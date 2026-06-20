// ═══════════════════════════════════════════════════════════════════
//  PROGRAMA PRI — Google Forms → Firestore (automático)
//
//  INSTRUCCIONES (solo una vez):
//  1. Abre tu Google Sheets → Extensiones → Apps Script
//  2. En el panel izquierdo haz clic en ⚙️ "Configuración del proyecto"
//     y activa "Mostrar archivo de manifiesto appsscript.json"
//  3. Abre el archivo appsscript.json y reemplázalo con el JSON
//     que aparece al final de este archivo (en los comentarios)
//  4. Vuelve a Código.gs, pega este código y guarda (Ctrl+S)
//  5. Ejecuta setupTrigger() → autoriza los permisos
//  6. Ejecuta probarConUltimaFila() para verificar
// ═══════════════════════════════════════════════════════════════════

const FIREBASE_PROJECT = 'programa-pri-2d395';
const FIRESTORE_COL    = 'diagnostico_colegios';

// ── TRIGGER: se ejecuta en cada envío de formulario ─────────────────────────
function onFormSubmit(e) {
  try {
    const sheet   = e.range.getSheet();
    const hoja    = sheet.getName();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const values  = e.values;

    const data = { _hoja: hoja };
    headers.forEach((header, i) => {
      if (!header) return;
      data[header.toString().trim()] = values[i] ? values[i].toString().trim() : '';
    });

    const ok = _escribirEnFirestore(data);
    Logger.log(ok ? '✅ OK: ' + hoja : '❌ Error: ' + hoja);

  } catch (err) {
    Logger.log('❌ onFormSubmit: ' + err.toString());
  }
}

// ── ESCRIBIR en Firestore ───────────────────────────────────────────────────
function _escribirEnFirestore(data) {
  // Token OAuth del dueño del script (sin necesidad de Firebase Auth)
  const token = ScriptApp.getOAuthToken();

  // Convertir a formato Firestore
  const fields = {};
  Object.entries(data).forEach(([k, v]) => {
    fields[k] = { stringValue: String(v) };
  });
  fields['_timestamp'] = { stringValue: new Date().toISOString() };

  const url = 'https://firestore.googleapis.com/v1/projects/'
            + FIREBASE_PROJECT
            + '/databases/(default)/documents/'
            + FIRESTORE_COL;

  const resp = UrlFetchApp.fetch(url, {
    method            : 'post',
    contentType       : 'application/json',
    headers           : { Authorization: 'Bearer ' + token },
    payload           : JSON.stringify({ fields }),
    muteHttpExceptions: true,
  });

  const code = resp.getResponseCode();
  if (code !== 200) {
    Logger.log('Firestore error ' + code + ': ' + resp.getContentText());
    return false;
  }
  Logger.log('Firestore OK: ' + resp.getContentText().slice(0, 120));
  return true;
}

// ── CONFIGURAR TRIGGER (ejecutar UNA sola vez) ──────────────────────────────
function setupTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'onFormSubmit') ScriptApp.deleteTrigger(t);
  });

  ScriptApp.newTrigger('onFormSubmit')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onFormSubmit()
    .create();

  SpreadsheetApp.getUi().alert('✅ Trigger configurado. Desde ahora los formularios llegan solos a Firestore.');
}

// ── PROBAR con la última fila de la pestaña activa ──────────────────────────
function probarConUltimaFila() {
  const sheet   = SpreadsheetApp.getActiveSheet();
  const hoja    = sheet.getName();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('Esta pestaña no tiene respuestas. Ve a una con datos.');
    return;
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const valores = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];

  const data = { _hoja: hoja };
  headers.forEach((h, i) => {
    if (h) data[h.toString().trim()] = valores[i] ? valores[i].toString().trim() : '';
  });

  Logger.log('Enviando: ' + JSON.stringify(data).slice(0, 300));
  const ok = _escribirEnFirestore(data);

  SpreadsheetApp.getUi().alert(ok
    ? '✅ ¡Funcionó!\n\nRevisa Firebase Console → Firestore → diagnostico_colegios\nBusca el documento con _hoja: "' + hoja + '"'
    : '❌ Falló.\n\nVe a Ver → Registros de ejecución para ver el error detallado.'
  );
}


// ═══════════════════════════════════════════════════════════════════
//  CONTENIDO DEL ARCHIVO appsscript.json
//  (Configuración del proyecto → activar "Mostrar manifiesto")
//
//  {
//    "timeZone": "America/Bogota",
//    "dependencies": {},
//    "exceptionLogging": "STACKDRIVER",
//    "runtimeVersion": "V8",
//    "oauthScopes": [
//      "https://www.googleapis.com/auth/spreadsheets",
//      "https://www.googleapis.com/auth/script.external_request",
//      "https://www.googleapis.com/auth/datastore",
//      "https://www.googleapis.com/auth/drive"
//    ]
//  }
// ═══════════════════════════════════════════════════════════════════
