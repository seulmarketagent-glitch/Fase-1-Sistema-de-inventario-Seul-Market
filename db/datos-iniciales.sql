-- =====================================================================
-- Seúl Market · Datos iniciales de configuración — BORRADOR v1 (Fase 2)
--
-- Solo estructura entregada por la empresa o necesaria para operar.
-- NO contiene usuarios, productos, precios ni datos corporativos inventados.
-- Lo marcado como "provisional" debe confirmarlo la empresa.
-- Se aplica después de esquema.sql.
-- =====================================================================

PRAGMA foreign_keys = ON;

-- Datos corporativos: una fila con todo en NULL (pendiente de la empresa).
INSERT INTO empresa_config (id) VALUES (1);

-- Roles. Los permisos de cada rol se asignan en la Fase 3.
INSERT INTO roles (id, nombre, descripcion) VALUES
  ('dueno', 'Dueño / primera línea comercial',
   'Acceso general a funciones administrativas y comerciales.'),
  ('vendedor_mayorista', 'Vendedor mayorista',
   'Solo lista de precios mayoristas y sus propias cotizaciones.');

-- Unidades base (decisión de negocio: casi todo por unidad; caseros por gramo).
INSERT INTO unidades_base (id, singular, plural, abreviatura) VALUES
  ('unidad', 'unidad', 'unidades', 'u.'),
  ('gramo',  'gramo',  'gramos',   'g');

-- Listas de precio separadas.
INSERT INTO listas_precio (id, nombre, canal) VALUES
  ('B2C',       'Precio tienda (B2C)', 'B2C'),
  ('MAYORISTA', 'Precio mayorista',    'B2B');

-- Reglas de vencimiento (confirmadas por la empresa, 2026-11-18).
--   hasta 6 meses de vida útil   → alerta 30 días (1 mes) antes
--   hasta 12 meses de vida útil  → alerta 50 días antes
--   más de 12 meses o sin dato   → alerta 50 días antes
INSERT INTO reglas_vencimiento (vida_util_hasta_meses, dias_alerta, provisional) VALUES
  (6,    30, 0),
  (12,   50, 0),
  (NULL, 50, 0);

-- Bodegas.
INSERT INTO bodegas (codigo, nombre, tipo, descripcion) VALUES
  ('TF', 'Tienda física',  'tienda',      'Planta baja: sala de ventas (B2C). Segundo piso: bodegas TF1 y TF2 (B2B).'),
  ('A',  'Bodega A',       'bodega',      'Bodega distribuida en cuatro pisos.'),
  ('B',  'Bodega B',       'bodega',      'Tercera bodega.'),
  ('C',  'Cámara de frío', 'camara_frio', 'Helados de origen coreano.');

-- Ubicaciones iniciales (ampliables). Pisos de A y B sin informar (NULL).
-- Canal (confirmado por la empresa, 2026-11-18): solo la sala de ventas es B2C;
-- todas las bodegas, incluidas TF1 y TF2, son inventario B2B.
INSERT INTO ubicaciones (bodega_id, codigo, nombre, canal, piso, es_sala_venta, provisional, orden) VALUES
  ((SELECT id FROM bodegas WHERE codigo = 'TF'), 'TF0', 'Sala de ventas (planta baja)', 'B2C',    1, 1, 1, 0),
  ((SELECT id FROM bodegas WHERE codigo = 'TF'), 'TF1', 'Bodega segundo piso 1',        'B2B',    2, 0, 0, 1),
  ((SELECT id FROM bodegas WHERE codigo = 'TF'), 'TF2', 'Bodega segundo piso 2',        'B2B',    2, 0, 0, 2),
  ((SELECT id FROM bodegas WHERE codigo = 'A'),  'A1',  'Bodega A · ubicación 1',       'B2B', NULL, 0, 0, 1),
  ((SELECT id FROM bodegas WHERE codigo = 'A'),  'A2',  'Bodega A · ubicación 2',       'B2B', NULL, 0, 0, 2),
  ((SELECT id FROM bodegas WHERE codigo = 'A'),  'A3',  'Bodega A · ubicación 3',       'B2B', NULL, 0, 0, 3),
  ((SELECT id FROM bodegas WHERE codigo = 'B'),  'B1',  'Bodega B · ubicación 1',       'B2B', NULL, 0, 0, 1),
  ((SELECT id FROM bodegas WHERE codigo = 'B'),  'B2',  'Bodega B · ubicación 2',       'B2B', NULL, 0, 0, 2),
  ((SELECT id FROM bodegas WHERE codigo = 'B'),  'B3',  'Bodega B · ubicación 3',       'B2B', NULL, 0, 0, 3),
  ((SELECT id FROM bodegas WHERE codigo = 'C'),  'C1',  'Cámara de frío · general',     'B2B', NULL, 0, 1, 1);

-- Correlativo de cotizaciones.
INSERT INTO correlativos (id, prefijo, ultimo) VALUES ('cotizacion', 'COT', 0);
