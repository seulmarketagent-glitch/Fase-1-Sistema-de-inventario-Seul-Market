/*
 * Arranque, navegación (por #hash) y acciones globales (data-accion).
 */
window.SI = window.SI || {};

SI.app = (function () {
  const esc = SI.util.esc;
  const estado = { vista: 'resumen' };

  function vistaDesdeHash() {
    const id = location.hash.replace('#', '');
    return SI.textos.nav.some((n) => n.id === id) ? id : SI.textos.nav[0].id;
  }

  function pintarMarca() {
    const A = SI.textos.app;
    document.title = `${A.subtitulo} · ${A.nombre} (demo)`;
    document.getElementById('marca-nombre').textContent = A.nombre;
    document.getElementById('marca-sub').textContent = A.subtitulo;
    const insignia = document.getElementById('insignia-demo');
    insignia.title = A.avisoDemo;
    insignia.innerHTML = `<span class="solo-escritorio">${esc(A.insigniaDemo)}</span><span class="solo-movil">${esc(A.insigniaDemoCorta)}</span>`;
    document.getElementById('topbar-acciones').innerHTML = `
      <button type="button" class="btn btn-primario" data-accion="nuevo-movimiento">
        <span aria-hidden="true">+</span>
        <span class="solo-escritorio">${esc(A.registrarMovimiento)}</span>
        <span class="solo-movil">${esc(A.registrarMovimientoCorto)}</span>
      </button>`;
  }

  function pintarNav() {
    const ind = SI.inventario.indicadores();
    document.getElementById('nav').innerHTML = SI.textos.nav.map((n) => {
      const actual = n.id === estado.vista ? ' aria-current="page"' : '';
      const contador = n.id === 'alertas' && ind.conAlerta
        ? `<span class="nav-contador" aria-label="${ind.conAlerta} productos con alerta">${ind.conAlerta}</span>` : '';
      return `<a href="#${esc(n.id)}"${actual}><span>${esc(n.etiqueta)}</span>${contador}</a>`;
    }).join('');
  }

  function pintarPie() {
    const A = SI.textos.app;
    document.getElementById('pie').innerHTML = `
      <div class="pie-textos">
        <p><span class="insignia insignia-demo">${esc(A.insigniaDemo)}</span> ${esc(A.avisoDemo)}</p>
        <p>${esc(SI.inventario.persistente ? A.avisoPersistencia : A.avisoSinPersistencia)}</p>
      </div>
      ${SI.ui.boton(A.restablecer, 'restablecer', {}, 'btn btn-chico')}`;
  }

  function refrescar() {
    pintarNav();
    SI.vistas[estado.vista].render(document.getElementById('vista'));
    pintarPie();
  }

  function navegar(id) {
    if (location.hash === '#' + id) {
      estado.vista = id;
      refrescar();
    } else {
      location.hash = id; // dispara hashchange
    }
  }

  function cerrarDialogos() {
    document.querySelectorAll('dialog[open]').forEach((d) => d.close());
  }

  /** Acciones globales declaradas con data-accion en cualquier botón. */
  function onClick(e) {
    const b = e.target.closest('[data-accion]');
    if (!b) return;
    const d = b.dataset;
    switch (d.accion) {
      case 'navegar':
        cerrarDialogos();
        navegar(d.vista);
        break;
      case 'ir-productos':
        SI.vistas.productos.aplicarFiltros({ estado: d.estado || '' });
        navegar('productos');
        break;
      case 'ir-movimientos':
        SI.vistas.movimientos.aplicarFiltros({ periodo: d.periodo || '' });
        navegar('movimientos');
        break;
      case 'limpiar-filtros':
        SI.vistas[d.vista].limpiarFiltros();
        refrescar();
        break;
      case 'ver-producto':
        SI.vistas.detalle.abrir(d.producto);
        break;
      case 'nuevo-movimiento':
        cerrarDialogos();
        SI.vistas.formulario.abrir({ tipo: d.tipo, producto: d.producto });
        break;
      case 'cerrar-dialogo': {
        const dlg = b.closest('dialog');
        if (dlg) dlg.close();
        break;
      }
      case 'restablecer':
        if (window.confirm(SI.textos.app.confirmarRestablecer)) {
          SI.inventario.restablecer();
          SI.vistas.productos.limpiarFiltros();
          SI.vistas.movimientos.limpiarFiltros();
          refrescar();
          SI.ui.toast(SI.textos.app.restablecido, 'ok');
        }
        break;
      default:
        break;
    }
  }

  function iniciar() {
    SI.inventario.cargar();
    pintarMarca();
    estado.vista = vistaDesdeHash();
    document.addEventListener('click', onClick);
    window.addEventListener('hashchange', () => {
      estado.vista = vistaDesdeHash();
      refrescar();
      window.scrollTo(0, 0);
    });
    refrescar();
  }

  return { iniciar, refrescar, navegar };
})();

document.addEventListener('DOMContentLoaded', SI.app.iniciar);
