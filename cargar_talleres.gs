/**
 * PROGRAMA PRI — Exportar nombres de pestañas como CSV para importar talleres
 *
 * INSTRUCCIONES:
 * 1. Abre tu Google Sheets con las ~70 pestañas de talleres
 * 2. Ve a Extensiones → Apps Script
 * 3. Pega este código y guarda (Ctrl+S)
 * 4. Ejecuta la función "exportarTalleresCSV"
 * 5. Autoriza los permisos si te lo pide
 * 6. El CSV se guarda en tu Google Drive como "talleres_pri.csv"
 *    y también se muestra en pantalla para copiar
 */

// ── Hojas que NO son talleres (ajusta si tienes más) ──────────────────────
const HOJAS_EXCLUIR = [
  'Resumen',
  'Dashboard',
  'Configuración',
  'Config',
  'Inicio',
  'RESUMEN',
  'CONFIGURACIÓN',
];

// ── Detectar área desde el nombre de la pestaña ───────────────────────────
function detectarArea(nombre) {
  const n = nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (n.includes('biolog'))      return 'Biología';
  if (n.includes('quimic'))      return 'Química';
  if (n.includes('matematica') || n.includes('mat ') || n.includes('mat.')) return 'Matemáticas';
  if (n.includes('geometr'))     return 'Geometría';
  if (n.includes('lectura') || n.includes('critica') || n.includes('lect')) return 'Lectura Crítica';
  if (n.includes('social') || n.includes('sociales')) return 'Sociales';
  if (n.includes('ingles') || n.includes('ingl'))     return 'Inglés';
  return '';
}

// ── Detectar número de sesión desde el nombre ─────────────────────────────
function detectarSesion(nombre) {
  const m = nombre.match(/sesi[oó]n\s*(\d+)/i) || nombre.match(/^(\d+)\s*[-–]/);
  return m ? parseInt(m[1]) : 1;
}

// ── Función principal ──────────────────────────────────────────────────────
function exportarTalleresCSV() {
  const ss     = SpreadsheetApp.getActiveSpreadsheet();
  const hojas  = ss.getSheets();
  const filas  = [['titulo', 'hojaCalculo', 'area', 'sesion', 'grupo', 'habilitado']];

  let conteo = 0;
  hojas.forEach(hoja => {
    const nombre = hoja.getName().trim();
    if (HOJAS_EXCLUIR.some(ex => nombre.toLowerCase() === ex.toLowerCase())) return;
    if (!nombre) return;

    const area   = detectarArea(nombre);
    const sesion = detectarSesion(nombre);

    filas.push([nombre, nombre, area, sesion, '', 'true']);
    conteo++;
  });

  // Generar CSV
  const csv = filas.map(f =>
    f.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
  ).join('\n');

  // Guardar en Drive
  const archivo = DriveApp.createFile('talleres_pri.csv', csv, MimeType.CSV);
  archivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // Mostrar resultado
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    `✅ CSV generado con ${conteo} talleres`,
    `📁 Archivo guardado en tu Drive como "talleres_pri.csv"\n` +
    `🔗 Link: ${archivo.getUrl()}\n\n` +
    `Pasos siguientes en el dashboard:\n` +
    `1. Descarga el CSV desde Drive\n` +
    `2. Usa "🔄 Reemplazar desde hojas" para borrar los viejos\n` +
    `   (o bórralos manualmente en Firebase)\n` +
    `3. Usa "📥 Importar talleres desde CSV" y sube el archivo\n\n` +
    `Vista previa (primeras 5 filas):\n${filas.slice(0,6).map(f=>f.join(' | ')).join('\n')}`,
    ui.ButtonSet.OK
  );

  Logger.log(`CSV generado:\n${csv}`);
}
