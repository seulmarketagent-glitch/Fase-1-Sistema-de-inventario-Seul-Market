/*
 * Estado del inventario y cálculos derivados (stock, estados, alertas, indicadores).
 *
 * Capa de lógica de negocio: estado en memoria y cálculos puros.
 * La lectura y el guardado viven en js/datos/ (repositorio + fuentes).
 */
window.SI = window.SI || {};

SI.inventario = (function () {
  const C = () => SI.catalogos;
  const estadoApp = { productos: [], movimientos: [] };

  /* ---------- Estado ---------- */
  // Este módulo NO lee ni guarda datos: eso lo hace SI.repositorio (js/datos/).

  /** Reemplaza el estado en memoria con los datos que entrega el repositorio. */
  function establecer(datos) {
    estadoApp.productos = datos.productos;
    estadoApp.movimientos = datos.movimientos;
  }

  /** Copia del estado para que el repositorio la guarde. */
  function instantanea() {
    return SI.util.clonar({ productos: estadoApp.productos, movimientos: estadoApp.movimientos });
  }

  /* ---------- Consultas ---------- */

  const productos = () => estadoApp.productos;
  const producto = (id) => estadoApp.productos.find((p) => p.id === id) || null;

  /** Movimientos ordenados del más reciente al más antiguo. */
  function movimientos() {
    return estadoApp.movimientos.slice().sort((a, b) =>
      b.fecha.localeCompare(a.fecha) || String(b.registradoEn).localeCompare(String(a.registradoEn)));
  }

  const movimientosDe = (productoId) => movimientos().filter((m) => m.productoId === productoId);

  function agregarMovimiento(mov) {
    estadoApp.movimientos.push(mov);
  }

  /* ---------- Stock ---------- */

  const stockEn = (p, ubicacionId) => p.stock[ubicacionId] || 0;
  const fisico = (p) => Object.values(p.stock).reduce((a, b) => a + b, 0);
  /** Disponible = físico − reservado (nunca negativo). */
  const disponible = (p) => Math.max(0, fisico(p) - (p.reservado || 0));

  /** Unidades de una ubicación que no pertenecen a ningún lote registrado. */
  function sinLote(p, ubicacionId) {
    const enLotes = (p.lotes || []).filter((l) => l.ubicacion === ubicacionId).reduce((a, l) => a + l.cantidad, 0);
    return Math.max(0, stockEn(p, ubicacionId) - enLotes);
  }

  function estado(p) {
    if (!p.activo) return 'inactivo';
    const d = disponible(p);
    if (d <= 0) return 'sin-stock';
    if (d <= p.stockMinimo) return 'bajo';
    return 'ok';
  }

  /* ---------- Vencimientos ---------- */

  function lotesConSaldo(p) {
    return (p.lotes || []).filter((l) => l.cantidad > 0).sort((a, b) => a.vence.localeCompare(b.vence));
  }

  /** { porVencer: [...], vencidos: [...] } con días restantes calculados. */
  function alertasVencimiento(p) {
    const limite = C().diasAlertaVencimiento;
    const porVencer = [];
    const vencidos = [];
    lotesConSaldo(p).forEach((l) => {
      const dias = SI.util.diasHasta(l.vence);
      if (dias < 0) vencidos.push(Object.assign({ dias }, l));
      else if (dias <= limite) porVencer.push(Object.assign({ dias }, l));
    });
    return { porVencer, vencidos };
  }

  function tieneAlertaVencimiento(p) {
    if (!p.activo) return false;
    const a = alertasVencimiento(p);
    return a.porVencer.length > 0 || a.vencidos.length > 0;
  }

  /** Nivel para ordenar por criticidad: 0 sin stock, 1 bajo, 2 vencimiento, 3 ok, 4 inactivo. */
  function nivelAlerta(p) {
    const e = estado(p);
    if (e === 'ok' && tieneAlertaVencimiento(p)) return 2;
    return C().estados[e].nivel;
  }

  /* ---------- Indicadores ---------- */

  function indicadores() {
    const activos = estadoApp.productos.filter((p) => p.activo);
    const desde = SI.util.sumarDias(SI.util.hoyISO(), -C().diasMovimientosRecientes);
    const stockBajo = activos.filter((p) => estado(p) === 'bajo').length;
    const sinStock = activos.filter((p) => estado(p) === 'sin-stock').length;
    const porVencer = activos.filter(tieneAlertaVencimiento).length;
    const conAlerta = activos.filter((p) => estado(p) !== 'ok' || tieneAlertaVencimiento(p)).length;
    return {
      skuActivos: activos.length,
      unidadesDisponibles: activos.reduce((a, p) => a + disponible(p), 0),
      stockBajo,
      sinStock,
      porVencer,
      conAlerta,
      movimientosRecientes: estadoApp.movimientos.filter((m) => m.fecha > desde).length,
      hayVencimientos: estadoApp.productos.some((p) => (p.lotes || []).length > 0)
    };
  }

  return {
    establecer, instantanea,
    productos, producto, movimientos, movimientosDe, agregarMovimiento,
    stockEn, fisico, disponible, sinLote, estado,
    lotesConSaldo, alertasVencimiento, tieneAlertaVencimiento, nivelAlerta,
    indicadores
  };
})();
