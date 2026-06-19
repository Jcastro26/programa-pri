// ============================================================
//  GOOGLE APPS SCRIPT — Sync Formulario → Firebase Firestore
//  Proyecto PRI · Tumaco
//  Sheet ID: 1a_xsxKrTn6KHe-Ft5_1aSiLs3-NqOiUfc6pMoc_8b5s
// ============================================================

const FIREBASE_PROJECT_ID   = 'programa-pri-2d395';
const FIREBASE_API_KEY      = 'AIzaSyABVpETOiTxYNoEKE-sLXjQHgPkkCgAZ30';
const COLECCION             = 'diagnostico_colegios';
const PUNTOS_POR_FORMULARIO = 10;
const SHEET_ID              = '1a_xsxKrTn6KHe-Ft5_1aSiLs3-NqOiUfc6pMoc_8b5s';

// Campos exactos del formulario (en orden de prioridad)
const CAMPOS_CEDULA  = ['numero_de_identificacion', 'numero_de_cedula', 'cedula', 'identificacion'];
const CAMPOS_EMAIL   = ['correo_electronico', 'direccion_de_correo_electronico', 'email', 'correo'];
const CAMPOS_NOMBRE  = ['nombre_completo', 'nombre', 'columna_3'];
const CAMPOS_PUNTOS  = ['puntuacion', 'puntaje', 'puntos'];
const CAMPOS_TIPO_ID = ['tipo_de_identificacion', 'tipo_de_documento', 'tipo_id'];
const CAMPOS_FECHA   = ['digite_la_fecha', 'digita_la_fecha', 'marca_temporal'];

// ── EXTRAER ID DE FORMULARIO DESDE URL ───────────────────────────────────────
/**
 * Extrae el formId DE RESPUESTA (1FAIpQLSxxx) a partir de la URL de edición o respuesta.
 * - Si la URL ya contiene /d/e/{responseId}/ → lo devuelve directamente.
 * - Si es URL de edición /d/{editId}/ → abre el formulario y obtiene el publishedUrl.
 * Esto garantiza que el ID guardado en Firestore coincida con TALLERES_SEED.
 */
function extractFormId(url) {
    if (!url) return '';
    // Ya es URL de respuesta (contiene /d/e/)
    const rMatch = url.match(/\/forms\/d\/e\/([^\/\?]+)/);
    if (rMatch) return rMatch[1];
    // Es URL de edición — obtener el publishedUrl via FormApp
    try {
        const form = FormApp.openByUrl(url);
        const pubUrl = form.getPublishedUrl(); // ej: https://docs.google.com/forms/d/e/1FAIpQLSxxx/viewform
        const pMatch = pubUrl.match(/\/forms\/d\/e\/([^\/\?]+)/);
        if (pMatch) return pMatch[1];
    } catch(e) {
        // Si falla (permisos), intenta con el shortId del edit URL como fallback
        const eMatch = url.match(/\/forms\/d\/([^\/\?]+)/);
        return eMatch ? eMatch[1] : '';
    }
    return '';
}

// ── 1. TRIGGER AUTOMÁTICO ────────────────────────────────────────────────────
//    Se ejecuta cada vez que alguien envía un formulario.
//    Instalar: Extensiones → Apps Script → Activadores → onFormSubmit (al enviar formulario)
function onFormSubmit(e) {
    try {
        const sheet   = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        const values  = e.values;

        // Construir objeto de datos con claves normalizadas
        const datos = {
            _hoja:             sheet.getName(),
            _formId:           extractFormId(sheet.getFormUrl()),
            _timestamp_envio:  new Date().toISOString()
        };
        headers.forEach((h, i) => {
            if (h) datos[limpiarClave(String(h))] = values[i] !== undefined ? String(values[i]) : '';
        });

        // 1. Guardar respuesta cruda en diagnostico_colegios
        guardarEnFirestore(datos);

        // 2. Intentar vincular al estudiante y darle puntos
        try {
            premiarEstudiante(datos, sheet.getName());
        } catch(pe) {
            Logger.log('⚠️ No se pudo vincular al estudiante: ' + pe.message);
        }

        Logger.log('✅ Guardado: ' + sheet.getName() + ' | ' + JSON.stringify(datos).substring(0, 100));
    } catch (err) {
        Logger.log('❌ Error en onFormSubmit: ' + err.message);
    }
}

