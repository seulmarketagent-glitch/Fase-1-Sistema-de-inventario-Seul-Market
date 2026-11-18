-- =====================================================================
-- Seúl Market · Sistema de inventario
-- Esquema de base de datos — BORRADOR v1 (Fase 2: modelo de datos)
--
-- Estado: diseño. NO está conectado a la aplicación todavía.
-- Dialecto: SQLite 3.38 o superior (verificado con 3.54). Se usan tipos y
-- restricciones portables a PostgreSQL. Los disparadores (TRIGGER) están en
-- sintaxis SQLite y deberán traducirse si se migra a PostgreSQL (Fase 9).
-- En la Fase 4 este archivo se convertirá en migraciones versionadas,
-- cada una con su reversión.
--
-- Convenciones:
--   * Cantidades de stock: ENTEROS en la unidad base del producto
--     (unidad o gramo). Cajas y packs son equivalencias (presentaciones).
--   * Dinero: ENTEROS en pesos chilenos (CLP), sin decimales.
--   * Fechas: texto ISO 8601. Fecha 'AAAA-MM-DD'; fecha y hora en UTC
--     'AAAA-MM-DDTHH:MM:SS.sssZ'.
--   * Booleanos: INTEGER 0/1.
--   * Nada se borra: los registros se desactivan (activo = 0) o se anulan
--     con un contra-movimiento. Bitácora y movimientos son inmutables.
--   * Ningún dato corporativo se inventa: los campos sin información de la
--     empresa quedan en NULL (= pendiente).
-- =====================================================================

PRAGMA foreign_keys = ON;   -- debe activarse en cada conexión SQLite

-- ---------------------------------------------------------------------
-- 1. Usuarios, roles, permisos y sesiones
-- ---------------------------------------------------------------------

CREATE TABLE roles (
  id          TEXT PRIMARY KEY,                 -- 'dueno', 'vendedor_mayorista'
  nombre      TEXT NOT NULL,
  descripcion TEXT,
  activo      INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1))
);

-- Catálogo de permisos (ej. 'inventario.ver'). La matriz rol-permiso se
-- define en la Fase 3; aquí solo existe la estructura.
CREATE TABLE permisos (
  id          TEXT PRIMARY KEY,
  descripcion TEXT NOT NULL,
  sensible    INTEGER NOT NULL DEFAULT 0 CHECK (sensible IN (0, 1))  -- 1 = se registra en bitácora
);

CREATE TABLE rol_permisos (
  rol_id     TEXT NOT NULL REFERENCES roles (id),
  permiso_id TEXT NOT NULL REFERENCES permisos (id),
  PRIMARY KEY (rol_id, permiso_id)
);

-- Cuentas individuales. Nunca se guarda la contraseña: solo su hash con sal,
-- en formato 'algoritmo$iteraciones$sal$hash' (se define en la Fase 4).
CREATE TABLE usuarios (
  id                      INTEGER PRIMARY KEY,
  nombre                  TEXT NOT NULL,
  correo                  TEXT NOT NULL UNIQUE COLLATE NOCASE,
  rol_id                  TEXT NOT NULL REFERENCES roles (id),
  hash_contrasena         TEXT,             -- NULL hasta que la persona define su contraseña
  debe_cambiar_contrasena INTEGER NOT NULL DEFAULT 1 CHECK (debe_cambiar_contrasena IN (0, 1)),
  intentos_fallidos       INTEGER NOT NULL DEFAULT 0 CHECK (intentos_fallidos >= 0),
  bloqueado_hasta         TEXT,
  ultimo_ingreso_en       TEXT,
  activo                  INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
  creado_en               TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  creado_por              INTEGER REFERENCES usuarios (id),
  desactivado_en          TEXT
);

