/* =============================================================================
   ROCKET ROOM — COTIZADOR POR PASOS (componente compartido)

   Uso en una página:
     <div id="cotizador-mount" data-espacio="oficina"></div>
     <script src="/cotizador.js" defer></script>

   data-espacio (opcional) → data-solo del cotizador:
     sin valor  → arranca preguntando para quién es (home)
     "cowork"   → solo "Para mí" y "Para mi equipo" (/cowork/)
     "oficina"  → arranca directo en oficinas (/oficinas/)

   Los precios viven en el objeto P, dentro del script de abajo.
   La modalidad Flexible de la cuenta de equipo NO se publica (flexible.mostrar: false).

   Netlify Forms: el form "cotizacion" se arma por JS; en index.html hay una copia
   estática oculta con los mismos campos para que Netlify lo registre en el deploy.
   ============================================================================= */
(function () {
  'use strict';
  var mount = document.getElementById('cotizador-mount');
  if (!mount) return;

  if (!document.getElementById('rrw-style')) {
    var st = document.createElement('style');
    st.id = 'rrw-style';
    st.textContent = ".rrw{\n  --rrw-ink:#0a0a0a;\n  --rrw-ink-soft:#4a4a4a;\n  --rrw-mute:#6b6b70;\n  --rrw-line:#e6e6e6;\n  --rrw-paper:#f5f5f5;\n  --rrw-card:#ffffff;\n  --rrw-blue:#0040ff;\n  --rrw-blue-dark:#0033cc;\n  --rrw-blue-soft:#eef2ff;\n  --rrw-orange:#ff5722;\n  --rrw-font:'Poppins',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;\n  /* Layout: una pregunta por pantalla dentro de una sola tarjeta; el precio final sale en un \"ticket\" negro. */\n  display:block;font-family:var(--rrw-font);color:var(--rrw-ink);background:var(--rrw-paper);\n  line-height:1.55;padding:56px 0 64px;-webkit-font-smoothing:antialiased;color-scheme:light;\n}\n.rrw *{box-sizing:border-box}\n.rrw [hidden]{display:none !important}\n.rrw button{font-family:inherit}\n.rrw-wrap{max-width:880px;margin:0 auto;padding-inline:clamp(16px,4vw,40px);display:flex;flex-direction:column;gap:20px}\n\n/* cabecera */\n.rrw-head{display:flex;flex-direction:column;gap:8px;max-width:62ch}\n.rrw-h{margin:0;font-size:clamp(1.8rem,4.4vw,2.6rem);font-weight:800;letter-spacing:-.02em;line-height:1.08;text-wrap:balance}\n.rrw-lead{margin:0;color:var(--rrw-ink-soft);font-size:1.02rem}\n\n/* tarjeta del asistente */\n.rrw-card{background:var(--rrw-card);border:2px solid var(--rrw-line);border-radius:4px}\n.rrw-top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 24px 12px}\n.rrw-back{background:none;border:0;padding:4px 0;color:var(--rrw-ink-soft);font-weight:600;font-size:.9rem;cursor:pointer}\n.rrw-back:hover{color:var(--rrw-ink)}\n.rrw-back[data-off]{visibility:hidden}\n.rrw-count{font-size:.74rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--rrw-mute)}\n.rrw-bar{display:flex;gap:4px;padding:0 24px}\n.rrw-bar:empty{display:none}\n.rrw-bar i{flex:1;height:4px;background:var(--rrw-line);border-radius:2px}\n.rrw-bar i.on{background:var(--rrw-blue)}\n.rrw-trail{display:flex;flex-wrap:wrap;gap:8px;padding:16px 24px 0}\n.rrw-trail:empty{display:none}\n.rrw-chip{display:inline-flex;align-items:center;gap:6px;background:var(--rrw-paper);border:2px solid transparent;border-radius:4px;padding:4px 10px;font-size:.8rem;font-weight:600;color:var(--rrw-ink);cursor:pointer}\n.rrw-chip:hover{border-color:var(--rrw-ink)}\n.rrw-chip svg{width:12px;height:12px;color:var(--rrw-mute);flex:none}\n.rrw-stage{padding:24px 24px 28px}\n.rrw-stage.rrw-in{animation:rrwIn .28s cubic-bezier(.2,.7,.2,1) both}\n@keyframes rrwIn{from{opacity:.2;transform:translateY(8px)}to{opacity:1;transform:none}}\n@media (prefers-reduced-motion:reduce){.rrw-stage.rrw-in{animation:none}}\n.rrw-q{margin:0 0 6px;font-size:clamp(1.3rem,3vw,1.6rem);font-weight:800;letter-spacing:-.02em;line-height:1.2;text-wrap:balance}\n.rrw-q:focus,.rrw-ticket-t:focus{outline:none}\n.rrw-hint{margin:0 0 20px;color:var(--rrw-mute);font-size:.94rem;max-width:62ch}\n.rrw-aside{margin:16px 0 0;font-size:.88rem;color:var(--rrw-ink-soft)}\n.rrw-sublbl{margin:24px 0 8px;font-size:.7rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--rrw-mute)}\n.rrw-link{background:none;border:0;padding:0;color:var(--rrw-blue);font-weight:600;font-size:inherit;cursor:pointer;text-decoration:underline;text-underline-offset:3px}\n.rrw-link:hover{color:var(--rrw-blue-dark)}\n\n/* paso 1: para qui\u00e9n */\n.rrw-tipos{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}\n.rrw-tipos[data-n=\"2\"]{grid-template-columns:repeat(2,minmax(0,1fr))}\n.rrw-tipo{display:flex;flex-direction:column;align-items:flex-start;gap:6px;text-align:left;background:var(--rrw-card);color:var(--rrw-ink);border:2px solid var(--rrw-line);border-radius:4px;padding:18px;cursor:pointer;transition:border-color .15s,transform .15s}\n.rrw-tipo:hover{border-color:var(--rrw-ink);transform:translateY(-2px)}\n.rrw-tipo[aria-pressed=\"true\"]{border-color:var(--rrw-blue);background:var(--rrw-blue-soft)}\n.rrw-glyph{width:64px;height:32px;color:var(--rrw-blue);margin-bottom:8px}\n.rrw-kick{font-size:.66rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--rrw-mute)}\n.rrw-tipo b{font-size:1.15rem;font-weight:800;letter-spacing:-.01em;line-height:1.2}\n.rrw-desc{font-size:.88rem;color:var(--rrw-ink-soft);line-height:1.45}\n.rrw-desde{align-self:stretch;margin-top:auto;padding-top:12px;border-top:2px solid var(--rrw-line);font-size:.85rem;color:var(--rrw-ink-soft)}\n.rrw-tipo .rrw-desc{margin-bottom:10px}\n.rrw-desde strong{color:var(--rrw-ink);font-weight:700;font-variant-numeric:tabular-nums}\n@media(max-width:720px){\n  .rrw-tipos,.rrw-tipos[data-n=\"2\"]{grid-template-columns:minmax(0,1fr)}\n  .rrw-glyph{display:none}\n}\n\n/* listas de opciones con precio a la derecha */\n.rrw-list{display:flex;flex-direction:column;gap:8px}\n.rrw-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:16px;width:100%;text-align:left;background:var(--rrw-card);color:var(--rrw-ink);border:2px solid var(--rrw-line);border-radius:4px;padding:14px 18px;cursor:pointer;transition:border-color .15s}\n.rrw-row:hover{border-color:var(--rrw-ink)}\n.rrw-row[aria-pressed=\"true\"]{border-color:var(--rrw-blue);background:var(--rrw-blue-soft)}\n.rrw-row-t{display:block;font-weight:700;font-size:1rem;line-height:1.3}\n.rrw-row-d{display:block;font-size:.84rem;color:var(--rrw-mute);margin-top:2px;line-height:1.4}\n.rrw-row-p{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}\n.rrw-row-p strong{display:block;font-weight:800;font-size:1.05rem}\n.rrw-row-p strong small{font-size:.7rem;font-weight:600;color:var(--rrw-mute);margin-right:3px}\n.rrw-row-p > span{display:block;font-size:.76rem;color:var(--rrw-mute)}\n@media(max-width:480px){.rrw-row{padding:12px 14px;gap:10px}.rrw-row-p strong{font-size:.98rem}}\n\n/* n\u00fameros (personas de oficina) */\n.rrw-nums{display:flex;flex-wrap:wrap;gap:8px}\n.rrw-num{min-width:56px;height:56px;padding:0 14px;border:2px solid var(--rrw-line);border-radius:4px;background:var(--rrw-card);color:var(--rrw-ink);font-size:1.05rem;font-weight:700;cursor:pointer}\n.rrw-num:hover{border-color:var(--rrw-ink)}\n.rrw-num[aria-pressed=\"true\"]{background:var(--rrw-blue);border-color:var(--rrw-blue);color:#fff}\n.rrw-num--wide{font-size:.9rem}\n\n/* stepper */\n.rrw-stepper{display:inline-flex;align-items:stretch;border:2px solid var(--rrw-line);border-radius:4px;background:var(--rrw-card)}\n.rrw-stepper button{width:52px;border:0;background:var(--rrw-paper);color:var(--rrw-ink);font-size:1.4rem;font-weight:600;cursor:pointer}\n.rrw-stepper button:hover:not(:disabled){background:var(--rrw-line)}\n.rrw-stepper button:disabled{opacity:.35;cursor:not-allowed}\n.rrw-stepper output{min-width:96px;display:flex;align-items:center;justify-content:center;padding:10px 0;font-size:1.5rem;font-weight:800;font-variant-numeric:tabular-nums}\n.rrw-stepper input{width:110px;border:0;text-align:center;font:inherit;font-size:1.5rem;font-weight:800;color:inherit;background:transparent;font-variant-numeric:tabular-nums;-moz-appearance:textfield;appearance:textfield}\n.rrw-stepper input::-webkit-outer-spin-button,.rrw-stepper input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}\n.rrw-presets{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}\n.rrw-preset{border:2px solid var(--rrw-line);border-radius:4px;background:var(--rrw-card);padding:6px 12px;font-weight:600;font-size:.85rem;cursor:pointer;color:var(--rrw-ink);font-variant-numeric:tabular-nums}\n.rrw-preset:hover{border-color:var(--rrw-ink)}\n.rrw-preset[aria-pressed=\"true\"]{border-color:var(--rrw-blue);color:var(--rrw-blue)}\n\n/* d\u00edas y escalas de precio */\n.rrw-days{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;max-width:520px}\n.rrw-day{border:2px solid var(--rrw-line);border-radius:4px;background:var(--rrw-card);color:var(--rrw-ink);padding:14px 4px;font-weight:700;cursor:pointer}\n.rrw-day:hover{border-color:var(--rrw-ink)}\n.rrw-day[aria-pressed=\"true\"]{background:var(--rrw-blue);border-color:var(--rrw-blue);color:#fff}\n.rrw-tiers{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;max-width:520px}\n.rrw-tier{border:2px solid var(--rrw-line);border-radius:4px;padding:10px 12px;font-size:.88rem;line-height:1.35}\n.rrw-tier span{display:block;font-size:.76rem;color:var(--rrw-mute)}\n.rrw-tier strong{font-weight:800;font-variant-numeric:tabular-nums}\n.rrw-tier.on{border-color:var(--rrw-blue);background:var(--rrw-blue-soft)}\n\n/* pie con estimado y bot\u00f3n */\n.rrw-foot{position:sticky;bottom:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px 20px;flex-wrap:wrap;padding:14px 24px;border-top:2px solid var(--rrw-line);background:var(--rrw-card);border-radius:0 0 4px 4px}\n.rrw-est{margin:0;font-size:.92rem;color:var(--rrw-ink-soft);font-variant-numeric:tabular-nums}\n.rrw-est strong{color:var(--rrw-ink);font-weight:800;font-size:1.08rem}\n.rrw-foot .rrw-btn{margin-left:auto}\n\n/* botones */\n.rrw-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-weight:700;font-size:.95rem;padding:13px 22px;border-radius:4px;border:2px solid transparent;cursor:pointer;text-decoration:none;line-height:1.1;text-align:center;transition:background .15s,border-color .15s,color .15s}\n.rrw-btn--primary{background:var(--rrw-blue);color:#fff}\n.rrw-btn--primary:hover{background:var(--rrw-blue-dark)}\n.rrw-btn--primary:disabled{opacity:.4;cursor:not-allowed}\n.rrw-btn--ghost{background:transparent;color:var(--rrw-ink);border-color:var(--rrw-ink)}\n.rrw-btn--ghost:hover{background:var(--rrw-ink);color:#fff}\n.rrw button:focus-visible,.rrw a:focus-visible,.rrw input:focus-visible,.rrw textarea:focus-visible{outline:3px solid var(--rrw-orange);outline-offset:2px}\n\n/* resultado */\n.rrw-ticket{background:var(--rrw-ink);color:#fff;border-radius:4px;padding:24px 26px;display:flex;flex-direction:column;gap:4px}\n.rrw-ticket-plan{font-size:.7rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#9db3ff}\n.rrw-ticket-t{margin:6px 0 0;font-size:1.2rem;font-weight:700;line-height:1.3;letter-spacing:-.01em}\n.rrw-ticket-s{margin:0;color:rgba(255,255,255,.72);font-size:.92rem}\n.rrw-amount{display:flex;align-items:baseline;flex-wrap:wrap;gap:4px 10px;margin-top:14px;padding-top:16px;border-top:1px solid rgba(255,255,255,.16)}\n.rrw-amount strong{font-size:clamp(2.2rem,6vw,3.2rem);font-weight:800;letter-spacing:-.03em;line-height:1;font-variant-numeric:tabular-nums}\n.rrw-amount span{font-size:1rem;color:rgba(255,255,255,.7);font-weight:500}\n.rrw-tax{margin:8px 0 0;font-size:.8rem;color:rgba(255,255,255,.62);font-variant-numeric:tabular-nums}\n.rrw-tax-medida{font-size:.92rem;color:rgba(255,255,255,.8)}\n.rrw-save{margin:10px 0 0;font-size:.9rem;font-weight:700;color:var(--rrw-orange);font-variant-numeric:tabular-nums}\n.rrw-rows{margin:20px 0 0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 28px}\n.rrw-rows div{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:10px 0;border-top:1px solid var(--rrw-line)}\n.rrw-rows dt{color:var(--rrw-mute);font-size:.88rem}\n.rrw-rows dd{margin:0;font-weight:600;font-size:.92rem;text-align:right;font-variant-numeric:tabular-nums}\n@media(max-width:640px){.rrw-rows{grid-template-columns:minmax(0,1fr)}}\n.rrw-notes{margin:16px 0 0;padding-left:18px;display:flex;flex-direction:column;gap:4px;color:var(--rrw-ink-soft);font-size:.86rem;max-width:68ch}\n.rrw-ctas{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}\n.rrw-ctas .rrw-btn{flex:1 1 220px}\n.rrw-mini{display:flex;flex-wrap:wrap;gap:8px 24px;margin-top:14px;font-size:.88rem}\n.rrw-copybox{display:block;width:100%;margin-top:12px;padding:12px;border:2px solid var(--rrw-line);border-radius:4px;font:inherit;font-size:.86rem;color:var(--rrw-ink);background:var(--rrw-paper);resize:vertical}\n\n/* formulario */\n.rrw-form{margin-top:24px;padding-top:24px;border-top:2px solid var(--rrw-line)}\n.rrw-form h4{margin:0 0 4px;font-size:1.1rem;font-weight:800}\n.rrw-form > p{margin:0 0 18px;color:var(--rrw-mute);font-size:.9rem}\n.rrw-fields{display:grid;grid-template-columns:1fr 1fr;gap:14px}\n.rrw-field{display:flex;flex-direction:column;gap:6px;min-width:0}\n.rrw-field.full{grid-column:1/-1}\n.rrw-field label,.rrw-lbl{font-size:.72rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--rrw-ink-soft)}\n.rrw-opc{text-transform:none;letter-spacing:0;font-weight:400}\n.rrw-field input,.rrw-field textarea{font:inherit;font-size:.98rem;padding:12px 14px;border:2px solid var(--rrw-line);border-radius:4px;background:#fff;color:var(--rrw-ink);width:100%}\n.rrw-field input:focus,.rrw-field textarea:focus{outline:none;border-color:var(--rrw-blue)}\n.rrw-fdays{display:flex;flex-wrap:wrap;gap:8px}\n.rrw-fdays .rrw-day{padding:9px 14px}\n.rrw-msg{margin:12px 0 0;font-weight:600;color:var(--rrw-blue);font-size:.9rem}\n.rrw-hp{position:absolute !important;left:-9999px !important;width:1px;height:1px;overflow:hidden}\n@media(max-width:560px){.rrw-fields{grid-template-columns:1fr}}\n\n/* lista completa */\n.rrw-all{display:flex;flex-direction:column;gap:16px;margin-top:8px}\n.rrw-all-toggle{align-self:flex-start;background:none;border:0;border-bottom:2px solid var(--rrw-blue);color:var(--rrw-blue);font-weight:700;font-size:.95rem;padding:0 0 2px;cursor:pointer}\n.rrw-all-toggle:hover{color:var(--rrw-blue-dark);border-color:var(--rrw-blue-dark)}\n.rrw-tabs{display:flex;flex-wrap:wrap;gap:8px}\n.rrw-tabs button{border:2px solid var(--rrw-line);background:var(--rrw-card);color:var(--rrw-ink-soft);border-radius:4px;padding:8px 16px;font-weight:600;font-size:.86rem;cursor:pointer}\n.rrw-tabs button[aria-selected=\"true\"]{background:var(--rrw-blue);border-color:var(--rrw-blue);color:#fff}\n.rrw-tablewrap{overflow-x:auto;border:2px solid var(--rrw-line);border-radius:4px;background:var(--rrw-card)}\n.rrw-table{width:100%;border-collapse:collapse;font-size:.9rem;min-width:480px}\n.rrw-table th,.rrw-table td{text-align:left;padding:11px 16px;border-bottom:1px solid var(--rrw-line)}\n.rrw-table thead th{font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:var(--rrw-mute);font-weight:700;background:#fafafa}\n.rrw-table tbody tr:last-child td{border-bottom:0}\n.rrw-table td.n{text-align:right;font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}\n.rrw-table td.r{text-align:right;color:var(--rrw-mute);font-size:.82rem;white-space:nowrap}\n.rrw-table tr.g td{background:var(--rrw-ink);color:#fff;font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;font-weight:700}\n.rrw-legal{margin:0;font-size:.8rem;color:var(--rrw-mute)}\n\n@media(max-width:560px){\n  .rrw{padding:36px 0 48px}\n  .rrw-top,.rrw-trail,.rrw-stage,.rrw-foot{padding-left:16px;padding-right:16px}\n  .rrw-bar{padding:0 16px}\n  .rrw-ticket{padding:20px}\n}\n";
    document.head.appendChild(st);
  }

  var tmp = document.createElement('div');
  tmp.innerHTML = "<section class=\"rrw\" id=\"cotizador\" data-solo=\"\">\n  <div class=\"rrw-wrap\">\n    <header class=\"rrw-head\">\n      <h2 class=\"rrw-h\">Armá tu plan en Rocket Room</h2>\n      <p class=\"rrw-lead\">Respondé un par de preguntas y te mostramos el precio final, con IVA incluido.</p>\n    </header>\n\n    <div class=\"rrw-card\">\n      <div class=\"rrw-top\">\n        <button type=\"button\" class=\"rrw-back\" data-back data-k=\"back\">← Volver</button>\n        <span class=\"rrw-count\" data-count>Paso 1</span>\n      </div>\n      <div class=\"rrw-bar\" data-bar aria-hidden=\"true\"></div>\n      <div class=\"rrw-trail\" data-trail></div>\n      <div class=\"rrw-stage\" data-stage></div>\n      <div class=\"rrw-foot\" data-foot hidden>\n        <p class=\"rrw-est\" data-est aria-live=\"polite\"></p>\n        <button type=\"button\" class=\"rrw-btn rrw-btn--primary\" data-next data-k=\"next\">Siguiente</button>\n      </div>\n    </div>\n\n    <div class=\"rrw-all\">\n      <button type=\"button\" class=\"rrw-all-toggle\" data-all-toggle aria-expanded=\"false\" aria-controls=\"rrw-all-body\">Ver la lista completa de precios</button>\n      <div id=\"rrw-all-body\" data-all-body hidden>\n        <div class=\"rrw-tabs\" role=\"tablist\" aria-label=\"Lista de precios\">\n          <button type=\"button\" role=\"tab\" data-tab=\"ind\" aria-selected=\"true\">Individual</button>\n          <button type=\"button\" role=\"tab\" data-tab=\"eq\" aria-selected=\"false\">Cuenta de equipo</button>\n          <button type=\"button\" role=\"tab\" data-tab=\"of4\" aria-selected=\"false\">Oficina 4 personas</button>\n          <button type=\"button\" role=\"tab\" data-tab=\"of6\" aria-selected=\"false\">Oficina 6 personas</button>\n        </div>\n        <div data-tabpanel=\"ind\"></div>\n        <div data-tabpanel=\"eq\" hidden></div>\n        <div data-tabpanel=\"of4\" hidden></div>\n        <div data-tabpanel=\"of6\" hidden></div>\n      </div>\n    </div>\n\n    <p class=\"rrw-legal\">Precios finales con IVA incluido. Lista vigente desde el <span data-actualizado></span>. Sujeto a disponibilidad.</p>\n  </div>\n</section>";
  var sec = tmp.firstElementChild;
  var pre = mount.getAttribute('data-espacio');
  sec.setAttribute('data-solo', pre === 'cowork' || pre === 'oficina' ? pre : '');
  mount.parentNode.replaceChild(sec, mount);

  /* En mobile la barra inferior del cotizador (Siguiente / precio) es sticky:
     mientras la tarjeta está en pantalla, el WhatsApp flotante sube por encima. */
  var lift = document.createElement('style');
  lift.textContent = '.float-wa{transition:transform .2s ease,bottom .25s ease}' +
    '@media(max-width:1000px){body.rrw-in-view .float-wa{bottom:calc(var(--rrw-foot-h,76px) + 14px)}}';
  document.head.appendChild(lift);
  var card = sec.querySelector('.rrw-card');
  if (card && window.IntersectionObserver) {
    new IntersectionObserver(function (en) {
      var foot = sec.querySelector('.rrw-foot');
      if (foot && foot.offsetHeight) document.body.style.setProperty('--rrw-foot-h', foot.offsetHeight + 'px');
      document.body.classList.toggle('rrw-in-view', en[0].isIntersecting && !!(foot && foot.offsetHeight));
    }, { threshold: 0 }).observe(card);
  }
})();
(function () {
  'use strict';

  /* =====================================================================
     PRECIOS · ÚNICO BLOQUE A EDITAR CUANDO CAMBIA LA LISTA
     Importes finales CON IVA. Copiados de /cotizador.js del sitio.
     ===================================================================== */
  var P = {
    actualizado: '01/09/2026',
    whatsapp: '5491141577861',
    reservas: 'https://reservas.rocketroom.com.ar',
    iva: 0.21,
    semanasPorMes: 4.33,
    diasUsoPaseLibre: 16,

    cowork: {
      dia:   { nombre: 'Pase por día',    frec: 'Un día suelto',      accesos: 1,  precio: 32500 },
      p4:    { nombre: 'Pack 4 accesos',  frec: '1 vez por semana',   accesos: 4,  precio: 115000 },
      p8:    { nombre: 'Pack 8 accesos',  frec: '2 veces por semana', accesos: 8,  precio: 205000 },
      p12:   { nombre: 'Pack 12 accesos', frec: '3 veces por semana', accesos: 12, precio: 270000 },
      libre: { nombre: 'Pase libre',      frec: 'Todos los días',     accesos: 0,  precio: 315000 }
    },

    /* Cuenta de equipo en el espacio compartido. porAcceso: precio por acceso
       según los días por semana (4 y 5 pagan lo mismo que 3).
       flexible.mostrar: en false se esconde la modalidad Flexible del sitio. */
    equipo: {
      minPuestos: 3,
      maxPuestos: 10,
      porAcceso: { 1: 20000, 2: 18500, 3: 17000, 4: 17000, 5: 17000 },
      flexible: { mostrar: false, porCredito: 22500, minCreditos: 10, maxCreditos: 200 }
    },

    /* De menor a mayor capacidad: ese orden decide qué oficina le toca a cada equipo. */
    oficinas: {
      of4: { nombre: 'Oficina para 4 personas', capacidad: 4, m2: '10,5', media: 99000, jornada: 156000,
             memMedia: { 1: 270000, 2: 475000, 3: 630000 }, memJornada: { 1: 500000, 2: 860000, 3: 1140000 } },
      of6: { nombre: 'Oficina para 6 personas', capacidad: 6, m2: '13', media: 130000, jornada: 205000,
             memMedia: { 1: 355000, 2: 620000, 3: 830000 }, memJornada: { 1: 650000, 2: 1130000, 3: 1490000 } }
    }
  };
  /* ================= FIN DEL BLOQUE DE PRECIOS ================= */

  var root = document.getElementById('cotizador');
  if (!root) return;

  var C = P.cowork, E = P.equipo, F = P.equipo.flexible;
  var FLEX = !!F.mostrar;
  var OF_KEYS = Object.keys(P.oficinas);
  var MAX_OF = Math.max.apply(null, OF_KEYS.map(function (k) { return P.oficinas[k].capacidad; }));
  var MIN_ACCESO = Math.min.apply(null, Object.keys(E.porAcceso).map(function (k) { return E.porAcceso[k]; }));
  var MIN_OFICINA = Math.min.apply(null, OF_KEYS.map(function (k) { return P.oficinas[k].media; }));
  var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var solo = root.getAttribute('data-solo') || '';

  var DIAS = [
    { id: 'lun', c: 'Lun', n: 'lunes' }, { id: 'mar', c: 'Mar', n: 'martes' },
    { id: 'mie', c: 'Mié', n: 'miércoles' }, { id: 'jue', c: 'Jue', n: 'jueves' },
    { id: 'vie', c: 'Vie', n: 'viernes' }
  ];
  var HORARIO = { manana: 'de 9 a 13 h', tarde: 'de 14 a 18 h', completa: 'de 8 a 20 h' };

  /* ---------------------------------------------------------------- helpers */
  function q(s) { return root.querySelector(s); }
  function qa(s) { return Array.prototype.slice.call(root.querySelectorAll(s)); }
  function money(n) { return '$' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function dec(n) { return String(n).replace('.', ','); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function lista(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1]; }
  function veces(n) { return n === 1 ? '1 vez por semana' : n + ' veces por semana'; }
  function diasSem(n) { return n === 1 ? '1 día por semana' : n + ' días por semana'; }
  function personas(n) { return n + (n === 1 ? ' persona' : ' personas'); }
  function dia(id) { for (var i = 0; i < DIAS.length; i++) if (DIAS[i].id === id) return DIAS[i]; }
  function ordenarDias(a) { return DIAS.map(function (d) { return d.id; }).filter(function (id) { return a.indexOf(id) !== -1; }); }
  function accesosEq(n, d) { return Math.round(n * d * P.semanasPorMes); }
  function oficinaKey(n) {
    for (var i = 0; i < OF_KEYS.length; i++) if (P.oficinas[OF_KEYS[i]].capacidad >= n) return OF_KEYS[i];
    return OF_KEYS[OF_KEYS.length - 1];
  }
  function rangoOficina(k) {
    var i = OF_KEYS.indexOf(k), hi = P.oficinas[k].capacidad;
    var lo = i === 0 ? 1 : P.oficinas[OF_KEYS[i - 1]].capacidad + 1;
    if (lo === 1) return 'Hasta ' + hi + ' personas';
    if (hi === lo) return hi + ' personas';
    return lo + (hi - lo === 1 ? ' o ' : ' a ') + hi + ' personas';
  }
  function ahorro(bruto, total, frente) {
    var m = bruto - total;
    return m > 0 ? { monto: m, pct: Math.round(m / bruto * 100), frente: frente } : null;
  }
  function track(evt, data) {
    var d = data || {};
    try { if (window.gtag) window.gtag('event', 'cotizador_' + evt, Object.assign({ event_category: 'cotizador' }, d)); } catch (e) {}
    try { if (window.fbq) window.fbq('trackCustom', 'Cotizador_' + evt, d); } catch (e) {}
  }

  var GLYPH = {
    individual: '<svg class="rrw-glyph" viewBox="0 0 64 32" aria-hidden="true"><rect x="2" y="9" width="14" height="14" rx="2" fill="currentColor"/></svg>',
    equipo: '<svg class="rrw-glyph" viewBox="0 0 64 32" aria-hidden="true"><rect x="2" y="10" width="12" height="12" rx="2" fill="currentColor"/><rect x="18" y="10" width="12" height="12" rx="2" fill="currentColor"/><rect x="34" y="10" width="12" height="12" rx="2" fill="currentColor"/><rect x="50" y="10" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    oficina: '<svg class="rrw-glyph" viewBox="0 0 64 32" aria-hidden="true"><path d="M27 30H3V2h58v28H37" fill="none" stroke="currentColor" stroke-width="2.5"/><rect x="18" y="8" width="11" height="6" rx="1" fill="currentColor"/><rect x="35" y="8" width="11" height="6" rx="1" fill="currentColor"/><rect x="18" y="17" width="11" height="6" rx="1" fill="currentColor"/><rect x="35" y="17" width="11" height="6" rx="1" fill="currentColor"/></svg>'
  };
  var LAPIZ = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M8.5 1.5l2 2L4 10H2V8z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>';

  /* ------------------------------------------------------------------ estado */
  function estadoInicial() {
    return {
      paso: 0,
      tipo: solo === 'oficina' ? 'oficina' : null,   // individual | equipo | oficina
      ind: null,                                     // dia | p4 | p8 | p12 | libre
      eqMod: FLEX ? null : 'fijos',                  // fijos | flex
      eqPuestos: 4,
      eqMedida: false,
      eqDias: [],
      eqCreditos: 20,
      ofPersonas: null,                              // 1..MAX_OF, o MAX_OF+1 = a medida
      ofFrec: null,                                  // dia | 1 | 2 | 3 | 4 (4 o 5 días = a medida)
      ofJornada: null,                               // manana | tarde | completa
      form: false,
      diasForm: []
    };
  }
  var st = estadoInicial();

  /* Pasos de cada camino. Los valores todavía sin elegir se tratan como el
     camino típico, así el contador "Paso X de N" no salta de golpe. */
  function flujo() {
    var f = [];
    if (solo !== 'oficina') f.push('tipo');
    if (st.tipo === 'individual') f.push('ind-frec');
    else if (st.tipo === 'equipo') {
      if (FLEX) f.push('eq-mod');
      if (st.eqMod === 'flex') f.push('eq-creditos');
      else { f.push('eq-puestos'); if (!st.eqMedida) f.push('eq-dias'); }
    } else if (st.tipo === 'oficina') {
      f.push('of-personas');
      if (!(st.ofPersonas > MAX_OF)) {
        f.push('of-frec');
        if (st.ofFrec !== '4') f.push('of-jornada');
      }
    }
    f.push('resultado');
    return f;
  }

  /* ------------------------------------------------------- piezas de interfaz */
  function fila(attr, val, t, d, precio, sub, on) {
    return '<button type="button" class="rrw-row" data-' + attr + '="' + val + '" data-k="' + attr + '-' + val + '" aria-pressed="' + on + '">' +
      '<span><span class="rrw-row-t">' + t + '</span><span class="rrw-row-d">' + d + '</span></span>' +
      '<span class="rrw-row-p"><strong>' + precio + '</strong>' + (sub ? '<span>' + sub + '</span>' : '') + '</span></button>';
  }
  function desde(n) { return '<small>desde</small>' + money(n); }

  /* ------------------------------------------------------------------ pasos */
  var PASOS = {
    'tipo': function () {
      var tipos = [
        { id: 'individual', kick: 'Cowork', t: 'Para mí', d: 'Un puesto en la planta abierta, por día o con un plan mensual.',
          desde: 'Desde <strong>' + money(C.dia.precio) + '</strong> el día' },
        { id: 'equipo', kick: 'Cowork', t: 'Para mi equipo', d: 'Puestos para ' + E.minPuestos + ' a ' + E.maxPuestos + ' personas en el espacio compartido, con una sola factura por mes.',
          desde: 'Desde <strong>' + money(MIN_ACCESO) + '</strong> por acceso' },
        { id: 'oficina', kick: 'Oficinas', t: 'Oficina privada', d: 'Oficinas para ' + OF_KEYS.map(function (k) { return P.oficinas[k].capacidad; }).join(' y ') + ' personas, a puerta cerrada, por día o con membresía.',
          desde: 'Desde <strong>' + money(MIN_OFICINA) + '</strong> la media jornada' }
      ].filter(function (x) { return solo !== 'cowork' || x.id !== 'oficina'; });
      return {
        t: '¿Para quién es el espacio?',
        h: 'Elegí una opción y seguimos con un par de preguntas más.',
        html: '<div class="rrw-tipos" data-n="' + tipos.length + '">' + tipos.map(function (x) {
          return '<button type="button" class="rrw-tipo" data-tipo="' + x.id + '" data-k="tipo-' + x.id + '" aria-pressed="' + (st.tipo === x.id) + '">' +
            GLYPH[x.id] + '<span class="rrw-kick">' + x.kick + '</span><b>' + x.t + '</b><span class="rrw-desc">' + x.d + '</span>' +
            '<span class="rrw-desde">' + x.desde + '</span></button>';
        }).join('') + '</div>',
        auto: true, listo: st.tipo !== null
      };
    },

    'ind-frec': function () {
      var rows = ['dia', 'p4', 'p8', 'p12', 'libre'].map(function (k) {
        var p = C[k], d, sub;
        if (k === 'dia') { d = 'Pase por día, sin compromiso mensual'; sub = 'por día'; }
        else if (k === 'libre') { d = 'Pase libre: venís todos los días que quieras'; sub = 'por mes'; }
        else { d = p.nombre + ' por mes'; sub = 'por mes · ' + money(p.precio / p.accesos) + ' el día'; }
        return fila('ind', k, p.frec, d, money(p.precio), sub, st.ind === k);
      }).join('');
      return {
        t: '¿Cada cuánto venís?',
        h: 'Todos los planes son por jornada completa, de 8 a 20 h, en la planta abierta.',
        html: '<div class="rrw-list">' + rows + '</div>' +
          '<p class="rrw-aside">¿Vienen dos? Cada persona toma su propio plan. Desde ' + E.minPuestos + ' personas conviene la ' +
          '<button type="button" class="rrw-link" data-ir-equipo data-k="ir-eq">cuenta de equipo</button>.</p>',
        auto: true, listo: !!st.ind
      };
    },

    'eq-mod': function () {
      return {
        t: '¿Cómo va a venir el equipo?',
        h: 'Un acceso es una jornada completa de una persona. La cuenta de equipo es desde ' + E.minPuestos + ' personas.',
        html: '<div class="rrw-list">' +
          fila('eqmod', 'fijos', 'Días fijos', 'El equipo viene siempre los mismos días. Es la opción de menor precio.', desde(MIN_ACCESO), 'por acceso', st.eqMod === 'fijos') +
          fila('eqmod', 'flex', 'Flexible', 'Créditos mensuales que usa cualquiera del equipo, el día que quiera.', money(F.porCredito), 'por crédito', st.eqMod === 'flex') +
          '</div>',
        auto: true, listo: st.eqMod !== null
      };
    },

    'eq-puestos': function () {
      var n = st.eqPuestos;
      return {
        t: '¿Cuántos puestos necesitan por día?',
        h: 'Los puestos no son nominados: puede venir cualquier persona del equipo, hasta completar los puestos de ese día.',
        html: '<div class="rrw-stepper" role="group" aria-label="Puestos por día">' +
          '<button type="button" data-puestos="-1" data-k="pm" aria-label="Un puesto menos"' + (n <= E.minPuestos ? ' disabled' : '') + '>−</button>' +
          '<output>' + n + '</output>' +
          '<button type="button" data-puestos="1" data-k="pp" aria-label="Un puesto más"' + (n >= E.maxPuestos ? ' disabled' : '') + '>+</button></div>' +
          '<p class="rrw-aside">¿Son más de ' + E.maxPuestos + '? <button type="button" class="rrw-link" data-eq-medida data-k="eqmed">Pedí una propuesta a medida</button>.</p>',
        auto: false, listo: true
      };
    },

    'eq-dias': function () {
      var d = st.eqDias.length;
      var days = DIAS.map(function (x) {
        return '<button type="button" class="rrw-day" data-dia="' + x.id + '" data-k="dia-' + x.id + '" aria-pressed="' + (st.eqDias.indexOf(x.id) !== -1) + '" aria-label="' + cap(x.n) + '">' + x.c + '</button>';
      }).join('');
      var tiers = [[1, '1 día por semana'], [2, '2 días por semana'], [3, '3 a 5 días por semana']].map(function (t) {
        var on = d > 0 && Math.min(d, 3) === t[0];
        return '<div class="rrw-tier' + (on ? ' on' : '') + '"><span>' + t[1] + '</span><strong>' + money(E.porAcceso[t[0]]) + '</strong></div>';
      }).join('');
      return {
        t: '¿Qué días vienen?',
        h: 'Elegí de 1 a 5 días. Desde 3 días por semana pagan el menor precio por acceso.',
        html: '<div class="rrw-days" role="group" aria-label="Días de la semana">' + days + '</div>' +
          '<p class="rrw-sublbl">Precio por acceso</p><div class="rrw-tiers">' + tiers + '</div>',
        auto: false, listo: d > 0
      };
    },

    'eq-creditos': function () {
      var c = st.eqCreditos;
      var presets = [10, 20, 40, 60, 100].filter(function (v) { return v >= F.minCreditos && v <= F.maxCreditos; });
      return {
        t: '¿Cuántos créditos por mes?',
        h: 'Un crédito es una jornada completa de una persona. Los usa cualquiera del equipo, el día que quiera, y vencen al cierre de cada mes.',
        html: '<div class="rrw-stepper" role="group" aria-label="Créditos por mes">' +
          '<button type="button" data-cred="-1" data-k="cm" aria-label="Un crédito menos"' + (c <= F.minCreditos ? ' disabled' : '') + '>−</button>' +
          '<input type="number" id="rrw-creditos" inputmode="numeric" min="' + F.minCreditos + '" max="' + F.maxCreditos + '" step="1" value="' + c + '" data-cred-input data-k="cin" aria-label="Créditos por mes">' +
          '<button type="button" data-cred="1" data-k="cp" aria-label="Un crédito más"' + (c >= F.maxCreditos ? ' disabled' : '') + '>+</button></div>' +
          '<div class="rrw-presets">' + presets.map(function (v) {
            return '<button type="button" class="rrw-preset" data-preset="' + v + '" data-k="pre-' + v + '" aria-pressed="' + (c === v) + '">' + v + '</button>';
          }).join('') + '</div>' +
          '<p class="rrw-aside">Referencia: 4 personas que vienen una vez por semana usan unos ' + accesosEq(4, 1) + ' créditos al mes.</p>',
        auto: false, listo: true
      };
    },

    'of-personas': function () {
      var nums = [];
      for (var n = 1; n <= MAX_OF; n++) {
        nums.push('<button type="button" class="rrw-num" data-ofp="' + n + '" data-k="ofp-' + n + '" aria-pressed="' + (st.ofPersonas === n) + '">' + n + '</button>');
      }
      nums.push('<button type="button" class="rrw-num rrw-num--wide" data-ofp="' + (MAX_OF + 1) + '" data-k="ofp-mas" aria-pressed="' + (st.ofPersonas > MAX_OF) + '">Más de ' + MAX_OF + '</button>');
      var sizes = OF_KEYS.map(function (k) {
        var O = P.oficinas[k], on = st.ofPersonas && st.ofPersonas <= MAX_OF && oficinaKey(st.ofPersonas) === k;
        return '<div class="rrw-tier' + (on ? ' on' : '') + '"><span>' + rangoOficina(k) + '</span><strong>' + O.nombre + '</strong> · ' + O.m2 + ' m²</div>';
      }).join('');
      return {
        t: '¿Cuántas personas van a usar la oficina?',
        h: 'Según cuántos sean, te asignamos la oficina que corresponde.',
        html: '<div class="rrw-nums" role="group" aria-label="Personas">' + nums.join('') + '</div>' +
          '<p class="rrw-sublbl">Nuestras oficinas</p><div class="rrw-tiers">' + sizes + '</div>',
        auto: true, listo: st.ofPersonas !== null
      };
    },

    'of-frec': function () {
      var O = P.oficinas[oficinaKey(st.ofPersonas)];
      var rows = fila('offrec', 'dia', 'Un día puntual', 'Sin compromiso mensual. Reservás y pagás online.', desde(O.media), 'por día', st.ofFrec === 'dia');
      [1, 2, 3].forEach(function (n) {
        rows += fila('offrec', String(n), cap(veces(n)), 'Membresía mensual · unas ' + Math.round(n * P.semanasPorMes) + ' jornadas al mes', desde(O.memMedia[n]), 'por mes', st.ofFrec === String(n));
      });
      rows += fila('offrec', '4', '4 o 5 veces por semana', 'Oficina full time: la cotizamos a medida', 'A medida', '', st.ofFrec === '4');
      return {
        t: '¿Con qué frecuencia la necesitan?',
        h: O.nombre + ' · ' + O.m2 + ' m² · equipo de ' + personas(st.ofPersonas) + '. Los precios son por la oficina completa.',
        html: '<div class="rrw-list">' + rows + '</div>',
        auto: true, listo: st.ofFrec !== null
      };
    },

    'of-jornada': function () {
      var O = P.oficinas[oficinaKey(st.ofPersonas)], puntual = st.ofFrec === 'dia', n = parseInt(st.ofFrec, 10);
      var pm = puntual ? O.media : O.memMedia[n], pj = puntual ? O.jornada : O.memJornada[n];
      var sub = puntual ? 'por día' : 'por mes';
      return {
        t: '¿Qué horario necesitan?',
        h: puntual ? 'Precio por el día, para todo el equipo.' : 'El mismo horario todas las semanas. El precio es por mes, para todo el equipo.',
        html: '<div class="rrw-list">' +
          fila('ofjor', 'manana', 'Media jornada de mañana', '4 horas, ' + HORARIO.manana, money(pm), sub, st.ofJornada === 'manana') +
          fila('ofjor', 'tarde', 'Media jornada de tarde', '4 horas, ' + HORARIO.tarde, money(pm), sub, st.ofJornada === 'tarde') +
          fila('ofjor', 'completa', 'Jornada completa', 'Todo el día, ' + HORARIO.completa, money(pj), sub, st.ofJornada === 'completa') +
          '</div>',
        auto: true, listo: st.ofJornada !== null
      };
    }
  };

  /* Texto de cada respuesta para los chips de arriba */
  function etiqueta(id) {
    switch (id) {
      case 'tipo': return { individual: 'Para mí', equipo: 'Para mi equipo', oficina: 'Oficina privada' }[st.tipo] || '';
      case 'ind-frec': return st.ind ? C[st.ind].frec : '';
      case 'eq-mod': return st.eqMod === 'flex' ? 'Flexible' : 'Días fijos';
      case 'eq-puestos': return st.eqMedida ? 'Más de ' + E.maxPuestos + ' puestos' : st.eqPuestos + ' puestos por día';
      case 'eq-dias': return st.eqDias.map(function (d) { return dia(d).c; }).join(' · ');
      case 'eq-creditos': return st.eqCreditos + ' créditos';
      case 'of-personas': return st.ofPersonas > MAX_OF ? 'Más de ' + MAX_OF + ' personas' : personas(st.ofPersonas);
      case 'of-frec': return st.ofFrec === 'dia' ? 'Un día puntual' : st.ofFrec === '4' ? '4 o 5 veces por semana' : veces(parseInt(st.ofFrec, 10));
      case 'of-jornada': return { manana: 'Media jornada, 9 a 13 h', tarde: 'Media jornada, 14 a 18 h', completa: 'Jornada completa' }[st.ofJornada] || '';
    }
    return '';
  }

  /* Estimado en vivo en el pie, para los pasos que se completan con más de un clic */
  function estimado(id) {
    if (id === 'eq-puestos') return 'Desde <strong>' + money(MIN_ACCESO) + '</strong> por acceso, según los días que vengan';
    if (id === 'eq-dias') {
      var d = st.eqDias.length;
      if (!d) return 'Elegí al menos un día para ver el precio';
      var acc = accesosEq(st.eqPuestos, d);
      return '<strong>' + money(acc * E.porAcceso[d]) + '</strong> por mes · ' + acc + ' accesos';
    }
    if (id === 'eq-creditos') {
      var c = clamp(st.eqCreditos, F.minCreditos, F.maxCreditos);
      return '<strong>' + money(c * F.porCredito) + '</strong> por mes · ' + c + ' créditos';
    }
    return '';
  }

  /* ------------------------------------------------------- motor de cotización */
  function cotizar() {
    var r, total;

    if (st.tipo === 'individual' && st.ind) {
      var p = C[st.ind];
      r = { plan: 'Plan individual · Espacio compartido', titulo: p.nombre, sub: p.frec + ' · jornada completa, ' + HORARIO.completa,
            total: p.precio, unidad: st.ind === 'dia' ? 'por día' : 'por mes', filas: [], notas: [], puntual: st.ind === 'dia' };
      if (st.ind === 'dia') {
        r.filas.push(['Uso', 'Un día, sin compromiso']);
        r.notas.push('Reservás el día y lo pagás online.');
      } else if (st.ind === 'libre') {
        r.filas.push(['Accesos', 'Todos los días hábiles']);
        r.filas.push(['Con ' + P.diasUsoPaseLibre + ' días de uso', money(p.precio / P.diasUsoPaseLibre) + ' por día']);
        r.ahorro = ahorro(P.diasUsoPaseLibre * C.dia.precio, p.precio, 'frente a ' + P.diasUsoPaseLibre + ' pases por día');
        r.notas.push('Lunes a viernes, de 8 a 20 h.');
      } else {
        r.filas.push(['Accesos', p.accesos + ' por mes']);
        r.filas.push(['Precio por acceso', money(p.precio / p.accesos)]);
        r.ahorro = ahorro(p.accesos * C.dia.precio, p.precio, 'frente a pagar cada día suelto');
        r.notas.push('Los accesos se usan dentro del mes y vencen a fin de mes.');
      }
      r.resumen = ['Plan individual (espacio compartido)', p.nombre + ' · ' + p.frec, 'Total: ' + money(p.precio) + ' ' + r.unidad + ' (IVA incluido)'];
      return r;
    }

    if (st.tipo === 'equipo') {
      var notasEq = [
        'Un único comprobante mensual para toda la empresa.',
        'El abono contempla los meses de cinco semanas, sin cargo extra.',
        'Los valores se actualizan junto con la lista general de precios.'
      ];

      if (st.eqMod === 'flex') {
        var c = clamp(st.eqCreditos, F.minCreditos, F.maxCreditos);
        total = c * F.porCredito;
        return {
          plan: 'Cuenta de equipo · Flexible', titulo: c + ' créditos por mes', sub: 'Para que use cualquiera del equipo, el día que quiera',
          total: total, unidad: 'por mes',
          filas: [['Precio por crédito', money(F.porCredito)], ['Un crédito', 'Una jornada completa'], ['Vigencia', 'Hasta el cierre del mes']],
          ahorro: ahorro(c * C.dia.precio, total, 'frente al pase por día'),
          notas: [notasEq[0], notasEq[2]],
          resumen: ['Cuenta de equipo · Flexible', c + ' créditos por mes a ' + money(F.porCredito), 'Total: ' + money(total) + ' por mes (IVA incluido)']
        };
      }

      if (st.eqMedida) {
        return {
          medida: true, plan: 'Cuenta de equipo', titulo: 'Más de ' + E.maxPuestos + ' puestos por día',
          texto: 'Para un equipo de ese tamaño armamos una propuesta a medida: podemos usar el espacio compartido en bloque o combinarlo con oficinas.',
          resumen: ['Cuenta de equipo para más de ' + E.maxPuestos + ' personas por día', 'Queremos una propuesta a medida.']
        };
      }

      var n = st.eqPuestos, d = st.eqDias.length, acc = accesosEq(n, d), pa = E.porAcceso[d];
      var indiv = d === 1 ? C.p4 : d === 2 ? C.p8 : d === 3 ? C.p12 : C.libre;
      var nombres = st.eqDias.map(function (x) { return dia(x).n; });
      total = acc * pa;
      var notas = [notasEq[0], notasEq[1], 'Pueden sumar personas por encima de los puestos contratados, según disponibilidad, al mismo valor del plan.'];
      if (FLEX) notas.push('Si vienen otros días, esos accesos se cobran al valor de la modalidad Flexible (' + money(F.porCredito) + ').');
      notas.push(notasEq[2]);
      return {
        plan: 'Cuenta de equipo · Días fijos', titulo: n + ' puestos · ' + diasSem(d), sub: cap(lista(nombres)),
        total: total, unidad: 'por mes',
        filas: [
          ['Accesos por mes', String(acc)],
          ['Precio por acceso', money(pa)],
          ['Por puesto', money(total / n) + ' al mes']
        ],
        ahorro: ahorro(n * indiv.precio, total, 'frente a ' + n + ' planes individuales'),
        notas: notas,
        resumen: ['Cuenta de equipo · Días fijos', n + ' puestos por día · ' + lista(nombres), acc + ' accesos por mes a ' + money(pa),
                  'Total: ' + money(total) + ' por mes (IVA incluido)']
      };
    }

    if (st.tipo === 'oficina' && st.ofPersonas !== null) {
      if (st.ofPersonas > MAX_OF) {
        return {
          medida: true, plan: 'Oficina privada', titulo: 'Equipo de más de ' + MAX_OF + ' personas',
          texto: 'Para equipos de más de ' + MAX_OF + ' personas armamos una propuesta combinando oficinas.',
          resumen: ['Oficina privada para un equipo de más de ' + MAX_OF + ' personas', 'Queremos una propuesta a medida.']
        };
      }
      var O = P.oficinas[oficinaKey(st.ofPersonas)], np = st.ofPersonas;
      var base = O.nombre + ' (' + O.m2 + ' m²)';
      if (st.ofFrec === '4') {
        return {
          medida: true, plan: 'Oficina privada · Full time', titulo: O.nombre + ' · 4 o 5 días por semana',
          texto: 'Las membresías llegan hasta 3 días por semana. Para 4 o 5 días cotizamos la oficina full time a medida.',
          resumen: ['Oficina privada: ' + base, 'Equipo de ' + personas(np) + ' · 4 o 5 días por semana', 'Queremos la cotización full time.']
        };
      }
      if (!st.ofFrec || !st.ofJornada) return null;
      var j = st.ofJornada === 'completa' ? 'jornada' : 'media';
      var nomJ = (j === 'media' ? 'Media jornada ' : 'Jornada completa ') + HORARIO[st.ofJornada];
      var filas = [['Oficina', O.m2 + ' m², hasta ' + personas(O.capacidad)], ['Equipo', personas(np)]];

      if (st.ofFrec === 'dia') {
        total = O[j];
        if (np > 1) filas.push(['Por persona', money(total / np)]);
        return {
          plan: 'Oficina privada · Uso puntual', titulo: O.nombre, sub: nomJ + ' · un día',
          total: total, unidad: j === 'media' ? 'la media jornada' : 'el día', filas: filas, puntual: true,
          notas: ['Reservás el día y lo pagás online.'],
          resumen: ['Oficina privada: ' + base, 'Equipo de ' + personas(np) + ' · ' + nomJ, 'Un día puntual', 'Total: ' + money(total) + ' (IVA incluido)']
        };
      }

      var nn = parseInt(st.ofFrec, 10), jm = nn * P.semanasPorMes;
      total = O[j === 'media' ? 'memMedia' : 'memJornada'][nn];
      filas.push([j === 'media' ? 'Por media jornada' : 'Por jornada', money(total / jm)]);
      if (np > 1) filas.push(['Por persona', money(total / np) + ' al mes']);
      return {
        plan: 'Oficina privada · Membresía', titulo: O.nombre, sub: nomJ + ' · ' + veces(nn),
        total: total, unidad: 'por mes', filas: filas,
        ahorro: ahorro(jm * O[j], total, 'frente a pagar cada jornada suelta'),
        notas: ['Mismo horario todas las semanas. Los días los coordinamos según disponibilidad.'],
        resumen: ['Oficina privada: ' + base, 'Equipo de ' + personas(np) + ' · ' + nomJ, 'Membresía ' + veces(nn), 'Total: ' + money(total) + ' por mes (IVA incluido)']
      };
    }
    return null;
  }

  function waLink(r) {
    var t = r.medida
      ? 'Hola! ' + r.resumen.join('\n')
      : 'Hola! Armé esta cotización en la web:\n\n' + r.resumen.join('\n') + '\n\n¿Hay disponibilidad?';
    return 'https://wa.me/' + P.whatsapp + '?text=' + encodeURIComponent(t);
  }

  function formHTML(r) {
    var conDias = !r.puntual && !(st.tipo === 'equipo' && st.eqMod !== 'flex' && !st.eqMedida);
    var dias = conDias
      ? '<div class="rrw-field full"><span class="rrw-lbl" id="rrw-fdias-l">¿Qué días necesitan? <span class="rrw-opc">(opcional)</span></span>' +
        '<div class="rrw-fdays" role="group" aria-labelledby="rrw-fdias-l">' + DIAS.map(function (x) {
          return '<button type="button" class="rrw-day" data-fdia="' + x.id + '" aria-pressed="' + (st.diasForm.indexOf(x.id) !== -1) + '">' + x.c + '</button>';
        }).join('') + '</div><input type="hidden" name="dias" data-fdias-input value="' + esc(st.diasForm.map(function (d) { return cap(dia(d).n); }).join(', ')) + '"></div>'
      : '<input type="hidden" name="dias" value="' + esc(st.tipo === 'equipo' ? lista(st.eqDias.map(function (d) { return dia(d).n; })) : '') + '">';
    return '<form class="rrw-form" name="cotizacion" method="POST" data-netlify="true" netlify-honeypot="rrw-bot" data-form' + (st.form ? '' : ' hidden') + '>' +
      '<input type="hidden" name="form-name" value="cotizacion">' +
      '<input type="hidden" name="pagina" value="' + esc(document.title) + '">' +
      '<input type="hidden" name="cotizacion" value="' + esc(r.resumen.join('\n')) + '">' +
      '<p class="rrw-hp" aria-hidden="true"><label>No completar <input name="rrw-bot" tabindex="-1" autocomplete="off"></label></p>' +
      '<h4>' + (r.medida ? 'Pedí tu propuesta' : 'Quiero este plan') + '</h4>' +
      '<p>Dejanos tus datos y te confirmamos disponibilidad para los días que necesitan.</p>' +
      '<div class="rrw-fields">' +
      '<div class="rrw-field"><label for="rrw-nombre">Nombre</label><input id="rrw-nombre" name="nombre" required autocomplete="name"></div>' +
      '<div class="rrw-field"><label for="rrw-email">Email</label><input id="rrw-email" name="email" type="email" required autocomplete="email"></div>' +
      '<div class="rrw-field full"><label for="rrw-empresa">Empresa <span class="rrw-opc">(opcional)</span></label><input id="rrw-empresa" name="empresa" autocomplete="organization"></div>' +
      dias +
      '<div class="rrw-field full"><label for="rrw-mensaje">Algo que quieras contarnos <span class="rrw-opc">(opcional)</span></label><textarea id="rrw-mensaje" name="mensaje" rows="3"></textarea></div>' +
      '</div>' +
      '<button type="submit" class="rrw-btn rrw-btn--primary" style="margin-top:18px" data-k="enviar">Enviar consulta</button>' +
      '<p class="rrw-msg" data-form-msg role="status" hidden></p></form>';
  }

  function resultadoHTML() {
    var r = cotizar();
    if (!r) return '<p class="rrw-hint">Faltan datos para cotizar. Volvé un paso.</p>';
    var h = '<div class="rrw-ticket"><span class="rrw-ticket-plan">' + r.plan + '</span>' +
      '<h3 class="rrw-ticket-t" tabindex="-1" data-focus>' + r.titulo + '</h3>' +
      (r.sub ? '<p class="rrw-ticket-s">' + r.sub + '</p>' : '');
    if (r.medida) {
      h += '<div class="rrw-amount"><strong>A medida</strong></div><p class="rrw-tax rrw-tax-medida">' + r.texto + '</p></div>';
    } else {
      h += '<div class="rrw-amount"><strong>' + money(r.total) + '</strong><span>' + r.unidad + '</span></div>' +
        '<p class="rrw-tax">IVA incluido · Precio sin impuestos nacionales: ' + money(r.total / (1 + P.iva)) + '</p>' +
        (r.ahorro ? '<p class="rrw-save">Ahorrás ' + money(r.ahorro.monto) + ' (' + r.ahorro.pct + '%) ' + r.ahorro.frente + '</p>' : '') +
        '</div>';
      h += '<dl class="rrw-rows">' + r.filas.map(function (x) { return '<div><dt>' + x[0] + '</dt><dd>' + x[1] + '</dd></div>'; }).join('') + '</dl>';
    }
    if (r.notas && r.notas.length) h += '<ul class="rrw-notes">' + r.notas.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>';
    h += '<div class="rrw-ctas">' +
      (r.puntual
        ? '<a class="rrw-btn rrw-btn--primary" href="' + P.reservas + '" target="_blank" rel="noopener" data-reservas data-k="res">Reservar online</a>'
        : '<button type="button" class="rrw-btn rrw-btn--primary" data-abrir-form data-k="abrir">' + (r.medida ? 'Pedir la propuesta' : 'Quiero este plan') + '</button>') +
      '<a class="rrw-btn rrw-btn--ghost" href="' + waLink(r) + '" target="_blank" rel="noopener" data-wa data-k="wa">Consultar por WhatsApp</a></div>' +
      '<div class="rrw-mini"><button type="button" class="rrw-link" data-copy data-k="copy">Copiar resumen</button>' +
      '<button type="button" class="rrw-link" data-reset data-k="reset">Empezar de nuevo</button></div>' +
      '<textarea class="rrw-copybox" data-copybox rows="5" readonly hidden aria-label="Resumen de la cotización"></textarea>';
    if (!r.puntual) h += formHTML(r);
    return h;
  }

  /* ------------------------------------------------------------------ render */
  function render(cambioPaso) {
    var f = flujo();
    if (st.paso > f.length - 1) st.paso = f.length - 1;
    var id = f[st.paso], esRes = id === 'resultado';
    var foco = document.activeElement && root.contains(document.activeElement) ? document.activeElement.getAttribute('data-k') : null;

    var back = q('[data-back]');
    back.disabled = st.paso === 0;
    if (st.paso === 0) back.setAttribute('data-off', ''); else back.removeAttribute('data-off');

    var preguntas = f.length - 1, sinTipo = st.tipo === null;
    q('[data-count]').textContent = esRes ? 'Tu cotización' : sinTipo ? 'Paso 1' : 'Paso ' + (st.paso + 1) + ' de ' + preguntas;
    var bar = '';
    if (!sinTipo) for (var i = 0; i < preguntas; i++) bar += '<i class="' + (esRes || i <= st.paso ? 'on' : '') + '"></i>';
    q('[data-bar]').innerHTML = bar;

    q('[data-trail]').innerHTML = f.slice(0, st.paso).map(function (pid, i) {
      var l = etiqueta(pid);
      return l ? '<button type="button" class="rrw-chip" data-goto="' + i + '" data-k="goto-' + i + '" aria-label="Cambiar: ' + esc(l) + '">' + l + LAPIZ + '</button>' : '';
    }).join('');

    var stage = q('[data-stage]'), foot = q('[data-foot]'), next = q('[data-next]');
    if (esRes) {
      stage.innerHTML = resultadoHTML();
      foot.hidden = true;
    } else {
      var s = PASOS[id]();
      stage.innerHTML = '<h3 class="rrw-q" tabindex="-1" data-focus>' + s.t + '</h3><p class="rrw-hint">' + s.h + '</p>' + s.html;
      var est = estimado(id);
      q('[data-est]').innerHTML = est;
      next.hidden = s.auto && !s.listo;
      next.disabled = !s.listo;
      next.textContent = f[st.paso + 1] === 'resultado' ? 'Ver precio' : 'Siguiente';
      foot.hidden = next.hidden && !est;
    }

    if (cambioPaso) {
      stage.classList.remove('rrw-in'); void stage.offsetWidth; stage.classList.add('rrw-in');
      var card = q('.rrw-card'), top = card.getBoundingClientRect().top;
      if (top < 0) card.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'start' });
      var hdr = q('[data-focus]');
      if (hdr) { try { hdr.focus({ preventScroll: true }); } catch (e) { hdr.focus(); } }
    } else if (foco) {
      var el = q('[data-k="' + foco + '"]');
      if (el && !el.disabled) el.focus(); else { var h2 = q('[data-focus]'); if (h2) h2.focus(); }
    }
  }

  function avanzar() {
    var f = flujo();
    st.paso = Math.min(st.paso + 1, f.length - 1);
    st.form = false;
    render(true);
    if (f[st.paso] === 'resultado') {
      var r = cotizar();
      track('cotizacion', { tipo: st.tipo, total: r && r.total ? r.total : 0, a_medida: !!(r && r.medida) });
    }
  }

  function copiar(btn) {
    var r = cotizar(); if (!r) return;
    var txt = r.resumen.join('\n');
    var ok = function () { btn.textContent = 'Copiado'; setTimeout(function () { btn.textContent = 'Copiar resumen'; }, 1800); };
    var fallo = function () {
      var ta = q('[data-copybox]'); ta.hidden = false; ta.value = txt; ta.focus(); ta.select();
      btn.textContent = 'Copiá el texto de abajo';
    };
    try { navigator.clipboard.writeText(txt).then(ok, fallo); } catch (e) { fallo(); }
    track('copiar_resumen');
  }

  /* ---------------------------------------------------------------- eventos */
  root.addEventListener('click', function (ev) {
    var b = ev.target.closest('button, a');
    if (!b || !root.contains(b)) return;
    var d = b.dataset;

    if (d.tipo) { st.tipo = d.tipo; track('paso', { campo: 'tipo', valor: d.tipo }); return avanzar(); }
    if (d.ind) { st.ind = d.ind; track('paso', { campo: 'individual', valor: d.ind }); return avanzar(); }
    if (d.eqmod) { st.eqMod = d.eqmod; track('paso', { campo: 'modalidad', valor: d.eqmod }); return avanzar(); }
    if (d.puestos) { st.eqPuestos = clamp(st.eqPuestos + parseInt(d.puestos, 10), E.minPuestos, E.maxPuestos); st.eqMedida = false; return render(false); }
    if ('eqMedida' in d) { st.eqMedida = true; track('paso', { campo: 'puestos', valor: 'a_medida' }); return avanzar(); }
    if (d.dia) {
      var i = st.eqDias.indexOf(d.dia);
      if (i === -1) st.eqDias.push(d.dia); else st.eqDias.splice(i, 1);
      st.eqDias = ordenarDias(st.eqDias);
      return render(false);
    }
    if (d.cred) { st.eqCreditos = clamp(st.eqCreditos + parseInt(d.cred, 10), F.minCreditos, F.maxCreditos); return render(false); }
    if (d.preset) { st.eqCreditos = parseInt(d.preset, 10); return render(false); }
    if (d.ofp) { st.ofPersonas = parseInt(d.ofp, 10); track('paso', { campo: 'personas_oficina', valor: st.ofPersonas }); return avanzar(); }
    if (d.offrec) { st.ofFrec = d.offrec; track('paso', { campo: 'frecuencia_oficina', valor: d.offrec }); return avanzar(); }
    if (d.ofjor) { st.ofJornada = d.ofjor; track('paso', { campo: 'horario_oficina', valor: d.ofjor }); return avanzar(); }
    if ('irEquipo' in d) { st.tipo = 'equipo'; st.paso = flujo().indexOf('tipo') + 1; st.form = false; return render(true); }

    if ('next' in d) { if (!b.disabled) avanzar(); return; }
    if ('back' in d) { if (st.paso > 0) { st.paso--; st.form = false; render(true); } return; }
    if (d.goto) { st.paso = parseInt(d.goto, 10); st.form = false; return render(true); }

    if ('abrirForm' in d) {
      st.form = true;
      var fm = q('[data-form]'); fm.hidden = false;
      fm.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'start' });
      var nm = fm.querySelector('[name="nombre"]'); if (nm) { try { nm.focus({ preventScroll: true }); } catch (e) { nm.focus(); } }
      track('abrir_formulario');
      return;
    }
    if (d.fdia) {
      var k = st.diasForm.indexOf(d.fdia);
      if (k === -1) st.diasForm.push(d.fdia); else st.diasForm.splice(k, 1);
      st.diasForm = ordenarDias(st.diasForm);
      b.setAttribute('aria-pressed', String(k === -1));
      var hid = q('[data-fdias-input]'); if (hid) hid.value = st.diasForm.map(function (x) { return cap(dia(x).n); }).join(', ');
      return;
    }
    if ('copy' in d) { copiar(b); return; }
    if ('reset' in d) { st = estadoInicial(); render(true); track('reiniciar'); return; }
    if ('wa' in d) { var rw = cotizar(); track('whatsapp', { total: rw && rw.total ? rw.total : 0 }); return; }
    if ('reservas' in d) { track('ir_a_reservas'); return; }

    if ('allToggle' in d) {
      var body = q('[data-all-body]'), abierto = !body.hidden;
      body.hidden = abierto;
      b.setAttribute('aria-expanded', String(!abierto));
      b.textContent = abierto ? 'Ver la lista completa de precios' : 'Ocultar la lista de precios';
      if (!abierto) track('ver_lista_completa');
      return;
    }
    if (d.tab) {
      qa('.rrw-tabs [data-tab]').forEach(function (t) { t.setAttribute('aria-selected', String(t === b)); });
      qa('[data-tabpanel]').forEach(function (p) { p.hidden = p.getAttribute('data-tabpanel') !== d.tab; });
    }
  });

  // créditos tecleados: el estimado se actualiza al tipear y el valor se valida al salir del campo
  root.addEventListener('input', function (ev) {
    if (!ev.target.matches('[data-cred-input]')) return;
    var v = parseInt(ev.target.value, 10);
    if (!isNaN(v)) st.eqCreditos = v;
    q('[data-est]').innerHTML = estimado('eq-creditos');
  });
  root.addEventListener('change', function (ev) {
    if (!ev.target.matches('[data-cred-input]')) return;
    st.eqCreditos = clamp(parseInt(ev.target.value, 10) || F.minCreditos, F.minCreditos, F.maxCreditos);
    render(false);
  });

  root.addEventListener('submit', function (ev) {
    var form = ev.target.closest('[data-form]');
    if (!form) return;
    ev.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var msg = form.querySelector('[data-form-msg]'), btn = form.querySelector('[type="submit"]');
    if (!/(^|\.)rocketroom\.com\.ar$/.test(location.hostname)) {
      msg.textContent = 'Vista previa: el envío funciona una vez publicado en el sitio (Netlify Forms, formulario "cotizacion").';
      msg.hidden = false;
      return;
    }
    var original = btn.textContent;
    btn.disabled = true; btn.textContent = 'Enviando…';
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form)).toString()
    }).then(function (res) {
      if (!res.ok) throw new Error('envio');
      msg.textContent = 'Listo. Te respondemos dentro del día hábil.';
      msg.hidden = false;
      form.reset();
      track('enviar_formulario');
    }).catch(function () {
      msg.textContent = 'No se pudo enviar. Probá de nuevo o escribinos por WhatsApp.';
      msg.hidden = false;
    }).then(function () { btn.disabled = false; btn.textContent = original; });
  });

  /* ------------------------------------------------------- lista completa */
  function tabla(rows) {
    return '<div class="rrw-tablewrap"><table class="rrw-table"><thead><tr><th>Plan</th><th style="text-align:right">Precio con IVA</th><th style="text-align:right">Referencia</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }
  function tr(a, b, c) { return '<tr><td>' + a + '</td><td class="n">' + b + '</td><td class="r">' + (c || '') + '</td></tr>'; }
  function grupo(t) { return '<tr class="g"><td colspan="3">' + t + '</td></tr>'; }
  function pintarListas() {
    var r = tr(C.dia.nombre, money(C.dia.precio), 'jornada completa');
    ['p4', 'p8', 'p12'].forEach(function (k) { r += tr(C[k].nombre + ' · ' + C[k].frec, money(C[k].precio) + ' / mes', money(C[k].precio / C[k].accesos) + ' por acceso'); });
    r += tr(C.libre.nombre, money(C.libre.precio) + ' / mes', money(C.libre.precio / P.diasUsoPaseLibre) + ' por día con ' + P.diasUsoPaseLibre + ' usos');
    q('[data-tabpanel="ind"]').innerHTML = tabla(r);

    var e = grupo('Días fijos · precio por acceso');
    [[1, '1 día por semana'], [2, '2 días por semana'], [3, '3 a 5 días por semana']].forEach(function (t) {
      e += tr(t[1], money(E.porAcceso[t[0]]), 'Ej.: 4 puestos, ' + money(accesosEq(4, t[0]) * E.porAcceso[t[0]]) + ' / mes');
    });
    if (FLEX) { e += grupo('Flexible'); e += tr('Precio por crédito', money(F.porCredito), 'vencen al cierre del mes'); }
    q('[data-tabpanel="eq"]').innerHTML = tabla(e);

    OF_KEYS.forEach(function (k) {
      var O = P.oficinas[k], o = grupo('Uso puntual');
      o += tr('Media jornada · 4 h', money(O.media), money(O.media / O.capacidad) + ' por persona');
      o += tr('Jornada completa', money(O.jornada), money(O.jornada / O.capacidad) + ' por persona');
      o += grupo('Membresía · media jornada');
      [1, 2, 3].forEach(function (n) { o += tr(cap(veces(n)), money(O.memMedia[n]) + ' / mes', money(O.memMedia[n] / (n * P.semanasPorMes)) + ' por turno'); });
      o += grupo('Membresía · jornada completa');
      [1, 2, 3].forEach(function (n) { o += tr(cap(veces(n)), money(O.memJornada[n]) + ' / mes', money(O.memJornada[n] / (n * P.semanasPorMes)) + ' por jornada'); });
      var panel = q('[data-tabpanel="' + k + '"]');
      if (panel) panel.innerHTML = tabla(o);
    });
    var act = q('[data-actualizado]'); if (act) act.textContent = P.actualizado;
  }

  pintarListas();
  render(false);
})();
