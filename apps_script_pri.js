// ============================================================
//  GOOGLE APPS SCRIPT — Sync Formulario → Firebase Firestore
//  Proyecto PRI · Tumaco
//  Sheet ID: 1a_xsxKrTn6KHe-Ft5_1aSiLs3-NqOiUfc6pMoc_8b5s
// ============================================================

const FIREBASE_PROJECT_ID = 'proyecto-pri-81fd5';
const FIREBASE_API_KEY    = 'AIzaSyDNcz4b8pO17erLeIJsbhxc2ekchPkmha8';
const COLECCION           = 'diagnostico_colegios';

// ── 1. TRIGGER AUTOMÁTICO — corre cada vez que alguien envía el formulario ──
function onFormSubmit(e) {
    try {
        const sheet   = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        const values  = e.values; // Apps Script pasa los valores de la fila nueva como array

        const datos = { _timestamp_envio: new Date().toISOString() };
        headers.forEach((h, i) => {
            if (h) datos[limpiarClave(String(h))] = values[i] !== undefined ? values[i] : '';
        });

        guardarEnFirestore(datos);
        Logger.log('✅ Respuesta guardada: ' + JSON.stringify(datos).substring(0, 120));
    } catch (err) {
        Logger.log('❌ Error en onFormSubmit: ' + err.message);
    }
}

// ── 2. SYNC HISTÓRICO EN LOTES (evita el timeout de 6 min) ──────────────────
//   → Ejecuta varias veces hasta que el log diga "COMPLETA".
//   → Cada ejecución procesa BATCH_SIZE filas y guarda el progreso.
function sincronizarHistorico() {
    const BATCH_SIZE = 20; // filas por ejecución
    const props      = PropertiesService.getScriptProperties();

    // Guardamos: qué hoja vamos (sheetIdx) y qué fila dentro de esa hoja (offset)
    let sheetIdx = parseInt(props.getProperty('sync_sheet') || '0');
    let offset   = parseInt(props.getProperty('sync_offset') || '0');

    const ss     = SpreadsheetApp.openById('1a_xsxKrTn6KHe-Ft5_1aSiLs3-NqOiUfc6pMoc_8b5s');
    const sheets = ss.getSheets();

    if (sheetIdx >= sheets.length) {
        props.deleteProperty('sync_sheet');
        props.deleteProperty('sync_offset');
        Logger.log('✅ TODAS LAS HOJAS SINCRONIZADAS. No quedan más datos.');
        return;
    }

    const sheet    = sheets[sheetIdx];
    const allData  = sheet.getDataRange().getValues();
    const headers  = allData[0];
    const dataRows = allData.slice(1).filter(r => r.some(c => c !== ''));

    const lote      = dataRows.slice(offset, offset + BATCH_SIZE);
    let   guardados = 0;

    for (const row of lote) {
        const datos = { _hoja: sheet.getName(), _sync_historico: true };
        headers.forEach((h, i) => {
            if (h) datos[limpiarClave(String(h))] = row[i] !== undefined ? row[i] : '';
        });
        guardarEnFirestore(datos);
        guardados++;
        Utilities.sleep(150);
    }

    const newOffset = offset + lote.length;

    if (newOffset < dataRows.length) {
        // Quedan filas en esta hoja
        props.setProperty('sync_sheet',  String(sheetIdx));
        props.setProperty('sync_offset', String(newOffset));
        Logger.log(`📦 Hoja "${sheet.getName()}" (${sheetIdx + 1}/${sheets.length}): ` +
                   `filas ${offset + 1}–${newOffset} de ${dataRows.length}. ` +
                   `Ejecuta de nuevo.`);
    } else {
        // Esta hoja terminó → pasa a la siguiente
        props.setProperty('sync_sheet',  String(sheetIdx + 1));
        props.setProperty('sync_offset', '0');
        Logger.log(`✅ Hoja "${sheet.getName()}" lista (${guardados} registros). ` +
                   `Pasando a hoja ${sheetIdx + 2}/${sheets.length}. Ejecuta de nuevo.`);
    }
}

// ── 3. GUARDAR EN FIRESTORE (REST API) ──────────────────────────────────────
function guardarEnFirestore(datos) {
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}` +
                `/databases/(default)/documents/${COLECCION}?key=${FIREBASE_API_KEY}`;

    const fields = {};
    for (const [k, v] of Object.entries(datos)) {
        if (v instanceof Date || (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v))) {
            fields[k] = { stringValue: String(v) };
        } else if (typeof v === 'number') {
            fields[k] = { doubleValue: v };
        } else if (typeof v === 'boolean') {
            fields[k] = { booleanValue: v };
        } else {
            fields[k] = { stringValue: String(v) };
        }
    }

    const payload = JSON.stringify({ fields });
    const options = {
        method: 'POST',
        contentType: 'application/json',
        payload,
        muteHttpExceptions: true
    };

    const resp = UrlFetchApp.fetch(url, options);
    if (resp.getResponseCode() >= 300) {
        throw new Error(`Firestore ${resp.getResponseCode()}: ${resp.getContentText().substring(0, 200)}`);
    }
}

// ── 4. LIMPIA CLAVES (sin espacios, sin tildes, sin caracteres raros) ────────
function limpiarClave(texto) {
    return texto
        .normalize('NFD').replace(/[̀-ͯ]/g, '') // quita tildes
        .replace(/[^a-zA-Z0-9_]/g, '_')                   // reemplaza caracteres especiales
        .replace(/_+/g, '_')                               // colapsa guiones dobles
        .replace(/^_|_$/g, '')                             // quita guiones al inicio/fin
        .substring(0, 60)                                  // máximo 60 chars
        .toLowerCase();
}