-- Sesiones de inicio de sesión. Se guarda el HASH del token, nunca el token.
CREATE TABLE sesiones (
  id                  INTEGER PRIMARY KEY,
  usuario_id          INTEGER NOT NULL REFERENCES usuarios (id),
  token_hash          TEXT NOT NULL UNIQUE,
  creada_en           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  expira_en           TEXT NOT NULL,
  ultima_actividad_en TEXT,
  revocada_en         TEXT,                  -- cierre de sesión o revocación
  ip                  TEXT,
  agente              TEXT
);
CREATE INDEX idx_sesiones_usuario ON sesiones (usuario_id);

-- Bitácora de acciones relevantes. Solo se agregan filas.
-- 'detalle' guarda antes/después en JSON, SIN contraseñas, tokens ni secretos.
CREATE TABLE bitacora (
  id            INTEGER PRIMARY KEY,
  registrado_en TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  usuario_id    INTEGER REFERENCES usuarios (id),   -- NULL = proceso del sistema
  accion        TEXT NOT NULL,                       -- ej. 'stock.traslado', 'precio.cambio'
  entidad       TEXT NOT NULL,                       -- ej. 'movimientos', 'precios'
  entidad_id    TEXT,
  detalle       TEXT CHECK (detalle IS NULL OR json_valid(detalle)),
  ip            TEXT
);
CREATE INDEX idx_bitacora_fecha ON bitacora (registrado_en);
CREATE INDEX idx_bitacora_entidad ON bitacora (entidad, entidad_id);

CREATE TRIGGER bitacora_sin_cambios BEFORE UPDATE ON bitacora
BEGIN SELECT RAISE(ABORT, 'La bitácora no se puede modificar.'); END;
CREATE TRIGGER bitacora_sin_borrado BEFORE DELETE ON bitacora
BEGIN SELECT RAISE(ABORT, 'La bitácora no se puede borrar.'); END;

-- ---------------------------------------------------------------------
-- 2. Datos corporativos (una sola fila, id = 1)
-- Todos los datos de la empresa quedan en NULL hasta que la empresa los entregue.
-- ---------------------------------------------------------------------

CREATE TABLE empresa_config (
  id                       INTEGER PRIMARY KEY CHECK (id = 1),
  razon_social             TEXT,
  nombre_fantasia          TEXT,
  rut                      TEXT,
  direccion                TEXT,
  telefono                 TEXT,
  correo                   TEXT,
  sitio_web                TEXT,
  logo_ruta                TEXT,              -- archivo del logo dentro del proyecto o del almacenamiento
  color_primario           TEXT CHECK (color_primario IS NULL OR color_primario GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
  color_secundario         TEXT CHECK (color_secundario IS NULL OR color_secundario GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
  vigencia_cotizacion_dias INTEGER CHECK (vigencia_cotizacion_dias IS NULL OR vigencia_cotizacion_dias > 0),
  precios_incluyen_iva     INTEGER CHECK (precios_incluyen_iva IS NULL OR precios_incluyen_iva IN (0, 1)),
  tasa_iva_porcentaje      NUMERIC CHECK (tasa_iva_porcentaje IS NULL OR (tasa_iva_porcentaje >= 0 AND tasa_iva_porcentaje < 100)),
  moneda                   TEXT NOT NULL DEFAULT 'CLP',
  zona_horaria             TEXT NOT NULL DEFAULT 'America/Santiago',
  actualizado_en           TEXT,
  actualizado_por          INTEGER REFERENCES usuarios (id)
);

-- Correlativos para numeración única (ej. cotizaciones).
CREATE TABLE correlativos (
  id      TEXT PRIMARY KEY,                    -- 'cotizacion'
  prefijo TEXT NOT NULL,                       -- 'COT'
  ultimo  INTEGER NOT NULL DEFAULT 0 CHECK (ultimo >= 0)
);

-- ---------------------------------------------------------------------
-- 3. Catálogo de productos
-- ---------------------------------------------------------------------

CREATE TABLE categorias (
  id     INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1))
);

