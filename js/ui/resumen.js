/* Vista: Resumen (indicadores, productos que requieren atención y últimos movimientos). */
window.SI = window.SI || {};
SI.vistas = SI.vistas || {};

SI.vistas.resumen = (function () {
  const esc = SI.util.esc;

  function render(el) {
    const T = SI.textos.resumen;
    const C = SI.catalogos;
    const inv = SI.inventario;
    const ui = SI.ui;
    const ind = inv.indicadores();

    const kpis = [
      { etiqueta: T.kpiSku, valor: ui.num(ind.skuActivos), detalle: T.kpiSkuDetalle, tono: 'ok', accion: 'ir-productos', datos: { estado: '' } },
      { etiqueta: T.kpiUnidades, valor: ui.num(ind.unidadesDisponibles), detalle: T.kpiUnidadesDetalle },
      { etiqueta: T.kpiBajo, valor: ui.num(ind.stockBajo), detalle: T.kpiBajoDetalle, tono: 'bajo', accion: 'ir-productos', datos: { estado: 'bajo' } },
      { etiqueta: T.kpiSin, valor: ui.num(ind.sinStock), detalle: T.kpiSinDetalle, tono: 'sin', accion: 'ir-productos', datos: { estado: 'sin-stock' } },
      { etiqueta: T.kpiRecientes, valor: ui.num(ind.movimientosRecientes), detalle: T.kpiRecientesDetalle(C.diasMovimientosRecientes), accion: 'ir-movimientos', datos: { periodo: String(C.diasMovimientosRecientes) } }
    ];
    // Solo si existen datos de vencimiento.
    if (ind.hayVencimientos) {
      kpis.push({ etiqueta: T.kpiVence, valor: ui.num(ind.porVencer), detalle: T.kpiVenceDetalle(C.diasAlertaVencimiento), tono: 'vence', accion: 'navegar', datos: { vista: 'alertas' } });
    }

    const atencion = inv.productos()
      .filter((p) => p.activo && inv.nivelAlerta(p) < 3)
      .sort((a, b) => inv.nivelAlerta(a) - inv.nivelAlerta(b))
      .slice(0, 6);

    const ultimos = inv.movimientos().slice(0, 6);

    el.innerHTML = `
      ${ui.cabeceraVista(T.titulo, T.descripcion)}
      <section class="grid-kpi" aria-label="Indicadores">${kpis.map(ui.kpi).join('')}</section>
      <div class="grid-2">
        <section class="panel">
          <div class="panel-cabecera"><h2>${esc(T.atencion)}</h2>${ui.boton(T.verTodos, 'navegar', { vista: 'alertas' }, 'btn btn-texto btn-chico')}</div>
          <div class="panel-cuerpo">
            ${atencion.length ? `<ul class="lista">${atencion.map(itemAtencion).join('')}</ul>` : ui.vacio(T.atencionVacio, '', '', true)}
          </div>
        </section>
        <section class="panel">
          <div class="panel-cabecera"><h2>${esc(T.ultimos)}</h2>${ui.boton(T.verTodos, 'navegar', { vista: 'movimientos' }, 'btn btn-texto btn-chico')}</div>
          <div class="panel-cuerpo">
            ${ultimos.length ? `<ul class="lista">${ultimos.map(itemMovimiento).join('')}</ul>` : ui.vacio(T.ultimosVacio, '', '', true)}
          </div>
        </section>
      </div>`;
  }

  function itemAtencion(p) {
    const inv = SI.inventario;
    const ui = SI.ui;
    return `<li class="lista-item">
      <div class="lista-principal">
        <button type="button" class="enlace" data-accion="ver-producto" data-producto="${esc(p.id)}">${esc(p.nombre)}</button>
        <span class="lista-secundario"><span class="mono">${esc(p.sku)}</span> · ${esc(SI.textos.resumen.disponibleVsMinimo(ui.num(inv.disponible(p)), ui.num(p.stockMinimo)))}</span>
      </div>
      <div class="lista-lateral"><span class="insignias">${ui.insigniaEstado(inv.estado(p))}${ui.insigniaVencimiento(p)}</span></div>
    </li>`;
  }

  function itemMovimiento(m) {
    const p = SI.inventario.producto(m.productoId);
    const ui = SI.ui;
    return `<li class="lista-item">
      <div class="lista-principal">
        <span>${ui.insigniaTipo(m.tipo)} ${m.canal ? ui.insigniaCanal(m.canal) : ''}</span>
        <span class="lista-secundario">${p ? `<button type="button" class="enlace" data-accion="ver-producto" data-producto="${esc(p.id)}">${esc(p.nombre)}</button>` : esc(m.productoId)} · ${ui.fecha(m.fecha)}</span>
      </div>
      <div class="lista-lateral">${ui.deltaMovimiento(m)}</div>
    </li>`;
  }

  return { render };
})();
