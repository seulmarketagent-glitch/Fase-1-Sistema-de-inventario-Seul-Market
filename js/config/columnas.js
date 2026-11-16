/*
 * Columnas, filtros y ordenamientos de la tabla de productos.
 * - Para ocultar una columna: visible: false.
 * - Para cambiar el orden: reordena el arreglo.
 * - movil: false oculta la columna en las tarjetas de pantallas angostas (sigue visible en el detalle).
 * - Las funciones render se ejecutan al dibujar (pueden usar SI.ui, SI.inventario, etc.).
 */
window.SI = window.SI || {};

SI.columnasProductos = [
  {
    id: 'sku', etiqueta: 'SKU', visible: true,
    render: (p) => `<span class="mono">${SI.util.esc(p.sku)}</span>`
  },
  {
    id: 'nombre', etiqueta: 'Producto', visible: true, clase: 'col-nombre',
    render: (p) => `<button type="button" class="enlace" data-accion="ver-producto" data-producto="${SI.util.esc(p.id)}">${SI.util.esc(p.nombre)}</button>`
  },
  {
    id: 'variante', etiqueta: 'Variante', visible: true,
    render: (p) => SI.util.esc(p.variante)
  },
  {
    id: 'categoria', etiqueta: 'Categoría', visible: true, movil: false,
    render: (p) => SI.util.esc(SI.ui.nombreCategoria(p.categoria))
  },
  {
    id: 'disponible', etiqueta: 'Disponible', visible: true, clase: 'num',
    render: (p) => `<span class="cantidad cantidad-${SI.ui.claseEstado(SI.inventario.estado(p))}">${SI.ui.num(SI.inventario.disponible(p))}</span>`
  },
  {
    id: 'reservado', etiqueta: 'Reservado', visible: true, clase: 'num',
    render: (p) => (p.reservado ? SI.ui.num(p.reservado) : `<span class="tenue">${SI.textos.comun.sinDato}</span>`)
  },
  {
    id: 'ubicacion', etiqueta: 'Ubicación', visible: true,
    render: (p) => SI.ui.stockPorUbicacionCorto(p)
  },
  {
    id: 'unidadBase', etiqueta: 'Unidad base', visible: true, movil: false,
    render: (p) => SI.util.esc(SI.conversiones.unidadBase(p).singular)
  },
  {
    id: 'presentacion', etiqueta: 'Presentación y equivalencia', visible: true,
    render: (p) => SI.util.esc(SI.conversiones.textoEquivalencias(p))
  },
  {
    id: 'minimo', etiqueta: 'Mínimo', visible: true, clase: 'num',
    render: (p) => SI.ui.num(p.stockMinimo)
  },
  {
    id: 'estado', etiqueta: 'Estado', visible: true, clase: 'col-estado',
    render: (p) => `<span class="insignias">${SI.ui.insigniaEstado(SI.inventario.estado(p))}${SI.ui.insigniaVencimiento(p)}</span>`
  }
];

/** Filtros desplegables de la vista Productos. */
SI.filtrosProductos = [
  {
    id: 'categoria', etiqueta: 'Categoría', todos: 'Todas',
    opciones: () => SI.catalogos.categorias,
    coincide: (p, valor) => p.categoria === valor
  },
  {
    id: 'ubicacion', etiqueta: 'Ubicación', todos: 'Todas',
    opciones: () => SI.catalogos.ubicaciones,
    // Un producto pertenece a una ubicación si tiene saldo asignado ahí (aunque sea 0).
    coincide: (p, valor) => Object.prototype.hasOwnProperty.call(p.stock, valor)
  },
  {
    id: 'estado', etiqueta: 'Estado', todos: 'Todos',
    opciones: () => Object.entries(SI.catalogos.estados).map(([id, e]) => ({ id, nombre: e.nombre })),
    coincide: (p, valor) => SI.inventario.estado(p) === valor
  }
];

/** Opciones de ordenamiento de la vista Productos. La primera es la predeterminada. */
SI.ordenesProductos = [
  {
    id: 'alerta', nombre: 'Nivel de alerta',
    comparar: (a, b) => SI.inventario.nivelAlerta(a) - SI.inventario.nivelAlerta(b) ||
      SI.inventario.disponible(a) - SI.inventario.disponible(b)
  },
  {
    id: 'nombre', nombre: 'Nombre (A–Z)',
    comparar: (a, b) => a.nombre.localeCompare(b.nombre, 'es')
  },
  {
    id: 'disponible-desc', nombre: 'Stock disponible (mayor a menor)',
    comparar: (a, b) => SI.inventario.disponible(b) - SI.inventario.disponible(a)
  },
  {
    id: 'disponible-asc', nombre: 'Stock disponible (menor a mayor)',
    comparar: (a, b) => SI.inventario.disponible(a) - SI.inventario.disponible(b)
  }
];
