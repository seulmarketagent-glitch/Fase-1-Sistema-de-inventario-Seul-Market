/*
 * Diálogo: registrar movimiento.
 * Flujo: formulario (con vista previa de conversión) → confirmación → aplicar.
 * Los campos visibles dependen del tipo de movimiento definido en SI.catalogos.tiposMovimiento.
 */
window.SI = window.SI || {};
SI.vistas = SI.vistas || {};

SI.vistas.formulario = (function () {
  const esc = SI.util.esc;
  let dlg = null;
  let f = null;          // valores del formulario
  let intento = false;   // se intentó enviar (mostrar errores)
  let listo = false;     // listeners instalados

  const T = () => SI.textos.formulario;
  const tipo = () => SI.movimientos.tipo(f.tipo);
  const producto = () => SI.inventario.producto(f.productoId);

  function etiquetaProducto(p) {
    return `${p.sku} · ${p.nombre} (${p.variante})`;
  }

  function resolverProducto(texto) {
    const t = String(texto || '').trim();
    if (!t) return '';
    const activos = SI.inventario.productos().filter((p) => p.activo);
    const exacto = activos.find((p) => etiquetaProducto(p) === t);
    if (exacto) return exacto.id;
    const sku = t.toUpperCase().split(/\s/)[0];
    const porSku = activos.find((p) => p.sku.toUpperCase() === sku);
    return porSku ? porSku.id : '';
  }

  /* ---------- Apertura y valores ---------- */

  function abrir(pref) {
    pref = pref || {};
    dlg = document.getElementById('dlg-movimiento');
    if (!listo) instalarEventos();
    const p = pref.producto ? SI.inventario.producto(pref.producto) : null;
    f = {
      tipo: SI.movimientos.tipo(pref.tipo) ? pref.tipo : SI.catalogos.tiposMovimiento[0].id,
      productoId: p && p.activo ? p.id : '',
      productoTexto: p && p.activo ? etiquetaProducto(p) : '',
      cantidad: '', presentacionId: '', canal: '', direccion: '',
      origen: '', destino: '', ubicacion: '',
      motivo: '', nota: '', fecha: SI.util.hoyISO(), lote: '', vencimiento: ''
    };
    aplicarPredeterminados();
    intento = false;
    pintarFormulario();
    if (!dlg.open) dlg.showModal();
    enfocar(f.productoId ? 'cantidad' : 'productoTexto');
  }

  /** Completa presentación, ubicaciones y canal según tipo y producto. */
  function aplicarPredeterminados() {
    const C = SI.catalogos;
    const inv = SI.inventario;
    const conv = SI.conversiones;
    const t = tipo();
    const p = producto();

    if (!t.canal) f.canal = '';
    else if (t.canal === 'obligatorio' && !f.canal) f.canal = C.canales[0].id;

    f.presentacionId = p
      ? (t.presentacionSugerida === 'mayor' ? conv.presentacionMayor(p) : conv.presentacionBase(p)).id
      : '';

    const todas = C.ubicaciones.map((u) => u.id);
    const asignadas = p ? Object.keys(p.stock) : [];
    const conStock = p ? todas.filter((u) => inv.stockEn(p, u) > 0).sort((a, b) => inv.stockEn(p, b) - inv.stockEn(p, a)) : [];
    const recepcion = C.ubicaciones.filter((u) => u.recepcion).map((u) => u.id);

    f.origen = conStock[0] || asignadas[0] || todas[0];
    f.ubicacion = conStock[0] || asignadas[0] || todas[0];
    if (t.efecto === 'traslado') {
      f.destino = asignadas.find((u) => u !== f.origen) || todas.find((u) => u !== f.origen) || '';
    } else if (t.id === 'recepcion') {
      f.destino = asignadas.find((u) => recepcion.includes(u)) || asignadas[0] || recepcion[0] || todas[0];
    } else {
      f.destino = asignadas[0] || todas[0];
    }
    f.direccion = '';
    f.motivo = '';
    f.lote = '';
    f.vencimiento = '';
  }

  /* ---------- Pintado ---------- */

  function pintarFormulario() {
    const t = tipo();
    const C = SI.catalogos;
    const activos = SI.inventario.productos().filter((p) => p.activo);

    const canal = !t.canal ? '' : t.canal === 'obligatorio'
      ? `<fieldset class="ancho-completo">
          <legend class="campo-req">${esc(T().canal)}</legend>
          <div class="opciones opciones-2">
            ${C.canales.map((c) => `<label class="opcion">
              <input type="radio" name="canal" value="${esc(c.id)}"${f.canal === c.id ? ' checked' : ''}>
              <span>${esc(c.nombre)}<small>${esc(c.descripcion)}</small></span>
            </label>`).join('')}
          </div>
          <p class="campo-error" id="err-canal"></p>
        </fieldset>`
      : `<div class="campo">
          <label for="mv-canal">${esc(T().canal)}</label>
          <select id="mv-canal" class="select" name="canal">${SI.ui.opcionesSelect(C.canales, f.canal, '—')}</select>
          <p class="campo-error" id="err-canal"></p>
        </div>`;

    dlg.innerHTML = `<form class="dialogo-contenido" novalidate>
      <header class="dlg-cabecera">
        <div><h2>${esc(T().titulo)}</h2><p>${esc(T().subtitulo)} <span class="insignia insignia-demo">${esc(SI.textos.app.insigniaDemo)}</span></p></div>
        <button type="button" class="btn-icono" data-accion="cerrar-dialogo" aria-label="${esc(SI.textos.comun.cerrar)}">×</button>
      </header>
      <div class="dlg-cuerpo">
        <fieldset>
          <legend>${esc(T().tipo)}</legend>
          <div class="opciones opciones-6">
            ${C.tiposMovimiento.map((x) => `<label class="opcion">
              <input type="radio" name="tipo" value="${esc(x.id)}"${x.id === f.tipo ? ' checked' : ''}>
              <span>${esc(x.nombre)}</span>
            </label>`).join('')}
          </div>
          <p class="campo-ayuda" style="margin-top:6px">${esc(t.descripcion)}</p>
        </fieldset>

        <div class="form-grid">
          <div class="campo ancho-completo">
            <label for="mv-producto" class="campo-req">${esc(T().producto)}</label>
            <input id="mv-producto" class="input" name="productoTexto" list="mv-lista-productos" autocomplete="off"
              placeholder="${esc(T().productoPlaceholder)}" value="${esc(f.productoTexto)}">
            <datalist id="mv-lista-productos">${activos.map((p) => `<option value="${esc(etiquetaProducto(p))}"></option>`).join('')}</datalist>
            <p class="campo-error" id="err-producto"></p>
          </div>
          ${canal}
        </div>

        <div class="form-grid" id="mv-dependientes"></div>

        <div id="mv-preview" aria-live="polite"></div>
        <p class="aviso aviso-error" id="mv-error-general" hidden>${esc(SI.textos.validacion.revisarErrores)}</p>
      </div>
      <footer class="dlg-pie">
        <button type="button" class="btn" data-accion="cerrar-dialogo">${esc(SI.textos.comun.cancelar)}</button>
        <button type="submit" class="btn btn-primario">${esc(T().revisar)}</button>
      </footer>
    </form>`;
    pintarDependientes();
  }

  /** Campos que dependen del tipo y del producto elegido. */
  function pintarDependientes() {
    const cont = dlg.querySelector('#mv-dependientes');
    const t = tipo();
    const p = producto();
    const ui = SI.ui;
    const conv = SI.conversiones;
    const C = SI.catalogos;

    const opcionesUbic = (sel) => C.ubicaciones.map((u) => {
      const extra = p ? ` (${T().enStock(ui.num(SI.inventario.stockEn(p, u.id)))})` : '';
      return `<option value="${esc(u.id)}"${u.id === sel ? ' selected' : ''}>${esc(u.nombre + extra)}</option>`;
    }).join('');

    const campoUbic = (nombre, etiqueta) => `<div class="campo">
      <label for="mv-${nombre}" class="campo-req">${esc(etiqueta)}</label>
      <select id="mv-${nombre}" class="select" name="${nombre}">${opcionesUbic(f[nombre])}</select>
      <p class="campo-error" id="err-${nombre}"></p>
    </div>`;

    const presentaciones = p
      ? p.presentaciones.map((x) => `<option value="${esc(x.id)}"${x.id === f.presentacionId ? ' selected' : ''}>${esc(conv.textoPresentacion(p, x))}</option>`).join('')
      : `<option value="">${esc(T().seleccionar)}</option>`;

    let html = `
      <div class="campo">
        <label for="mv-cantidad" class="campo-req">${esc(T().cantidad)}</label>
        <input id="mv-cantidad" class="input" name="cantidad" type="number" inputmode="decimal" min="0" step="any" value="${esc(f.cantidad)}">
        <p class="campo-error" id="err-cantidad"></p>
      </div>
      <div class="campo">
        <label for="mv-presentacion" class="campo-req">${esc(T().presentacion)}</label>
        <select id="mv-presentacion" class="select" name="presentacionId"${p ? '' : ' disabled'}>${presentaciones}</select>
        <p class="campo-error" id="err-presentacionId"></p>
      </div>`;

    if (t.efecto === 'ajuste') {
      html += `<div class="campo">
        <label for="mv-direccion" class="campo-req">${esc(T().direccion)}</label>
        <select id="mv-direccion" class="select" name="direccion">
          <option value="">${esc(T().seleccionar)}</option>
          ${Object.entries(T().direcciones).map(([id, n]) => `<option value="${id}"${f.direccion === id ? ' selected' : ''}>${esc(n)}</option>`).join('')}
        </select>
        <p class="campo-error" id="err-direccion"></p>
      </div>`;
    }

    t.campos.forEach((campo) => { html += campoUbic(campo, T()[campo]); });

    if (t.registraLote && p && p.controlaVencimiento) {
      html += `<div class="campo">
          <label for="mv-lote">${esc(T().lote)}</label>
          <input id="mv-lote" class="input" name="lote" value="${esc(f.lote)}" placeholder="${esc(T().lotePlaceholder)}" autocomplete="off">
        </div>
        <div class="campo">
          <label for="mv-vencimiento" class="campo-req">${esc(T().vencimiento)}</label>
          <input id="mv-vencimiento" class="input" name="vencimiento" type="date" value="${esc(f.vencimiento)}">
          <p class="campo-error" id="err-vencimiento"></p>
        </div>`;
    }

    if (t.motivos) {
      html += `<div class="campo">
        <label for="mv-motivo" class="${t.motivoObligatorio ? 'campo-req' : ''}">${esc(T().motivo)}</label>
        <select id="mv-motivo" class="select" name="motivo">
          <option value="">${esc(T().motivoPlaceholder)}</option>
          ${t.motivos.map((m) => `<option value="${esc(m)}"${f.motivo === m ? ' selected' : ''}>${esc(m)}</option>`).join('')}
        </select>
        <p class="campo-error" id="err-motivo"></p>
      </div>`;
    }

    html += `
      <div class="campo">
        <label for="mv-fecha" class="campo-req">${esc(T().fecha)}</label>
        <input id="mv-fecha" class="input" name="fecha" type="date" max="${SI.util.hoyISO()}" value="${esc(f.fecha)}">
        <p class="campo-error" id="err-fecha"></p>
      </div>
      <div class="campo ancho-completo">
        <label for="mv-nota" id="mv-nota-etiqueta">${esc(T().nota)}</label>
        <input id="mv-nota" class="input" name="nota" value="${esc(f.nota)}" placeholder="${esc((t.referencia && t.referencia.placeholder) || '')}" autocomplete="off">
        <p class="campo-error" id="err-nota"></p>
      </div>`;

    cont.innerHTML = html;
    actualizar();
  }

  function pintarPreview(v) {
    const cont = dlg.querySelector('#mv-preview');
    if (!cont) return;
    const c = v.calculo;
    const conv = SI.conversiones;
    const ui = SI.ui;

    if (!c || !c.producto || !c.unidades) {
      cont.innerHTML = `<div class="preview"><span class="preview-titulo">${esc(T().conversion)}</span><p class="preview-vacio">${esc(T().previewVacio)}</p></div>`;
      return;
    }
    const p = c.producto;
    const notas = [];
    const mayor = conv.presentacionMayor(p);
    if (c.tipo.id === 'venta' && f.canal === 'B2B' && c.factor < mayor.factor && c.unidades % mayor.factor !== 0) {
      notas.push(`<p class="aviso aviso-info">${esc(T().parcial(conv.textoUnidades(p, c.unidades), conv.textoPresentacion(p, mayor).toLowerCase()))}</p>`);
    }
    if (c.origen && p.controlaVencimiento) notas.push(`<p class="campo-ayuda">${esc(T().lotesFefo)}</p>`);
    if (v.errores.cantidad) notas.push(`<p class="aviso aviso-error">${esc(v.errores.cantidad)}</p>`);
    v.avisos.forEach((a) => notas.push(`<p class="aviso aviso-alerta">${esc(a)}</p>`));

    cont.innerHTML = `<div class="preview">
      <span class="preview-titulo">${esc(T().conversion)}</span>
      <span class="preview-conversion">${esc(conv.textoConversion(p, c.cantidad, f.presentacionId))}</span>
      ${c.saldos.length ? `<div class="saldos">
        ${c.saldos.map((s) => `<span>${esc(ui.nombreUbicacion(s.ubicacion))}: <b>${ui.num(s.antes)}</b><span class="flecha">→</span><b>${ui.num(s.despues)}</b></span>`).join('')}
        <span>${esc(T().totalProducto)}: <b>${ui.num(c.totalAntes)}</b><span class="flecha">→</span><b>${ui.num(c.totalDespues)}</b></span>
      </div>` : ''}
      ${notas.join('')}
    </div>`;
  }

  function pintarErrores(v) {
    const errores = v.errores || {};
    dlg.querySelectorAll('.campo-error').forEach((el) => {
      const campo = el.id.replace('err-', '');
      el.textContent = errores[campo] || '';
      const nombre = campo === 'producto' ? 'productoTexto' : campo;
      dlg.querySelectorAll(`[name="${nombre}"]`).forEach((input) => {
        if (errores[campo]) input.setAttribute('aria-invalid', 'true');
        else input.removeAttribute('aria-invalid');
      });
    });
    const general = dlg.querySelector('#mv-error-general');
    if (general) general.hidden = v.ok;
    // Marca la referencia como obligatoria cuando aplica (p. ej., venta B2B).
    const etiquetaNota = dlg.querySelector('#mv-nota-etiqueta');
    if (etiquetaNota) {
      const t = tipo();
      const req = (t.referencia && t.referencia.obligatoriaEnCanal && t.referencia.obligatoriaEnCanal.includes(f.canal)) ||
        (f.motivo === SI.catalogos.motivoOtro);
      etiquetaNota.classList.toggle('campo-req', !!req);
    }
  }

  function actualizar() {
    const v = SI.movimientos.validar(f);
    pintarPreview(v);
    if (intento) pintarErrores(v);
    else pintarErrores({ ok: true, errores: {} });
    return v;
  }

  function pintarConfirmacion(v) {
    const c = v.calculo;
    const p = c.producto;
    const ui = SI.ui;
    const conv = SI.conversiones;
    const filas = [
      ['Tipo', ui.insigniaTipo(c.tipo.id) + (f.canal ? ' ' + ui.insigniaCanal(f.canal) : '')],
      ['Producto', `<span class="mono">${esc(p.sku)}</span> · ${esc(p.nombre)} (${esc(p.variante)})`],
      ['Cantidad ingresada', esc(`${ui.num(c.cantidad)} × ${conv.textoPresentacion(p, conv.presentacion(p, f.presentacionId))}`)],
      [T().conversion, `<span class="cantidad">${esc(conv.textoUnidades(p, c.unidades))}</span>`]
    ];
    if (c.origen) filas.push([T().origen, esc(ui.nombreUbicacion(c.origen))]);
    if (c.destino) filas.push([T().destino, esc(ui.nombreUbicacion(c.destino))]);
    if (c.pideVencimiento) filas.push([T().vencimiento, `${ui.fecha(f.vencimiento)}${f.lote ? ' · ' + esc(f.lote) : ''}`]);
    if (f.motivo) filas.push([T().motivo, esc(f.motivo)]);
    if (String(f.nota).trim()) filas.push([T().nota, esc(String(f.nota).trim())]);
    filas.push([T().fecha, ui.fecha(f.fecha)]);

    dlg.innerHTML = `<div class="dialogo-contenido">
      <header class="dlg-cabecera">
        <div><h2>${esc(T().resumenTitulo)}</h2><p>${esc(T().resumenSubtitulo)}</p></div>
        <button type="button" class="btn-icono" data-accion="cerrar-dialogo" aria-label="${esc(SI.textos.comun.cerrar)}">×</button>
      </header>
      <div class="dlg-cuerpo">
        <dl class="dl">${filas.map(([k, val]) => `<dt>${esc(k)}</dt><dd>${val}</dd>`).join('')}</dl>
        <div id="mv-preview"></div>
      </div>
      <footer class="dlg-pie">
        <button type="button" class="btn" data-mov="volver">${esc(T().volver)}</button>
        <button type="button" class="btn btn-primario" data-mov="confirmar">${esc(T().confirmar)}</button>
      </footer>
    </div>`;
    pintarPreview(v);
    dlg.querySelector('[data-mov="confirmar"]').focus();
  }

  function enfocar(nombre) {
    const el = dlg.querySelector(`[name="${nombre}"]`);
    if (el) el.focus();
  }

  /* ---------- Eventos ---------- */

  function onCambio(e) {
    const el = e.target;
    const nombre = el.name;
    if (!f || !nombre || !(nombre in f)) return;
    if (el.type === 'radio' && !el.checked) return;

    if (nombre === 'productoTexto') {
      f.productoTexto = el.value;
      const id = resolverProducto(el.value);
      if (id !== f.productoId) {
        f.productoId = id;
        aplicarPredeterminados();
        pintarDependientes();
        return;
      }
      actualizar();
      return;
    }

    if (nombre === 'tipo') {
      if (el.value === f.tipo) return; // 'input' y 'change' llegan ambos
      f.tipo = el.value;
      aplicarPredeterminados();
      pintarFormulario();
      dlg.querySelector(`[name="tipo"][value="${f.tipo}"]`).focus();
      return;
    }
    f[nombre] = el.value;
    actualizar();
  }

  function onSubmit(e) {
    e.preventDefault();
    const v = SI.movimientos.validar(f);
    if (!v.ok) {
      intento = true;
      pintarErrores(v);
      pintarPreview(v);
      const primero = dlg.querySelector('[aria-invalid="true"]');
      if (primero) primero.focus();
      return;
    }
    pintarConfirmacion(v);
  }

  function onClick(e) {
    const b = e.target.closest('[data-mov]');
    if (!b) return;
    if (b.dataset.mov === 'volver') {
      pintarFormulario();
      enfocar('cantidad');
      return;
    }
    if (b.dataset.mov === 'confirmar') confirmar(b);
  }

  async function confirmar(boton) {
    if (boton.disabled) return;
    boton.disabled = true; // evita registrar dos veces con doble clic
    let r;
    try {
      r = await SI.repositorio.registrarMovimiento(f);
    } catch (e) {
      boton.disabled = false;
      SI.ui.toast(SI.textos.app.errorDatos, 'error');
      return;
    }
    if (!r.ok) {
      intento = true;
      pintarFormulario();
      pintarErrores(r);
      SI.ui.toast(SI.textos.validacion.revisarErrores, 'error');
      return;
    }
    const m = r.movimiento;
    const p = r.calculo.producto;
    dlg.close();
    SI.ui.toast(SI.textos.confirmacion.movimiento(r.calculo.tipo.nombre, SI.conversiones.textoUnidades(p, m.unidades), `${p.sku} ${p.nombre}`), 'ok');
    if (r.guardado === false) SI.ui.toast(SI.textos.app.avisoNoGuardado, 'error');
    SI.app.refrescar();
  }

  function instalarEventos() {
    dlg.addEventListener('input', onCambio);
    dlg.addEventListener('change', onCambio);
    dlg.addEventListener('submit', onSubmit);
    dlg.addEventListener('click', onClick);
    listo = true;
  }

  return { abrir };
})();