-- Unidad base en la que se guarda TODO el saldo de un producto.
CREATE TABLE unidades_base (
  id          TEXT PRIMARY KEY,                -- 'unidad', 'gramo'
  singular    TEXT NOT NULL,
  plural      TEXT NOT NULL,
  abreviatura TEXT NOT NULL
);

CREATE TABLE productos (
  id                   INTEGER PRIMARY KEY,
  sku                  TEXT NOT NULL UNIQUE,   -- código de barras del fabricante DE LA UNIDAD
  sku_es_interno       INTEGER NOT NULL DEFAULT 0 CHECK (sku_es_interno IN (0, 1)),  -- 1 = creado por falta o error del código
  nombre               TEXT NOT NULL,
  variante             TEXT,
  descripcion          TEXT,
  categoria_id         INTEGER REFERENCES categorias (id),
  unidad_base_id       TEXT NOT NULL REFERENCES unidades_base (id),
  controla_vencimiento INTEGER NOT NULL DEFAULT 0 CHECK (controla_vencimiento IN (0, 1)),
  vida_util_meses      INTEGER CHECK (vida_util_meses IS NULL OR vida_util_meses > 0),
  habilitado_mayorista INTEGER NOT NULL DEFAULT 0 CHECK (habilitado_mayorista IN (0, 1)),
  activo               INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
  creado_en            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  actualizado_en       TEXT
);
CREATE INDEX idx_productos_nombre ON productos (nombre);

-- Presentaciones: equivalencias de empaque. factor = unidades base por presentación.
-- codigo_barras: el de la caja/pack (distinto del SKU de la unidad).
CREATE TABLE presentaciones (
  id            INTEGER PRIMARY KEY,
  producto_id   INTEGER NOT NULL REFERENCES productos (id),
  nombre        TEXT NOT NULL,                 -- 'Unidad', 'Pack 5', 'Caja'
  plural        TEXT NOT NULL,
  factor        INTEGER NOT NULL CHECK (factor > 0),
  codigo_barras TEXT UNIQUE,
  es_base       INTEGER NOT NULL DEFAULT 0 CHECK (es_base IN (0, 1)),
  cotizable     INTEGER NOT NULL DEFAULT 0 CHECK (cotizable IN (0, 1)),  -- aparece en la lista mayorista
  activo        INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
  UNIQUE (producto_id, nombre),
  CHECK (es_base = 0 OR factor = 1)
);
-- Una sola presentación base por producto.
CREATE UNIQUE INDEX uq_presentacion_base ON presentaciones (producto_id) WHERE es_base = 1;

-- ---------------------------------------------------------------------
-- 4. Precios (B2C y mayorista separados, con historial)
-- ---------------------------------------------------------------------

CREATE TABLE listas_precio (
  id     TEXT PRIMARY KEY,                     -- 'B2C', 'MAYORISTA'
  nombre TEXT NOT NULL,
  canal  TEXT NOT NULL CHECK (canal IN ('B2C', 'B2B'))
);

-- Un precio por lista y presentación. Un cambio de precio cierra el vigente
-- (vigente_hasta) e inserta uno nuevo: el historial no se pierde.
CREATE TABLE precios (
  id              INTEGER PRIMARY KEY,
  lista_id        TEXT NOT NULL REFERENCES listas_precio (id),
  presentacion_id INTEGER NOT NULL REFERENCES presentaciones (id),
  monto           INTEGER NOT NULL CHECK (monto >= 0),       -- CLP
  vigente_desde   TEXT NOT NULL,
  vigente_hasta   TEXT,                                       -- NULL = vigente
  creado_en       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  creado_por      INTEGER REFERENCES usuarios (id),
  CHECK (vigente_hasta IS NULL OR vigente_hasta >= vigente_desde)
);
-- Un solo precio vigente por lista y presentación.
CREATE UNIQUE INDEX uq_precio_vigente ON precios (lista_id, presentacion_id) WHERE vigente_hasta IS NULL;

