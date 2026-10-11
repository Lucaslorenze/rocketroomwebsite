/* =============================================================================
   ROCKET ROOM — COTIZADOR (componente compartido)

   Cómo se usa en una página:
     <div id="cotizador-mount" data-espacio="oficina"></div>
     <script src="/cotizador.js" defer></script>

   data-espacio es opcional: "cowork" u "oficina" dejan ese paso ya respondido.

   Los precios viven en RRQ_PRECIOS, acá abajo. Es el único bloque a editar
   cuando cambia la lista: al ser un archivo compartido, se actualiza en las
   tres páginas de una sola vez.

   IMPORTANTE (Netlify Forms): este formulario se inyecta por JS, así que
   Netlify no lo detecta solo. En index.html hay una copia estática oculta
   del form "cotizacion" para que quede registrado en el deploy.
   ============================================================================= */
(function () {
  'use strict';

  /* =====================================================================
     PRECIOS — ÚNICO BLOQUE A EDITAR CUANDO CAMBIA LA LISTA
     Importes finales, CON IVA. Fuente: planilla "Planes y Precios RR".
     ===================================================================== */
  var RRQ_PRECIOS = {
    actualizado: '01/09/2026',
    whatsapp: '5491141577861',
    reservas: 'https://reservas.rocketroom.com.ar',
    diasUsoPaseLibre: 16, // días de uso esperados del pase libre
    semanasPorMes: 4.33,

    cowork: {
      dia:   { nombre: 'Pase por día',         accesos: 1,  precio: 32500 },
      p4:    { nombre: 'Pack 4 accesos',       accesos: 4,  precio: 115000 },
      p8:    { nombre: 'Pack 8 accesos',       accesos: 8,  precio: 205000 },
      p12:   { nombre: 'Pack 12 accesos',      accesos: 12, precio: 270000 },
      libre: { nombre: 'Pase libre ilimitado', accesos: 0,  precio: 315000 }
    },

    /* El orden de las claves va de menor a mayor capacidad.
       "hora" queda como referencia interna (uso de salas para socios); no se
       ofrece en el flujo público ni aparece en las tablas. */
    oficinas: {
      of4: {
        nombre: 'Oficina para 4 personas', corto: 'Para 4 personas', capacidad: 4, m2: '10,5',
        hora: 35500, media: 99000, jornada: 156000,
        mem_media_1: 270000, mem_media_2: 475000, mem_media_3: 630000,
        mem_jornada_1: 500000, mem_jornada_2: 860000, mem_jornada_3: 1140000
      },
      of6: {
        nombre: 'Oficina para 6 personas', corto: 'Para 6 personas', capacidad: 6, m2: '13',
        hora: 47500, media: 130000, jornada: 205000,
        mem_media_1: 355000, mem_media_2: 620000, mem_media_3: 830000,
        mem_jornada_1: 650000, mem_jornada_2: 1130000, mem_jornada_3: 1490000
      }
    },

    /* Cuenta de equipo (espacio compartido), modalidad días fijos. Precio por
       acceso CON IVA según los días por semana. La modalidad Flexible NO se
       publica en el sitio (venta directa), por eso no está acá. */
    equipo: {
      minPersonas: 3,
      maxPersonas: 10,
      porAcceso: { 1: 20000, 2: 18500, 3: 17000, 4: 17000, 5: 17000 }
    },

    fotos: {
      cowork: 'https://res.cloudinary.com/dcwfzvqgp/image/upload/f_auto,q_auto,w_700/v1783956861/Cowork_Con_publico_psutpp.png',
      oficina: 'https://res.cloudinary.com/dcwfzvqgp/image/upload/f_auto,q_auto,w_700/v1783611019/oficina_alfa_RR_z2awvw.png'
    }
  };
  /* ================= FIN DEL BLOQUE DE PRECIOS ================= */

  /* Frecuencias del slider. El último paso cambia según el tipo de espacio:
     en cowork es el pase libre, en oficinas es el tope de 3 días + aviso. */
  var FREQS = {
    cowork: [
      { id: 'full',  corto: 'Un día',      label: 'Un día suelto',        detalle: '1 acceso, sin compromiso mensual' },
      { id: '1',     corto: '1 vez',       label: '1 vez por semana',     detalle: '4 accesos al mes' },
      { id: '2',     corto: '2 veces',     label: '2 veces por semana',   detalle: '8 accesos al mes' },
      { id: '3',     corto: '3 veces',     label: '3 veces por semana',   detalle: '12 accesos al mes' },
      { id: 'libre', corto: 'Todos',       label: 'Todos los días',       detalle: 'Pase libre, sin contar accesos' }
    ],
    equipo: [
      { id: 'e1', dias: 1, corto: '1 día',  label: '1 día por semana' },
      { id: 'e2', dias: 2, corto: '2 días', label: '2 días por semana' },
      { id: 'e3', dias: 3, corto: '3 días', label: '3 días por semana' },
      { id: 'e4', dias: 4, corto: '4 días', label: '4 días por semana' },
      { id: 'e5', dias: 5, corto: '5 días', label: '5 días por semana' }
    ],
    oficina: [
      { id: 'full',  corto: 'Un día',      label: 'Un día suelto',        detalle: 'Sin compromiso mensual' },
      { id: '1',     corto: '1 vez',       label: '1 vez por semana',     detalle: 'unas 4 jornadas al mes' },
      { id: '2',     corto: '2 veces',     label: '2 veces por semana',   detalle: 'unas 9 jornadas al mes' },
      { id: '3',     corto: '3 veces',     label: '3 veces por semana',   detalle: 'unas 13 jornadas al mes' },
      { id: '4',     corto: '4 o 5 veces', label: '4 o 5 veces por semana', detalle: 'se cotiza a medida' }
    ]
  };

  var mount = document.getElementById('cotizador-mount');
  if (!mount) return;

  /* ---------------------------------------------------------------- estilos */
  var CSS = [
    '.rrq{',
    '--rrq-black:#0a0a0a;--rrq-white:#fff;--rrq-gray-bg:#f5f5f5;',
    '--rrq-ink:#0a0a0a;--rrq-ink-soft:#4a4a4a;--rrq-ink-mute:#7a7a7a;--rrq-line:#e6e6e6;',
    '--rrq-blue:#0040ff;--rrq-blue-dark:#0030c8;--rrq-blue-soft:#e8eeff;--rrq-orange:#ff5722;',
    "--rrq-ff:'Poppins',system-ui,-apple-system,sans-serif;",
    'font-family:var(--rrq-ff);background:var(--rrq-white);color:var(--rrq-ink);',
    'line-height:1.6;padding:96px 0 0;-webkit-font-smoothing:antialiased;display:block}',
    '@media(max-width:768px){.rrq{padding:64px 0 0}}',
    '.rrq *{box-sizing:border-box}',
    '.rrq [hidden]{display:none !important}',
    '.rrq-wrap{width:100%;max-width:1240px;margin:0 auto;padding-left:clamp(20px,4vw,64px);padding-right:clamp(20px,4vw,64px)}',

    /* cabecera */
    '.rrq-head{max-width:680px;margin-bottom:56px}',
    '.rrq h2{font-size:clamp(1.9rem,3.6vw,2.9rem);font-weight:800;letter-spacing:-.02em;line-height:1.08;margin:0 0 16px}',
    '.rrq-lead{font-size:1.1rem;color:var(--rrq-ink-soft);margin:0;line-height:1.6}',

    /* paso: número + línea conectora */
    '.rrq-step{display:grid;grid-template-columns:56px 1fr;gap:0;margin-bottom:8px}',
    '.rrq-step[hidden]{display:none !important}',
    '.rrq-step-rail{display:flex;flex-direction:column;align-items:center}',
    '.rrq-step-num{width:38px;height:38px;border:2px solid var(--rrq-blue);border-radius:4px;color:var(--rrq-blue);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.95rem;flex:none;background:#fff}',
    '.rrq-step-line{width:2px;flex:1;background:var(--rrq-line);margin:6px 0}',
    '.rrq-step:last-of-type .rrq-step-line{background:transparent}',
    '.rrq-step-body{padding:0 0 44px 12px;min-width:0;animation:rrqIn .45s cubic-bezier(.2,.7,.2,1) both}',
    '@keyframes rrqIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}',
    '.rrq-step-title{font-size:1.25rem;font-weight:800;letter-spacing:-.02em;margin:5px 0 4px;line-height:1.25}',
    '.rrq-step-hint{font-size:.92rem;color:var(--rrq-ink-mute);margin-bottom:20px}',
    '@media(max-width:640px){',
    '.rrq-step{grid-template-columns:40px 1fr}',
    '.rrq-step-num{width:32px;height:32px;font-size:.85rem}',
    '.rrq-step-body{padding:0 0 36px 10px}',
    '.rrq-step-title{font-size:1.08rem}}',

    /* tarjetas de espacio */
    '.rrq-spaces{display:grid;grid-template-columns:1fr 1fr;gap:16px}',
    '@media(max-width:760px){.rrq-spaces{grid-template-columns:1fr}}',
    '.rrq-space{font-family:var(--rrq-ff);position:relative;border:2px solid var(--rrq-line);border-radius:4px;background:#fff;padding:0;text-align:left;cursor:pointer;overflow:hidden;transition:border-color .2s,transform .2s;color:var(--rrq-ink);display:block;width:100%}',
    '.rrq-space:hover{border-color:var(--rrq-black);transform:translateY(-2px)}',
    '.rrq-space[aria-pressed="true"]{border-color:var(--rrq-blue)}',
    '.rrq-space-img{position:relative;height:200px;overflow:hidden}',
    '.rrq-space-img img{width:100%;height:100%;object-fit:cover;transition:transform .7s ease;display:block}',
    '.rrq-space:hover .rrq-space-img img{transform:scale(1.05)}',
    '.rrq-space-img::after{content:"";position:absolute;inset:0;background:rgba(10,10,10,.1);transition:background .25s}',
    '.rrq-space[aria-pressed="true"] .rrq-space-img::after{background:rgba(0,64,255,.45)}',
    '.rrq-space-kicker{position:absolute;top:14px;left:14px;z-index:2;background:#fff;color:var(--rrq-ink);font-size:.68rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;padding:6px 10px}',
    '.rrq-space-body{padding:22px 22px 24px;display:flex;align-items:flex-end;justify-content:space-between;gap:14px}',
    '.rrq-space-body h4{font-size:1.15rem;font-weight:800;letter-spacing:-.01em;margin:0 0 6px}',
    '.rrq-space-body p{font-size:.9rem;color:var(--rrq-ink-mute);margin:0;line-height:1.45}',
    '.rrq-space-arrow{flex:none;width:22px;height:22px;color:var(--rrq-ink-mute);transition:transform .25s,color .25s}',
    '.rrq-space:hover .rrq-space-arrow{transform:translateX(4px);color:var(--rrq-ink)}',
    '.rrq-space[aria-pressed="true"] .rrq-space-arrow{color:var(--rrq-blue);transform:none}',

    /* opciones genéricas */
    '.rrq-opts{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}',
    '.rrq-opt{font-family:var(--rrq-ff);position:relative;background:#fff;border:2px solid var(--rrq-line);border-radius:4px;padding:16px 18px;text-align:left;cursor:pointer;transition:.16s;line-height:1.3;color:var(--rrq-ink)}',
    '.rrq-opt:hover{border-color:var(--rrq-black)}',
    '.rrq-opt b{display:block;font-size:.98rem;font-weight:700}',
    '.rrq-opt span{display:block;font-size:.84rem;color:var(--rrq-ink-mute);margin-top:3px}',
    '.rrq-opt[aria-pressed="true"]{border-color:var(--rrq-blue);background:rgba(0,64,255,.06)}',
    '.rrq-opt-check{position:absolute;top:10px;right:10px;width:16px;height:16px;color:var(--rrq-blue);opacity:0;transition:opacity .16s}',
    '.rrq-opt[aria-pressed="true"] .rrq-opt-check{opacity:1}',
    '.rrq-sub{overflow:hidden;max-height:0;transition:max-height .35s cubic-bezier(.2,.7,.2,1)}',
    '.rrq-sub.rrq-open{max-height:220px}',
    '.rrq-sub-inner{padding-top:16px}',
    /* horario de la media jornada: selector segmentado en una línea */
    '.rrq-seg-label{display:block;font-size:.8rem;font-weight:600;color:var(--rrq-ink-mute);margin-bottom:8px}',
    '.rrq-seg{display:inline-flex;gap:3px;padding:3px;border:2px solid var(--rrq-line);border-radius:4px;background:#fff}',
    '.rrq-seg-opt{font-family:var(--rrq-ff);font-size:.92rem;font-weight:600;color:var(--rrq-ink);background:transparent;border:0;border-radius:2px;height:40px;padding:0 22px;cursor:pointer;transition:background .16s,color .16s}',
    '.rrq-seg-opt:hover{background:var(--rrq-gray-bg)}',
    '.rrq-seg-opt[aria-checked="true"]{background:var(--rrq-blue);color:#fff}',
    '.rrq-seg-opt:focus-visible{outline:2px solid var(--rrq-blue);outline-offset:2px}',

    /* equipo */
    '.rrq-people{display:flex;flex-wrap:wrap;gap:8px}',
    '.rrq-person{font-family:var(--rrq-ff);width:56px;height:56px;border:2px solid var(--rrq-line);border-radius:4px;background:#fff;color:var(--rrq-ink);font-size:1rem;font-weight:700;cursor:pointer;transition:.16s}',
    '.rrq-person:hover{border-color:var(--rrq-black)}',
    '.rrq-person[aria-pressed="true"]{background:var(--rrq-blue);border-color:var(--rrq-blue);color:#fff}',
    '.rrq-person-mas{width:auto;padding:0 18px;font-size:.88rem}',
    '.rrq-people-note{font-size:.9rem;color:var(--rrq-ink-soft);margin-top:14px}',
    '.rrq-people-note b{font-weight:700;color:var(--rrq-ink)}',

    /* slider */
    '.rrq-slider{padding:4px 0 0;max-width:640px}',
    '.rrq-track{position:relative;height:48px;cursor:pointer;touch-action:none}',
    '.rrq-rail{position:absolute;top:50%;left:0;right:0;height:6px;transform:translateY(-50%);background:var(--rrq-line)}',
    '.rrq-fill{position:absolute;top:50%;left:0;height:6px;transform:translateY(-50%);background:var(--rrq-blue);transition:width .22s cubic-bezier(.2,.7,.2,1)}',
    '.rrq-tick{position:absolute;top:50%;width:12px;height:12px;transform:translate(-50%,-50%);background:#fff;border:2px solid var(--rrq-line);border-radius:50%}',
    '.rrq-tick.rrq-on{border-color:var(--rrq-blue);background:var(--rrq-blue)}',
    '.rrq-thumb{position:absolute;top:50%;width:26px;height:26px;transform:translate(-50%,-50%);background:var(--rrq-blue);border:3px solid #fff;border-radius:50%;box-shadow:0 2px 12px rgba(0,64,255,.45);transition:left .22s cubic-bezier(.2,.7,.2,1);pointer-events:none}',
    '.rrq-track:focus-visible{outline:2px solid var(--rrq-blue);outline-offset:4px}',
    '.rrq-labels{position:relative;height:42px;margin-top:2px}',
    '.rrq-label{position:absolute;transform:translateX(-50%);text-align:center;background:none;border:0;padding:0;font-family:var(--rrq-ff);cursor:pointer;color:var(--rrq-ink-mute);width:74px}',
    /* las dos puntas se alinean hacia adentro: centradas se salían del viewport */
    '.rrq-label:first-child{transform:translateX(0);text-align:left}',
    '.rrq-label:last-child{transform:translateX(-100%);text-align:right}',
    '.rrq-label b{display:block;font-size:.8rem;font-weight:700;line-height:1.2}',
    '.rrq-label span{display:block;font-size:.7rem;margin-top:2px}',
    '.rrq-label.rrq-on{color:var(--rrq-blue)}',
    '.rrq-freq-note{margin-top:14px;font-size:.95rem;color:var(--rrq-ink-soft)}',
    '.rrq-freq-note b{color:var(--rrq-ink);font-weight:700}',
    '.rrq-team-cond{margin-top:12px;font-size:.8rem;line-height:1.5;color:var(--rrq-ink-mute)}',
    '@media(max-width:560px){.rrq-label{width:58px}.rrq-label b{font-size:.72rem}.rrq-label span{display:none}}',

    /* layout de dos columnas */
    '.rrq-layout{display:grid;grid-template-columns:minmax(0,1fr) 352px;gap:40px;align-items:start}',
    '.rrq-col{min-width:0}',
    '@media(max-width:1000px){.rrq-layout{grid-template-columns:1fr;gap:0}}',

    /* botones */
    '.rrq-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:var(--rrq-ff);font-weight:600;font-size:.92rem;padding:14px 22px;border:2px solid transparent;border-radius:4px;cursor:pointer;transition:.16s;text-decoration:none;line-height:1;text-align:center}',
    '.rrq-btn-wa{background:transparent;color:#fff;border-color:rgba(255,255,255,.4)}',
    '.rrq-btn-wa:hover{background:#fff;color:var(--rrq-black);border-color:#fff}',
    '.rrq-btn-primary{background:var(--rrq-blue);color:#fff}',
    '.rrq-btn-primary:hover{background:var(--rrq-blue-dark)}',

    /* panel flotante (desktop) */
    /* top deja pasar el header sticky del sitio (~80px) */
    '.rrq-panel{position:sticky;top:100px;background:var(--rrq-black);color:#fff;padding:26px 24px;border-radius:4px}',
    '@media(max-width:1000px){.rrq-panel{display:none}}',
    '.rrq-panel-kicker{font-size:.66rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.4)}',
    '.rrq-panel-amount{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin:8px 0 2px}',
    '.rrq-panel-amount strong{font-size:2.3rem;font-weight:900;letter-spacing:-.03em;line-height:1.05;font-variant-numeric:tabular-nums}',
    '.rrq-unit{font-size:.85rem;color:rgba(255,255,255,.55);font-weight:600}',
    '.rrq-per{margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,.14);font-size:.8rem;color:rgba(255,255,255,.5);line-height:1.5}',
    '.rrq-save{font-size:.82rem;font-weight:700;color:var(--rrq-orange);margin-top:10px;line-height:1.4}',
    '.rrq-panel-resumen{margin-top:14px;font-size:.88rem;color:rgba(255,255,255,.82);line-height:1.5;font-weight:600}',
    '.rrq-panel-ctas{display:flex;flex-direction:column;gap:8px;margin-top:20px}',
    /* nota que reemplaza al botón de WhatsApp cuando el uso es puntual */
    '.rrq-ayuda{font-size:.8rem;color:rgba(255,255,255,.55);text-align:center;margin-top:10px;line-height:1.45}',
    '.rrq-ayuda a{color:#fff;font-weight:600;border-bottom:1px solid rgba(255,255,255,.35)}',
    '.rrq-ayuda a:hover{border-color:#fff}',
    '.rrq-ayuda[hidden]{display:none}',
    '.rrq-bar .rrq-ayuda{display:none}',

    /* barra compacta (solo mobile) */
    '.rrq-bar{display:none;position:sticky;bottom:0;z-index:30;background:var(--rrq-black);color:#fff;box-shadow:0 -8px 24px rgba(0,0,0,.18)}',
    '@media(max-width:1000px){.rrq-bar{display:block}}',
    '.rrq-bar-inner{display:flex;align-items:center;flex-wrap:wrap;gap:6px 12px;padding:10px clamp(16px,4vw,24px)}',
    '.rrq-bar-left{min-width:0;flex:1}',
    '.rrq-bar-amount{display:flex;align-items:baseline;gap:6px}',
    '.rrq-bar-amount strong{font-size:1.3rem;font-weight:800;letter-spacing:-.02em;line-height:1.2;font-variant-numeric:tabular-nums}',
    '.rrq-bar-amount .rrq-unit{font-size:.72rem}',
    /* el ahorro va en su propia línea, debajo: en una sola fila se cortaba */
    '.rrq-bar-save{flex-basis:100%;font-size:.72rem;font-weight:700;color:var(--rrq-orange);line-height:1.35}',
    '.rrq-bar-ctas{display:flex;gap:6px;flex:none}',
    '.rrq-bar .rrq-btn{padding:11px 14px;font-size:.82rem}',
    /* mientras la barra de mobile está en pantalla, el WhatsApp flotante sube por encima (no se oculta) */
    '@media(max-width:1000px){body.rrq-bar-visible .float-wa{bottom:calc(var(--rrq-bar-h,72px) + 12px)}}',

    /* formulario */
    '.rrq-form{background:#fff;border:2px solid var(--rrq-line);border-radius:4px;padding:30px;margin:32px 0 0}',
    '.rrq-form[hidden]{display:none}',
    '.rrq-form h3{font-size:1.15rem;font-weight:800;margin:0 0 6px}',
    '.rrq-form>p{font-size:.9rem;color:var(--rrq-ink-mute);margin:0 0 22px}',
    '.rrq-form-quote{background:var(--rrq-gray-bg);border-left:3px solid var(--rrq-blue);border-radius:0 4px 4px 0;padding:14px 16px;margin-bottom:22px;font-size:.9rem;line-height:1.5;white-space:pre-line}',
    '.rrq-fields{display:grid;grid-template-columns:1fr 1fr;gap:14px}',
    '@media(max-width:560px){.rrq-fields{grid-template-columns:1fr}}',
    '.rrq-field{display:flex;flex-direction:column;gap:6px}',
    '.rrq-field.rrq-full{grid-column:1/-1}',
    '.rrq-field label{font-size:.72rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--rrq-ink-soft)}',
    '.rrq-field input,.rrq-field textarea{font-family:var(--rrq-ff);font-size:.98rem;padding:13px 14px;border:2px solid var(--rrq-line);border-radius:4px;background:#fff;color:var(--rrq-ink)}',
    '.rrq-field input:focus,.rrq-field textarea:focus{outline:none;border-color:var(--rrq-blue)}',
    '.rrq-days{display:flex;flex-wrap:wrap;gap:8px}',
    '.rrq-day{font-family:var(--rrq-ff);border:2px solid var(--rrq-line);border-radius:4px;background:#fff;padding:10px 15px;font-size:.9rem;font-weight:600;cursor:pointer;color:var(--rrq-ink)}',
    '.rrq-day[aria-pressed="true"]{border-color:var(--rrq-blue);background:rgba(0,64,255,.06);color:var(--rrq-blue-dark)}',
    '.rrq-form-msg{font-size:.9rem;font-weight:600;color:var(--rrq-blue);margin-top:14px}',
    '.rrq-form-msg.rrq-err{color:#c0341a}',
    '.rrq-form-msg[hidden]{display:none}',
    '.rrq-hp{position:absolute !important;left:-9999px !important;width:1px;height:1px;opacity:0}',

    /* tabla de planes */
    '.rrq-all{margin-top:48px;padding-bottom:8px}',
    '.rrq-all-toggle{font-family:var(--rrq-ff);background:none;border:0;border-bottom:2px solid var(--rrq-blue);color:var(--rrq-blue);font-size:.95rem;font-weight:700;cursor:pointer;padding:0 0 3px}',
    '.rrq-all-toggle:hover{color:var(--rrq-blue-dark);border-color:var(--rrq-blue-dark)}',
    '.rrq-all-body{margin-top:26px}',
    '.rrq-all-body[hidden]{display:none}',
    '.rrq-tabs{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap}',
    '.rrq-tabs button{font-family:var(--rrq-ff);background:#fff;border:2px solid var(--rrq-line);border-radius:4px;color:var(--rrq-ink-soft);padding:10px 20px;font-weight:600;font-size:.88rem;cursor:pointer}',
    '.rrq-tabs button[aria-selected="true"]{background:var(--rrq-blue);border-color:var(--rrq-blue);color:#fff}',
    '.rrq-tabpanel[hidden]{display:none}',
    '.rrq-table-scroll{overflow-x:auto;border:2px solid var(--rrq-line);border-radius:4px}',
    '.rrq-table{width:100%;border-collapse:collapse;font-size:.92rem;min-width:520px;background:#fff}',
    '.rrq-table th,.rrq-table td{text-align:left;padding:13px 18px;border-bottom:1px solid var(--rrq-line)}',
    '.rrq-table thead th{font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:var(--rrq-ink-mute);font-weight:700;background:#fafafa}',
    '.rrq-table tbody tr:last-child td{border-bottom:0}',
    '.rrq-table td.rrq-num{text-align:right;font-weight:700;white-space:nowrap}',
    '.rrq-table td.rrq-ref{text-align:right;color:var(--rrq-ink-mute);font-size:.82rem;white-space:nowrap}',
    '.rrq-group td{background:var(--rrq-black);color:#fff;font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;font-weight:700}',
    '.rrq-foot{font-size:.82rem;color:var(--rrq-ink-mute);margin-top:16px;line-height:1.7}',

    /* ===== compactado para mobile ===== */
    '@media(max-width:640px){',
    '.rrq{padding:48px 0 0}',
    '.rrq-head{margin-bottom:32px}',
    '.rrq h2{font-size:1.45rem;line-height:1.15;margin-bottom:10px}',
    '.rrq-lead{font-size:.92rem}',
    /* pasos más chicos y juntos */
    '.rrq-step{grid-template-columns:32px 1fr}',
    '.rrq-step-num{width:26px;height:26px;font-size:.75rem;border-width:2px}',
    '.rrq-step-body{padding:0 0 26px 10px}',
    '.rrq-step-title{font-size:.98rem;margin:2px 0 3px}',
    '.rrq-step-hint{font-size:.82rem;margin-bottom:14px}',
    /* tarjetas de espacio en fila, con miniatura */
    '.rrq-spaces{gap:10px}',
    '.rrq-space{display:grid;grid-template-columns:92px 1fr;align-items:stretch}',
    '.rrq-space-img{height:100%;min-height:92px}',
    '.rrq-space-kicker{display:none}',
    '.rrq-space-body{padding:13px 14px;align-items:center}',
    '.rrq-space-body h4{font-size:.95rem;margin-bottom:3px}',
    '.rrq-space-body p{font-size:.78rem}',
    '.rrq-space-arrow{width:18px;height:18px}',
    /* opciones y equipo */
    '.rrq-opts{grid-template-columns:1fr 1fr;gap:8px}',
    '.rrq-opt{padding:12px 13px}',
    '.rrq-opt b{font-size:.86rem}',
    '.rrq-opt span{font-size:.74rem;margin-top:2px}',
    '.rrq-opt-check{width:13px;height:13px;top:8px;right:8px}',
    '.rrq-person{width:44px;height:44px;font-size:.9rem}',
    /* sin esto hereda el ancho fijo de .rrq-person y el texto se sale de la caja */
    '.rrq-person-mas{width:auto;height:44px;padding:0 14px;font-size:.8rem;white-space:nowrap}',
    '.rrq-people{gap:6px}',
    '.rrq-people-note{font-size:.82rem;margin-top:11px}',
    /* el slider se sale de la sangría del paso y usa el ancho del contenedor */
    '.rrq-slider{margin-left:-42px;width:calc(100% + 42px);padding-top:8px}',
    '.rrq-track{height:44px}',
    '.rrq-thumb{width:22px;height:22px}',
    '.rrq-labels{height:30px}',
    '.rrq-freq-note{font-size:.85rem;margin-top:12px}',
    /* formulario y tabla */
    '.rrq-form{padding:20px 18px;margin-top:24px}',
    '.rrq-form h3{font-size:1rem}',
    '.rrq-form>p{font-size:.84rem;margin-bottom:16px}',
    '.rrq-form-quote{font-size:.82rem;padding:12px 13px;margin-bottom:16px}',
    '.rrq-field input,.rrq-field textarea{font-size:.92rem;padding:11px 12px}',
    '.rrq-day{padding:9px 13px;font-size:.85rem}',
    '.rrq-all{margin-top:32px}',
    '.rrq-all-toggle{font-size:.88rem}',
    '.rrq-table th,.rrq-table td{padding:11px 14px}',
    '.rrq-table{font-size:.85rem}',
    '}'
  ].join('');

  var ICON_CHECK = '<svg class="rrq-opt-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>';
  var ICON_ARROW = '<svg class="rrq-space-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  /* ------------------------------------------------------------------ markup */
  function paso(n, id, titulo, hint, cuerpo) {
    return '<div class="rrq-step" data-step="' + id + '">' +
      '<div class="rrq-step-rail"><div class="rrq-step-num" data-num>' + n + '</div><div class="rrq-step-line"></div></div>' +
      '<div class="rrq-step-body">' +
      '<h3 class="rrq-step-title">' + titulo + '</h3>' +
      (hint ? '<p class="rrq-step-hint" data-hint>' + hint + '</p>' : '') +
      cuerpo + '</div></div>';
  }

  /* los botones de personas se arman según el espacio (oficina: 1–6, compartido: 1–10) */
  function botonesPersonas(max, sel) {
    var h = '';
    for (var p = 1; p <= max; p++) {
      h += '<button type="button" class="rrq-person" data-personas="' + p + '" aria-pressed="' + (p === sel) + '">' + p + '</button>';
    }
    h += '<button type="button" class="rrq-person rrq-person-mas" data-personas="' + (max + 1) + '" aria-pressed="' + (sel > max) + '">Más de ' + max + '</button>';
    return h;
  }

  var HTML = [
    '<div class="rrq-wrap">',
    '<div class="rrq-head">',
    '<h2>Armá tu plan y mirá el precio en vivo</h2>',
    '<p class="rrq-lead">Elegí el espacio, la frecuencia y el tamaño de tu equipo. Los precios incluyen IVA.</p>',
    '</div>',

    '<div class="rrq-layout"><div class="rrq-col">',

    paso(1, 'espacio', '¿Qué espacio necesitás?', '',
      '<div class="rrq-spaces" data-spaces>' +
      '<button type="button" class="rrq-space" data-espacio="cowork" aria-pressed="false">' +
      '<div class="rrq-space-img"><span class="rrq-space-kicker">Cowork</span><img src="' + RRQ_PRECIOS.fotos.cowork + '" alt="Zona de cowork de Rocket Room" loading="lazy" width="700" height="400"></div>' +
      '<div class="rrq-space-body"><div><h4>Espacio compartido</h4><p>Un puesto en la planta abierta</p></div>' + ICON_ARROW + '</div>' +
      '</button>' +
      '<button type="button" class="rrq-space" data-espacio="oficina" aria-pressed="false">' +
      '<div class="rrq-space-img"><span class="rrq-space-kicker">Oficinas</span><img src="' + RRQ_PRECIOS.fotos.oficina + '" alt="Oficina privada de Rocket Room" loading="lazy" width="700" height="400"></div>' +
      '<div class="rrq-space-body"><div><h4>Oficina privada</h4><p>Espacio privado para equipos</p></div>' + ICON_ARROW + '</div>' +
      '</button>' +
      '</div>'),

    paso(2, 'equipo', 'Contanos de tu equipo', '¿Cuántas personas van a usar la oficina?',
      '<div class="rrq-people" data-people></div>' +
      '<p class="rrq-people-note" data-people-note></p>' +
      '<div style="margin-top:26px" data-solo-oficina>' +
      '<div class="rrq-opts" data-field="jornada">' +
      '<button type="button" class="rrq-opt" data-value="media" aria-pressed="false">' + ICON_CHECK + '<b>Media jornada</b><span>4 horas, de mañana o de tarde</span></button>' +
      '<button type="button" class="rrq-opt" data-value="completa" aria-pressed="false">' + ICON_CHECK + '<b>Jornada completa</b><span>8 horas, de 8 a 20</span></button>' +
      '</div>' +
      '<div class="rrq-sub" data-turno-wrap><div class="rrq-sub-inner">' +
      '<span class="rrq-seg-label" id="rrq-horario">Horario</span>' +
      '<div class="rrq-seg" data-seg="turno" role="radiogroup" aria-labelledby="rrq-horario">' +
      '<button type="button" class="rrq-seg-opt" role="radio" data-value="manana" aria-checked="false">9 a 13</button>' +
      '<button type="button" class="rrq-seg-opt" role="radio" data-value="tarde" aria-checked="false">14 a 18</button>' +
      '</div></div></div>' +
      '</div>'),

    paso(3, 'frecuencia', '¿Con qué frecuencia vas a venir?', '',
      '<div class="rrq-slider">' +
      '<div class="rrq-track" data-track role="slider" tabindex="0" aria-valuemin="0" aria-valuemax="4" aria-valuenow="1" aria-label="Frecuencia de uso">' +
      '<div class="rrq-rail"></div><div class="rrq-fill" data-fill></div>' +
      '<div data-ticks></div><div class="rrq-thumb" data-thumb></div>' +
      '</div>' +
      '<div class="rrq-labels" data-labels></div>' +
      '</div>' +
      '<p class="rrq-freq-note" data-freq-note></p>' +
      '<p class="rrq-team-cond" data-team-cond hidden>La cuenta de equipo está disponible desde 3 personas y se factura en un único comprobante mensual. ' +
      'El abono contempla el mes completo, incluidos los meses de cinco semanas. Podés sumar personas por encima de los puestos contratados, ' +
      'según disponibilidad, al mismo valor del plan. Los valores se actualizan junto con la lista de precios general.</p>'),

    // formulario
    '<form class="rrq-form" data-form name="cotizacion" method="POST" data-netlify="true" netlify-honeypot="rrq-bot" hidden>',
    '<input type="hidden" name="form-name" value="cotizacion">',
    '<input type="hidden" name="pagina" data-form-pagina>',
    '<input type="hidden" name="cotizacion" data-form-resumen>',
    '<p class="rrq-hp" hidden><label>No completar: <input name="rrq-bot"></label></p>',
    '<h3>Quiero esta membresía</h3>',
    '<p>Dejanos los datos y te confirmamos disponibilidad real para los días que necesitás.</p>',
    '<div class="rrq-form-quote" data-form-quote></div>',
    '<div class="rrq-fields">',
    '<div class="rrq-field"><label for="rrq-nombre">Nombre</label><input id="rrq-nombre" name="nombre" required autocomplete="name"></div>',
    '<div class="rrq-field"><label for="rrq-email">Email</label><input id="rrq-email" name="email" type="email" required autocomplete="email"></div>',
    '<div class="rrq-field rrq-full"><label for="rrq-empresa">Empresa (opcional)</label><input id="rrq-empresa" name="empresa" autocomplete="organization"></div>',
    '<div class="rrq-field rrq-full">',
    '<label>¿Qué días necesitás? (opcional)</label>',
    '<div class="rrq-days" data-days>',
    '<button type="button" class="rrq-day" data-day="Lunes" aria-pressed="false">Lun</button>',
    '<button type="button" class="rrq-day" data-day="Martes" aria-pressed="false">Mar</button>',
    '<button type="button" class="rrq-day" data-day="Miércoles" aria-pressed="false">Mié</button>',
    '<button type="button" class="rrq-day" data-day="Jueves" aria-pressed="false">Jue</button>',
    '<button type="button" class="rrq-day" data-day="Viernes" aria-pressed="false">Vie</button>',
    '</div><input type="hidden" name="dias" data-days-input></div>',
    '<div class="rrq-field rrq-full"><label for="rrq-msg">Algo que quieras contarnos (opcional)</label><textarea id="rrq-msg" name="mensaje" rows="3"></textarea></div>',
    '</div>',
    '<button type="submit" class="rrq-btn rrq-btn-primary" style="margin-top:20px" data-form-submit>Enviar consulta</button>',
    '<p class="rrq-form-msg" data-form-msg hidden></p>',
    '</form>',

    '</div>', // /rrq-col

    // panel flotante (desktop)
    '<aside class="rrq-panel">',
    '<span class="rrq-panel-kicker">Tu cotización</span>',
    '<div class="rrq-panel-resumen" data-resumen>Elegí un espacio para empezar.</div>',
    '<div class="rrq-per" data-per></div>',
    '<div class="rrq-panel-amount"><strong data-amount>—</strong><span class="rrq-unit" data-unit></span></div>',
    '<div class="rrq-save" data-save hidden></div>',
    '<div class="rrq-panel-ctas">',
    '<a class="rrq-btn rrq-btn-primary" data-cta-principal href="#" role="button">Quiero esta membresía</a>',
    '<a class="rrq-btn rrq-btn-wa" data-wa href="https://wa.me/' + RRQ_PRECIOS.whatsapp + '" target="_blank" rel="noopener">Consultar por WhatsApp</a>',
    '</div>',
    '<p class="rrq-ayuda" data-ayuda hidden>¿Preferís que te ayudemos? <a data-wa href="https://wa.me/' + RRQ_PRECIOS.whatsapp + '" target="_blank" rel="noopener">Escribinos</a>.</p>',
    '</aside>',

    '</div>', // /rrq-layout

    // tabla de planes
    '<div class="rrq-all">',
    '<button type="button" class="rrq-all-toggle" data-all-toggle aria-expanded="false">Ver todos los planes y precios</button>',
    '<div class="rrq-all-body" data-all-body hidden>',
    '<div class="rrq-tabs" role="tablist">',
    '<button type="button" role="tab" data-tab="cowork" aria-selected="true">Espacio compartido</button>',
    '<button type="button" role="tab" data-tab="of4" aria-selected="false">Oficina 4 personas</button>',
    '<button type="button" role="tab" data-tab="of6" aria-selected="false">Oficina 6 personas</button>',
    '</div>',
    '<div class="rrq-tabpanel" data-tabpanel="cowork"></div>',
    '<div class="rrq-tabpanel" data-tabpanel="of4" hidden></div>',
    '<div class="rrq-tabpanel" data-tabpanel="of6" hidden></div>',
    '<p class="rrq-foot">Todos los precios incluyen IVA. Sujeto a disponibilidad.</p>',
    '</div></div>',

    '</div>', // /rrq-wrap

    // barra compacta (mobile)
    '<div class="rrq-bar">',
    '<div class="rrq-bar-inner">',
    '<div class="rrq-bar-left">',
    '<div class="rrq-bar-amount"><strong data-amount>—</strong><span class="rrq-unit" data-unit></span></div>',
    '</div>',
    '<div class="rrq-bar-ctas">',
    '<a class="rrq-btn rrq-btn-wa" data-wa href="https://wa.me/' + RRQ_PRECIOS.whatsapp + '" target="_blank" rel="noopener">WhatsApp</a>',
    '<a class="rrq-btn rrq-btn-primary" data-cta-principal href="#" role="button">Lo quiero</a>',
    '</div>',
    '<div class="rrq-bar-save" data-save hidden></div>',
    '</div></div>'
  ].join('');

  /* ------------------------------------------------------------- inyección */
  if (!document.getElementById('rrq-style')) {
    var st = document.createElement('style');
    st.id = 'rrq-style';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  var root = document.createElement('section');
  root.className = 'rrq';
  root.id = 'cotizador';
  root.innerHTML = HTML;
  mount.parentNode.replaceChild(root, mount);

  /* ------------------------------------------------------------------ estado */
  var estado = {
    espacio: null,
    personas: 4,      // oficina
    personasCw: 1,    // espacio compartido
    jornada: 'completa',
    turno: 'manana',
    freqIdx: 1,
    dias: []
  };

  function q(sel) { return root.querySelector(sel); }
  function qa(sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }
  function money(n) { return '$' + Math.round(n).toLocaleString('es-AR'); }
  function esEquipo() {
    var E = RRQ_PRECIOS.equipo;
    return estado.espacio === 'cowork' && estado.personasCw >= E.minPersonas && estado.personasCw <= E.maxPersonas;
  }
  function freqs() { return FREQS[estado.espacio === 'oficina' ? 'oficina' : esEquipo() ? 'equipo' : 'cowork']; }
  function accesosEquipo(n, d) { return Math.round(n * d * RRQ_PRECIOS.semanasPorMes); }
  function pintarPersonas() {
    var cw = estado.espacio === 'cowork';
    q('[data-people]').innerHTML = cw
      ? botonesPersonas(RRQ_PRECIOS.equipo.maxPersonas, estado.personasCw)
      : botonesPersonas(6, estado.personas);
    var hint = q('[data-step="equipo"] [data-hint]');
    if (hint) hint.textContent = cw ? '¿Cuántas personas van a venir?' : '¿Cuántas personas van a usar la oficina?';
    q('[data-solo-oficina]').hidden = cw;
  }
  function freqActual() { return freqs()[estado.freqIdx]; }
  function oficinaPorPersonas(n) { return n <= 4 ? 'of4' : 'of6'; }

  function track(evt, data) {
    var payload = Object.assign({ event_category: 'cotizador', transport_type: 'beacon', event_label: document.title }, data || {});
    try { if (window.gtag) window.gtag('event', 'cotizador_' + evt, payload); } catch (e) {}
    try { if (window.fbq) window.fbq('trackCustom', 'Cotizador_' + evt, data || {}); } catch (e) {}
  }

  /* ------------------------------------------------------- motor de cotización */
  function cotizar() {
    var e = estado;
    if (!e.espacio) return null;
    if (e.personas > 6 && e.espacio === 'oficina') return { custom: true, customTxt: 'Somos un equipo de más de 6 personas y queremos una propuesta a medida de oficina privada.' };

    var f = freqActual();

    if (e.espacio === 'cowork' && e.personasCw > RRQ_PRECIOS.equipo.maxPersonas) {
      return { custom: true, customTxt: 'Somos un equipo de más de ' + RRQ_PRECIOS.equipo.maxPersonas + ' personas y queremos una propuesta a medida para el espacio compartido.' };
    }

    if (esEquipo()) {
      var E = RRQ_PRECIOS.equipo, C0 = RRQ_PRECIOS.cowork;
      var np = e.personasCw, d = f.dias;
      var acc = accesosEquipo(np, d), pa = E.porAcceso[d], tot = acc * pa;
      var indiv = d === 1 ? C0.p4 : d === 2 ? C0.p8 : d === 3 ? C0.p12 : C0.libre;
      var brutoE = np * indiv.precio;
      return {
        total: tot,
        unidad: '/ mes',
        per: money(pa) + ' por acceso · ' + acc + ' accesos al mes',
        resumen: 'Cuenta de equipo · ' + np + ' personas · ' + f.label + ' (' + acc + ' accesos al mes)',
        ahorro: brutoE - tot,
        off: Math.round((brutoE - tot) / brutoE * 100),
        saveTxt: 'frente a ' + np + ' planes individuales'
      };
    }

    if (e.espacio === 'cowork') {
      var C = RRQ_PRECIOS.cowork;
      var prod = f.id === 'full' ? C.dia : f.id === '1' ? C.p4 : f.id === '2' ? C.p8 : f.id === '3' ? C.p12 : C.libre;
      var r = {
        total: prod.precio,
        unidad: prod === C.dia ? '/ día' : '/ mes',
        resumen: 'Cowork · ' + f.label + (prod.accesos > 1 ? ' (' + prod.accesos + ' accesos al mes)' : ''),
        per: '', ahorro: 0, off: 0
      };
      if (e.personasCw > 1) {
        r.multi = e.personasCw;
        r.resumen = 'Cowork · ' + e.personasCw + ' personas · ' + f.label + (prod.accesos > 1 ? ' (' + prod.accesos + ' accesos al mes por persona)' : '');
      }
      if (prod === C.dia) {
        r.per = 'Jornada completa, de 8 a 20';
      } else if (prod === C.libre) {
        var brutoL = RRQ_PRECIOS.diasUsoPaseLibre * C.dia.precio;
        r.per = money(prod.precio / RRQ_PRECIOS.diasUsoPaseLibre) + ' por jornada con ' + RRQ_PRECIOS.diasUsoPaseLibre + ' días de uso';
        r.ahorro = brutoL - prod.precio;
        r.off = Math.round(r.ahorro / brutoL * 100);
      } else {
        var brutoP = prod.accesos * C.dia.precio;
        r.per = money(prod.precio / prod.accesos) + ' por acceso';
        r.ahorro = brutoP - prod.precio;
        r.off = Math.round(r.ahorro / brutoP * 100);
      }
      if (r.multi) {
        r.per = money(r.total) + ' por persona · ' + r.per;
        r.total = r.total * r.multi;
        r.ahorro = r.ahorro * r.multi;
      }
      return r;
    }

    // oficinas
    var O = RRQ_PRECIOS.oficinas[oficinaPorPersonas(e.personas)];
    var tipo = e.jornada === 'media' ? 'media' : 'jornada';
    var suelto = tipo === 'media' ? O.media : O.jornada;
    var nomJornada = tipo === 'media' ? 'Media jornada' : 'Jornada completa';
    var turnoTxt = tipo === 'media' ? (e.turno === 'manana' ? ' (de 9 a 13)' : ' (de 14 a 18)') : '';
    var base = O.nombre + ' · equipo de ' + e.personas + (e.personas === 1 ? ' persona' : ' personas') + ' · ' + nomJornada + turnoTxt;

    if (f.id === 'full') {
      return {
        total: suelto,
        unidad: tipo === 'media' ? '/ media jornada' : '/ día',
        per: money(suelto / O.capacidad) + ' por persona',
        resumen: base + ' · un día suelto',
        ahorro: 0, off: 0
      };
    }

    // 4 o 5 días por semana no tiene precio de lista: se cotiza a mano
    if (f.id === '4') {
      return {
        consultar: true,
        resumen: base + ' · 4 o 5 veces por semana',
        nota: 'Las membresías de lista llegan hasta 3 días por semana. Para 4 o 5 días armamos la cotización a mano: escribinos y te la pasamos.'
      };
    }

    var n = parseInt(f.id, 10);
    var total = O['mem_' + tipo + '_' + n];
    var jornadasMes = n * RRQ_PRECIOS.semanasPorMes;
    var bruto = jornadasMes * suelto;
    return {
      total: total,
      unidad: '/ mes',
      per: money(total / jornadasMes) + ' por jornada · ' + money(total / O.capacidad) + ' por persona',
      resumen: base + ' · ' + f.label,
      ahorro: bruto - total,
      off: Math.round((bruto - total) / bruto * 100)
    };
  }

  /* ------------------------------------------------------------ precio animado */
  var animRaf = null, animDesde = 0;
  function setTexto(sel, txt) { qa(sel).forEach(function (el) { el.textContent = txt; }); }
  function setOculto(sel, oculto) { qa(sel).forEach(function (el) { el.hidden = oculto; }); }

  function animarPrecio(destino) {
    if (animRaf) cancelAnimationFrame(animRaf);
    var desde = animDesde, delta = destino - desde, ini = null, dur = 550;
    if (delta === 0) { setTexto('[data-amount]', money(destino)); return; }
    function paso(ts) {
      if (ini === null) ini = ts;
      var pr = Math.min((ts - ini) / dur, 1);
      var eased = 1 - Math.pow(1 - pr, 3);
      setTexto('[data-amount]', money(desde + delta * eased));
      if (pr < 1) animRaf = requestAnimationFrame(paso);
      else { animDesde = destino; animRaf = null; }
    }
    animRaf = requestAnimationFrame(paso);
  }

  /* --------------------------------------------------------------- slider */
  function pintarSlider() {
    var lista = freqs(), n = lista.length;
    var ticks = q('[data-ticks]'), labels = q('[data-labels]');
    ticks.innerHTML = ''; labels.innerHTML = '';
    lista.forEach(function (f, i) {
      var pct = (i / (n - 1)) * 100;
      var t = document.createElement('div');
      t.className = 'rrq-tick' + (i <= estado.freqIdx ? ' rrq-on' : '');
      t.style.left = pct + '%';
      ticks.appendChild(t);

      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'rrq-label' + (i === estado.freqIdx ? ' rrq-on' : '');
      b.style.left = pct + '%';
      b.dataset.idx = i;
      b.innerHTML = '<b>' + f.corto + '</b><span>' + (f.id === 'full' ? 'suelto' : f.id === 'libre' ? 'ilimitado' : 'por semana') + '</span>';
      labels.appendChild(b);
    });
    var pctSel = (estado.freqIdx / (n - 1)) * 100;
    q('[data-fill]').style.width = pctSel + '%';
    q('[data-thumb]').style.left = pctSel + '%';
    var track = q('[data-track]');
    track.setAttribute('aria-valuemax', String(n - 1));
    track.setAttribute('aria-valuenow', String(estado.freqIdx));
    track.setAttribute('aria-valuetext', freqActual().label);
    var r = cotizar();
    var f = freqActual();
    var extra = r && r.nota ? '<br>' + r.nota : '';
    var det = f.dias ? accesosEquipo(estado.personasCw, f.dias) + ' accesos al mes para el equipo' : f.detalle;
    q('[data-freq-note]').innerHTML = f.label + (det ? ' · <b>' + det + '</b>' : '') + extra;
    q('[data-team-cond]').hidden = !f.dias;
  }

  function setFreq(i) {
    var n = freqs().length;
    var nuevo = Math.max(0, Math.min(n - 1, i));
    if (nuevo === estado.freqIdx) return;
    estado.freqIdx = nuevo;
    pintarSlider();
    render();
    track('paso', { rrq_campo: 'frecuencia', rrq_valor: freqActual().id });
  }

  function idxDesdeEvento(ev) {
    var track = q('[data-track]');
    var r = track.getBoundingClientRect();
    var x = (ev.clientX - r.left) / r.width;
    return Math.round(x * (freqs().length - 1));
  }

  /* ------------------------------------------------------------------ render */
  function resumenTexto(r) {
    if (!r) return '';
    if (r.custom) return r.customTxt;
    if (r.consultar) return r.resumen + '\nNecesito que me coticen esta frecuencia.';
    var t = r.resumen + '\nTotal: ' + money(r.total) + ' ' + r.unidad + ' (IVA incluido)';
    if (estado.dias.length) t += '\nDías: ' + estado.dias.join(', ');
    return t;
  }

  /* Uso puntual (un día suelto, en cowork o en oficinas, media o jornada completa):
     se reserva y se paga online, así que el CTA va derecho al sistema de reservas
     y el botón de WhatsApp deja lugar a una línea de ayuda. */
  function esUsoPuntual() {
    return estado.espacio !== null && freqActual().id === 'full';
  }

  function pintarCtaPrincipal() {
    var puntual = esUsoPuntual();
    qa('[data-cta-principal]').forEach(function (b) {
      var esBarra = !!b.closest('.rrq-bar');
      if (puntual) {
        b.textContent = esBarra ? 'Reservar' : 'Reservar online';
        b.href = RRQ_PRECIOS.reservas;
        b.target = '_blank';
        b.rel = 'noopener';
      } else {
        b.textContent = esBarra ? 'Lo quiero' : 'Quiero esta membresía';
        b.href = '#';
        b.removeAttribute('target');
        b.removeAttribute('rel');
      }
    });
    // en el panel, el botón de WhatsApp se reemplaza por la línea de ayuda
    qa('.rrq-panel [data-wa].rrq-btn').forEach(function (a) { a.hidden = puntual; });
    setOculto('[data-ayuda]', !puntual);
  }

  function render() {
    // visibilidad y numeración de pasos
    var esOficina = estado.espacio === 'oficina';
    q('[data-step="equipo"]').hidden = !estado.espacio;
    q('[data-step="frecuencia"]').hidden = !estado.espacio || (esOficina && estado.personas > 6) ||
      (estado.espacio === 'cowork' && estado.personasCw > RRQ_PRECIOS.equipo.maxPersonas);
    var n = 0;
    qa('.rrq-step').forEach(function (s) {
      if (!s.hidden) { n++; s.querySelector('[data-num]').textContent = String(n); }
    });

    if (esOficina) {
      var O = RRQ_PRECIOS.oficinas[oficinaPorPersonas(estado.personas)];
      q('[data-people-note]').innerHTML = estado.personas > 6
        ? 'Para equipos de más de 6 personas armamos una propuesta a medida combinando oficinas.'
        : 'Te corresponde la <b>' + O.nombre + '</b> · ' + O.m2 + ' m², hasta ' + O.capacidad + ' personas.';
      q('[data-turno-wrap]').classList.toggle('rrq-open', estado.jornada === 'media');
    } else if (estado.espacio === 'cowork') {
      var E = RRQ_PRECIOS.equipo, np = estado.personasCw;
      q('[data-people-note]').innerHTML = np > E.maxPersonas
        ? 'Para equipos de más de ' + E.maxPersonas + ' personas armamos una propuesta a medida.'
        : np >= E.minPersonas
          ? 'Con ' + E.minPersonas + ' o más personas cotizamos la <b>cuenta de equipo</b>: una sola factura y puede venir cualquiera del equipo.'
          : np === 1 ? 'Plan individual.' : 'Planes individuales: el total es por las ' + np + ' personas.';
    }

    var r = cotizar();

    if (!r) {
      if (animRaf) { cancelAnimationFrame(animRaf); animRaf = null; }
      animDesde = 0;
      setTexto('[data-amount]', '—');
      setTexto('[data-unit]', '');
      setTexto('[data-per]', '');
      setTexto('[data-resumen]', 'Elegí un espacio para empezar.');
      setOculto('[data-save]', true);
      qa('[data-wa]').forEach(function (a) {
        a.href = 'https://wa.me/' + RRQ_PRECIOS.whatsapp + '?text=' + encodeURIComponent('Hola! Quiero consultar por Rocket Room.');
      });
      return;
    }

    if (r.custom || r.consultar) {
      if (animRaf) { cancelAnimationFrame(animRaf); animRaf = null; }
      animDesde = 0;
      setTexto('[data-amount]', r.custom ? 'A medida' : 'Consultar');
      setTexto('[data-unit]', '');
      setTexto('[data-per]', '');
      setTexto('[data-resumen]', r.custom
        ? (estado.espacio === 'oficina'
          ? 'Equipo de más de 6 personas: combinamos oficinas y armamos una propuesta.'
          : 'Equipo de más de ' + RRQ_PRECIOS.equipo.maxPersonas + ' personas: armamos una propuesta a medida.')
        : r.resumen);
      setOculto('[data-save]', true);
    } else {
      animarPrecio(r.total);
      setTexto('[data-unit]', r.unidad);
      setTexto('[data-per]', r.per);
      setTexto('[data-resumen]', r.resumen);
      if (r.ahorro > 0) {
        setOculto('[data-save]', false);
        setTexto('[data-save]', 'Ahorrás ' + money(r.ahorro) + ' · ' + r.off + '% off ' + (r.saveTxt || 'frente al día suelto'));
      } else {
        setOculto('[data-save]', true);
      }
    }

    var texto = 'Hola! Armé esta cotización en la web:\n\n' + resumenTexto(r) + '\n\n¿Hay disponibilidad?';
    qa('[data-wa]').forEach(function (a) {
      a.href = 'https://wa.me/' + RRQ_PRECIOS.whatsapp + '?text=' + encodeURIComponent(texto);
    });
    pintarCtaPrincipal();
    q('[data-form-resumen]').value = resumenTexto(r);
    q('[data-form-quote]').textContent = resumenTexto(r);
    q('[data-form-pagina]').value = document.title;
  }

  /* --------------------------------------------------------------- eventos */
  q('[data-spaces]').addEventListener('click', function (ev) {
    var b = ev.target.closest('.rrq-space');
    if (!b) return;
    estado.espacio = b.dataset.espacio;
    qa('.rrq-space').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    if (estado.freqIdx > freqs().length - 1) estado.freqIdx = freqs().length - 1;
    pintarPersonas();
    pintarSlider();
    render();
    track('paso', { rrq_campo: 'espacio', rrq_valor: estado.espacio });
  });

  q('[data-people]').addEventListener('click', function (ev) {
    var b = ev.target.closest('.rrq-person');
    if (!b) return;
    var v = parseInt(b.dataset.personas, 10);
    var eraEquipo = esEquipo();
    if (estado.espacio === 'cowork') estado.personasCw = v; else estado.personas = v;
    qa('.rrq-person').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    // al pasar de individual a equipo (o al revés) cambia la escala de frecuencias
    // se conserva la frecuencia equivalente: individual [suelto,1x,2x,3x,libre] ↔ equipo [1d..5d]
    if (eraEquipo !== esEquipo()) {
      estado.freqIdx = esEquipo()
        ? [0, 0, 1, 2, 4][estado.freqIdx]
        : [1, 2, 3, 4, 4][estado.freqIdx];
    }
    pintarSlider();
    render();
    track('paso', { rrq_campo: 'personas', rrq_valor: v });
  });

  root.addEventListener('click', function (ev) {
    var b = ev.target.closest('.rrq-opt');
    if (!b) return;
    var grp = b.closest('[data-field]');
    if (!grp) return;
    var campo = grp.dataset.field;
    grp.querySelectorAll('.rrq-opt').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    if (campo === 'jornada') estado.jornada = b.dataset.value;
    if (campo === 'turno') estado.turno = b.dataset.value;
    render();
    track('paso', { rrq_campo: campo, rrq_valor: b.dataset.value });
  });

  // horario de media jornada (selector segmentado, radiogroup)
  function pintarTurno() {
    qa('.rrq-seg-opt').forEach(function (x) {
      var on = x.dataset.value === estado.turno;
      x.setAttribute('aria-checked', String(on));
      x.tabIndex = on ? 0 : -1;
    });
  }
  function setTurno(v, foco) {
    estado.turno = v;
    pintarTurno();
    if (foco) q('.rrq-seg-opt[data-value="' + v + '"]').focus();
    render();
    track('paso', { rrq_campo: 'turno', rrq_valor: v });
  }
  q('[data-seg="turno"]').addEventListener('click', function (ev) {
    var b = ev.target.closest('.rrq-seg-opt');
    if (b) setTurno(b.dataset.value, false);
  });
  q('[data-seg="turno"]').addEventListener('keydown', function (ev) {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(ev.key) === -1) return;
    ev.preventDefault();
    setTurno(estado.turno === 'manana' ? 'tarde' : 'manana', true);
  });

  // slider: click, drag y teclado
  var track_el = q('[data-track]');
  var arrastrando = false;
  track_el.addEventListener('pointerdown', function (ev) {
    arrastrando = true;
    track_el.setPointerCapture(ev.pointerId);
    setFreq(idxDesdeEvento(ev));
  });
  track_el.addEventListener('pointermove', function (ev) {
    if (arrastrando) setFreq(idxDesdeEvento(ev));
  });
  track_el.addEventListener('pointerup', function () { arrastrando = false; });
  track_el.addEventListener('pointercancel', function () { arrastrando = false; });
  track_el.addEventListener('keydown', function (ev) {
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') { setFreq(estado.freqIdx + 1); ev.preventDefault(); }
    if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') { setFreq(estado.freqIdx - 1); ev.preventDefault(); }
    if (ev.key === 'Home') { setFreq(0); ev.preventDefault(); }
    if (ev.key === 'End') { setFreq(freqs().length - 1); ev.preventDefault(); }
  });
  q('[data-labels]').addEventListener('click', function (ev) {
    var b = ev.target.closest('.rrq-label');
    if (b) setFreq(parseInt(b.dataset.idx, 10));
  });

  qa('[data-cta-principal]').forEach(function (b) {
    b.addEventListener('click', function (ev) {
      // en uso puntual el botón es un link real al sistema de reservas: lo dejamos pasar
      if (esUsoPuntual()) { track('ir_a_reservas'); return; }
      ev.preventDefault();
      var f = q('[data-form]');
      f.hidden = false;
      f.scrollIntoView({ behavior: 'smooth', block: 'center' });
      track('abrir_formulario');
    });
  });

  qa('[data-wa]').forEach(function (a) {
    a.addEventListener('click', function () {
      track('whatsapp', { rrq_total: (cotizar() || {}).total || 0 });
    });
  });

  q('[data-days]').addEventListener('click', function (ev) {
    var b = ev.target.closest('.rrq-day');
    if (!b) return;
    b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    estado.dias = qa('.rrq-day').filter(function (d) { return d.getAttribute('aria-pressed') === 'true'; })
      .map(function (d) { return d.dataset.day; });
    q('[data-days-input]').value = estado.dias.join(', ');
    render();
  });

  q('[data-form]').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var form = this, msg = q('[data-form-msg]'), btn = q('[data-form-submit]');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var original = btn.textContent;
    btn.disabled = true; btn.textContent = 'Enviando…';
    msg.hidden = true; msg.classList.remove('rrq-err');

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form)).toString()
    }).then(function (res) {
      if (res.ok) {
        form.reset();
        qa('.rrq-day').forEach(function (d) { d.setAttribute('aria-pressed', 'false'); });
        estado.dias = [];
        msg.textContent = 'Listo. Te respondemos dentro del día hábil.';
        msg.hidden = false;
        track('enviar_formulario');
        try { if (window.fbq) window.fbq('track', 'Lead'); } catch (e) {}
        try { if (window.gtag) window.gtag('event', 'generate_lead', { form_location: 'cotizador' }); } catch (e) {}
      } else {
        msg.textContent = 'No pudimos enviar la consulta. Probá de nuevo o escribinos por WhatsApp.';
        msg.classList.add('rrq-err'); msg.hidden = false;
      }
    }).catch(function () {
      msg.textContent = 'Hubo un problema de conexión. Probá de nuevo o escribinos por WhatsApp.';
      msg.classList.add('rrq-err'); msg.hidden = false;
    }).finally(function () {
      btn.disabled = false; btn.textContent = original;
    });
  });

  /* -------------------------------------------------- tabla de todos los planes */
  function fila(nombre, precio, ref) {
    return '<tr><td>' + nombre + '</td><td class="rrq-num">' + money(precio) + '</td><td class="rrq-ref">' + (ref || '') + '</td></tr>';
  }
  function tabla(rows) {
    return '<div class="rrq-table-scroll"><table class="rrq-table">' +
      '<thead><tr><th>Plan</th><th style="text-align:right">Precio c/IVA</th><th style="text-align:right">Referencia</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div>';
  }
  function pintarTablas() {
    var C = RRQ_PRECIOS.cowork, rows = '';
    rows += fila(C.dia.nombre, C.dia.precio, 'jornada completa');
    ['p4', 'p8', 'p12'].forEach(function (k) {
      rows += fila(C[k].nombre, C[k].precio, money(C[k].precio / C[k].accesos) + ' por acceso');
    });
    rows += fila(C.libre.nombre, C.libre.precio, money(C.libre.precio / RRQ_PRECIOS.diasUsoPaseLibre) + ' por día con ' + RRQ_PRECIOS.diasUsoPaseLibre + ' usos');
    var EQ = RRQ_PRECIOS.equipo;
    rows += '<tr class="rrq-group"><td colspan="3">Cuenta de equipo · desde ' + EQ.minPersonas + ' personas · precio por acceso</td></tr>';
    rows += fila('1 día por semana', EQ.porAcceso[1], 'por persona y día');
    rows += fila('2 días por semana', EQ.porAcceso[2], 'por persona y día');
    rows += fila('3 a 5 días por semana', EQ.porAcceso[3], 'por persona y día');
    q('[data-tabpanel="cowork"]').innerHTML = tabla(rows);

    Object.keys(RRQ_PRECIOS.oficinas).forEach(function (key) {
      var O = RRQ_PRECIOS.oficinas[key], r = '';
      r += '<tr class="rrq-group"><td colspan="3">Uso puntual</td></tr>';
      r += fila('Media jornada · 4 h', O.media, money(O.media / O.capacidad) + ' por persona');
      r += fila('Jornada completa · 8 h', O.jornada, money(O.jornada / O.capacidad) + ' por persona');
      r += '<tr class="rrq-group"><td colspan="3">Membresías · media jornada</td></tr>';
      [1, 2, 3].forEach(function (i) {
        r += fila(i + (i === 1 ? ' vez' : ' veces') + ' por semana', O['mem_media_' + i], money(O['mem_media_' + i] / (i * RRQ_PRECIOS.semanasPorMes)) + ' por media jornada');
      });
      r += '<tr class="rrq-group"><td colspan="3">Membresías · jornada completa</td></tr>';
      [1, 2, 3].forEach(function (i) {
        r += fila(i + (i === 1 ? ' vez' : ' veces') + ' por semana', O['mem_jornada_' + i], money(O['mem_jornada_' + i] / (i * RRQ_PRECIOS.semanasPorMes)) + ' por jornada');
      });
      q('[data-tabpanel="' + key + '"]').innerHTML = tabla(r);
    });
  }

  q('[data-all-toggle]').addEventListener('click', function () {
    var body = q('[data-all-body]'), abierto = !body.hidden;
    body.hidden = abierto;
    this.setAttribute('aria-expanded', String(!abierto));
    this.textContent = abierto ? 'Ver todos los planes y precios' : 'Ocultar la lista de planes';
    if (!abierto) track('ver_todos_los_planes');
  });

  qa('.rrq-tabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      qa('.rrq-tabs button').forEach(function (x) { x.setAttribute('aria-selected', 'false'); });
      b.setAttribute('aria-selected', 'true');
      qa('.rrq-tabpanel').forEach(function (pn) { pn.hidden = pn.dataset.tabpanel !== b.dataset.tab; });
    });
  });

  /* --------------------------------------------------------- arranque */
  function aplicarPreseleccion() {
    var pre = mount.dataset.espacio;
    if (pre === 'cowork' || pre === 'oficina') {
      estado.espacio = pre;
      qa('.rrq-space').forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.espacio === pre)); });
    }
  }

  // mientras el cotizador está en pantalla, el WhatsApp flotante del sitio sube por encima
  // de la barra compacta de mobile (se mide su alto real para no pisarla)
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (entries) {
      var bar = root.querySelector('.rrq-bar');
      if (bar && bar.offsetHeight) document.body.style.setProperty('--rrq-bar-h', bar.offsetHeight + 'px');
      document.body.classList.toggle('rrq-bar-visible', entries[0].isIntersecting);
    }, { threshold: 0 }).observe(root);
  }

  pintarTablas();
  aplicarPreseleccion();
  pintarPersonas();
  qa('[data-field="jornada"] .rrq-opt').forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.value === estado.jornada)); });
  pintarTurno();
  pintarSlider();
  render();
})();
