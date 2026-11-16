/*
 * Reglas de conversión entre presentaciones (caja, pack) y la unidad base.
 *
 * Regla central: el saldo de un producto existe solo en su unidad base.
 * Las cajas y packs son presentaciones con un factor de equivalencia:
 *   unidades base = cantidad × factor de la presentación.
 * Ej.: 2 cajas de 24 → 48 unidades; 12 unidades de una caja de 24 → 12 unidades.
 */
window.SI = window.SI || {};

SI.conversiones = (function () {
  const num = (n) => new Intl.NumberFormat(SI.catalogos.region.locale).format(n);

  function unidadBase(producto) {
    return SI.catalogos.unidadesBase[producto.unidadBase] || SI.catalogos.unidadesBase.unidad;
  }

  function presentacion(producto, id) {
    return producto.presentaciones.find((x) => x.id === id) || null;
  }

  function factor(producto, id) {
    const pres = presentacion(producto, id);
    return pres ? pres.factor : null;
  }

  /** Presentación de factor 1 (la unidad base). */
  function presentacionBase(producto) {
    return producto.presentaciones.find((x) => x.factor === 1) || producto.presentaciones[0];
  }

  /** Presentación de mayor factor (normalmente la caja). */
  function presentacionMayor(producto) {
    return producto.presentaciones.reduce((a, b) => (b.factor > a.factor ? b : a));
  }

  /** Convierte una cantidad en una presentación a unidades base. */
  function aUnidadesBase(producto, cantidad, presentacionId) {
    const f = factor(producto, presentacionId);
    if (f == null || !isFinite(cantidad)) return null;
    return Math.round(cantidad * f * 1e6) / 1e6;
  }

  /** Valida que el resultado sea positivo y respete los decimales de la unidad base. */
  function esCantidadValida(producto, unidades) {
    if (!(unidades > 0)) return false;
    const dec = unidadBase(producto).decimales || 0;
    const escala = Math.pow(10, dec);
    return Math.abs(Math.round(unidades * escala) - unidades * escala) < 1e-9;
  }

  /** "48 unidades" / "1 unidad" */
  function textoUnidades(producto, n) {
    const u = unidadBase(producto);
    return `${num(n)} ${Math.abs(n) === 1 ? u.singular : u.plural}`;
  }

  /** "Caja (24 u.)" o "Unidad" */
  function textoPresentacion(producto, pres) {
    if (!pres) return '';
    return pres.factor === 1 ? pres.nombre : `${pres.nombre} (${num(pres.factor)} ${unidadBase(producto).abreviatura})`;
  }

  /** "Caja = 24 u. · Pack = 6 u." */
  function textoEquivalencias(producto) {
    const u = unidadBase(producto);
    const lista = producto.presentaciones
      .filter((x) => x.factor !== 1)
      .sort((a, b) => b.factor - a.factor)
      .map((x) => `${x.nombre} = ${num(x.factor)} ${u.abreviatura}`);
    return lista.length ? lista.join(' · ') : `Solo por ${u.singular}`;
  }

  /** "2 × Caja (24 u.) = 48 unidades" */
  function textoConversion(producto, cantidad, presentacionId) {
    const pres = presentacion(producto, presentacionId);
    const unidades = aUnidadesBase(producto, cantidad, presentacionId);
    if (!pres || unidades == null) return '';
    if (pres.factor === 1) return textoUnidades(producto, unidades);
    return `${num(cantidad)} × ${textoPresentacion(producto, pres)} = ${textoUnidades(producto, unidades)}`;
  }

  /** Desglose de un saldo en la presentación mayor: "4 cajas + 8 unidades". */
  function desglose(producto, unidades) {
    const mayor = presentacionMayor(producto);
    if (!mayor || mayor.factor <= 1 || unidades < mayor.factor) return textoUnidades(producto, unidades);
    const cajas = Math.floor(unidades / mayor.factor);
    const resto = unidades - cajas * mayor.factor;
    const nombre = mayor.nombre.toLowerCase();
    const plural = cajas === 1 ? nombre : (mayor.plural || nombre + 's').toLowerCase();
    return `${num(cajas)} ${plural}` + (resto ? ` + ${textoUnidades(producto, resto)}` : '');
  }

  return {
    unidadBase, presentacion, factor, presentacionBase, presentacionMayor,
    aUnidadesBase, esCantidadValida, textoUnidades, textoPresentacion,
    textoEquivalencias, textoConversion, desglose
  };
})();