CREATE TRIGGER precios_inmutables
BEFORE UPDATE OF lista_id, presentacion_id, monto, vigente_desde, creado_en, creado_por ON precios
BEGIN SELECT RAISE(ABORT, 'Un precio no se modifica: se cierra y se registra uno nuevo.'); END;
CREATE TRIGGER precios_sin_borrado BEFORE DELETE ON precios
BEGIN SELECT RAISE(ABORT, 'Los precios no se borran: se cierran con vigente_hasta.'); END;

-- ---------------------------------------------------------------------
-- 5. Bodegas y ubicaciones (configurables, sin cantidad fija)
-- El canal (B2C o B2B) pertenece a la UBICACIÓN, no a la bodega:
-- solo lo que está físicamente en la sala de ventas es inventario B2C;
-- todo lo que está en bodegas (incluidas TF1 y TF2) es inventario B2B.
-- ---------------------------------------------------------------------

CREATE TABLE bodegas (
  id          INTEGER PRIMARY KEY,
  codigo      TEXT NOT NULL UNIQUE,            -- 'TF', 'A', 'B', 'C'
  nombre      TEXT NOT NULL,
  tipo        TEXT NOT NULL CHECK (tipo IN ('tienda', 'bodega', 'camara_frio')),
  descripcion TEXT,
  activo      INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1))
);

CREATE TABLE ubicaciones (
  id            INTEGER PRIMARY KEY,
  bodega_id     INTEGER NOT NULL REFERENCES bodegas (id),
  codigo        TEXT NOT NULL UNIQUE,          -- 'TF0', 'TF1', 'A1', 'C1'...
  nombre        TEXT NOT NULL,
  canal         TEXT NOT NULL CHECK (canal IN ('B2C', 'B2B')),  -- inventario al que pertenece lo que está aquí
  piso          INTEGER,                        -- NULL = sin informar
  es_sala_venta INTEGER NOT NULL DEFAULT 0 CHECK (es_sala_venta IN (0, 1)),
  provisional   INTEGER NOT NULL DEFAULT 0 CHECK (provisional IN (0, 1)),  -- 1 = código por confirmar
  orden         INTEGER NOT NULL DEFAULT 0,
  activo        INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1))
);
CREATE INDEX idx_ubicaciones_bodega ON ubicaciones (bodega_id);

-- ---------------------------------------------------------------------
-- 6. Lotes y existencias
-- ---------------------------------------------------------------------

-- Un lote nace en una recepción. fecha_vencimiento es la fecha REAL del lote
-- (la que se usa para alertas y FEFO), obligatoria si el producto controla vencimiento.
CREATE TABLE lotes (
  id                INTEGER PRIMARY KEY,
  producto_id       INTEGER NOT NULL REFERENCES productos (id),
  codigo_interno    TEXT NOT NULL UNIQUE,      -- generado por el sistema
  codigo_proveedor  TEXT,                      -- lote del proveedor, si viene
  fecha_vencimiento TEXT,
  fecha_recepcion   TEXT NOT NULL,
  creado_en         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  creado_por        INTEGER REFERENCES usuarios (id)
);
CREATE INDEX idx_lotes_producto_venc ON lotes (producto_id, fecha_vencimiento);

CREATE TRIGGER lotes_vencimiento_obligatorio BEFORE INSERT ON lotes
WHEN NEW.fecha_vencimiento IS NULL
  AND (SELECT controla_vencimiento FROM productos WHERE id = NEW.producto_id) = 1
BEGIN SELECT RAISE(ABORT, 'Este producto controla vencimiento: el lote necesita fecha de vencimiento.'); END;

-- Existencia = cuánto hay de un lote en una ubicación. Es la única fuente del saldo.
-- Solo la modifica la lógica de movimientos del servidor (Fase 5).
CREATE TABLE existencias (
  id             INTEGER PRIMARY KEY,
  lote_id        INTEGER NOT NULL REFERENCES lotes (id),
  ubicacion_id   INTEGER NOT NULL REFERENCES ubicaciones (id),
  cantidad       INTEGER NOT NULL DEFAULT 0 CHECK (cantidad >= 0),          -- sin stock negativo
  reservada      INTEGER NOT NULL DEFAULT 0 CHECK (reservada >= 0 AND reservada <= cantidad),
  actualizado_en TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (lote_id, ubicacion_id)
);
CREATE INDEX idx_existencias_ubicacion ON existencias (ubicacion_id);