// ── 2. VINCULAR ESTUDIANTE Y PREMIAR ─────────────────────────────────────────
function premiarEstudiante(datos, hojaNombre) {
    const cedula  = extraerCampo(datos, CAMPOS_CEDULA);
    const email   = extraerCampo(datos, CAMPOS_EMAIL);
    const nombre  = extraerCampo(datos, CAMPOS_NOMBRE) || email || cedula || 'Estudiante';
    const tipoId  = extraerCampo(datos, CAMPOS_TIPO_ID) || 'CC';
    const fecha   = extraerCampo(datos, CAMPOS_FECHA) || datos.marca_temporal || '';

    if (!cedula && !email) {
        Logger.log('⚠️ Sin cédula/TI ni email — no se puede vincular.');
        return;
    }

    const cedulaNorm = cedula ? normalizarCedula(cedula) : null;

    // Buscar el UID del estudiante en la colección usuarios
    // NOTA: el campo de email en usuarios se llama 'correo', y cedula es opcional
    let uid = null;
    if (email)           uid = buscarPorCampo('correo', email.toLowerCase().trim());
    if (!uid && cedulaNorm) uid = buscarPorCampo('cedula', cedulaNorm);

    if (!uid) {
        Logger.log('⚠️ Estudiante no registrado en la app: ' + (email || cedulaNorm));
        return;
    }

    // Evitar doble puntuación si ya completó este formulario
    if (yaCompletoPrevio(uid, hojaNombre)) {
        Logger.log('ℹ️ ' + uid + ' ya completó: ' + hojaNombre);
        return;
    }

    const puntuacion = extraerCampo(datos, CAMPOS_PUNTOS) || '—';

    // Registrar en talleres_completados con todos los datos del estudiante
    escribirDocumento('talleres_completados', {
        uid:          uid,
        nombre:       nombre,
        email:        email  || '',
        cedula:       cedulaNorm || '',
        tipoId:       tipoId,
        hoja:         hojaNombre,
        puntuacion:   String(puntuacion),
        fechaForm:    fecha,
        fuente:       'google_forms',
        puntos:       PUNTOS_POR_FORMULARIO,
        completadoEn: new Date().toISOString()
    });

    // Sumar puntos al usuario
    sumarPuntos(uid, PUNTOS_POR_FORMULARIO);

    Logger.log('🏆 ' + nombre + ' recibió ' + PUNTOS_POR_FORMULARIO + ' PTS por: ' + hojaNombre);
}

