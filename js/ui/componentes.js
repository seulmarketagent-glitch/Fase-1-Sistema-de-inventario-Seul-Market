/*
 * Componentes visuales y formateadores compartidos por todas las vistas.
 * Devuelven HTML como texto; todo valor dinámico pasa por SI.util.esc.
 */
window.SI = window.SI || {};

SI.ui = (function () {
  const esc = SI.util.esc;
  const C = () => SI.catalogos;
  let fmtNum = null;
  let fmtCLP = null;

  function num(n) {
    fmtNum = fmtNum || new Intl.NumberFormat(C().region.locale);
    return fmtNum.format(n);
  }

  function clp(n) {
    if (n == null) return SI.textos.comun.sinDato;
    fmtCLP = fmtCLP || new Intl.NumberFormat(C().region.locale, { style: 'currency', currency: C().region.moneda, maximumFractionDigits: 0 });
    return fmtCLP.format(n);
  }

  function fecha(iso) {
    if (!iso) return SI.textos.comun.sinDato;
    return SI.util.desdeISO(iso).toLocaleDateString(C().region.locale, { day: '2-digit', month: 'short', year: 'numeric' });
  }

  const buscar = (lista, id) => lista.find((x) => x.id === id);
  const nombreCategoria = (id) => (buscar(C().categorias, id) || { nombre: id }).nombre;
  const nombreUbicacion = (id) => (buscar(C().ubicaciones, id) || { nombre: id }).nombre;
  const cortoUbicacion = (id) => (buscar(C().ubicaciones, id) || { corto: id }).corto;
  const nombreCanal = (id) => (buscar(C().canales, id) || { nombre: id }).nombre;
  const claseEstado = (estadoId) => C().estados[estadoId].clase;

  /** Convierte {producto: 'p01'} en ' data-producto="p01"'. */
  function datos(obj) {
    return Object.entries(obj || {})
      .filter(([, v]) => v != null && v !== '')
      .map(([k, v]) => ` data-${k}="${esc(v)}"`).join('');
  }

  function boton(texto, accion, extra, clase) {
    return `<button type="button" class="${clase || 'btn'}" data-accion="${esc(accion)}"${datos(extra)}>${esc(texto)}</button>`;
  }

  function insigniaEstado(estadoId) {
    const e = C().estados[estadoId];
    return `<span class="insignia insignia-${e.clase}">${esc(e.nombre)}</span>`;
  }

  function insigniaVencimiento(p) {
    if (!SI.inventario.tieneAlertaVencimiento(p)) return '';
    const a = SI.inventario.alertasVencimiento(p);
    const texto = a.vencidos.length ? SI.textos.alertas.vencidos : SI.textos.alertas.porVencer;
    return `<span class="insignia insignia-vence">${esc(texto)}</span>`;
  }

  function insigniaTipo(tipoId) {
    const t = SI.movimientos.tipo(tipoId);
    if (!t) return esc(tipoId);
    return `<span class="insignia insignia-mov-${t.efecto}">${esc(t.nombre)}</span>`;
  }

  function insigniaCanal(canal) {
    return canal ? `<span class="insignia insignia-canal">${esc(canal)}</span>` : `<span class="tenue">${SI.textos.comun.sinDato}</span>`;
  }

  function kpi(k) {
    const contenido = `
      <span class="kpi-etiqueta">${esc(k.etiqueta)}</span>
      <span class="kpi-valor">${esc(k.valor)}</span>
      <span class="kpi-detalle">${esc(k.detalle || '')}</span>`;
    const clase = `kpi${k.tono ? ' kpi-' + k.tono : ''}`;
    if (k.accion) return `<button type="button" class="${clase}" data-accion="${esc(k.accion)}"${datos(k.datos)}>${contenido}</button>`;
    return `<div class="${clase}">${contenido}</div>`;
  }

  function vacio(titulo, texto, accionesHtml, compacto) {
    return `<div class="vacio${compacto ? ' vacio-compacto' : ''}">
      <strong>${esc(titulo)}</strong>
      ${texto ? `<p>${esc(texto)}</p>` : ''}
      ${accionesHtml || ''}
    </div>`;
  }

  function cabeceraVista(titulo, descripcion, accionesHtml) {
    return `<div class="vista-cabecera">
      <div><h1>${esc(titulo)}</h1>${descripcion ? `<p>${esc(descripcion)}</p>` : ''}</div>
      ${accionesHtml ? `<div>${accionesHtml}</div>` : ''}
    </div>`;
  }

  function opcionesSelect(lista, seleccionado, textoTodos) {
    const primera = textoTodos != null ? `<option value="">${esc(textoTodos)}</option>` : '';
    return primera + lista.map((o) =>
      `<option value="${esc(o.id)}"${o.id === seleccionado ? ' selected' : ''}>${esc(o.nombre)}</option>`).join('');
  }

  /** "Sala 22 · Bodega 80" */
  function stockPorUbicacionCorto(p) {
    const claves = Object.keys(p.stock);
    if (!claves.length) return `<span class="tenue">${esc(SI.textos.detalle.noAsignado)}</span>`;
    return `<span class="ubic-lista">${claves.map((u) =>
      `<span>${esc(cortoUbicacion(u))} <b>${num(p.stock[u])}</b></span>`).join('')}</span>`;
  }

  /* ---------- Movimientos ---------- */

  function deltaMovimiento(m) {
    if (m.delta > 0) return `<span class="delta-pos">+${num(m.unidades)}</span>`;
    if (m.delta < 0) return `<span class="delta-neg">−${num(m.unidades)}</span>`;
    return `<span class="delta-cero">⇄ ${num(m.unidades)}</span>`;
  }

  function ubicacionesMovimiento(m) {
    if (m.origen && m.destino) return `${esc(nombreUbicacion(m.origen))} <span class="flecha">→</span> ${esc(nombreUbicacion(m.destino))}`;
    return esc(nombreUbicacion(m.origen || m.destino || ''));
  }

  function cantidadIngresada(m) {
    if (m.factor === 1) return `${num(m.cantidad)} ${esc(m.presentacionNombre.toLowerCase())}`;
    return `${num(m.cantidad)} × ${esc(m.presentacionNombre)} <span class="tenue">(${num(m.factor)})</span>`;
  }

  function detalleMovimiento(m) {
    const partes = [];
    if (m.motivo) partes.push(`<strong>${esc(m.motivo)}</strong>`);
    if (m.nota) partes.push(esc(m.nota));
    if (m.lotes && m.lotes.length) partes.push(`<span class="tenue">Lote ${m.lotes.map((l) => esc(l.codigo)).join(', ')}</span>`);
    return partes.length ? partes.join('<br>') : `<span class="tenue">${SI.textos.comun.sinDato}</span>`;
  }

  /* ---------- Toasts ---------- */

  function toast(mensaje, tipo) {
    const cont = document.getElementById('toasts');
    if (!cont) return;
    const el = document.createElement('div');
    el.className = `toast toast-${tipo || 'ok'}`;
    el.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
    el.innerHTML = `<p>${esc(mensaje)}</p><button type="button" aria-label="${esc(SI.textos.comun.cerrar)}">×</button>`;
    const quitar = () => el.remove();
    el.querySelector('button').addEventListener('click', quitar);
    cont.appendChild(el);
    setTimeout(quitar, 6000);
  }

  return {
    num, clp, fecha, datos, boton,
    nombreCategoria, nombreUbicacion, cortoUbicacion, nombreCanal, claseEstado,
    insigniaEstado, insigniaVencimiento, insigniaTipo, insigniaCanal,
    kpi, vacio, cabeceraVista, opcionesSelect, stockPorUbicacionCorto,
    deltaMovimiento, ubicacionesMovimiento, cantidadIngresada, detalleMovimiento,
    toast
  };
})();