-- Stock mínimo por producto, opcionalmente por bodega y por canal.
CREATE TABLE stock_minimos (
  id          INTEGER PRIMARY KEY,
  producto_id INTEGER NOT NULL REFERENCES productos (id),
  bodega_id   INTEGER REFERENCES bodegas (id),           -- NULL = todas
  canal       TEXT CHECK (canal IS NULL OR canal IN ('B2C', 'B2B')),  -- NULL = ambos
  minimo      INTEGER NOT NULL CHECK (minimo >= 0)        -- en unidades base
);
CREATE UNIQUE INDEX uq_stock_minimo ON stock_minimos (producto_id, COALESCE(bodega_id, 0), COALESCE(canal, ''));

-- ---------------------------------------------------------------------
-- 7. Movimientos (auditables e inmutables)
-- ---------------------------------------------------------------------

-- Motivos de devolución, merma y ajuste. La empresa aún no define la lista
-- oficial: los que se carguen quedarán como provisionales.
CREATE TABLE motivos (
  id              INTEGER PRIMARY KEY,
  tipo_movimiento TEXT NOT NULL CHECK (tipo_movimiento IN ('devolucion', 'merma', 'ajuste')),
  nombre          TEXT NOT NULL,
  requiere_nota   INTEGER NOT NULL DEFAULT 0 CHECK (requiere_nota IN (0, 1)),
  provisional     INTEGER NOT NULL DEFAULT 1 CHECK (provisional IN (0, 1)),
  activo          INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
  UNIQUE (tipo_movimiento, nombre)
);

-- Cabecera: qué se hizo, quién, cuándo y en qué presentación se ingresó.
CREATE TABLE movimientos (
  id                  INTEGER PRIMARY KEY,
  tipo                TEXT NOT NULL CHECK (tipo IN ('recepcion', 'venta', 'traslado', 'devolucion', 'merma', 'ajuste', 'anulacion')),
  fecha_operacion     TEXT NOT NULL,            -- fecha del hecho (AAAA-MM-DD)
  registrado_en       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  usuario_id          INTEGER NOT NULL REFERENCES usuarios (id),
  producto_id         INTEGER NOT NULL REFERENCES productos (id),
  canal               TEXT CHECK (canal IS NULL OR canal IN ('B2C', 'B2B')),
  motivo_id           INTEGER REFERENCES motivos (id),
  referencia          TEXT,                     -- boleta, N° de pedido o cliente
  nota                TEXT,
  presentacion_id     INTEGER NOT NULL REFERENCES presentaciones (id),
  cantidad_ingresada  NUMERIC NOT NULL CHECK (cantidad_ingresada > 0),  -- ej. 0,5 cajas
  factor              INTEGER NOT NULL CHECK (factor > 0),               -- copiado al registrar
  unidades            INTEGER NOT NULL CHECK (unidades > 0),             -- total en unidades base
  anula_movimiento_id INTEGER UNIQUE REFERENCES movimientos (id),        -- un movimiento se anula una sola vez
  CHECK ((tipo = 'anulacion') = (anula_movimiento_id IS NOT NULL)),
  CHECK (tipo <> 'venta' OR canal IS NOT NULL)
);
CREATE INDEX idx_movimientos_producto ON movimientos (producto_id, fecha_operacion);
CREATE INDEX idx_movimientos_fecha ON movimientos (fecha_operacion);