// ── 2b. VINCULAR HISTÓRICO ───────────────────────────────────────────────────
//    Corre DESPUÉS de sincronizarHistorico.
//    Lee diagnostico_colegios en lotes y vincula cada registro a su estudiante.
//    Ejecuta varias veces hasta que el log diga "VINCULAR COMPLETA".
function vincularHistorico() {
    const BATCH_SIZE = 10;
    const props      = PropertiesService.getScriptProperties();
    const pageToken  = props.getProperty('vincular_token') || '';
    let procesados   = 0;
    let vinculados   = 0;

    const url = 'https://firestore.googleapis.com/v1/projects/' + FIREBASE_PROJECT_ID +
                '/databases/(default)/documents/' + COLECCION +
                '?key=' + FIREBASE_API_KEY +
                '&pageSize=' + BATCH_SIZE +
                (pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : '');

    const resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const body = JSON.parse(resp.getContentText());

    if (!body.documents || body.documents.length === 0) {
        props.deleteProperty('vincular_token');
        Logger.log('✅ VINCULAR COMPLETA — todos los registros procesados.');
        return;
    }

    for (const docFirestore of body.documents) {
        const fields = docFirestore.fields || {};

        // Reconstruir objeto plano desde Firestore REST format
        const datos = {};
        for (const [k, v] of Object.entries(fields)) {
            datos[k] = v.stringValue !== undefined ? v.stringValue
                     : v.doubleValue  !== undefined ? v.doubleValue
                     : v.integerValue !== undefined ? v.integerValue
                     : v.booleanValue !== undefined ? v.booleanValue
                     : '';
        }

        const hoja = datos._hoja || '';
        if (!hoja) { procesados++; continue; }

        try {
            premiarEstudiante(datos, hoja);
            vinculados++;
        } catch(e) {
            Logger.log('⚠️ ' + e.message);
        }

        Utilities.sleep(250);
        procesados++;
    }

    if (body.nextPageToken) {
        props.setProperty('vincular_token', body.nextPageToken);
        Logger.log('📦 Lote: ' + procesados + ' registros | Vinculados: ' + vinculados + '. Ejecuta de nuevo.');
    } else {
        props.deleteProperty('vincular_token');
        Logger.log('✅ VINCULAR COMPLETA. Vinculados en este lote: ' + vinculados);
    }
}

// ── 3. SYNC HISTÓRICO EN LOTES ───────────────────────────────────────────────
//    Ejecuta varias veces hasta que el log diga "COMPLETA".
//    Cada ejecución procesa BATCH_SIZE filas y guarda el progreso.
function sincronizarHistorico() {
    const BATCH_SIZE = 15;
    const props      = PropertiesService.getScriptProperties();
    let sheetIdx     = parseInt(props.getProperty('sync_sheet')  || '0');
    let offset       = parseInt(props.getProperty('sync_offset') || '0');

    const ss     = SpreadsheetApp.openById(SHEET_ID);
    const sheets = ss.getSheets();

    if (sheetIdx >= sheets.length) {
        props.deleteProperty('sync_sheet');
        props.deleteProperty('sync_offset');
        Logger.log('✅ SYNC COMPLETA — todas las hojas sincronizadas.');
        return;
    }

    const sheet    = sheets[sheetIdx];
    const allData  = sheet.getDataRange().getValues();
    const headers  = allData[0];
    const dataRows = allData.slice(1).filter(r => r.some(c => c !== ''));
    const lote     = dataRows.slice(offset, offset + BATCH_SIZE);
    let guardados  = 0;

    for (const row of lote) {
        const datos = {
            _hoja:            sheet.getName(),
            _formId:          extractFormId(sheet.getFormUrl()),
            _sync_historico:  true,
            _timestamp_envio: new Date().toISOString()
        };
        headers.forEach((h, i) => {
            if (h) datos[limpiarClave(String(h))] = row[i] !== undefined ? String(row[i]) : '';
        });
        guardarEnFirestore(datos);
        guardados++;
        Utilities.sleep(180); // evitar rate limit
    }

    const newOffset = offset + lote.length;

    if (newOffset < dataRows.length) {
        props.setProperty('sync_sheet',  String(sheetIdx));
        props.setProperty('sync_offset', String(newOffset));
        Logger.log('📦 Hoja "' + sheet.getName() + '" (' + (sheetIdx + 1) + '/' + sheets.length + '): ' +
                   'filas ' + (offset + 1) + '–' + newOffset + ' de ' + dataRows.length + '. Ejecuta de nuevo.');
    } else {
        props.setProperty('sync_sheet',  String(sheetIdx + 1));
        props.setProperty('sync_offset', '0');
        Logger.log('✅ Hoja "' + sheet.getName() + '" lista (' + guardados + ' registros). ' +
                   'Pasando a hoja ' + (sheetIdx + 2) + '/' + sheets.length + '. Ejecuta de nuevo.');
    }
}

