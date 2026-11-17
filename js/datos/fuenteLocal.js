/*
 * Adaptador de datos: navegador actual (localStorage). SOLO DEMOSTRACIÓN.
 *
 * Contrato que debe cumplir cualquier fuente (la futura de servidor también):
 *   leer()          → Promise<{ productos, movimientos } | null>
 *   escribir(datos) → Promise<void>      (rechaza si no se pudo guardar)
 *   borrar()        → Promise<void>
 *   persistente     → boolean            (false si el navegador no permite guardar)
 *
 * Aquí no hay contraseñas, usuarios ni secretos: solo datos ficticios.
 */
window.SI = window.SI || {};
SI.fuentes = SI.fuentes || {};

SI.fuentes.local = (function () {
  const clave = () => SI.configDatos.local.clave;
  let persistente = false;

  function leer() {
    return new Promise((resolver) => {
      let crudo = null;
      let datos = null;
      try {
        crudo = window.localStorage.getItem(clave());
        persistente = true;
      } catch (e) {
        persistente = false; // el navegador no permite almacenamiento (p. ej., modo privado estricto)
      }
      try {
        if (crudo) datos = JSON.parse(crudo);
      } catch (e) {
        datos = null; // contenido ilegible: se usa la demo; lo guardado no se borra hasta el próximo registro
      }
      const valido = datos && Array.isArray(datos.productos) && Array.isArray(datos.movimientos);
      resolver(valido ? datos : null);
    });
  }

  function escribir(datos) {
    return new Promise((resolver, rechazar) => {
      try {
        window.localStorage.setItem(clave(), JSON.stringify({
          productos: datos.productos,
          movimientos: datos.movimientos
        }));
        persistente = true;
        resolver();
      } catch (e) {
        persistente = false;
        rechazar(e);
      }
    });
  }

  function borrar() {
    return new Promise((resolver) => {
      try { window.localStorage.removeItem(clave()); } catch (e) { /* sin almacenamiento */ }
      resolver();
    });
  }

  return {
    nombre: 'local',
    leer, escribir, borrar,
    get persistente() { return persistente; }
  };
})();