-- Detalle por lote y ubicación (una salida FEFO puede tocar varios lotes).
--   solo origen  = salida      solo destino = entrada      ambos = traslado
CREATE TABLE movimiento_lineas (
  id                   INTEGER PRIMARY KEY,
  movimiento_id        INTEGER NOT NULL REFERENCES movimientos (id),
  lote_id              INTEGER NOT NULL REFERENCES lotes (id),
  ubicacion_origen_id  INTEGER REFERENCES ubicaciones (id),
  ubicacion_destino_id INTEGER REFERENCES ubicaciones (id),
  unidades             INTEGER NOT NULL CHECK (unidades > 0),
  CHECK (ubicacion_origen_id IS NOT NULL OR ubicacion_destino_id IS NOT NULL),
  CHECK (ubicacion_origen_id IS NULL OR ubicacion_destino_id IS NULL OR ubicacion_origen_id <> ubicacion_destino_id)
);
CREATE INDEX idx_lineas_movimiento ON movimiento_lineas (movimiento_id);
CREATE INDEX idx_lineas_lote ON movimiento_lineas (lote_id);

CREATE TRIGGER movimientos_sin_cambios BEFORE UPDATE ON movimientos
BEGIN SELECT RAISE(ABORT, 'Un movimiento no se modifica: se anula con un contra-movimiento.'); END;
CREATE TRIGGER movimientos_sin_borrado BEFORE DELETE ON movimientos
BEGIN SELECT RAISE(ABORT, 'Un movimiento no se borra: se anula con un contra-movimiento.'); END;
CREATE TRIGGER lineas_sin_cambios BEFORE UPDATE ON movimiento_lineas
BEGIN SELECT RAISE(ABORT, 'El detalle de un movimiento no se modifica.'); END;
CREATE TRIGGER lineas_sin_borrado BEFORE DELETE ON movimiento_lineas
BEGIN SELECT RAISE(ABORT, 'El detalle de un movimiento no se borra.'); END;

-- ---------------------------------------------------------------------
-- 8. Reglas de vencimiento (configurables)
-- ---------------------------------------------------------------------

-- Se aplica la regla con el menor 'vida_util_hasta_meses' que sea >= a la vida
-- útil del producto. La fila con NULL cubre vidas útiles mayores (o sin informar).
-- Reglas confirmadas por la empresa (2026-11-18): hasta 6 meses → 30 días (1 mes);
-- 12 meses o más → 50 días.
CREATE TABLE reglas_vencimiento (
  id                    INTEGER PRIMARY KEY,
  vida_util_hasta_meses INTEGER CHECK (vida_util_hasta_meses IS NULL OR vida_util_hasta_meses > 0),
  dias_alerta           INTEGER NOT NULL CHECK (dias_alerta > 0),
  provisional           INTEGER NOT NULL DEFAULT 0 CHECK (provisional IN (0, 1)),
  activo                INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1))
);
CREATE UNIQUE INDEX uq_regla_vida_util ON reglas_vencimiento (COALESCE(vida_util_hasta_meses, -1));

-- ---------------------------------------------------------------------
-- 9. Cotizaciones mayoristas (no reservan ni descuentan stock)
-- ---------------------------------------------------------------------

-- Los datos de precio, IVA y empresa se COPIAN al emitir, para que una
-- cotización antigua se vea igual aunque después cambien precios o configuración.
-- No contiene cantidades disponibles, lotes, bodegas ni ubicaciones.
CREATE TABLE cotizaciones (
  id                   INTEGER PRIMARY KEY,
  numero               TEXT NOT NULL UNIQUE,     -- ej. 'COT-2026-000001'
  fecha_emision        TEXT NOT NULL,
  vendedor_id          INTEGER NOT NULL REFERENCES usuarios (id),
  cliente_nombre       TEXT NOT NULL,
  cliente_rut          TEXT,
  cliente_contacto     TEXT,
  vigencia_dias        INTEGER CHECK (vigencia_dias IS NULL OR vigencia_dias > 0),  -- NULL si la empresa no la definió
  valida_hasta         TEXT,
  precios_incluyen_iva INTEGER CHECK (precios_incluyen_iva IS NULL OR precios_incluyen_iva IN (0, 1)),
  tasa_iva_porcentaje  NUMERIC,
  subtotal             INTEGER NOT NULL CHECK (subtotal >= 0),
  iva                  INTEGER CHECK (iva IS NULL OR iva >= 0),
  total                INTEGER NOT NULL CHECK (total >= 0),
  estado               TEXT NOT NULL DEFAULT 'emitida' CHECK (estado IN ('emitida', 'anulada')),
  empresa_datos        TEXT CHECK (empresa_datos IS NULL OR json_valid(empresa_datos)),
  notas                TEXT,
  creado_en            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  anulada_en           TEXT,
  anulada_por          INTEGER REFERENCES usuarios (id),
  CHECK ((estado = 'anulada') = (anulada_en IS NOT NULL))
);
CREATE INDEX idx_cotizaciones_vendedor ON cotizaciones (vendedor_id, fecha_emision);

