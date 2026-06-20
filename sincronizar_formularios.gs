// ═══════════════════════════════════════════════════════════════════
//  PROGRAMA PRI — Google Forms → Firestore (automático)
//
//  INSTRUCCIONES (solo una vez):
//  1. Abre tu Google Sheets → Extensiones → Apps Script
//  2. Borra lo que haya, pega TODO este código y guarda (Ctrl+S)
//  3. Ejecuta la función  setupTrigger()  (solo una vez)
//  4. Autoriza los permisos que pida Google
//  5. Ejecuta  probarConUltimaFila()  para verificar que funciona
//
//  Desde ese momento cada formulario enviado llega solo a Firestore.
// ═══════════════════════════════════════════════════════════════════

const FIREBASE_API_KEY = 'AIzaSyABVpETOiTxYNoEKE-sLXjQHgPkkCgAZ30';
const FIREBASE_PROJECT = 'programa-pri-2d395';
const FIRESTORE_COL    = 'diagnostico_colegios';

// ── 1. TRIGGER: se ejecuta automáticamente en cada envío ────────────────────
function onFormSubmit(e) {
  try {
    const sheet   = e.range.getSheet();
    const hoja    = sheet.getName();   // nombre de la pestaña = nombre del taller
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const values  = e.values;          // valores de la fila recién enviada

    // Construir objeto con todos los campos del formulario
    const data = { _hoja: hoja };
    headers.forEach((header, i) => {
      if (!header) return;
      const clave = header.toString().trim();
      data[clave] = (values[i] !== undefined && values[i] !== null)
        ? values[i].toString().trim()
        : '';
    });

    const ok = _escribirEnFirestore(data);
    Logger.log(ok
      ? '✅ Enviado a Firestore — hoja: ' + hoja
      : '❌ Error al enviar — hoja: ' + hoja
    );

  } catch (err) {
    Logger.log('❌ Error en onFormSubmit: ' + err.toString());
  }
}

// ── 2. ESCRIBIR en Firestore vía REST API ───────────────────────────────────
function _escribirEnFirestore(data) {
  const idToken = _obtenerToken();
  if (!idToken) { Logger.log('Sin token — revisa la API Key'); return false; }

  // Convertir a formato de campos Firestore
  const fields = {};
  Object.entries(data).forEach(([k, v]) => {
    fields[k] = { stringValue: String(v) };
  });
  fields['_timestamp'] = { stringValue: new Date().toISOString() };

  // POST al endpoint REST de Firestore
  const url = 'https://firestore.googleapis.com/v1/projects/'
            + FIREBASE_PROJECT
            + '/databases/(default)/documents/'
            + FIRESTORE_COL;

  const resp = UrlFetchApp.fetch(url, {
    method          : 'post',
    contentType     : 'application/json',
    headers         : { Authorization: 'Bearer ' + idToken },
    payload         : JSON.stringify({ fields }),
    muteHttpExceptions: true,
  });

  const code = resp.getResponseCode();
  if (code !== 200) {
    Logger.log('Firestore respondió ' + code + ': ' + resp.getContentText());
    return false;
  }
  return true;
}

// ── 3. OBTENER TOKEN de Firebase (autenticación anónima) ────────────────────
function _obtenerToken() {
  const url = 'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key='
            + FIREBASE_API_KEY;
  const resp = UrlFetchApp.fetch(url, {
    method            : 'post',
    contentType       : 'application/json',
    payload           : JSON.stringify({ returnSecureToken: true }),
    muteHttpExceptions: true,
  });
  if (resp.getResponseCode() !== 200) {
    Logger.log('Error de autenticación: ' + resp.getContentText());
    return null;
  }
  return JSON.parse(resp.getContentText()).idToken;
}

// ── 4. CONFIGURAR TRIGGER (ejecutar UNA sola vez) ───────────────────────────
function setupTrigger() {
  // Eliminar triggers anteriores para no duplicar
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'onFormSubmit') {
      ScriptApp.deleteTrigger(t);
    }
  });

  // Crear el trigger en este spreadsheet
  ScriptApp.newTrigger('onFormSubmit')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onFormSubmit()
    .create();

  SpreadsheetApp.getUi().alert(
    '✅ ¡Listo!\n\n' +
    'El trigger está configurado.\n' +
    'Desde ahora cada formulario enviado llega\n' +
    'automáticamente a Firestore → diagnostico_colegios.\n\n' +
    'Puedes ejecutar probarConUltimaFila() para verificar.'
  );
}

// ── 5. PRUEBA: envía la última fila de la pestaña activa ────────────────────
function probarConUltimaFila() {
  const sheet   = SpreadsheetApp.getActiveSheet();
  const hoja    = sheet.getName();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('Esta pestaña no tiene datos aún. Ve a una con respuestas.');
    return;
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const valores = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];

  const data = { _hoja: hoja };
  headers.forEach((h, i) => {
    if (h) data[h.toString().trim()] = valores[i] ? valores[i].toString().trim() : '';
  });

  Logger.log('Enviando datos de prueba: ' + JSON.stringify(data));
  const ok = _escribirEnFirestore(data);

  SpreadsheetApp.getUi().alert(ok
    ? '✅ ¡Prueba exitosa!\n\nRevisa Firebase Console → Firestore → diagnostico_colegios\nDebería aparecer un documento nuevo con _hoja: "' + hoja + '"'
    : '❌ Falló.\n\nVe a Ver → Registros de ejecución para ver el error.'
  );
}
