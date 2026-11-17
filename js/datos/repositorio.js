/*
 * Repositorio: única puerta entre la interfaz y los datos.
 *
 * - Lecturas: la interfaz consulta SI.inventario (estado en memoria + cálculos),
 *   que el repositorio llena al cargar.
 * - Escrituras: siempre por aquí, y siempre asíncronas (Promise), para que
 *   cambiar la fuente local por un servidor no obligue a reescribir pantallas.
 *
 * Con la fuente local, las reglas de negocio (SI.movimientos) se ejecutan en el
 * navegador. Con un servidor, el servidor aplicará las mismas reglas y los
 * permisos; el navegador solo validará para dar mensajes rápidos.
 */
window.SI = window.SI || {};

SI.repositorio = (function () {
  function fuente() {
    const f = SI.fuentes[SI.configDatos.fuente];
    if (!f) throw new Error(`Fuente de datos desconocida: ${SI.configDatos.fuente}`);
    return f;
  }

  /** Carga los datos guardados; si no hay, usa la demostración (sin guardarla todavía). */
  async function cargar() {
    const datos = await fuente().leer();
    SI.inventario.establecer(datos || SI.datosDemo.generar());
  }

  /**
   * Valida y registra un movimiento. Devuelve el mismo resultado que
   * SI.movimientos.aplicar: { ok, movimiento, calculo } o { ok:false, errores, ... }.
   * Si no se pudo guardar, el movimiento queda en memoria y se avisa con guardado:false.
   */
  async function registrarMovimiento(datosFormulario) {
    const r = SI.movimientos.aplicar(datosFormulario);
    if (!r.ok) return r;
    try {
      await fuente().escribir(SI.inventario.instantanea());
      r.guardado = true;
    } catch (e) {
      r.guardado = false;
    }
    return r;
  }

  /** Vuelve a los datos de demostración y descarta lo guardado en la fuente actual. */
  async function restablecer() {
    await fuente().borrar();
    SI.inventario.establecer(SI.datosDemo.generar());
  }

  return {
    cargar, registrarMovimiento, restablecer,
    get persistente() { return fuente().persistente; },
    get nombreFuente() { return fuente().nombre; }
  };
})();