CREATE TABLE cotizacion_items (
  id                  INTEGER PRIMARY KEY,
  cotizacion_id       INTEGER NOT NULL REFERENCES cotizaciones (id),
  linea               INTEGER NOT NULL CHECK (linea > 0),
  producto_id         INTEGER NOT NULL REFERENCES productos (id),
  presentacion_id     INTEGER NOT NULL REFERENCES presentaciones (id),
  precio_id           INTEGER REFERENCES precios (id),   -- precio vigente usado
  sku                 TEXT NOT NULL,                     -- copias al emitir
  descripcion         TEXT NOT NULL,
  presentacion_nombre TEXT NOT NULL,
  cantidad            INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario     INTEGER NOT NULL CHECK (precio_unitario >= 0),
  subtotal            INTEGER NOT NULL CHECK (subtotal >= 0),
  UNIQUE (cotizacion_id, linea)
);

-- Una cotización emitida no cambia; solo puede pasar a 'anulada'.
CREATE TRIGGER cotizaciones_inmutables BEFORE UPDATE ON cotizaciones
WHEN NOT (OLD.estado = 'emitida' AND NEW.estado = 'anulada'
          AND NEW.numero = OLD.numero AND NEW.total = OLD.total AND NEW.subtotal = OLD.subtotal
          AND NEW.vendedor_id = OLD.vendedor_id AND NEW.fecha_emision = OLD.fecha_emision)
BEGIN SELECT RAISE(ABORT, 'Una cotización emitida no se modifica; solo se puede anular.'); END;
CREATE TRIGGER cotizaciones_sin_borrado BEFORE DELETE ON cotizaciones
BEGIN SELECT RAISE(ABORT, 'Las cotizaciones no se borran: se anulan.'); END;
CREATE TRIGGER items_sin_cambios BEFORE UPDATE ON cotizacion_items
BEGIN SELECT RAISE(ABORT, 'El detalle de una cotización no se modifica.'); END;
CREATE TRIGGER items_sin_borrado BEFORE DELETE ON cotizacion_items
BEGIN SELECT RAISE(ABORT, 'El detalle de una cotización no se borra.'); END;

-- ---------------------------------------------------------------------
-- 10. Vistas
-- ---------------------------------------------------------------------

-- Detalle interno de existencias (solo usuarios con acceso al inventario).
CREATE VIEW vista_existencias AS
SELECT e.id            AS existencia_id,
       p.id            AS producto_id,
       p.sku,
       p.nombre        AS producto,
       l.id            AS lote_id,
       l.codigo_interno AS lote,
       l.codigo_proveedor AS lote_proveedor,
       l.fecha_vencimiento,
       b.codigo        AS bodega,
       u.codigo        AS ubicacion,
       u.canal,
       e.cantidad,
       e.reservada,
       e.cantidad - e.reservada AS disponible
FROM existencias e
JOIN lotes l       ON l.id = e.lote_id
JOIN productos p   ON p.id = l.producto_id
JOIN ubicaciones u ON u.id = e.ubicacion_id
JOIN bodegas b     ON b.id = u.bodega_id
WHERE e.cantidad > 0;

