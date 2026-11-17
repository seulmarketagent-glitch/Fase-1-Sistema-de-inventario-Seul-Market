/*
 * Validación y aplicación de movimientos de inventario.
 *
 * Todos los movimientos se convierten a unidades base antes de afectar el stock.
 * Reglas:
 *  - Cantidades siempre positivas; el saldo de una ubicación nunca queda negativo.
 *  - Entradas (recepción, devolución) suman en destino.
 *  - Salidas (venta, merma) restan en origen. Las salidas consumen lotes por FEFO.
 *  - Traslados restan en origen y suman en destino (mueven también los lotes).
 *  - Ajustes suman o restan en una ubicación y exigen motivo.
 */
window.SI = window.SI || {};

SI.movimientos = (function () {
  const C = () => SI.catalogos;
  const V = () => SI.textos.validacion;

  const tipo = (id) => C().tiposMovimiento.find((t) => t.id === id) || null;
  const existeUbicacion = (id) => C().ubicaciones.some((u) => u.id === id);
  const existeCanal = (id) => C().canales.some((c) => c.id === id);
  const nombreUbicacion = (id) => (C().ubicaciones.find((u) => u.id === id) || {}).nombre || id;

  /** Determina origen y destino reales según el tipo de movimiento. */
  function resolverUbicaciones(t, d) {
    switch (t.efecto) {
      case 'entrada': return { origen: null, destino: d.destino || null };
      case 'salida': return { origen: d.origen || null, destino: null };
      case 'traslado': return { origen: d.origen || null, destino: d.destino || null };
      case 'ajuste':
        if (d.direccion === 'sumar') return { origen: null, destino: d.ubicacion || null };
        if (d.direccion === 'restar') return { origen: d.ubicacion || null, destino: null };
        return { origen: null, destino: null };
      default: return { origen: null, destino: null };
    }
  }

  /**
   * Valida los datos del formulario.
   * Devuelve { ok, errores: {campo: mensaje}, avisos: [..], calculo }.
   * "calculo" se entrega aunque haya errores para alimentar la vista previa.
   */
  function validar(d) {
    const inv = SI.inventario;
    const conv = SI.conversiones;
    const errores = {};
    const avisos = [];

    const t = tipo(d.tipo);
    if (!t) return { ok: false, errores: { tipo: V().tipo }, avisos, calculo: null };

    const p = inv.producto(d.productoId);
    if (!p) errores.producto = V().producto;
    else if (!p.activo) errores.producto = V().productoInactivo;

    // Cantidad y conversión
    const texto = String(d.cantidad == null ? '' : d.cantidad).trim().replace(',', '.');
    const cantidad = Number(texto);
    if (texto === '') errores.cantidad = V().cantidadRequerida;
    else if (!isFinite(cantidad)) errores.cantidad = V().cantidadNumero;
    else if (cantidad <= 0) errores.cantidad = V().cantidadPositiva;

    let factor = null;
    let unidades = null;
    if (p) {
      factor = conv.factor(p, d.presentacionId);
      if (!factor) errores.presentacionId = V().presentacion;
    }
    if (p && factor && !errores.cantidad) {
      unidades = conv.aUnidadesBase(p, cantidad, d.presentacionId);
      if (!conv.esCantidadValida(p, unidades)) {
        errores.cantidad = V().cantidadEntera(conv.unidadBase(p).plural);
        unidades = null;
      }
    }

    // Ubicaciones
    t.campos.forEach((campo) => {
      if (!existeUbicacion(d[campo])) errores[campo] = V().ubicacion;
    });
    if (t.efecto === 'traslado' && d.origen && d.origen === d.destino) errores.destino = V().mismaUbicacion;
    if (t.efecto === 'ajuste' && d.direccion !== 'sumar' && d.direccion !== 'restar') errores.direccion = V().direccion;
    const { origen, destino } = resolverUbicaciones(t, d);

    // Canal
    if (t.canal === 'obligatorio' && !existeCanal(d.canal)) errores.canal = V().canal;
    if (t.canal === 'opcional' && d.canal && !existeCanal(d.canal)) errores.canal = V().canal;

    // Motivo y referencia
    const nota = String(d.nota || '').trim();
    if (t.motivos && t.motivoObligatorio && !t.motivos.includes(d.motivo)) errores.motivo = V().motivo;
    if (t.motivos && d.motivo === C().motivoOtro && !nota) errores.nota = V().notaOtro;
    const refObligatoria = t.referencia && t.referencia.obligatoriaEnCanal;
    if (refObligatoria && refObligatoria.includes(d.canal) && !nota) errores.nota = V().referenciaObligatoria;

    // Fecha
    if (!d.fecha) errores.fecha = V().fechaRequerida;
    else if (!SI.util.esFechaValida(d.fecha)) errores.fecha = V().fechaInvalida;
    else if (d.fecha > SI.util.hoyISO()) errores.fecha = V().fechaFutura;

    // Lote y vencimiento (recepción de productos con control de vencimiento)
    const pideVencimiento = !!(t.registraLote && p && p.controlaVencimiento);
    if (pideVencimiento) {
      if (!d.vencimiento) errores.vencimiento = V().vencimiento;
      else if (!SI.util.esFechaValida(d.vencimiento)) errores.vencimiento = V().vencimientoInvalido;
      else if (d.fecha && d.vencimiento < d.fecha) avisos.push(V().avisoVencido);
    }

    // Saldos resultantes
    let saldos = [];
    let totalAntes = null;
    let totalDespues = null;
    if (p && unidades) {
      if (origen && existeUbicacion(origen)) {
        const s = inv.stockEn(p, origen);
        if (unidades > s) {
          errores.cantidad = V().stockInsuficiente(conv.textoUnidades(p, s), nombreUbicacion(origen));
        }
      }
      const cambios = {};
      if (origen && existeUbicacion(origen)) cambios[origen] = (cambios[origen] || 0) - unidades;
      if (destino && existeUbicacion(destino)) cambios[destino] = (cambios[destino] || 0) + unidades;
      saldos = Object.keys(cambios).map((u) => ({
        ubicacion: u, antes: inv.stockEn(p, u), despues: inv.stockEn(p, u) + cambios[u]
      }));
      totalAntes = inv.fisico(p);
      totalDespues = totalAntes + Object.values(cambios).reduce((a, b) => a + b, 0);

      if (t.id === 'venta' && !errores.cantidad && unidades > inv.disponible(p)) {
        avisos.push(V().avisoReservado(conv.textoUnidades(p, inv.disponible(p))));
      }
    }

    return {
      ok: Object.keys(errores).length === 0,
      errores,
      avisos,
      calculo: {
        tipo: t, producto: p, cantidad, factor, unidades, origen, destino,
        saldos, totalAntes, totalDespues, pideVencimiento
      }
    };
  }

  /* ---------- Lotes ---------- */

  /** Descuenta lotes de una ubicación, primero los que vencen antes (FEFO). Devuelve lo descontado. */
  function consumirLotes(p, ubicacionId, unidades) {
    const descontados = [];
    let resto = unidades;
    (p.lotes || [])
      .filter((l) => l.ubicacion === ubicacionId && l.cantidad > 0)
      .sort((a, b) => a.vence.localeCompare(b.vence))
      .forEach((l) => {
        if (resto <= 0) return;
        const k = Math.min(l.cantidad, resto);
        l.cantidad -= k;
        resto -= k;
        descontados.push({ codigo: l.codigo, vence: l.vence, cantidad: k });
      });
    p.lotes = (p.lotes || []).filter((l) => l.cantidad > 0);
    return descontados;
  }

  function agregarLote(p, lote) {
    p.lotes = p.lotes || [];
    const igual = p.lotes.find((l) => l.codigo === lote.codigo && l.vence === lote.vence && l.ubicacion === lote.ubicacion);
    if (igual) igual.cantidad += lote.cantidad;
    else p.lotes.push(Object.assign({}, lote));
  }

  /* ---------- Aplicación ---------- */

  /**
   * Valida y aplica el movimiento al estado en memoria. No guarda: eso lo hace
   * SI.repositorio.registrarMovimiento. Devuelve { ok, movimiento } o { ok:false, errores }.
   */
  function aplicar(d) {
    const v = validar(d);
    if (!v.ok) return v;
    const { tipo: t, producto: p, unidades, origen, destino, cantidad } = v.calculo;
    const pres = SI.conversiones.presentacion(p, d.presentacionId);
    const nota = String(d.nota || '').trim();

    let lotes = [];
    if (origen) {
      p.stock[origen] = SI.inventario.stockEn(p, origen) - unidades;
      lotes = consumirLotes(p, origen, unidades);
    }
    if (destino) {
      p.stock[destino] = SI.inventario.stockEn(p, destino) + unidades;
      if (t.efecto === 'traslado') {
        lotes.forEach((l) => agregarLote(p, { codigo: l.codigo, vence: l.vence, cantidad: l.cantidad, ubicacion: destino }));
      } else if (v.calculo.pideVencimiento) {
        const codigo = String(d.lote || '').trim() || ('L-' + d.fecha.replace(/-/g, '').slice(2) + '-' + p.sku.slice(-4));
        lotes = [{ codigo, vence: d.vencimiento, cantidad: unidades }];
        agregarLote(p, { codigo, vence: d.vencimiento, cantidad: unidades, ubicacion: destino });
      }
    }

    const movimiento = {
      id: SI.util.uid('MOV'),
      fecha: d.fecha,
      registradoEn: new Date().toISOString(),
      tipo: t.id,
      productoId: p.id,
      cantidad,
      presentacionId: pres.id,
      presentacionNombre: pres.nombre,
      factor: pres.factor,
      unidades,
      delta: (destino ? unidades : 0) - (origen ? unidades : 0),
      origen: origen || null,
      destino: destino || null,
      canal: t.canal && d.canal ? d.canal : null,
      direccion: t.efecto === 'ajuste' ? d.direccion : null,
      motivo: t.motivos ? d.motivo : null,
      nota: nota || null,
      lotes,
      saldoProducto: SI.inventario.fisico(p),
      demo: false
    };
    SI.inventario.agregarMovimiento(movimiento);
    return { ok: true, movimiento, calculo: v.calculo };
  }

  return { tipo, validar, aplicar, resolverUbicaciones };
})();
