/*
 * Configuración de la capa de acceso a datos.
 *
 * fuente: qué adaptador usa SI.repositorio para leer y guardar.
 *   'local' → navegador actual (localStorage), solo para demostración.
 *   Más adelante se agregará un adaptador de servidor; las pantallas no cambian.
 */
window.SI = window.SI || {};

SI.configDatos = {
  fuente: 'local',

  local: {
    /**
     * Clave de almacenamiento del navegador. Es la misma que usaba la versión
     * anterior, así que los movimientos ya registrados se conservan.
     * Cámbiala solo si quieres empezar de cero sin borrar lo guardado.
     */
    clave: 'seul-market-inventario-demo-v1'
  }
};
