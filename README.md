# Seúl Market · Sistema de inventario (prototipo v0.1)

Primera interfaz funcional para revisar y administrar inventario.
**Funciona solo con datos de demostración ficticios.** No es inventario real de Seúl Market y no está conectada a ningún sistema externo.

Área de Automatización y Sistemas: Mario Ulloa y Salomón Kim.

---

## 1. Cómo ejecutarla

No requiere instalar nada.

1. Abre la carpeta `Seul Market - Sistema de Inventario`.
2. Haz doble clic en **`index.html`** (se abre en Chrome, Safari, Edge o Firefox actualizados).
3. Para volver a los datos iniciales usa el botón **"Restablecer datos de demostración"** al pie de la página.

### Opción alternativa: servidor local de solo lectura

Si el navegador bloquea algo al abrir el archivo directamente, puedes servir la carpeta con el Python que traen las herramientas de Apple:

```bash
cd "/Users/salo/Desktop/Seul Market - Sistema de Inventario"
```

```bash
/usr/bin/python3 -m http.server 8765 --bind 127.0.0.1
```

Luego abre `http://127.0.0.1:8765` en el navegador y detén el servidor con `Ctrl + C`. Solo es accesible desde este equipo. Los datos guardados con este método quedan separados de los guardados al abrir el archivo con doble clic, porque el navegador los trata como sitios distintos.

### Decisión técnica

Cuando se creó, la carpeta estaba vacía y el equipo no tenía Node.js. Hoy hay Python 3.9 incluido con las herramientas de Apple, pero esa versión ya no recibe soporte. Por eso se eligió **HTML + CSS + JavaScript sin dependencias ni compilación**:

- Se abre con doble clic. No necesita `npm`, servidor ni conexión a internet.
- Los scripts son clásicos (no módulos ES) porque los navegadores bloquean módulos al abrir archivos locales. Comparten un único espacio de nombres global: `window.SI`.
- Si más adelante se adopta React, Vue u otro framework, las capas de **configuración**, **modelo** y **datos** se pueden reutilizar casi sin cambios.

### Capas (desde la etapa "Fase 1 · Estructura")

| Capa | Carpeta | Responsabilidad | Puede usar |
|---|---|---|---|
| Configuración | `js/config/`, `css/tokens.css` | Catálogos, textos, columnas, fuente de datos, diseño | Nada (solo datos) |
| Lógica de negocio | `js/modelo/` | Conversiones, cálculos de stock, alertas, validación y aplicación de movimientos (FEFO, sin negativos). No lee ni guarda datos | Configuración |
| Acceso a datos | `js/datos/` | `repositorio.js` es la única puerta para cargar, registrar y restablecer. `fuenteLocal.js` guarda en el navegador. `demo.js` genera los datos ficticios | Lógica de negocio y configuración |
| Presentación | `js/ui/`, `js/app.js` | Pantallas, formularios y navegación. Leen del estado en memoria y **escriben solo a través del repositorio** | Todas las anteriores |

Todas las escrituras del repositorio son asíncronas (devuelven una promesa). Así, cuando exista un servidor, se agrega una fuente nueva en `js/datos/` y se cambia `fuente` en `js/config/datos.js`, sin reescribir pantallas. En ese momento el servidor volverá a aplicar las reglas y los permisos; el navegador solo validará para dar mensajes rápidos.

**Transición de datos:** la clave de almacenamiento (`seul-market-inventario-demo-v1`) y el formato no cambiaron, así que lo registrado antes de esta etapa se conserva. Si lo guardado está dañado, se muestra la demo y lo guardado no se borra hasta el siguiente registro.

---

## 2. Pantallas y funciones disponibles

