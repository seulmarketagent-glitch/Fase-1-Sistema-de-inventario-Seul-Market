/* Vista: Movimientos (historial con filtros). */
window.SI = window.SI || {};
SI.vistas = SI.vistas || {};

SI.vistas.movimientos = (function () {
  const esc = SI.util.esc;
  const filtros = { q: '', tipo: '', canal: '', periodo: '' };
  let contenedor = null;

  function limpiarFiltros() {
    filtros.q = ''; filtros.tipo = ''; filtros.canal = ''; filtros.periodo = '';
  }

  function aplicarFiltros(valores) {
    limpiarFiltros();
    Object.assign(filtros, valores);
  }

  function lista() {
    const inv = SI.inventario;
    const q = SI.util.normalizar(filtros.q);
    const desde = filtros.periodo ? SI.util.sumarDias(SI.util.hoyISO(), -Number(filtros.periodo)) : null;
    return inv.movimientos().filter((m) => {
      if (filtros.tipo && m.tipo !== filtros.tipo) return false;
      if (filtros.canal && m.canal !== filtros.canal) return false;
      if (desde && !(m.fecha > desde)) return false;
      if (q) {
        const p = inv.producto(m.productoId) || {};
        const texto = SI.util.normalizar(`${p.sku} ${p.nombre} ${m.nota || ''} ${m.motivo || ''}`);
        if (!texto.includes(q)) return false;
      }
      return true;
    });
  }

  function render(el) {
    const T = SI.textos.movimientos;
    const ui = SI.ui;
    const C = SI.catalogos;
    el.innerHTML = `
      ${ui.cabeceraVista(T.titulo, T.descripcion)}
      <form class="panel filtros" role="search" onsubmit="return false">
        <div class="campo campo-busqueda">
          <label for="m-q">${esc(T.buscar)}</label>
          <input id="m-q" class="input" type="search" data-filtro="q" value="${esc(filtros.q)}" autocomplete="off">
        </div>
        <div class="campo">
          <label for="m-tipo">${esc(T.filtroTipo)}</label>
          <select id="m-tipo" class="select" data-filtro="tipo">${ui.opcionesSelect(C.tiposMovimiento, filtros.tipo, SI.textos.comun.todos)}</select>
        </div>
        <div class="campo">
          <label for="m-canal">${esc(T.filtroCanal)}</label>
          <select id="m-canal" class="select" data-filtro="canal">${ui.opcionesSelect(C.canales, filtros.canal, SI.textos.comun.todos)}</select>
        </div>
        <div class="campo">
          <label for="m-periodo">${esc(T.filtroPeriodo)}</label>
          <select id="m-periodo" class="select" data-filtro="periodo">${ui.opcionesSelect(T.periodos, filtros.periodo)}</select>
        </div>
      </form>
      <div id="movimientos-resultado"></div>`;

    contenedor = el.querySelector('#movimientos-resultado');
    el.querySelector('.filtros').addEventListener('input', (e) => {
      const campo = e.target.dataset.filtro;
      if (!campo) return;
      filtros[campo] = e.target.value;
      pintarResultado();
    });
    pintarResultado();
  }

  function pintarResultado() {
    const T = SI.textos.movimientos;
    const ui = SI.ui;
    const total = SI.inventario.movimientos().length;
    const items = lista();
    const hayFiltros = filtros.q || filtros.tipo || filtros.canal || filtros.periodo;
    const pie = `<div class="filtros-pie">
      <span>${esc(T.contador(items.length, total))}</span>
      ${hayFiltros ? ui.boton(SI.textos.comun.limpiarFiltros, 'limpiar-filtros', { vista: 'movimientos' }, 'btn btn-texto btn-chico') : ''}
    </div>`;

    if (!items.length) {
      const acciones = (hayFiltros ? ui.boton(SI.textos.comun.limpiarFiltros, 'limpiar-filtros', { vista: 'movimientos' }) + ' ' : '') +
        ui.boton(SI.textos.app.registrarMovimiento, 'nuevo-movimiento', {}, 'btn btn-primario');
      contenedor.innerHTML = pie + `<div class="panel">${ui.vacio(T.vacioTitulo, T.vacioTexto, `<div>${acciones}</div>`)}</div>`;
      return;
    }

    const c = T.columnas;
    contenedor.innerHTML = pie + `
      <div class="tabla-contenedor responsive">
        <table class="tabla">
          <thead><tr>
            <th scope="col">${esc(c.fecha)}</th><th scope="col">${esc(c.tipo)}</th><th scope="col">${esc(c.producto)}</th>
            <th scope="col">${esc(c.ingresado)}</th><th scope="col" class="num">${esc(c.unidades)}</th>
            <th scope="col">${esc(c.ubicacion)}</th><th scope="col">${esc(c.canal)}</th><th scope="col">${esc(c.detalle)}</th>
          </tr></thead>
          <tbody>
            ${items.map((m) => {
              const p = SI.inventario.producto(m.productoId);
              return `<tr>
                <td data-etiqueta="${esc(c.fecha)}">${ui.fecha(m.fecha)}${m.demo ? `<br><span class="tenue">${esc(T.etiquetaDemo)}</span>` : ''}</td>
                <td data-etiqueta="${esc(c.tipo)}">${ui.insigniaTipo(m.tipo)}</td>
                <td data-etiqueta="${esc(c.producto)}">${p
                  ? `<button type="button" class="enlace" data-accion="ver-producto" data-producto="${esc(p.id)}">${esc(p.nombre)}</button><br><span class="mono tenue">${esc(p.sku)}</span>`
                  : esc(m.productoId)}</td>
                <td data-etiqueta="${esc(c.ingresado)}">${ui.cantidadIngresada(m)}</td>
                <td data-etiqueta="${esc(c.unidades)}" class="num">${ui.deltaMovimiento(m)}</td>
                <td data-etiqueta="${esc(c.ubicacion)}">${ui.ubicacionesMovimiento(m)}</td>
                <td data-etiqueta="${esc(c.canal)}">${ui.insigniaCanal(m.canal)}</td>
                <td data-etiqueta="${esc(c.detalle)}">${ui.detalleMovimiento(m)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  }

  return { render, limpiarFiltros, aplicarFiltros };
})();
