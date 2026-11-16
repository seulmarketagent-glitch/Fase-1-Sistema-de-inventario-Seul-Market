/* Diálogo: detalle de producto (datos, equivalencias, stock por ubicación, lotes e historial). Solo lectura. */
window.SI = window.SI || {};
SI.vistas = SI.vistas || {};

SI.vistas.detalle = (function () {
  const esc = SI.util.esc;

  function abrir(productoId) {
    const p = SI.inventario.producto(productoId);
    const dlg = document.getElementById('dlg-detalle');
    if (!p || !dlg) return;
    dlg.innerHTML = contenido(p);
    if (!dlg.open) dlg.showModal();
    dlg.querySelector('.dlg-cuerpo').scrollTop = 0;
  }

  function contenido(p) {
    const T = SI.textos.detalle;
    const inv = SI.inventario;
    const conv = SI.conversiones;
    const ui = SI.ui;
    const ub = conv.unidadBase(p);
    const estado = inv.estado(p);
    const historial = inv.movimientosDe(p.id);
    const ubicaciones = Object.keys(p.stock);

    const general = `<dl class="dl">
      <dt>${esc(T.sku)}</dt><dd class="mono">${esc(p.sku)}</dd>
      <dt>${esc(T.variante)}</dt><dd>${esc(p.variante)}</dd>
      <dt>${esc(T.categoria)}</dt><dd>${esc(ui.nombreCategoria(p.categoria))}</dd>
      <dt>${esc(T.estado)}</dt><dd><span class="insignias">${ui.insigniaEstado(estado)}${ui.insigniaVencimiento(p)}</span></dd>
      <dt>${esc(T.precioB2C)}</dt><dd>${ui.clp(p.precioB2C)}</dd>
      <dt>${esc(T.precioB2B)}</dt><dd>${ui.clp(p.precioB2B)}</dd>
    </dl>`;

    const presentaciones = `<table class="tabla tabla-simple">
      <thead><tr><th>${esc(T.presentacion)}</th><th>${esc(T.equivalencia)}</th></tr></thead>
      <tbody>${p.presentaciones.slice().sort((a, b) => a.factor - b.factor).map((x) => `<tr>
        <td>${esc(x.nombre)}${x.factor === 1 ? ` <span class="insignia insignia-canal">${esc(T.unidadBase)}</span>` : ''}</td>
        <td>${x.factor === 1 ? `1 ${esc(ub.singular)}` : `${ui.num(x.factor)} ${esc(ub.plural)}`}</td>
      </tr>`).join('')}</tbody>
    </table>`;

    const stock = `
      <div class="stock-resumen">
        <div><small>${esc(T.fisico)}</small><b>${ui.num(inv.fisico(p))}</b></div>
        <div><small>${esc(T.reservado)}</small><b>${ui.num(p.reservado || 0)}</b></div>
        <div><small>${esc(T.disponible)}</small><b class="cantidad cantidad-${ui.claseEstado(estado)}">${ui.num(inv.disponible(p))}</b></div>
        <div><small>${esc(T.minimo)}</small><b>${ui.num(p.stockMinimo)}</b></div>
      </div>
      <p class="campo-ayuda">${esc(T.equivale)}: ${esc(conv.desglose(p, inv.disponible(p)))} disponibles. ${p.reservado ? esc(T.reservadoNota) : ''}</p>
      ${ubicaciones.length ? `<table class="tabla tabla-simple">
        <thead><tr><th>${esc(T.ubicacion)}</th><th class="num">${esc(T.cantidad)}</th>${p.controlaVencimiento ? `<th class="num">${esc(T.sinLote)}</th>` : ''}</tr></thead>
        <tbody>${ubicaciones.map((u) => `<tr>
          <td>${esc(ui.nombreUbicacion(u))}</td>
          <td class="num"><span class="cantidad">${ui.num(inv.stockEn(p, u))}</span></td>
          ${p.controlaVencimiento ? `<td class="num">${ui.num(inv.sinLote(p, u))}</td>` : ''}
        </tr>`).join('')}</tbody>
      </table>` : `<p class="tenue">${esc(T.noAsignado)}</p>`}`;

    let lotes;
    if (!p.controlaVencimiento) {
      lotes = `<p class="tenue">${esc(T.noControla)}</p>`;
    } else {
      const ls = inv.lotesConSaldo(p);
      lotes = ls.length ? `<table class="tabla tabla-simple">
        <thead><tr><th>${esc(T.lote)}</th><th>${esc(T.ubicacion)}</th><th class="num">${esc(T.cantidad)}</th><th>${esc(T.vence)}</th></tr></thead>
        <tbody>${ls.map((l) => {
          const dias = SI.util.diasHasta(l.vence);
          const tono = dias < 0 ? 'sin' : dias <= SI.catalogos.diasAlertaVencimiento ? 'vence' : '';
          const texto = dias < 0 ? SI.textos.alertas.vencidoHace(-dias) : SI.textos.alertas.venceEn(dias);
          return `<tr>
            <td class="mono">${esc(l.codigo)}</td>
            <td>${esc(ui.nombreUbicacion(l.ubicacion))}</td>
            <td class="num">${ui.num(l.cantidad)}</td>
            <td>${ui.fecha(l.vence)} ${tono ? `<span class="insignia insignia-${tono}">${esc(texto)}</span>` : `<span class="tenue">· ${esc(texto)}</span>`}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>` : `<p class="tenue">${esc(T.sinLotes)}</p>`;
    }

    const hist = historial.length ? `<div class="tabla-contenedor"><table class="tabla tabla-simple">
      <thead><tr><th>Fecha</th><th>Tipo</th><th>Ingresado</th><th class="num">Unidades</th><th>Ubicación</th><th>Detalle</th></tr></thead>
      <tbody>${historial.map((m) => `<tr>
        <td>${ui.fecha(m.fecha)}</td>
        <td>${ui.insigniaTipo(m.tipo)} ${m.canal ? ui.insigniaCanal(m.canal) : ''}</td>
        <td>${ui.cantidadIngresada(m)}</td>
        <td class="num">${ui.deltaMovimiento(m)}</td>
        <td>${ui.ubicacionesMovimiento(m)}</td>
        <td>${ui.detalleMovimiento(m)}</td>
      </tr>`).join('')}</tbody>
    </table></div>` : `<p class="tenue">${esc(T.historialVacio)}</p>`;

    return `<div class="dialogo-contenido">
      <header class="dlg-cabecera">
        <div>
          <h2 id="dlg-detalle-titulo">${esc(p.nombre)}</h2>
          <p><span class="mono">${esc(p.sku)}</span> · ${esc(p.variante)} · <span class="insignia insignia-demo">${esc(SI.textos.app.insigniaDemo)}</span></p>
        </div>
        <button type="button" class="btn-icono" data-accion="cerrar-dialogo" aria-label="${esc(SI.textos.comun.cerrar)}">×</button>
      </header>
      <div class="dlg-cuerpo">
        <section class="seccion"><h3>${esc(T.general)}</h3>${general}</section>
        <section class="seccion"><h3>${esc(T.presentaciones)}</h3>
          <p class="campo-ayuda">${esc(T.unidadBase)}: <strong>${esc(ub.singular)}</strong>. Las presentaciones son equivalencias; el saldo se guarda solo en ${esc(ub.plural)}.</p>
          ${presentaciones}
        </section>
        <section class="seccion"><h3>${esc(T.stock)} · ${esc(T.porUbicacion)}</h3>${stock}</section>
        <section class="seccion"><h3>${esc(T.lotes)}</h3>${lotes}</section>
        <section class="seccion"><h3>${esc(T.historial)}</h3>${hist}</section>
        <p class="aviso aviso-info">${esc(T.notaSaldo)}</p>
      </div>
      <footer class="dlg-pie">
        <button type="button" class="btn" data-accion="cerrar-dialogo">${esc(SI.textos.comun.cerrar)}</button>
        ${p.activo ? SI.ui.boton(T.registrar, 'nuevo-movimiento', { producto: p.id }, 'btn btn-primario') : ''}
      </footer>
    </div>`;
  }

  return { abrir };
})();
