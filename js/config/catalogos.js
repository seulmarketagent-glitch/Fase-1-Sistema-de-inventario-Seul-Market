/*
 * Catálogos configurables del negocio.
 * Modifica aquí categorías, ubicaciones, canales, estados, unidades base,
 * tipos de movimiento y sus motivos. El resto de la aplicación los lee desde este archivo.
 */
window.SI = window.SI || {};

SI.catalogos = {
  /** Formato regional y moneda (pesos chilenos). */
  region: { locale: 'es-CL', moneda: 'CLP' },

  /** Días para considerar un lote "próximo a vencer". */
  diasAlertaVencimiento: 30,

  /** Ventana de días para el indicador "Movimientos recientes". */
  diasMovimientosRecientes: 7,

  /** Clave de almacenamiento local del navegador (cámbiala para empezar de cero). */
  claveAlmacenamiento: 'seul-market-inventario-demo-v1',

  /**
   * Unidades base de inventario. Todo saldo se guarda en la unidad base del producto.
   * decimales: 0 = solo cantidades enteras.
   */
  unidadesBase: {
    unidad: { singular: 'unidad', plural: 'unidades', abreviatura: 'u.', decimales: 0 }
  },

  categorias: [
    { id: 'ramen', nombre: 'Ramen y fideos' },
    { id: 'snacks', nombre: 'Snacks' },
    { id: 'bebidas', nombre: 'Bebidas' },
    { id: 'condimentos', nombre: 'Condimentos y salsas' },
    { id: 'algas', nombre: 'Algas' },
    { id: 'refrigerados', nombre: 'Kimchi y refrigerados' }
  ],

  /**
   * Ubicaciones físicas de demostración (supuesto: todas en el local de Recoleta).
   * recepcion: true → destino sugerido al registrar recepciones.
   */
  ubicaciones: [
    { id: 'sala', nombre: 'Sala de ventas', corto: 'Sala', detalle: 'Local Recoleta' },
    { id: 'bodega', nombre: 'Bodega', corto: 'Bodega', detalle: 'Local Recoleta', recepcion: true },
    { id: 'refrigerador', nombre: 'Refrigerador', corto: 'Refri.', detalle: 'Local Recoleta' }
  ],

  canales: [
    {
      id: 'B2C',
      nombre: 'B2C · Local',
      descripcion: 'Venta al detalle en el local de Recoleta, normalmente por unidad.'
    },
    {
      id: 'B2B',
      nombre: 'B2B · Mayorista',
      descripcion: 'Pedido mayorista (redes sociales u otros medios). Admite cajas completas o cantidades parciales.'
    }
  ],

  /**
   * Estados de stock. "nivel" ordena por criticidad (menor = más urgente).
   * Regla: sin stock si disponible = 0; stock bajo si disponible <= stock mínimo.
   */
  estados: {
    'sin-stock': { nombre: 'Sin stock', clase: 'sin', nivel: 0 },
    bajo: { nombre: 'Stock bajo', clase: 'bajo', nivel: 1 },
    ok: { nombre: 'Disponible', clase: 'ok', nivel: 3 },
    inactivo: { nombre: 'Inactivo', clase: 'inactivo', nivel: 4 }
  },

  /** Valor de motivo que obliga a escribir una nota. */
  motivoOtro: 'Otro',

  /**
   * Tipos de movimiento.
   * efecto: entrada (suma en destino) | salida (resta en origen) |
   *         traslado (origen → destino) | ajuste (suma o resta en una ubicación, con motivo).
   * campos: ubicaciones que pide el formulario.
   * canal: 'obligatorio' | 'opcional' | false.
   * registraLote: la recepción crea un lote si el producto controla vencimiento.
   */
  tiposMovimiento: [
    {
      id: 'recepcion',
      nombre: 'Recepción',
      descripcion: 'Ingreso de mercadería desde proveedor. Puedes ingresarla en cajas o packs: se convierte a unidades base.',
      efecto: 'entrada',
      campos: ['destino'],
      canal: false,
      registraLote: true,
      motivos: null,
      referencia: { placeholder: 'N° de guía o factura del proveedor (opcional)' },
      presentacionSugerida: 'mayor'
    },
    {
      id: 'venta',
      nombre: 'Venta',
      descripcion: 'Salida por venta. En B2B puedes vender cajas completas o cantidades parciales (por ejemplo 12 unidades de una caja de 24).',
      efecto: 'salida',
      campos: ['origen'],
      canal: 'obligatorio',
      motivos: null,
      referencia: {
        placeholder: 'N° de boleta, pedido o cliente',
        obligatoriaEnCanal: ['B2B']
      },
      presentacionSugerida: 'base'
    },
    {
      id: 'traslado',
      nombre: 'Traslado',
      descripcion: 'Mueve unidades entre ubicaciones. No cambia el stock total del producto.',
      efecto: 'traslado',
      campos: ['origen', 'destino'],
      canal: false,
      motivos: null,
      referencia: { placeholder: 'Nota del traslado (opcional)' },
      presentacionSugerida: 'base'
    },
    {
      id: 'devolucion',
      nombre: 'Devolución',
      descripcion: 'Reingreso de productos devueltos por un cliente en condiciones de venta.',
      efecto: 'entrada',
      campos: ['destino'],
      canal: 'opcional',
      motivos: ['Cliente desistió (producto sellado)', 'Error en el pedido', 'Cambio de producto', 'Otro'],
      motivoObligatorio: true,
      referencia: { placeholder: 'N° de boleta o pedido original' },
      presentacionSugerida: 'base'
    },
    {
      id: 'merma',
      nombre: 'Merma',
      descripcion: 'Salida por pérdida: vencimiento, daño, extravío o consumo interno.',
      efecto: 'salida',
      campos: ['origen'],
      canal: false,
      motivos: ['Producto vencido', 'Dañado o roto', 'Robo o extravío', 'Consumo interno', 'Otro'],
      motivoObligatorio: true,
      referencia: { placeholder: 'Detalle de la merma' },
      presentacionSugerida: 'base'
    },
    {
      id: 'ajuste',
      nombre: 'Ajuste',
      descripcion: 'Corrige el saldo tras un conteo o error. Requiere motivo y queda en el historial.',
      efecto: 'ajuste',
      campos: ['ubicacion'],
      canal: false,
      motivos: ['Diferencia en conteo físico', 'Error en registro anterior', 'Otro'],
      motivoObligatorio: true,
      referencia: { placeholder: 'Detalle del ajuste (ej.: conteo semanal)' },
      presentacionSugerida: 'base'
    }
  ]
};