-- Saldo por producto y canal (para indicadores y estados).
CREATE VIEW vista_stock_producto AS
SELECT p.id AS producto_id,
       u.canal,
       COALESCE(SUM(e.cantidad), 0)               AS fisico,
       COALESCE(SUM(e.reservada), 0)              AS reservado,
       COALESCE(SUM(e.cantidad - e.reservada), 0) AS disponible
FROM productos p
JOIN lotes l       ON l.producto_id = p.id
JOIN existencias e ON e.lote_id = l.id
JOIN ubicaciones u ON u.id = e.ubicacion_id
GROUP BY p.id, u.canal;

-- Alertas de vencimiento por lote y ubicación, calculadas al consultar
-- (no se guardan: no puede haber avisos duplicados).
-- Usa la fecha REAL del lote y la regla según la vida útil del producto.
-- La fecha de hoy se toma con la hora local del servidor, que debe estar en
-- America/Santiago (se documenta en la Fase 4).
CREATE VIEW vista_alertas_vencimiento AS
SELECT *
FROM (
  SELECT p.id            AS producto_id,
         p.sku,
         p.nombre        AS producto,
         p.vida_util_meses,
         l.id            AS lote_id,
         l.codigo_interno AS lote,
         l.codigo_proveedor AS lote_proveedor,
         l.fecha_vencimiento,
         b.codigo        AS bodega,
         u.codigo        AS ubicacion,
         e.cantidad,
         CAST(julianday(l.fecha_vencimiento) - julianday(date('now', 'localtime')) AS INTEGER) AS dias_restantes,
         COALESCE(
           (SELECT r.dias_alerta FROM reglas_vencimiento r
             WHERE r.activo = 1 AND r.vida_util_hasta_meses IS NOT NULL
               AND p.vida_util_meses IS NOT NULL AND r.vida_util_hasta_meses >= p.vida_util_meses
             ORDER BY r.vida_util_hasta_meses LIMIT 1),
           (SELECT r.dias_alerta FROM reglas_vencimiento r
             WHERE r.activo = 1 AND r.vida_util_hasta_meses IS NULL LIMIT 1)
         ) AS dias_alerta
  FROM existencias e
  JOIN lotes l       ON l.id = e.lote_id
  JOIN productos p   ON p.id = l.producto_id
  JOIN ubicaciones u ON u.id = e.ubicacion_id
  JOIN bodegas b     ON b.id = u.bodega_id
  WHERE e.cantidad > 0 AND l.fecha_vencimiento IS NOT NULL AND p.activo = 1
) a
WHERE a.dias_restantes <= a.dias_alerta;
-- estado: dias_restantes < 0 → vencido; si no → por vencer.

-- Catálogo mayorista: lo ÚNICO del catálogo que puede consultar un vendedor
-- mayorista. No tiene cantidades, lotes, bodegas ni ubicaciones.
CREATE VIEW vista_catalogo_mayorista AS
SELECT p.id            AS producto_id,
       p.sku,
       p.nombre,
       p.variante,
       p.descripcion,
       c.nombre        AS categoria,
       pr.id           AS presentacion_id,
       pr.nombre       AS presentacion,
       pr.factor       AS unidades_por_presentacion,
       ub.plural       AS unidad_base,
       pc.id           AS precio_id,
       pc.monto        AS precio_mayorista,
       pc.vigente_desde
FROM productos p
JOIN presentaciones pr ON pr.producto_id = p.id AND pr.activo = 1 AND pr.cotizable = 1
JOIN precios pc        ON pc.presentacion_id = pr.id AND pc.lista_id = 'MAYORISTA' AND pc.vigente_hasta IS NULL
JOIN unidades_base ub  ON ub.id = p.unidad_base_id
LEFT JOIN categorias c ON c.id = p.categoria_id
WHERE p.activo = 1 AND p.habilitado_mayorista = 1;
