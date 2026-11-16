/*
 * Utilidades generales (fechas, texto, identificadores).
 * No contienen reglas de negocio.
 */
window.SI = window.SI || {};

SI.util = (function () {
  const pad = (n) => String(n).padStart(2, '0');

  function aISO(fecha) {
    return fecha.getFullYear() + '-' + pad(fecha.getMonth() + 1) + '-' + pad(fecha.getDate());
  }

  function desdeISO(iso) {
    const [a, m, d] = String(iso).split('-').map(Number);
    return new Date(a, m - 1, d);
  }

  function hoyISO() {
    return aISO(new Date());
  }

  function sumarDias(iso, dias) {
    const f = desdeISO(iso);
    f.setDate(f.getDate() + dias);
    return aISO(f);
  }

  /** Días desde hoy hasta la fecha (negativo si ya pasó). */
  function diasHasta(iso) {
    return Math.round((desdeISO(iso) - desdeISO(hoyISO())) / 86400000);
  }

  function esFechaValida(iso) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso))) return false;
    return aISO(desdeISO(iso)) === iso;
  }

  /** Escapa texto para insertarlo de forma segura en HTML. */
  function esc(valor) {
    return String(valor == null ? '' : valor).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  /** Minúsculas y sin tildes, para búsquedas. */
  function normalizar(texto) {
    return String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }

  let contador = 0;
  function uid(prefijo) {
    contador += 1;
    return prefijo + '-' + Date.now().toString(36).toUpperCase() + contador.toString(36).toUpperCase();
  }

  function clonar(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  return { aISO, desdeISO, hoyISO, sumarDias, diasHasta, esFechaValida, esc, normalizar, uid, clonar };
})();
