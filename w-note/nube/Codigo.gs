/**
 * w-note · nube (Google Apps Script + Google Sheet)
 * ---------------------------------------------------------------------------
 * Por qué existe: compai.cl se publica con GitHub Pages, que es estático y no
 * acepta POST. Este script es el "servidor" de w-note: guarda las notas en una
 * hoja de cálculo tuya y entrega tu agenda de Google Calendar. Lo usan el PC
 * (wnote.py) y el iPhone (compai.cl/w-note) por 4G/5G o Wi-Fi.
 *
 * Instalación (3 min) — ver w-note/README.md, sección "Nube":
 *   1. Abre https://script.google.com/create (o una Hoja → Extensiones → Apps Script) y pega este archivo.
 *      Si el script no nace desde una hoja, crea solo la hoja «w-note · notas» en tu Drive.
 *   2. Ejecuta la función `configurar` una vez (autoriza) y copia el token del registro.
 *   3. Implementar → Nueva implementación → Aplicación web
 *        Ejecutar como: Yo · Quién tiene acceso: Cualquier usuario → copia la URL /exec.
 *   (Opcional) Servicios → + → Google Calendar API, para leer el link de Meet.
 *
 * Protocolo (igual en PC, iPhone y servidor Wi-Fi local):
 *   GET  <url>?k=TOKEN                 → { ok, notes:[...], server_time }
 *   GET  <url>?k=TOKEN&action=agenda   → { ok, events:[...] }
 *   POST <url>  {k, notes:[...]}       → { ok, notes:[...] }  (fusiona, no pisa)
 *   POST <url>  {k, action:'archivo', ruta, mime, b64} → { ok, archivo:{id,nombre,carpeta} }
 *        Respaldo de prints y actas del PC en Drive: compAI / w-notes / <ruta>.
 * Nota: {id, theme_key, text, created_at, updated_at, deleted, source}
 * Fusión: por id; gana el updated_at mayor. Borrar = deleted:true (lápida).
 */

var HOJA = 'notas';
var COLS = ['id', 'theme_key', 'text', 'created_at', 'updated_at', 'deleted', 'source'];
var LAPIDA_DIAS = 30;      // las notas archivadas se purgan tras 30 días
var MAX_NOTAS = 2000;
var MAX_TEXTO = 5000;

// Respaldo de prints y actas (22-11-2026): carpeta «compAI» del Drive de stapiamena@compai.cl.
// Se puede cambiar sin tocar el código con la propiedad del script RESPALDO_CARPETA_ID.
var RESPALDO_CARPETA_ID = '1PS9ZWjRAda-WnZ7EgLP4JNuoiH_c5xLT';
var RESPALDO_SUBCARPETA = 'w-notes';
var RESPALDO_RAICES = ['Prints', 'Actas_Reuniones'];   // lo único que se acepta
var RESPALDO_EXT = /\.(png|jpg|jpeg|json|md|txt)$/i;    // sin audio: pesa demasiado
var RESPALDO_MAX_BYTES = 25 * 1024 * 1024;

/* ── Entrada HTTP ─────────────────────────────────────────────────────── */

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (!autorizado_(p.k)) return json_({ ok: false, error: 'token' });
  if (p.action === 'ping') return json_({ ok: true, server_time: Date.now() });
  if (p.action === 'agenda') return json_({ ok: true, events: agenda_() });
  return json_({ ok: true, notes: leer_(), server_time: Date.now() });
}

function doPost(e) {
  var body = {};
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'json' });
  }
  var k = body.k || ((e && e.parameter) || {}).k;
  if (!autorizado_(k)) return json_({ ok: false, error: 'token' });
  if (body.action === 'archivo') return json_(guardarArchivo_(body));

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var fusion = fusionar_(leer_(), Array.isArray(body.notes) ? body.notes : []);
    escribir_(fusion);
    return json_({ ok: true, notes: fusion, server_time: Date.now() });
  } finally {
    lock.releaseLock();
  }
}

