/* =====================================================================
   Rocket Room — formulario de contacto en pasos (componente compartido)
   Lo usan home, /cowork/ y /oficinas/. Mejora progresiva: sin JS el
   formulario se ve completo y Netlify Forms lo recibe igual. Con JS:
   un campo por paso, resumen editable de lo ya cargado, envío AJAX a
   Netlify y agradecimiento animado.
   ===================================================================== */
(function () {
  'use strict';

  var CSS = [
    '.rr-steps .rr-field[hidden]{display:none}',
    '.rr-steps .rr-field textarea{min-height:88px}',
    '.cta-card .rr-step-count{font-size:.78rem;font-weight:600;letter-spacing:.02em;color:var(--rr-gray-500,#7a7a7a);margin:0 0 -4px}',
    '.rr-done{display:grid;gap:8px}',
    '.rr-done:empty{display:none}',
    '.rr-done-row{display:flex;align-items:center;gap:12px;padding:10px 14px;border:1px solid var(--rr-gray-200,#e6e6e6);border-radius:10px;background:#fafafa;min-width:0}',
    '.rr-done-txt{display:grid;min-width:0;flex:1}',
    '.rr-done-label{font-size:.72rem;font-weight:600;color:var(--rr-gray-500,#7a7a7a)}',
    '.rr-done-val{font-size:.92rem;font-weight:600;color:var(--rr-black,#0a0a0a);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.rr-done-edit{flex:none;font:600 .82rem/1 inherit;font-family:inherit;color:var(--rr-blue,#0040ff);background:none;border:0;padding:6px 0;cursor:pointer;text-decoration:underline;text-underline-offset:3px}',
    '.cta-card .rr-form .rr-next{width:100%;margin-bottom:0;cursor:pointer}',
    '.rr-steps .rr-submit[hidden],.rr-steps .rr-next[hidden]{display:none}',
    /* agradecimiento */
    '.cta-card.rr-sent > :not(.rr-thanks){display:none}',
    '.rr-thanks{display:none;text-align:center;padding:18px 4px 6px;outline:none}',
    '.cta-card.rr-sent .rr-thanks{display:block}',
    '.rr-check{width:72px;height:72px;margin:0 auto 18px;display:block}',
    '.rr-check circle{fill:none;stroke:var(--rr-blue,#0040ff);stroke-width:3;stroke-dasharray:152;stroke-dashoffset:152;animation:rrDraw .6s ease-out forwards}',
    '.rr-check path{fill:none;stroke:var(--rr-blue,#0040ff);stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:40;stroke-dashoffset:40;animation:rrDraw .35s .5s ease-out forwards}',
    '.rr-thanks h3{font-size:1.35rem;font-weight:800;letter-spacing:-.01em;margin-bottom:8px;opacity:0;animation:rrUp .45s .7s ease-out forwards}',
    '.cta-card .rr-thanks .rr-thanks-txt{color:var(--rr-gray-700,#4a4a4a);font-size:.95rem;line-height:1.5;margin:0 0 18px;opacity:0;animation:rrUp .45s .8s ease-out forwards}',
    '.rr-again{font:600 .88rem/1 inherit;font-family:inherit;color:var(--rr-blue,#0040ff);background:none;border:0;cursor:pointer;text-decoration:underline;text-underline-offset:3px;opacity:0;animation:rrUp .45s .9s ease-out forwards}',
    '@keyframes rrDraw{to{stroke-dashoffset:0}}',
    '@keyframes rrUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}',
    '@media (prefers-reduced-motion:reduce){.rr-check circle,.rr-check path{animation:none;stroke-dashoffset:0}.rr-thanks h3,.cta-card .rr-thanks .rr-thanks-txt,.rr-again{animation:none;opacity:1}}'
  ].join('\n');

  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function track() {
    try { if (window.fbq) window.fbq('track', 'Lead'); } catch (e) {}
    try { if (window.gtag) window.gtag('event', 'generate_lead', { form_location: 'contacto' }); } catch (e) {}
  }

  function enhance(form) {
    var card = form.closest('.cta-card');
    var fields = Array.prototype.slice.call(form.querySelectorAll('.rr-field'));
    var submit = form.querySelector('.rr-submit');
    var status = form.querySelector('.rr-form-status');
    if (!card || fields.length < 2 || !submit) return;

    var ctrl = function (i) { return fields[i].querySelector('input,textarea,select'); };
    var label = function (i) { return (fields[i].querySelector('label') || {}).textContent || ''; };
    var cur = 0;
    var done = fields.map(function () { return false; });

    form.classList.add('rr-steps');

    var count = document.createElement('div');
    count.className = 'rr-step-count';
    count.setAttribute('aria-live', 'polite');
    var list = document.createElement('div');
    list.className = 'rr-done';
    fields[0].parentNode.insertBefore(count, fields[0]);
    fields[0].parentNode.insertBefore(list, fields[0]);

    var next = document.createElement('button');
    next.type = 'button';
    next.className = 'btn btn-primary rr-next';
    next.innerHTML = 'Siguiente →';
    submit.parentNode.insertBefore(next, submit);

    var thanks = document.createElement('div');
    thanks.className = 'rr-thanks';
    thanks.setAttribute('tabindex', '-1');
    card.appendChild(thanks);

    function firstPending() {
      for (var i = 0; i < fields.length; i++) if (!done[i]) return i;
      return fields.length - 1;
    }

    function render(focus) {
      fields.forEach(function (f, i) { f.hidden = i !== cur; });
      var last = cur === fields.length - 1;
      next.hidden = last;
      submit.hidden = !last;
      count.textContent = 'Paso ' + (cur + 1) + ' de ' + fields.length;
      list.innerHTML = fields.map(function (f, i) {
        if (i === cur || !done[i]) return '';
        return '<div class="rr-done-row"><span class="rr-done-txt"><span class="rr-done-label">' + esc(label(i)) +
          '</span><span class="rr-done-val">' + esc(ctrl(i).value) + '</span></span>' +
          '<button type="button" class="rr-done-edit" data-i="' + i + '" aria-label="Cambiar ' + esc(label(i).toLowerCase()) + '">Cambiar</button></div>';
      }).join('');
      if (focus) { try { ctrl(cur).focus({ preventScroll: true }); } catch (e) { ctrl(cur).focus(); } }
    }

    function advance() {
      var c = ctrl(cur);
      c.value = c.value.trim() ? c.value : '';
      if (!c.checkValidity()) { c.reportValidity(); return; }
      done[cur] = true;
      cur = firstPending();
      render(true);
    }

    next.addEventListener('click', advance);
    form.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && cur < fields.length - 1) { e.preventDefault(); advance(); }
    });
    list.addEventListener('click', function (e) {
      var b = e.target.closest('.rr-done-edit');
      if (!b) return;
      cur = +b.getAttribute('data-i');
      render(true);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // valida todo: si algo quedó mal, vuelve a ese paso
      for (var i = 0; i < fields.length; i++) {
        if (!ctrl(i).checkValidity()) { done[i] = false; cur = i; render(true); ctrl(i).reportValidity(); return; }
      }
      var original = submit.innerHTML;
      submit.disabled = true; submit.textContent = 'Enviando…';
      status.textContent = ''; status.className = 'rr-form-status';
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
      }).then(function (r) {
        if (!r.ok) throw new Error('http');
        var nombre = (form.querySelector('[name="nombre"]') || {}).value || '';
        nombre = nombre.trim().split(/\s+/)[0];
        thanks.innerHTML =
          '<svg class="rr-check" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M15 27l7.5 7.5L37 19"/></svg>' +
          '<h3>¡Gracias' + (nombre ? ', ' + esc(nombre) : '') + '!</h3>' +
          '<p class="rr-thanks-txt">Recibimos tu consulta. Te respondemos en el día.</p>' +
          '<button type="button" class="rr-again">Enviar otra consulta</button>';
        card.classList.add('rr-sent');
        thanks.focus({ preventScroll: true });
        form.reset();
        done = done.map(function () { return false; });
        cur = 0;
        render(false);
        track();
      }).catch(function () {
        status.textContent = 'No pudimos enviar la consulta. Probá de nuevo o escribinos por WhatsApp.';
        status.classList.add('err');
      }).finally(function () { submit.disabled = false; submit.innerHTML = original; });
    });

    thanks.addEventListener('click', function (e) {
      if (!e.target.closest('.rr-again')) return;
      card.classList.remove('rr-sent');
      thanks.innerHTML = '';
      render(true);
    });

    render(false);
  }

  function init() {
    var forms = document.querySelectorAll('.cta-card .rr-form');
    if (!forms.length) return;
    var st = document.createElement('style');
    st.id = 'rr-contacto-style';
    st.textContent = CSS;
    document.head.appendChild(st);
    Array.prototype.forEach.call(forms, enhance);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
