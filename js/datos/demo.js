/*
 * DATOS DE DEMOSTRACIÓN — FICTICIOS.
 * No representan inventario, precios ni ventas reales de Seúl Market.
 * Los nombres de productos son genéricos a propósito.
 *
 * Las fechas se calculan relativas a "hoy" para que la demo siempre muestre
 * movimientos recientes y lotes próximos a vencer.
 *
 * Estructura de un producto:
 *   stock:         saldo físico por ubicación, en UNIDADES BASE.
 *   reservado:     unidades comprometidas en pedidos B2B pendientes (se restan del disponible).
 *   presentaciones: equivalencias configurables; factor = unidades base por presentación.
 *   lotes:         solo si controlaVencimiento = true.
 */
window.SI = window.SI || {};

SI.datosDemo = (function () {
  const U = { id: 'unidad', nombre: 'Unidad', plural: 'Unidades', factor: 1 };
  const caja = (factor) => ({ id: 'caja', nombre: 'Caja', plural: 'Cajas', factor });
  const pack = (factor) => ({ id: 'pack', nombre: `Pack ${factor}`, plural: `Packs ${factor}`, factor });

  function producto(datos) {
    return Object.assign({
      activo: true,
      unidadBase: 'unidad',
      reservado: 0,
      controlaVencimiento: false,
      lotes: []
    }, datos);
  }

  function generar() {
    const hoy = SI.util.hoyISO();
    const dia = (n) => SI.util.sumarDias(hoy, n);

    const productos = [
      producto({
        id: 'p01', sku: 'RAM-0001', nombre: 'Ramen picante de res', variante: 'Paquete 120 g',
        categoria: 'ramen', presentaciones: [U, pack(5), caja(40)],
        stock: { sala: 22, bodega: 80 }, reservado: 20, stockMinimo: 40,
        precioB2C: 1290, precioB2B: 990
      }),
      producto({
        id: 'p02', sku: 'RAM-0002', nombre: 'Ramen de pollo extra picante', variante: 'Paquete 140 g',
        categoria: 'ramen', presentaciones: [U, caja(40)],
        stock: { sala: 6, bodega: 12 }, stockMinimo: 30,
        precioB2C: 1490, precioB2B: 1150
      }),
      producto({
        id: 'p03', sku: 'RAM-0003', nombre: 'Ramen de kimchi en vaso', variante: 'Vaso 86 g',
        categoria: 'ramen', presentaciones: [U, caja(24)],
        stock: { sala: 0, bodega: 0 }, stockMinimo: 24,
        precioB2C: 1590, precioB2B: 1200
      }),
      producto({
        id: 'p04', sku: 'SNK-0001', nombre: 'Snack de camarón', variante: 'Bolsa 90 g',
        categoria: 'snacks', presentaciones: [U, caja(20)],
        stock: { sala: 16, bodega: 40 }, stockMinimo: 20,
        precioB2C: 1990, precioB2B: 1490
      }),
      producto({
        id: 'p05', sku: 'SNK-0002', nombre: 'Papas sabor miel y mantequilla', variante: 'Bolsa 60 g',
        categoria: 'snacks', presentaciones: [U, caja(16)],
        stock: { sala: 4, bodega: 0 }, stockMinimo: 16,
        precioB2C: 1790, precioB2B: 1350
      }),
      producto({
        id: 'p06', sku: 'ALG-0001', nombre: 'Snack de alga tostada', variante: 'Paquete 5 g',
        categoria: 'algas', presentaciones: [U, pack(3), caja(72)],
        stock: { sala: 30, bodega: 144 }, stockMinimo: 60,
        precioB2C: 690, precioB2B: 490
      }),
      producto({
        id: 'p07', sku: 'ALG-0002', nombre: 'Hojas de alga para kimbap', variante: 'Paquete 10 hojas',
        categoria: 'algas', presentaciones: [U, caja(50)],
        stock: { sala: 8, bodega: 50 }, stockMinimo: 20,
        precioB2C: 3490, precioB2B: 2690
      }),
      producto({
        id: 'p08', sku: 'BEB-0001', nombre: 'Bebida de durazno', variante: 'Lata 240 ml',
        categoria: 'bebidas', presentaciones: [U, pack(6), caja(24)],
        stock: { sala: 36, bodega: 84 }, reservado: 24, stockMinimo: 48,
        precioB2C: 1190, precioB2B: 850,
        controlaVencimiento: true,
        lotes: [
          { codigo: 'L-DUR-0412', ubicacion: 'sala', cantidad: 36, vence: dia(150) },
          { codigo: 'L-DUR-0509', ubicacion: 'bodega', cantidad: 84, vence: dia(210) }
        ]
      }),
      producto({
        id: 'p09', sku: 'BEB-0002', nombre: 'Leche sabor plátano', variante: 'Botella 200 ml',
        categoria: 'bebidas', presentaciones: [U, pack(6), caja(24)],
        stock: { sala: 7, bodega: 24 }, stockMinimo: 24,
        precioB2C: 1290, precioB2B: 950,
        controlaVencimiento: true,
        lotes: [
          { codigo: 'L-PLA-0301', ubicacion: 'sala', cantidad: 7, vence: dia(8) },
          { codigo: 'L-PLA-0322', ubicacion: 'bodega', cantidad: 24, vence: dia(60) }
        ]
      }),
      producto({
        id: 'p10', sku: 'CON-0001', nombre: 'Pasta de ají fermentado', variante: 'Pote 500 g',
        categoria: 'condimentos', presentaciones: [U, caja(20)],
        stock: { sala: 7, bodega: 20 }, stockMinimo: 10,
        precioB2C: 4990, precioB2B: 3890
      }),
      producto({
        id: 'p11', sku: 'CON-0002', nombre: 'Salsa de soya', variante: 'Botella 500 ml',
        categoria: 'condimentos', presentaciones: [U, caja(12)],
        stock: { sala: 0, bodega: 0 }, stockMinimo: 6,
        precioB2C: 3990, precioB2B: 2990
      }),
      producto({
        id: 'p12', sku: 'KIM-0001', nombre: 'Kimchi de repollo', variante: 'Frasco 500 g',
        categoria: 'refrigerados', presentaciones: [U, caja(12)],
        stock: { refrigerador: 12 }, stockMinimo: 8,
        precioB2C: 5490, precioB2B: 4290,
        controlaVencimiento: true,
        lotes: [
          { codigo: 'L-KIM-1101', ubicacion: 'refrigerador', cantidad: 4, vence: dia(5) },
          { codigo: 'L-KIM-1108', ubicacion: 'refrigerador', cantidad: 8, vence: dia(25) }
        ]
      }),
      producto({
        id: 'p13', sku: 'RAM-0099', nombre: 'Ramen edición de temporada', variante: 'Paquete 130 g',
        categoria: 'ramen', presentaciones: [U, caja(40)],
        stock: {}, stockMinimo: 0, activo: false,
        precioB2C: 1690, precioB2B: 1290
      })
    ];

    // Historial ilustrativo. Muestra cada tipo de caso; no reconstruye exactamente los saldos iniciales.
    const mov = (n, datos) => Object.assign({
      id: 'DEMO-' + String(n).padStart(3, '0'),
      registradoEn: dia(datos.dias) + 'T1' + (n % 10) + ':00:00',
      fecha: dia(datos.dias),
      canal: null, direccion: null, motivo: null, nota: null, origen: null, destino: null,
      lotes: [], saldoProducto: null, demo: true
    }, datos);

    const movimientos = [
      mov(1, { dias: -12, tipo: 'recepcion', productoId: 'p02', cantidad: 1, presentacionId: 'caja', presentacionNombre: 'Caja', factor: 40, unidades: 40, delta: 40, destino: 'bodega', nota: 'Guía 10198 (demo)' }),
      mov(2, { dias: -6, tipo: 'recepcion', productoId: 'p01', cantidad: 2, presentacionId: 'caja', presentacionNombre: 'Caja', factor: 40, unidades: 80, delta: 80, destino: 'bodega', nota: 'Guía 10234 (demo)' }),
      mov(3, { dias: -5, tipo: 'traslado', productoId: 'p01', cantidad: 20, presentacionId: 'unidad', presentacionNombre: 'Unidad', factor: 1, unidades: 20, delta: 0, origen: 'bodega', destino: 'sala', nota: 'Reposición de góndola' }),
      mov(4, { dias: -4, tipo: 'venta', productoId: 'p01', cantidad: 2, presentacionId: 'unidad', presentacionNombre: 'Unidad', factor: 1, unidades: 2, delta: -2, origen: 'sala', canal: 'B2C', nota: 'Boleta 5521 (demo)' }),
      mov(5, { dias: -3, tipo: 'venta', productoId: 'p08', cantidad: 12, presentacionId: 'unidad', presentacionNombre: 'Unidad', factor: 1, unidades: 12, delta: -12, origen: 'bodega', canal: 'B2B', nota: 'Pedido Instagram B2B-018 · 12 de una caja de 24 (demo)' }),
      mov(6, { dias: -3, tipo: 'venta', productoId: 'p06', cantidad: 1, presentacionId: 'caja', presentacionNombre: 'Caja', factor: 72, unidades: 72, delta: -72, origen: 'bodega', canal: 'B2B', nota: 'Pedido WhatsApp B2B-019 (demo)' }),
      mov(7, { dias: -2, tipo: 'merma', productoId: 'p12', cantidad: 2, presentacionId: 'unidad', presentacionNombre: 'Unidad', factor: 1, unidades: 2, delta: -2, origen: 'refrigerador', motivo: 'Producto vencido' }),
      mov(8, { dias: -2, tipo: 'ajuste', productoId: 'p05', cantidad: 1, presentacionId: 'unidad', presentacionNombre: 'Unidad', factor: 1, unidades: 1, delta: -1, origen: 'sala', direccion: 'restar', motivo: 'Diferencia en conteo físico', nota: 'Conteo semanal (demo)' }),
      mov(9, { dias: -1, tipo: 'devolucion', productoId: 'p04', cantidad: 1, presentacionId: 'unidad', presentacionNombre: 'Unidad', factor: 1, unidades: 1, delta: 1, destino: 'sala', canal: 'B2C', motivo: 'Cliente desistió (producto sellado)', nota: 'Boleta 5530 (demo)' }),
      mov(10, { dias: -1, tipo: 'venta', productoId: 'p09', cantidad: 3, presentacionId: 'unidad', presentacionNombre: 'Unidad', factor: 1, unidades: 3, delta: -3, origen: 'sala', canal: 'B2C', nota: 'Boleta 5534 (demo)' })
    ];

    return { productos: SI.util.clonar(productos), movimientos };
  }

  return { generar };
})();