/* ── Configuración (ejecutar a mano una vez) ─────────────────────────── */

function configurar() {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('WNOTE_TOKEN');
  if (!token) {
    token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '').slice(0, 8);
    props.setProperty('WNOTE_TOKEN', token);
  }
  hoja_(); // crea la pestaña "notas" con encabezados
  try { CalendarApp.getDefaultCalendar(); } catch (err) {} // pide permiso de Calendar
  Logger.log('TOKEN w-note: ' + token);
  Logger.log('Pégalo en w-note (PC) → Nube → Token, junto con la URL /exec de la implementación.');
  return token;
}

/** Cambia el token (si se filtró). Después actualiza PC y celular. */
function rotarToken() {
  PropertiesService.getScriptProperties().deleteProperty('WNOTE_TOKEN');
  return configurar();
}

/* ── Notas ────────────────────────────────────────────────────────────── */

function autorizado_(k) {
  var token = PropertiesService.getScriptProperties().getProperty('WNOTE_TOKEN');
  return !!token && typeof k === 'string' && k === token;
}

function libro_() {
  var activo = SpreadsheetApp.getActiveSpreadsheet();
  if (activo) return activo;
  // Script independiente (creado en script.google.com): usa o crea su propia hoja «w-note · notas».
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  var nuevo = SpreadsheetApp.create('w-note · notas');
  props.setProperty('SHEET_ID', nuevo.getId());
  Logger.log('Hoja creada: ' + nuevo.getUrl());
  return nuevo;
}

function hoja_() {
  var libro = libro_();
  var h = libro.getSheetByName(HOJA);
  if (!h) {
    h = libro.insertSheet(HOJA);
    h.getRange(1, 1, 1, COLS.length).setValues([COLS]).setFontWeight('bold');
    h.setFrozenRows(1);
    h.getRange('A:A').setNumberFormat('@');
    h.getRange('C:C').setNumberFormat('@').setWrap(true);
    h.setColumnWidth(3, 420);
  }
  return h;
}

function leer_() {
  var h = hoja_();
  var n = h.getLastRow() - 1;
  if (n < 1) return [];
  var filas = h.getRange(2, 1, n, COLS.length).getValues();
  var out = [];
  for (var i = 0; i < filas.length; i++) {
    var f = filas[i];
    if (f[0] === '' || f[0] === null) continue;
    out.push({
      id: String(f[0]),
      theme_key: String(f[1] || 'comercial'),
      text: String(f[2] || ''),
      created_at: Number(f[3]) || 0,
      updated_at: Number(f[4]) || 0,
      deleted: f[5] === true || String(f[5]).toUpperCase() === 'TRUE',
      source: String(f[6] || '')
    });
  }
  return out;
}

function escribir_(notas) {
  var h = hoja_();
  var n = h.getLastRow() - 1;
  if (n > 0) h.getRange(2, 1, n, COLS.length).clearContent();
  if (!notas.length) return;
  var filas = notas.map(function (x) {
    var texto = String(x.text);
    if (/^[=+\-@]/.test(texto)) texto = "'" + texto; // evita que la hoja lo lea como fórmula
    return [String(x.id), x.theme_key, texto, x.created_at, x.updated_at, !!x.deleted, x.source || ''];
  });
  h.getRange(2, 1, filas.length, COLS.length).setValues(filas);
}

function limpiar_(x) {
  if (!x || x.id === undefined || x.id === null || x.id === '') return null;
  var ahora = Date.now();
  return {
    id: String(x.id).slice(0, 64),
    theme_key: String(x.theme_key || 'comercial').slice(0, 32),
    text: String(x.text || '').slice(0, MAX_TEXTO),
    created_at: Number(x.created_at) || ahora,
    updated_at: Math.min(Number(x.updated_at) || 0, ahora + 60000), // sin relojes del futuro
    deleted: !!x.deleted,
    source: String(x.source || '').slice(0, 24)
  };
}

