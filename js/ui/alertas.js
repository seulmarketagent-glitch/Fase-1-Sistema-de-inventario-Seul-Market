/* Vista: Alertas (sin stock, stock bajo, próximos a vencer, vencidos). */
window.SI = window.SI || {};
SI.vistas = SI.vistas || {};

SI.vistas.alertas = (function () {
  const esc = SI.util.esc;

  function render(el) {
    const T = SI.textos.alertas;
    const inv = SI.inventario;
    const ui = SI.ui;
    const activos = inv.productos().filter((p) => p.activo);

    const sinStock = activos.filter((p) => inv.estado(p) === 'sin-stock');
    const bajo = activos.filter((p) => inv.estado(p) === 'bajo')
      .sort((a, b) => inv.disponible(a) / (a.stockMinimo || 1) - inv.disponible(b) / (b.stockMinimo || 1));

    const porVencer = [];
    const vencidos = [];
    activos.forEach((p) => {
      const a = inv.alertasVencimiento(p);
      a.porVencer.forEach((l) => porVencer.push({ p, l }));
      a.vencidos.forEach((l) => vencidos.push({ p, l }));
    });
    porVencer.sort((x, y) => x.l.dias - y.l.dias);

    const secciones = [
      { titulo: T.sinStock, tono: 'sin', html: sinStock.map(itemStock).join(''), n: sinStock.length },
      { titulo: T.bajo, tono: 'bajo', html: bajo.map(itemStock).join(''), n: bajo.length }
    ];
    if (inv.indicadores().hayVencimientos) {
      secciones.push({ titulo: T.porVencer, tono: 'vence', html: porVencer.map(itemLote).join(''), n: porVencer.length });
      secciones.push({ titulo: T.vencidos, tono: 'sin', html: vencidos.map(itemLote).join(''), n: vencidos.length });
    }

    el.innerHTML = `
      ${ui.cabeceraVista(T.titulo, T.descripcion)}
      <div class="grid-2">
        ${secciones.map((s) => `
          <section class="panel">
            <div class="panel-cabecera">
              <h2>${esc(s.titulo)}</h2>
              <span class="insignia insignia-${s.n ? s.tono : 'ok'}">${ui.num(s.n)}</span>
            </div>
            <div class="panel-cuerpo">
              ${s.n ? `<ul class="lista">${s.html}</ul>` : ui.vacio(T.vacio, '', '', true)}
            </div>
          </section>`).join('')}
      </div>`;
  }

  function itemStock(p) {
    const ui = SI.ui;
    const inv = SI.inventario;
    return `<li class="lista-item">
      <div class="lista-principal">
        <button type="button" class="enlace" data-accion="ver-producto" data-producto="${esc(p.id)}">${esc(p.nombre)}</button>
        <span class="lista-secundario"><span class="mono">${esc(p.sku)}</span> · ${esc(SI.textos.resumen.disponibleVsMinimo(ui.num(inv.disponible(p)), ui.num(p.stockMinimo)))}</span>
      </div>
      <div class="lista-lateral">
        ${ui.boton(SI.textos.alertas.reponer, 'nuevo-movimiento', { tipo: 'recepcion', producto: p.id }, 'btn btn-chico')}
      </div>
    </li>`;
  }

  function itemLote({ p, l }) {
    const ui = SI.ui;
    const T = SI.textos.alertas;
    const cuando = l.dias < 0 ? T.vencidoHace(-l.dias) : T.venceEn(l.dias);
    return `<li class="lista-item">
      <div class="lista-principal">
        <button type="button" class="enlace" data-accion="ver-producto" data-producto="${esc(p.id)}">${esc(p.nombre)}</button>
        <span class="lista-secundario">Lote <span class="mono">${esc(l.codigo)}</span> · ${esc(SI.conversiones.textoUnidades(p, l.cantidad))} en ${esc(ui.nombreUbicacion(l.ubicacion))}</span>
        <span class="lista-secundario"><strong>${esc(cuando)}</strong> (${ui.fecha(l.vence)})</span>
      </div>
      <div class="lista-lateral">
        ${ui.boton(T.merma, 'nuevo-movimiento', { tipo: 'merma', producto: p.id }, 'btn btn-chico')}
      </div>
    </li>`;
  }

  return { render };
})();
