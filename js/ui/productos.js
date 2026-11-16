/* Vista: Productos (tabla con búsqueda, filtros y ordenamiento). Solo lectura de saldos. */
window.SI = window.SI || {};
SI.vistas = SI.vistas || {};

SI.vistas.productos = (function () {
  const esc = SI.util.esc;
  const filtros = { q: '', orden: '' };
  let contenedor = null;

  function limpiarFiltros() {
    filtros.q = '';
    SI.filtrosProductos.forEach((f) => { filtros[f.id] = ''; });
  }

  /** Permite que otras vistas abran Productos con filtros predefinidos. */
  function aplicarFiltros(valores) {
    limpiarFiltros();
    Object.assign(filtros, valores);
  }

  function lista() {
    const q = SI.util.normalizar(filtros.q);
    const orden = SI.ordenesProductos.find((o) => o.id === filtros.orden) || SI.ordenesProductos[0];
    return SI.inventario.productos()
      .filter((p) => !q || SI.util.normalizar(`${p.sku} ${p.nombre} ${p.variante}`).includes(q))
      .filter((p) => SI.filtrosProductos.every((f) => !filtros[f.id] || f.coincide(p, filtros[f.id])))
      .slice()
      .sort(orden.comparar);
  }

  function render(el) {
    const T = SI.textos.productos;
    const ui = SI.ui;
    if (!filtros.orden) filtros.orden = SI.ordenesProductos[0].id;

    el.innerHTML = `
      ${ui.cabeceraVista(T.titulo, T.descripcion)}
      <form class="panel filtros" role="search" onsubmit="return false">
        <div class="campo campo-busqueda">
          <label for="f-q">${esc(T.buscar)}</label>
          <input id="f-q" class="input" type="search" data-filtro="q" value="${esc(filtros.q)}" placeholder="Ej.: RAM-0001 o ramen" autocomplete="off">
        </div>
        ${SI.filtrosProductos.map((f) => `
          <div class="campo">
            <label for="f-${f.id}">${esc(f.etiqueta)}</label>
            <select id="f-${f.id}" class="select" data-filtro="${f.id}">${ui.opcionesSelect(f.opciones(), filtros[f.id] || '', f.todos)}</select>
          </div>`).join('')}
        <div class="campo">
          <label for="f-orden">${esc(T.ordenar)}</label>
          <select id="f-orden" class="select" data-filtro="orden">${ui.opcionesSelect(SI.ordenesProductos, filtros.orden)}</select>
        </div>
      </form>
      <div id="productos-resultado"></div>`;

    contenedor = el.querySelector('#productos-resultado');
    el.querySelector('.filtros').addEventListener('input', (e) => {
      const campo = e.target.dataset.filtro;
      if (!campo) return;
      filtros[campo] = e.target.value;
      pintarResultado();
    });
    pintarResultado();
  }

  function pintarResultado() {
    const T = SI.textos.productos;
    const ui = SI.ui;
    const total = SI.inventario.productos().length;
    const items = lista();
    const columnas = SI.columnasProductos.filter((c) => c.visible);
    const hayFiltros = filtros.q || SI.filtrosProductos.some((f) => filtros[f.id]);

    const pie = `<div class="filtros-pie">
      <span>${esc(T.contador(items.length, total))}</span>
      ${hayFiltros ? ui.boton(SI.textos.comun.limpiarFiltros, 'limpiar-filtros', { vista: 'productos' }, 'btn btn-texto btn-chico') : ''}
    </div>`;

    if (!items.length) {
      contenedor.innerHTML = pie + `<div class="panel">${ui.vacio(T.vacioTitulo, T.vacioTexto,
        ui.boton(SI.textos.comun.limpiarFiltros, 'limpiar-filtros', { vista: 'productos' }))}</div>`;
      return;
    }

    contenedor.innerHTML = pie + `
      <div class="tabla-contenedor responsive">
        <table class="tabla">
          <thead><tr>${columnas.map((c) => `<th scope="col" class="${c.clase || ''}">${esc(c.etiqueta)}</th>`).join('')}</tr></thead>
          <tbody>
            ${items.map((p) => `<tr class="${p.activo ? '' : 'fila-inactiva'}">
              ${columnas.map((c) => `<td class="${c.clase || ''}${c.movil === false ? ' ocultar-movil' : ''}" data-etiqueta="${esc(c.etiqueta)}">${c.render(p)}</td>`).join('')}
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  limpiarFiltros();
  return { render, limpiarFiltros, aplicarFiltros };
})();