/** Fusión por id: gana el updated_at mayor. Igual que en wnote.py e index.html. */
function fusionar_(locales, entrantes) {
  var mapa = {};
  locales.concat(entrantes).forEach(function (raw) {
    var x = limpiar_(raw);
    if (!x) return;
    var y = mapa[x.id];
    if (!y || x.updated_at > y.updated_at || (x.updated_at === y.updated_at && x.deleted && !y.deleted)) {
      mapa[x.id] = x;
    }
  });
  var limite = Date.now() - LAPIDA_DIAS * 86400000;
  var lista = Object.keys(mapa).map(function (k) { return mapa[k]; })
    .filter(function (x) { return !(x.deleted && x.updated_at < limite); })
    .sort(function (a, b) { return b.created_at - a.created_at; });
  return lista.slice(0, MAX_NOTAS);
}

/* ── Respaldo de prints y actas en Drive ──────────────────────────────── */

/** Ejecutar a mano una vez después de pegar esta versión: pide el permiso de Drive y crea las carpetas. */
function autorizarRespaldo() {
  var base = carpetaRespaldo_(['Prints']);
  carpetaRespaldo_(['Actas_Reuniones', 'Capturas_Clave']);
  Logger.log('Respaldo listo en: ' + base.getParents().next().getUrl());
}

/** Carpeta compAI / w-notes / <partes…>; crea lo que falte. */
function carpetaRespaldo_(partes) {
  var id = PropertiesService.getScriptProperties().getProperty('RESPALDO_CARPETA_ID') || RESPALDO_CARPETA_ID;
  var carpeta = DriveApp.getFolderById(id);
  [RESPALDO_SUBCARPETA].concat(partes).forEach(function (nombre) {
    var it = carpeta.getFoldersByName(nombre);
    carpeta = it.hasNext() ? it.next() : carpeta.createFolder(nombre);
  });
  return carpeta;
}

/** Guarda (o reemplaza) un archivo del PC. ruta = «Prints/x.png», «Actas_Reuniones/Capturas_Clave/y.png»… */
function guardarArchivo_(body) {
  var partes = String(body.ruta || '').replace(/\\/g, '/').split('/').filter(String);
  var nombre = partes.pop() || '';
  var valido = /^[^\/\\:*?"<>|\u0000-\u001f]{1,180}$/;
  if (!partes.length || RESPALDO_RAICES.indexOf(partes[0]) < 0 || partes.length > 3) return { ok: false, error: 'ruta' };
  for (var i = 0; i < partes.length; i++) {
    if (!valido.test(partes[i]) || partes[i] === '.' || partes[i] === '..') return { ok: false, error: 'ruta' };
  }
  if (!valido.test(nombre) || !RESPALDO_EXT.test(nombre)) return { ok: false, error: 'tipo' };
  var bytes;
  try { bytes = Utilities.base64Decode(String(body.b64 || '')); } catch (err) { return { ok: false, error: 'b64' }; }
  if (!bytes.length || bytes.length > RESPALDO_MAX_BYTES) return { ok: false, error: 'peso' };

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var carpeta = carpetaRespaldo_(partes);
    var viejos = carpeta.getFilesByName(nombre);
    while (viejos.hasNext()) viejos.next().setTrashed(true);   // una sola versión por nombre
    var archivo = carpeta.createFile(Utilities.newBlob(bytes, String(body.mime || 'application/octet-stream'), nombre));
    return { ok: true, archivo: { id: archivo.getId(), nombre: nombre, carpeta: partes.join('/') }, server_time: Date.now() };
  } finally {
    lock.releaseLock();
  }
}

/* ── Agenda (Google Calendar) ─────────────────────────────────────────── */