| Sección | Qué permite |
|---|---|
| **Resumen** | Indicadores de SKU activos, unidades disponibles, stock bajo, sin stock, movimientos recientes (7 días) y próximos a vencer (solo si hay lotes con vencimiento). Los indicadores son clicables y llevan a la vista filtrada. Incluye listas de "Requieren atención" y "Últimos movimientos". |
| **Productos** | Tabla con SKU, nombre, variante, categoría, disponible, reservado, stock por ubicación, unidad base, presentación y equivalencia, mínimo y estado. Búsqueda por nombre o SKU; filtros por categoría, ubicación y estado; orden por nivel de alerta, nombre o stock disponible. En celular la tabla se muestra como tarjetas. **El saldo no se puede editar en la tabla.** |
| **Movimientos** | Historial completo con búsqueda y filtros por tipo, canal y periodo. |
| **Alertas** | Productos sin stock y con stock bajo (con acceso a registrar una recepción), lotes próximos a vencer y lotes vencidos (con acceso a registrar una merma). |
| **Detalle de producto** | Se abre al hacer clic en el nombre de un producto. Muestra datos generales, precios demo en CLP, unidad base y presentaciones, stock físico, reservado, disponible y mínimo, stock por ubicación, lotes y vencimientos, e historial del producto. |
| **Registrar movimiento** | Botón visible en la barra superior y en cada vista. Tipos disponibles: **Recepción, Venta (B2C/B2B), Traslado, Devolución, Merma y Ajuste**. Los campos cambian según el tipo. Una vista previa en vivo muestra la conversión a unidades base y el saldo antes y después. Antes de aplicar hay un paso de confirmación. Al confirmar se actualizan los saldos, los indicadores, la tabla y el historial, y aparece un mensaje de confirmación. |

### Regla central de inventario

- Cada producto tiene **una unidad base** (en la demo, "unidad"), y todo saldo se guarda en ella.
- Cajas y packs son **presentaciones con factor de equivalencia**. No son saldos independientes.
- Al confirmar un movimiento: `unidades base = cantidad × factor de la presentación`.
  - Recepción de 2 cajas de 40 → +80 unidades.
  - Venta B2C de 1 unidad → −1.
  - Venta B2B parcial: 12 unidades de un producto que viene en caja de 24 → −12. La interfaz indica que es una venta parcial.
  - Venta B2B de 1 caja de 24 → −24.

### Validaciones

- Producto, cantidad, presentación, ubicaciones y fecha son obligatorios. La venta exige canal.
- La cantidad debe ser mayor que cero y equivaler a un número entero de unidades base.
- **No se permiten saldos negativos.** Una salida o traslado no puede superar el stock de la ubicación de origen.
- Un traslado debe tener origen y destino distintos.
- Devolución, merma y ajuste **exigen motivo**. Si el motivo es "Otro", hay que escribir una nota.
- Una venta B2B exige número de pedido o cliente.
- La fecha no puede ser futura.
- La recepción de productos con control de vencimiento exige la fecha de vencimiento del lote.
- Si una venta supera el stock disponible y usaría unidades reservadas, se muestra un aviso, pero no se bloquea.

---

## 3. Supuestos de la demostración

1. **Productos ficticios y genéricos** (13 SKU, uno inactivo). Los precios en CLP, las cantidades, los lotes y los pedidos son inventados.
2. **Ubicaciones:** Sala de ventas, Bodega y Refrigerador, todas en el local de Recoleta.
3. **Disponible = stock físico − reservado.** El reservado representa pedidos B2B pendientes. En esta versión es un dato fijo de la demo: no hay flujo para crear ni liberar reservas.
4. **Stock bajo:** disponible ≤ stock mínimo. **Sin stock:** disponible = 0.
5. **Próximo a vencer:** lote que vence en 30 días o menos. Las fechas de la demo se calculan respecto del día actual, para que siempre haya casos visibles.
6. **Lotes:** solo los productos marcados con control de vencimiento los usan. Las salidas descuentan primero el lote que vence antes (FEFO). Los traslados mueven los lotes. Las devoluciones y los ajustes positivos quedan como "sin lote asignado".
7. **Historial inicial ilustrativo:** los movimientos marcados como "Histórico demo" muestran cada caso (recepción en cajas, venta B2C, venta B2B parcial, venta B2B por caja, traslado, merma, ajuste y devolución), pero no reconstruyen exactamente los saldos iniciales.
8. **Sin usuarios ni permisos:** no se registra quién hizo cada movimiento.
9. Los movimientos registrados no se pueden editar ni anular. Para corregir uno se registra un ajuste con motivo.
10. No se interpretó la cantidad de publicaciones de una tienda online como unidades físicas. Ningún dato proviene de canales de venta reales.

---

## 4. Decisiones que Seúl Market debe validar antes de usar datos reales

