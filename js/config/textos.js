/*
 * Textos de la interfaz: navegación, títulos, etiquetas, mensajes y validaciones.
 * Edita aquí cualquier texto visible sin tocar la lógica.
 */
window.SI = window.SI || {};

SI.textos = {
  app: {
    nombre: 'Seúl Market',
    subtitulo: 'Sistema de inventario',
    insigniaDemo: 'Datos de demostración',
    insigniaDemoCorta: 'Demo',
    avisoDemo: 'Prototipo con datos ficticios. Los productos, cantidades, precios y movimientos no representan el inventario real de Seúl Market.',
    avisoPersistencia: 'Los cambios se guardan solo en este navegador (almacenamiento local). No hay conexión con caja, tienda online, Mercado Libre ni bases de datos.',
    avisoSinPersistencia: 'Este navegador no permite guardar datos localmente: los cambios se perderán al recargar la página.',
    restablecer: 'Restablecer datos de demostración',
    confirmarRestablecer: '¿Restablecer los datos de demostración? Se perderán los movimientos registrados en este navegador.',
    restablecido: 'Se restablecieron los datos de demostración.',
    errorCarga: 'No se pudieron cargar los datos. Recarga la página; si el problema sigue, avisa al área de Sistemas.',
    errorDatos: 'No se pudo completar la operación con los datos. Inténtalo de nuevo.',
    avisoNoGuardado: 'El movimiento se aplicó, pero no se pudo guardar en este navegador: se perderá al recargar.',
    registrarMovimiento: 'Registrar movimiento',
    registrarMovimientoCorto: 'Movimiento'
  },

  /** Navegación principal. El orden aquí define el orden del menú. */
  nav: [
    { id: 'resumen', etiqueta: 'Resumen' },
    { id: 'productos', etiqueta: 'Productos' },
    { id: 'movimientos', etiqueta: 'Movimientos' },
    { id: 'alertas', etiqueta: 'Alertas' }
  ],

  comun: {
    cerrar: 'Cerrar',
    cancelar: 'Cancelar',
    verDetalle: 'Ver detalle',
    todas: 'Todas',
    todos: 'Todos',
    sinDato: '—',
    limpiarFiltros: 'Limpiar filtros'
  },

  resumen: {
    titulo: 'Resumen',
    descripcion: 'Vista general del inventario de demostración, expresado en unidades base.',
    kpiSku: 'SKU activos',
    kpiSkuDetalle: 'Productos habilitados',
    kpiUnidades: 'Unidades disponibles',
    kpiUnidadesDetalle: 'Unidades base, descontando reservas',
    kpiBajo: 'Stock bajo',
    kpiBajoDetalle: 'En o bajo el stock mínimo',
    kpiSin: 'Sin stock',
    kpiSinDetalle: 'Sin unidades disponibles',
    kpiRecientes: 'Movimientos recientes',
    kpiRecientesDetalle: (d) => `Registrados en los últimos ${d} días`,
    kpiVence: 'Próximos a vencer',
    kpiVenceDetalle: (d) => `Productos con lotes vencidos o que vencen en ${d} días o menos`,
    atencion: 'Requieren atención',
    atencionVacio: 'No hay productos con alertas de stock.',
    ultimos: 'Últimos movimientos',
    ultimosVacio: 'Aún no hay movimientos registrados.',
    verTodos: 'Ver todos',
    disponibleVsMinimo: (d, m) => `${d} disponibles · mínimo ${m}`
  },

  productos: {
    titulo: 'Productos',
    descripcion: 'Saldos en unidades base. El stock no se edita en la tabla: se modifica registrando movimientos.',
    buscar: 'Buscar por nombre o SKU',
    ordenar: 'Ordenar por',
    contador: (n, t) => `Mostrando ${n} de ${t} productos`,
    vacioTitulo: 'No hay productos que coincidan',
    vacioTexto: 'Prueba con otra búsqueda o limpia los filtros.'
  },

  movimientos: {
    titulo: 'Movimientos',
    descripcion: 'Historial de recepciones, ventas, traslados, devoluciones, mermas y ajustes.',
    buscar: 'Buscar por producto, SKU o referencia',
    filtroTipo: 'Tipo',
    filtroCanal: 'Canal',
    filtroPeriodo: 'Periodo',
    periodos: [
      { id: '', nombre: 'Todo el historial' },
      { id: '7', nombre: 'Últimos 7 días' },
      { id: '30', nombre: 'Últimos 30 días' }
    ],
    contador: (n, t) => `Mostrando ${n} de ${t} movimientos`,
    vacioTitulo: 'No hay movimientos que coincidan',
    vacioTexto: 'Ajusta los filtros o registra un nuevo movimiento.',
    columnas: {
      fecha: 'Fecha',
      tipo: 'Tipo',
      producto: 'Producto',
      ingresado: 'Cantidad ingresada',
      unidades: 'Unidades base',
      ubicacion: 'Ubicación',
      canal: 'Canal',
      detalle: 'Motivo / referencia'
    },
    etiquetaDemo: 'Histórico demo'
  },

  alertas: {
    titulo: 'Alertas',
    descripcion: 'Productos que necesitan reposición o revisión de vencimientos.',
    sinStock: 'Sin stock',
    bajo: 'Stock bajo',
    porVencer: 'Próximos a vencer',
    vencidos: 'Lotes vencidos',
    vacio: 'Sin alertas en esta categoría.',
    reponer: 'Registrar recepción',
    merma: 'Registrar merma',
    venceEn: (d) => (d === 0 ? 'Vence hoy' : d === 1 ? 'Vence mañana' : `Vence en ${d} días`),
    vencidoHace: (d) => (d === 1 ? 'Venció hace 1 día' : `Venció hace ${d} días`)
  },

  detalle: {
    general: 'Datos generales',
    presentaciones: 'Unidad base y presentaciones',
    stock: 'Stock',
    porUbicacion: 'Stock por ubicación',
    lotes: 'Lotes y vencimientos',
    historial: 'Historial de movimientos',
    sku: 'SKU',
    categoria: 'Categoría',
    variante: 'Variante',
    unidadBase: 'Unidad base',
    precioB2C: 'Precio B2C por unidad (demo)',
    precioB2B: 'Precio B2B por unidad (demo)',
    estado: 'Estado',
    fisico: 'Stock físico',
    reservado: 'Reservado',
    disponible: 'Disponible',
    minimo: 'Stock mínimo',
    equivale: 'Equivale a',
    reservadoNota: 'Reservado para pedidos B2B pendientes (dato de demostración; en esta versión no se modifica desde la interfaz).',
    presentacion: 'Presentación',
    equivalencia: 'Equivalencia',
    ubicacion: 'Ubicación',
    cantidad: 'Cantidad',
    sinLote: 'Sin lote asignado',
    lote: 'Lote',
    vence: 'Vence',
    noControla: 'Este producto no registra lotes ni vencimientos.',
    sinLotes: 'No hay lotes con saldo.',
    historialVacio: 'Este producto aún no tiene movimientos.',
    notaSaldo: 'El saldo no se edita directamente. Para corregirlo registra un Ajuste con motivo; quedará en el historial.',
    registrar: 'Registrar movimiento',
    noAsignado: 'Sin ubicaciones asignadas'
  },

  formulario: {
    titulo: 'Registrar movimiento',
    subtitulo: 'El stock se actualiza en unidades base al confirmar.',
    tipo: 'Tipo de movimiento',
    producto: 'Producto o SKU',
    productoPlaceholder: 'Escribe el SKU o el nombre y elige de la lista',
    canal: 'Canal',
    cantidad: 'Cantidad',
    presentacion: 'Unidad o presentación',
    origen: 'Ubicación de origen',
    destino: 'Ubicación de destino',
    ubicacion: 'Ubicación',
    direccion: 'Tipo de ajuste',
    direcciones: { sumar: 'Sumar unidades', restar: 'Restar unidades' },
    motivo: 'Motivo',
    motivoPlaceholder: 'Selecciona un motivo',
    nota: 'Referencia o nota',
    fecha: 'Fecha',
    lote: 'Código de lote',
    lotePlaceholder: 'Opcional; se genera si lo dejas vacío',
    vencimiento: 'Fecha de vencimiento',
    seleccionar: 'Selecciona…',
    enStock: (n) => `${n} en stock`,
    revisar: 'Revisar movimiento',
    confirmar: 'Confirmar movimiento',
    volver: 'Volver y editar',
    resumenTitulo: 'Confirma el movimiento',
    resumenSubtitulo: 'Revisa la conversión y los saldos antes de confirmar.',
    conversion: 'Conversión a unidades base',
    saldos: 'Saldos',
    antes: 'Antes',
    despues: 'Después',
    totalProducto: 'Total físico del producto',
    previewVacio: 'Elige producto, cantidad y presentación para ver la conversión a unidades base.',
    parcial: (u, caja) => `Venta parcial: ${u} de una ${caja}. Se descuentan solo las unidades solicitadas.`,
    lotesFefo: 'Las salidas descuentan primero los lotes que vencen antes (FEFO).',
    obligatorio: 'Obligatorio'
  },

  validacion: {
    tipo: 'Selecciona un tipo de movimiento.',
    producto: 'Selecciona un producto válido de la lista.',
    productoInactivo: 'El producto está inactivo y no admite movimientos.',
    cantidadRequerida: 'Ingresa una cantidad.',
    cantidadNumero: 'La cantidad debe ser un número.',
    cantidadPositiva: 'La cantidad debe ser mayor que cero.',
    cantidadEntera: (u) => `La cantidad debe equivaler a un número entero de ${u}.`,
    presentacion: 'Selecciona una unidad o presentación.',
    ubicacion: 'Selecciona una ubicación.',
    mismaUbicacion: 'El destino debe ser distinto del origen.',
    direccion: 'Indica si el ajuste suma o resta unidades.',
    canal: 'Selecciona el canal de venta (B2C o B2B).',
    motivo: 'Selecciona un motivo.',
    notaOtro: 'Describe el motivo cuando eliges "Otro".',
    referenciaObligatoria: 'Ingresa el N° de pedido o el cliente del pedido B2B.',
    fechaRequerida: 'Ingresa la fecha del movimiento.',
    fechaInvalida: 'La fecha no es válida.',
    fechaFutura: 'La fecha no puede ser posterior a hoy.',
    vencimiento: 'Ingresa la fecha de vencimiento del lote recibido.',
    vencimientoInvalido: 'La fecha de vencimiento no es válida.',
    stockInsuficiente: (s, ub) => `Stock insuficiente: hay ${s} en ${ub}. El saldo no puede quedar negativo.`,
    avisoReservado: (d) => `La venta supera el stock disponible (${d}) y usaría unidades reservadas para pedidos B2B.`,
    avisoVencido: 'La fecha de vencimiento es anterior a la fecha de recepción.',
    revisarErrores: 'Revisa los campos marcados antes de continuar.'
  },

  confirmacion: {
    movimiento: (tipo, unidades, producto) => `Movimiento registrado: ${tipo} de ${unidades} · ${producto}.`
  }
};