function agenda_() {
  var props = PropertiesService.getScriptProperties();
  var ids = String(props.getProperty('CALENDAR_IDS') || 'primary')
    .split(',').map(function (s) { return s.trim(); }).filter(String);
  var desde = new Date(Date.now() - 60 * 60000);     // incluye la reunión en curso
  var hasta = new Date(Date.now() + 36 * 3600000);
  var eventos = [];
  ids.forEach(function (id) {
    try {
      eventos = eventos.concat(agendaAvanzada_(id, desde, hasta));
    } catch (err) {
      eventos = eventos.concat(agendaBasica_(id, desde, hasta));
    }
  });
  var ahora = Date.now();
  return eventos
    .filter(function (ev) { return ev.end > ahora && !ev.all_day; })
    .sort(function (a, b) { return a.start - b.start; })
    .slice(0, 8);
}

/** Con el servicio avanzado "Google Calendar API": trae link de Meet e invitados. */
function agendaAvanzada_(id, desde, hasta) {
  var r = Calendar.Events.list(id, {
    timeMin: desde.toISOString(), timeMax: hasta.toISOString(),
    singleEvents: true, orderBy: 'startTime', maxResults: 20
  });
  return (r.items || []).filter(function (e) { return e.status !== 'cancelled'; }).map(function (e) {
    var allDay = !e.start.dateTime;
    var link = e.hangoutLink || '';
    if (!link && e.conferenceData && e.conferenceData.entryPoints) {
      e.conferenceData.entryPoints.forEach(function (p) { if (!link && p.entryPointType === 'video') link = p.uri; });
    }
    if (!link) link = buscarLink_((e.location || '') + ' ' + (e.description || ''));
    var invitados = (e.attendees || []).map(function (a) { return a.email || ''; });
    return {
      id: e.id,
      title: e.summary || '(sin título)',
      start: new Date(e.start.dateTime || e.start.date).getTime(),
      end: new Date(e.end.dateTime || e.end.date).getTime(),
      all_day: allDay,
      link: link,
      platform: plataforma_(link),
      org: organizacion_(invitados, (e.organizer || {}).email || '')
    };
  });
}

/** Sin servicio avanzado: CalendarApp (no ve el link de Meet si no está en la descripción). */
function agendaBasica_(id, desde, hasta) {
  var cal = id === 'primary' ? CalendarApp.getDefaultCalendar() : CalendarApp.getCalendarById(id);
  if (!cal) return [];
  return cal.getEvents(desde, hasta).map(function (e) {
    var link = buscarLink_((e.getLocation() || '') + ' ' + (e.getDescription() || ''));
    var invitados = e.getGuestList().map(function (g) { return g.getEmail(); });
    return {
      id: e.getId(),
      title: e.getTitle() || '(sin título)',
      start: e.getStartTime().getTime(),
      end: e.getEndTime().getTime(),
      all_day: e.isAllDayEvent(),
      link: link,
      platform: plataforma_(link),
      org: organizacion_(invitados, (e.getCreators() || [''])[0])
    };
  });
}

function buscarLink_(texto) {
  var m = String(texto).match(/https:\/\/(meet\.google\.com|[\w.-]*zoom\.us|teams\.microsoft\.com|teams\.live\.com)\/[^\s"'<>)]+/i);
  return m ? m[0] : '';
}

function plataforma_(link) {
  if (/meet\.google/i.test(link)) return 'Google Meet';
  if (/teams\./i.test(link)) return 'MS Teams';
  if (/zoom\.us/i.test(link)) return 'Zoom';
  return 'Otra Videollamada';
}

/** Organización = dominio del primer invitado externo (no compai.cl ni correo personal). */
function organizacion_(correos, organizador) {
  var propio = /@(compai\.cl)$/i;
  var personal = /@(gmail|hotmail|outlook|yahoo|icloud|live)\./i;
  var lista = correos.concat([organizador]);
  for (var i = 0; i < lista.length; i++) {
    var c = String(lista[i] || '');
    if (!c || propio.test(c) || personal.test(c) || /calendar\.google\.com$/i.test(c)) continue;
    var dom = c.split('@')[1] || '';
    var base = dom.split('.')[0];
    if (base) return base.charAt(0).toUpperCase() + base.slice(1);
  }
  return 'compAI_Interno';
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