// ── FUNCIONES AUXILIARES DE FIRESTORE (REST API) ─────────────────────────────

function guardarEnFirestore(datos) {
    const url = firestoreUrl(COLECCION);
    const resp = UrlFetchApp.fetch(url, {
        method: 'POST',
        contentType: 'application/json',
        payload: JSON.stringify({ fields: objetoAFields(datos) }),
        muteHttpExceptions: true
    });
    if (resp.getResponseCode() >= 300) {
        throw new Error('Firestore ' + resp.getResponseCode() + ': ' + resp.getContentText().substring(0, 200));
    }
}

function escribirDocumento(coleccion, datos) {
    const url = firestoreUrl(coleccion);
    UrlFetchApp.fetch(url, {
        method: 'POST',
        contentType: 'application/json',
        payload: JSON.stringify({ fields: objetoAFields(datos) }),
        muteHttpExceptions: true
    });
}

function buscarPorCampo(campo, valor) {
    const url = 'https://firestore.googleapis.com/v1/projects/' + FIREBASE_PROJECT_ID +
                '/databases/(default)/documents:runQuery?key=' + FIREBASE_API_KEY;

    const query = {
        structuredQuery: {
            from: [{ collectionId: 'usuarios' }],
            where: {
                fieldFilter: {
                    field: { fieldPath: campo },
                    op: 'EQUAL',
                    value: { stringValue: valor }
                }
            },
            limit: 1
        }
    };

    const resp    = UrlFetchApp.fetch(url, {
        method: 'POST',
        contentType: 'application/json',
        payload: JSON.stringify(query),
        muteHttpExceptions: true
    });
    const results = JSON.parse(resp.getContentText());
    if (results && results[0] && results[0].document) {
        return results[0].document.name.split('/').pop();
    }
    return null;
}

function yaCompletoPrevio(uid, hojaNombre) {
    const url = 'https://firestore.googleapis.com/v1/projects/' + FIREBASE_PROJECT_ID +
                '/databases/(default)/documents:runQuery?key=' + FIREBASE_API_KEY;

    const query = {
        structuredQuery: {
            from: [{ collectionId: 'talleres_completados' }],
            where: {
                compositeFilter: {
                    op: 'AND',
                    filters: [
                        { fieldFilter: { field: { fieldPath: 'uid'  }, op: 'EQUAL', value: { stringValue: uid       } } },
                        { fieldFilter: { field: { fieldPath: 'hoja' }, op: 'EQUAL', value: { stringValue: hojaNombre } } }
                    ]
                }
            },
            limit: 1
        }
    };

    const resp    = UrlFetchApp.fetch(url, {
        method: 'POST',
        contentType: 'application/json',
        payload: JSON.stringify(query),
        muteHttpExceptions: true
    });
    const results = JSON.parse(resp.getContentText());
    return !!(results && results[0] && results[0].document);
}

function sumarPuntos(uid, puntos) {
    const getUrl  = 'https://firestore.googleapis.com/v1/projects/' + FIREBASE_PROJECT_ID +
                    '/databases/(default)/documents/usuarios/' + uid + '?key=' + FIREBASE_API_KEY;
    const getResp = UrlFetchApp.fetch(getUrl, { muteHttpExceptions: true });
    const doc     = JSON.parse(getResp.getContentText());

    let actuales = 0;
    if (doc.fields && doc.fields.puntos) {
        actuales = parseInt(doc.fields.puntos.integerValue || doc.fields.puntos.doubleValue || 0);
    }

    const patchUrl = getUrl + '&updateMask.fieldPaths=puntos';
    UrlFetchApp.fetch(patchUrl, {
        method: 'PATCH',
        contentType: 'application/json',
        payload: JSON.stringify({ fields: { puntos: { integerValue: actuales + puntos } } }),
        muteHttpExceptions: true
    });
}

// ── UTILIDADES ────────────────────────────────────────────────────────────────