1. **Unidad base por producto** y lista real de **presentaciones y factores** (caja, pack, display, fardo). ¿Algún producto se vende por peso?
2. **Catálogo maestro:** formato oficial de SKU, variantes, categorías y quién puede crear o modificar productos.
3. **Ubicaciones reales:** sala, bodega, refrigerado, otras bodegas o sucursales.
4. **Reservas B2B:** cuándo se reserva stock (pedido confirmado, pagado o despachado) y cómo se libera o anula.
5. **Reglas de stock negativo:** se recomienda mantener el bloqueo, pero hay que confirmar si la venta en el local puede adelantarse a una recepción no registrada.
6. **Stock mínimo** por producto y si debe ser distinto por ubicación o canal.
7. **Vencimientos y lotes:** qué productos los controlan, si se usa FEFO y qué días de anticipación disparan la alerta.
8. **Motivos oficiales** de merma, ajuste y devolución, y quién puede aprobar un ajuste.
9. **Responsables y auditoría:** usuarios, roles, aprobaciones y registro de autor de cada movimiento.
10. **Origen de los datos reales:** conteo inicial físico, sistema de caja, planillas existentes, tienda online o Mercado Libre. Cada integración requiere acceso técnico confirmado.
11. **Persistencia:** base de datos o servicio donde vivirá el inventario y su respaldo.
12. **Precios:** si el inventario debe mostrarlos y si existen listas distintas para B2C y B2B.

---

## 5. Qué es demostración y qué está conectado

| Función | Estado |
|---|---|
| Interfaz, navegación, filtros, formularios, validaciones y conversiones | **Frontend de demostración**, funcional dentro del navegador |
| Datos de productos, lotes, precios y movimientos | **Ficticios**, en `js/datos/demo.js` |
| Guardado | **Solo en el navegador actual** (`localStorage`). No se comparte entre equipos ni usuarios. Se pierde si se borran los datos del navegador. En modo privado puede no guardarse (la interfaz lo indica en el pie). |
| Caja, tienda online, Mercado Libre, redes sociales, APIs, bases de datos | **No conectados.** No existe ninguna integración real. |

---

## 6. Estructura y cómo modificarla

```
index.html                     Estructura base y orden de carga de scripts
css/
  tokens.css                   ← Colores, tipografía, espaciados, radios, sombras (variables CSS)
  base.css                     Layout general y responsive
  components.css               Botones, tablas, formularios, insignias, diálogos, avisos
js/
  util.js                      Fechas, escape de HTML, búsqueda sin tildes
  config/
    catalogos.js               ← Categorías, ubicaciones, canales, estados, unidades base,
                                 tipos de movimiento, motivos, días de alerta
    textos.js                  ← Navegación, títulos, etiquetas, mensajes y validaciones
    datos.js                   ← Fuente de datos activa y clave de almacenamiento local
    columnas.js                ← Columnas de la tabla de productos, filtros y ordenamientos
  modelo/                      LÓGICA DE NEGOCIO (no lee ni guarda datos)
    conversiones.js            Reglas de presentación ↔ unidad base
    inventario.js              Estado en memoria, cálculo de stock, estados, alertas, indicadores
    movimientos.js             Validación y aplicación de movimientos (incluye FEFO de lotes)
  datos/                       ACCESO A DATOS
    repositorio.js             Única puerta: cargar, registrarMovimiento, restablecer (asíncronas)
    fuenteLocal.js             Adaptador del navegador (localStorage), solo demostración
    demo.js                    ← Productos, presentaciones, lotes y movimientos ficticios
  ui/
    componentes.js             Formatos (CLP, fechas, números), insignias, KPI, toasts
    resumen.js · productos.js · movimientos.js · alertas.js
    detalleProducto.js         Diálogo de detalle
    formularioMovimiento.js    Diálogo de registro y confirmación
  app.js                       Arranque, navegación por #hash y acciones globales
```

Cambios frecuentes:

- **Colores o tipografía:** edita `css/tokens.css`.
- **Nombre de una sección o un texto:** edita `js/config/textos.js`.
- **Nueva categoría, ubicación o motivo:** agrégala en `js/config/catalogos.js`.
- **Nuevo tipo de movimiento:** agrégalo en `tiposMovimiento`, con `efecto` entrada, salida, traslado o ajuste. El formulario y los filtros lo toman automáticamente.
- **Ocultar o reordenar columnas:** usa `visible: false` o cambia el orden del arreglo en `js/config/columnas.js`.
- **Equivalencias de empaque:** edita el arreglo `presentaciones` de cada producto en `js/datos/demo.js` (`factor` = unidades base por presentación).
- **Volver a los datos demo después de editar `demo.js`:** usa "Restablecer datos de demostración" o cambia `local.clave` en `js/config/datos.js`.
- **Nueva fuente de datos:** crea un adaptador en `js/datos/` con `leer`, `escribir`, `borrar` y `persistente` (ver el contrato en `fuenteLocal.js`), cárgalo en `index.html` y cámbialo en `js/config/datos.js`.