function firestoreUrl(coleccion) {
    return 'https://firestore.googleapis.com/v1/projects/' + FIREBASE_PROJECT_ID +
           '/databases/(default)/documents/' + coleccion + '?key=' + FIREBASE_API_KEY;
}

function objetoAFields(datos) {
    const fields = {};
    for (const [k, v] of Object.entries(datos)) {
        if (typeof v === 'number') {
            fields[k] = { doubleValue: v };
        } else if (typeof v === 'boolean') {
            fields[k] = { booleanValue: v };
        } else {
            fields[k] = { stringValue: String(v) };
        }
    }
    return fields;
}

function extraerCampo(datos, posiblesCampos) {
    for (const c of posiblesCampos) {
        if (datos[c] && String(datos[c]).trim() !== '') return String(datos[c]).trim();
    }
    return null;
}

function normalizarCedula(raw) {
    return String(raw).trim()
        .replace(/^(T\.?\s*I\.?\s*|C\.?\s*C\.?\s*|RC\.?\s*|NIT\.?\s*)/i, '')
        .replace(/\s+/g, '')
        .trim();
}

function limpiarClave(texto) {
    return texto
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .substring(0, 60)
        .toLowerCase();
}

// ── ENRIQUECER DOCUMENTOS EXISTENTES CON _formId ─────────────────────────────
//    Ejecuta varias veces hasta que el log diga "ENRIQUECER COMPLETA".
//    Necesario solo una vez para datos históricos que no tienen _formId.
function enriquecerFormIds() {
    const BATCH = 20;

    // Construir mapa nombre_hoja → formId desde el Spreadsheet actual
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheetMap = {};
    ss.getSheets().forEach(function(s) {
        const url = s.getFormUrl();
        if (url) sheetMap[s.getName()] = extractFormId(url);
    });
    Logger.log('Mapa hojas→formId: ' + JSON.stringify(sheetMap));

    const props      = PropertiesService.getScriptProperties();
    const pageToken  = props.getProperty('enrich_token') || '';

    const url = 'https://firestore.googleapis.com/v1/projects/' + FIREBASE_PROJECT_ID +
                '/databases/(default)/documents/' + COLECCION +
                '?key=' + FIREBASE_API_KEY +
                '&pageSize=' + BATCH +
                (pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : '');

    const resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const body = JSON.parse(resp.getContentText());

    if (!body.documents || body.documents.length === 0) {
        props.deleteProperty('enrich_token');
        Logger.log('✅ ENRIQUECER COMPLETA — todos los documentos procesados.');
        return;
    }

    let patched = 0;
    for (const docFirestore of body.documents) {
        const fields     = docFirestore.fields || {};
        const hoja       = fields._hoja?._value   || fields._hoja?.stringValue  || '';
        const formIdExistente = fields._formId?.stringValue || '';
        const formId     = sheetMap[hoja] || '';

        // Solo parchear si tenemos un formId nuevo y el doc no lo tiene ya
        if (hoja && formId && formId !== formIdExistente) {
            const docName  = docFirestore.name;
            const patchUrl = 'https://firestore.googleapis.com/v1/' + docName +
                             '?key=' + FIREBASE_API_KEY +
                             '&updateMask.fieldPaths=_formId';
            UrlFetchApp.fetch(patchUrl, {
                method:      'PATCH',
                contentType: 'application/json',
                payload:     JSON.stringify({ fields: { _formId: { stringValue: formId } } }),
                muteHttpExceptions: true
            });
            patched++;
            Utilities.sleep(150);
        }
    }

    if (body.nextPageToken) {
        props.setProperty('enrich_token', body.nextPageToken);
        Logger.log('📦 Lote procesado: ' + patched + ' docs enriquecidos. Ejecuta enriquecerFormIds() de nuevo.');
    } else {
        props.deleteProperty('enrich_token');
        Logger.log('✅ ENRIQUECER COMPLETA. Docs enriquecidos en este lote: ' + patched);
    }
}
