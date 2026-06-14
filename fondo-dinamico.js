/**
 * fondo-dinamico.js — Programa PRI
 * Fondo animado según la hora del día:
 *  · Noche     (19h – 4h):  Luciérnagas + luna + estrellas (canvas)
 *  · Amanecer  ( 4h – 6h):  Sol naciente + cielo cálido    (canvas)
 *  · Día       ( 6h – 16h): Sol brillante + rayos + aves   (canvas)
 *  · Atardecer (16h – 19h): Video fondo_pacifico.mp4
 */
(function () {
    'use strict';

    const h = new Date().getHours() + new Date().getMinutes() / 60;
    const esNoche     = h >= 19 || h < 4;   // 7 PM → 4 AM
    const esAmanecer  = h >= 4  && h < 6;   // 4 AM → 6 AM
    const esAtardecer = h >= 16 && h < 19;  // 4 PM → 7 PM
    // esDia: 6h → 16h

    /* ── Contenedor fijo detrás de todo el contenido ── */
    const wrap = document.createElement('div');
    wrap.id = 'fondo-din';
    wrap.style.cssText =
        'position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none;';
    document.body.insertBefore(wrap, document.body.firstChild);

    /* ── CSS: secciones oscuras con overlay MUY translúcido ── */
    const css = document.createElement('style');
    css.id = 'fondo-din-css';
    css.textContent = `
        body, html { background: transparent !important; }

        /* ══ HEROES ══════════════════════════════════════════════════ */
        .hero-ppri {
            background: linear-gradient(135deg,
                rgba(5,24,48,0.18) 0%,
                rgba(6,49,98,0.18) 60%,
                rgba(10,42,80,0.18) 100%) !important;
        }
        .hero-icfes { background: rgba(2, 13, 26, 0.18) !important; }

        /* ══ SECCIONES OSCURAS ════════════════════════════════════════ */
        .stats-section, .niveles-section,
        .fases-section, .piloto-section, .patrocinadores-section,
        .about-ppri, .valores-section, .timeline-section,
        .galeria-ppri, .piloto-galeria, .mentors-wrapper,
        .etapas-section, .icfes-cta, #metricas-programa, #sondeo-stats,
        .icfes-about, .icfes-materias, .icfes-method, .schedule-section,
        .docentes-section, .productos-section, .mentors-section,
        .productos-wrapper, .module-header,
        .about-section, .boveda-section, .features-section,
        .how-section, .cta-section, .admin-table-wrap {
            background: rgba(1, 4, 12, 0.25) !important;
            background-image: none !important;
        }

        /* ══ GLASS: lista explícita, sin selectores de atributo ══════
           Solo elementos que son verdaderas "tarjetas" o "cajas"        */
        .stat-card, .kpi-card, .qa-card,
        .valor-card, .materia-card,
        .fase-card, .etapa-card, .modulo-card,
        .metric-card, .nivel-body,
        .timeline-card, .mentor-card,
        .ppri-lib-card, .paper-graphic-box,
        .review-item, .historial-item, .taller-card,
        .section-box, .foro-messages,
        .modal-box, .modal-canje,
        .prod-card, .prod-card-libretas,
        .diag-kpi, .diag-block, .diag-alerta, .diag-explain-col,
        .sesion-step, .metodologia-freire,
        .sim-visual, .sim-text-side,
        .banner-estudiante, .banner-visitante,
        .empty-state, .piloto-stats > div,
        .highlight-step, .admin-prod-field,
        .reviews-panel,
        .module-item, .tutor-item, .canje-item, .ri-card,
        .check-item, .area-check-item,
        .reg-box, .causa-item, .review-card, .precio-item {
            background: rgba(2, 12, 30, 0.68) !important;
            backdrop-filter: blur(18px) saturate(1.3) !important;
            -webkit-backdrop-filter: blur(18px) saturate(1.3) !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            border-radius: 1.1rem !important;
            box-shadow: 0 6px 28px rgba(0,0,0,0.30),
                        inset 0 1px 0 rgba(255,255,255,0.09) !important;
        }

        /* ══ TEXTO blanco en cada tipo de card (wildcard por clase) ══ */
        .stat-card *:not([style*="color"]),       .kpi-card *:not([style*="color"]),
        .qa-card *:not([style*="color"]),          .valor-card *:not([style*="color"]),
        .materia-card *:not([style*="color"]),     .fase-card *:not([style*="color"]),
        .etapa-card *:not([style*="color"]),       .modulo-card *:not([style*="color"]),
        .metric-card *:not([style*="color"]),      .nivel-body *:not([style*="color"]),
        .timeline-card *:not([style*="color"]),    .mentor-card *:not([style*="color"]),
        .ppri-lib-card *:not([style*="color"]),
        .paper-graphic-box *:not([style*="color"]),.review-item *:not([style*="color"]),
        .historial-item *:not([style*="color"]),   .taller-card *:not([style*="color"]),
        .prod-card *:not([style*="color"]),        .prod-card-libretas *:not([style*="color"]),
        .diag-kpi *:not([style*="color"]),         .diag-block *:not([style*="color"]),
        .diag-alerta *:not([style*="color"]),      .diag-explain-col *:not([style*="color"]),
        .sesion-step *:not([style*="color"]),      .metodologia-freire *:not([style*="color"]),
        .sim-visual *:not([style*="color"]),       .sim-text-side *:not([style*="color"]),
        .banner-estudiante *:not([style*="color"]),.banner-visitante *:not([style*="color"]),
        .piloto-stats > div *:not([style*="color"]),.reviews-panel *:not([style*="color"]),
        .highlight-step *:not([style*="color"]),
        .module-item *:not([style*="color"]),   .tutor-item *:not([style*="color"]),
        .canje-item *:not([style*="color"]),     .ri-card *:not([style*="color"]),
        .check-item *:not([style*="color"]),     .area-check-item *:not([style*="color"]),
        .reg-box *:not([style*="color"]),        .causa-item *:not([style*="color"]),
        .review-card *:not([style*="color"]),    .precio-item *:not([style*="color"]) {
            color: #ffffff !important;
        }

        /* ══ RESTAURAR colores de acento ══════════════════════════════
           IMPORTANTE: deben tener especificidad ≥ (0,2,0) para superar
           al wildcard *:not([style*="color"]) que tiene (0,2,0).
           Usamos "padre + clase" o "clase duplicada" para lograrlo.     */
        .stat-card .stat-number         { color: var(--naranja-atardecer, #FF5E00) !important; }
        .diag-kpi .diag-kpi-num         { color: var(--kpi-color, #FF5E00) !important; }
        .fase-card .fase-num            { color: var(--naranja-atardecer, #FF5E00) !important; }
        .timeline-card .timeline-num    { color: var(--naranja-atardecer, #FF5E00) !important; }
        .nivel-num-circle span:last-child  { color: #fff !important; }
        .nivel-num-circle span:first-child { color: var(--oro-sol, #FFD700) !important; }
        .review-item .review-stars,
        .review-card .review-stars      { color: #fbbf24 !important; }
        .badge-gold.badge-gold          { color: var(--oro-sol, #FFD700) !important; }
        .mentor-card .mentor-career     { color: var(--azul-superficie-teal, #38bdf8) !important; }
        .nivel-body .nivel-grado        { color: var(--azul-superficie-teal, #38bdf8) !important; }
        .modulo-card .modulo-area       { color: var(--azul-superficie-teal, #38bdf8) !important; }
        .modulo-card .modulo-puntaje    { color: var(--naranja-atardecer, #FF5E00) !important; }
        .sp-card .badge-teal            { color: var(--azul-superficie-teal, #38bdf8) !important; }
        .prod-card .prod-price,
        .prod-card-libretas .prod-price { color: var(--naranja-atardecer, #FF5E00) !important; }
        .saldo-badge.saldo-badge        { color: var(--oro-sol, #FFD700) !important; }
        .review-card .review-fecha      { color: rgba(255,255,255,0.45) !important; }
        .module-item .module-item-meta  { color: rgba(255,255,255,0.55) !important; }
        .reg-box .reg-box-title         { color: var(--azul-superficie-teal, #38bdf8) !important; }
        .diag-block .diag-chart-title   { color: var(--azul-superficie-teal, #38bdf8) !important; }
        .precio-item .precio-item .label { color: rgba(255,255,255,0.65) !important; }
        .reg-box .field label           { color: rgba(255,255,255,0.6) !important; }

        /* ══ SESIÓN: color naranja a los iconos SVG ════════════════════ */
        .sesion-step .step-icon  { color: var(--naranja-atardecer, #FF5E00) !important; }
        .sesion-step .step-num   { color: var(--oro-sol, #FFD700) !important; }
        .step-arrow              { color: rgba(255,255,255,0.3) !important; }

        /* ══ CARRUSEL: esquinas redondeadas en logo boxes ═════════════ */
        .sp-logo-box { border-radius: 1rem !important; overflow: hidden; }

        /* ══ OCULTAR sol HTML (canvas ya dibuja el propio) ════════════ */
        .sun-cutout { display: none !important; }

        /* ══ MÉTRICAS preicfes: border-radius y texto legible ══════════ */
        #metricas-programa div[style*="border:1px"],
        #metricas-programa div[style*="border: 1px"] {
            border-radius: 1rem !important;
        }
        #metricas-programa div[style*="color:rgba(240,244,248,0.4)"],
        #metricas-programa div[style*="color:rgba(240,244,248,0.45)"] {
            color: rgba(255,255,255,0.65) !important;
        }
        #metricas-programa div[style*="color:rgba(240,244,248,0.5)"],
        #metricas-programa div[style*="color:rgba(240,244,248,0.52)"] {
            color: rgba(255,255,255,0.7) !important;
        }
        #metricas-programa div[style*="color:rgba(240,244,248,0.85)"] {
            color: rgba(255,255,255,0.95) !important;
        }
        #metricas-programa div[style*="color:rgba(240,244,248,0.75)"],
        #metricas-programa div[style*="color:rgba(240,244,248,0.8)"] {
            color: rgba(255,255,255,0.9) !important;
        }

        /* ══ SIM-VISUAL: restaurar sombra offset ══════════════════════ */
        .sim-visual {
            box-shadow: 12px 12px 0 #000,
                        inset 0 1px 0 rgba(255,255,255,0.09) !important;
        }

        /* ══ SIM-TEXT-SIDE: más padding lateral para que no apriete ═══ */
        .sim-text-side {
            padding: 2rem 2.5rem !important;
        }

        /* ══ FOOTER: restaurar fondo negro original ════════════════════ */
        .footer-industrial {
            background-color: #010c17 !important;
            border-top: 3px solid #1f7a8c !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            border-radius: 0 !important;
            box-shadow: 0 -10px 30px rgba(31,122,140,0.1) !important;
        }
        .footer-industrial *,
        .footer-industrial *:not([style*="color"]) {
            background: transparent !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            color: rgba(255,255,255,0.82) !important;
        }

        /* ══ FOUNDER CARD ════════════════════════════════════════════ */
        .founder-card {
            background: rgba(2, 12, 30, 0.72) !important;
            backdrop-filter: blur(18px) !important;
            -webkit-backdrop-filter: blur(18px) !important;
            border: 2px solid rgba(255,255,255,0.15) !important;
            border-radius: 1.1rem !important;
            box-shadow: 10px 10px 0 var(--naranja-atardecer),
                        0 8px 32px rgba(0,0,0,0.45) !important;
        }
        .founder-card *, .founder-quote { color: #ffffff !important; }
        .founder-name { color: var(--oro-sol) !important; }
        .founder-role { color: var(--azul-superficie-teal, #38bdf8) !important; }

        /* ══ ADMIN PANEL: sólido ══════════════════════════════════════ */
        .admin-prod-panel {
            background: rgba(4, 14, 28, 0.96) !important;
            border: 1.5px solid rgba(255,94,0,0.22) !important;
            border-radius: 1.1rem !important;
        }

        /* ══ BORDER-RADIUS en cajas semánticas (sin cambiar fondo) ═══ */
        .alert-box, .fyf-box, .page-card,
        .glass-panel, .diag-explain-badge, .mision-tag, .badge-tag {
            border-radius: 0.5rem !important;
        }

        /* ══ BOTONES: esquinas redondeadas ════════════════════════════ */
        .btn-login, .btn-primary, .btn-secondary,
        .btn-cta-dark, .btn-cta-white, .btn-material,
        .btn-tienda-libreta, .btn-unirse, .btn-volver,
        .btn-admin-save, .btn-cancel, .btn-confirm,
        .btn-submit-rating, .filtro-btn, .fab-register,
        .btn-enviar, .btn-ver-solo, .btn-canjear,
        .ppri-btn-tienda-pulse, .star-btn,
        .icfes-cta-btns a, .hero-icfes-btns a,
        .cta-buttons a, .hero-buttons a,
        section button:not(.menu-toggle):not(.modal-close):not(.lb-prev):not(.lb-next),
        input[type="submit"], input[type="button"] {
            border-radius: 0.65rem !important;
        }
        /* Hero buttons overriden in style.css with (0,2,0) specificity — match it */
        .hero-buttons .btn,
        .hero-buttons .btn-primary,
        .hero-buttons .btn-secondary {
            border-radius: 0.65rem !important;
        }

        /* ══ RESTAURAR footer buttons ══════════════════════════════════ */
        .footer-industrial .btn-login,
        .footer-industrial .btn-primary,
        .footer-industrial .btn-secondary,
        .footer-industrial a,
        .footer-industrial button {
            border-radius: 0 !important;
        }
        .footer-nav-list a:hover {
            color: #FF5E00 !important;
        }
    `;
    document.head.appendChild(css);

    /* ══════════════════════════════════════════════════════════════
       ATARDECER — Video fondo_pacifico.mp4
    ══════════════════════════════════════════════════════════════ */
    if (esAtardecer) {
        const vid = document.createElement('video');
        vid.setAttribute('autoplay', '');
        vid.setAttribute('loop', '');
        vid.setAttribute('muted', '');
        vid.setAttribute('playsinline', '');
        vid.style.cssText =
            'position:absolute;inset:0;width:100%;height:100%;' +
            'object-fit:cover;transform:scale(1.06);opacity:0.94;';
        const src = document.createElement('source');
        src.src  = 'fondo_pacifico.mp4';
        src.type = 'video/mp4';
        vid.appendChild(src);
        wrap.appendChild(vid);
        vid.play().catch(() => {});
        const ov = document.createElement('div');
        ov.style.cssText =
            'position:absolute;inset:0;' +
            'background:linear-gradient(to bottom,' +
            '  rgba(2,8,23,0.08) 0%,' +
            '  rgba(2,8,23,0.02) 35%,' +
            '  rgba(2,8,23,0.40) 100%);';
        wrap.appendChild(ov);
        return;
    }

    /* ═══════════════════════════════════════════════════════════════
       CANVAS compartido (noche / amanecer / día)
    ═══════════════════════════════════════════════════════════════ */
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
    wrap.appendChild(canvas);
    let W = canvas.width  = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    window.addEventListener('resize', () => {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    });

    /* ══════════════════════════════════════════════════════════════
       NOCHE — Estrellas + Luna + Luciérnagas
    ══════════════════════════════════════════════════════════════ */
    if (esNoche) {
        const estrellas = Array.from({ length: 180 }, () => ({
            x:  Math.random(),
            y:  Math.random() * 0.78,
            r:  Math.random() * 1.5 + 0.2,
            a:  Math.random() * 0.55 + 0.2,
            tw: Math.random() * 0.025 + 0.004,
            ph: Math.random() * Math.PI * 2
        }));
        const luna = { rx: 0.80, ry: 0.11, r: 34 };

        function nuevaLuciernaga() {
            const verde = Math.random() > 0.28;
            return {
                x: Math.random() * W,
                y: H * 0.12 + Math.random() * H * 0.82,
                vx: (Math.random() - 0.5) * 0.48,
                vy: -(Math.random() * 0.55 + 0.12),
                a: 0, aMax: Math.random() * 0.78 + 0.22,
                life: 0, maxLife: Math.random() * 300 + 130,
                r: Math.random() * 2.3 + 0.7,
                col: verde ? '175,255,95' : '255,225,75'
            };
        }
        const ff = Array.from({ length: 65 }, nuevaLuciernaga);

        let t = 0;
        (function draw() {
            requestAnimationFrame(draw);
            t += 0.016;
            const sky = ctx.createLinearGradient(0, 0, 0, H);
            sky.addColorStop(0,   '#010810');
            sky.addColorStop(0.5, '#020c1a');
            sky.addColorStop(1,   '#021224');
            ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

            estrellas.forEach(s => {
                const alpha = s.a + Math.sin(t * s.tw * 55 + s.ph) * 0.18;
                ctx.beginPath();
                ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,235,${Math.max(0.05, alpha)})`;
                ctx.fill();
            });

            const lx = luna.rx * W, ly = luna.ry * H;
            const halo = ctx.createRadialGradient(lx, ly, 0, lx, ly, luna.r * 5.5);
            halo.addColorStop(0, 'rgba(240,232,195,0.22)');
            halo.addColorStop(1, 'rgba(240,232,195,0)');
            ctx.beginPath(); ctx.arc(lx, ly, luna.r * 5.5, 0, Math.PI * 2);
            ctx.fillStyle = halo; ctx.fill();

            ctx.save();
            ctx.shadowBlur = 22; ctx.shadowColor = 'rgba(242,236,200,0.6)';
            ctx.beginPath(); ctx.arc(lx, ly, luna.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(248,243,210,0.97)'; ctx.fill();
            ctx.globalAlpha = 0.09;
            [[lx - 9, ly - 6, 7],[lx + 11, ly + 7, 5],[lx - 2, ly + 12, 4]].forEach(([cx, cy, cr]) => {
                ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2);
                ctx.fillStyle = '#c2a870'; ctx.fill();
            });
            ctx.restore();

            ff.forEach((f, i) => {
                f.life++;
                f.x += f.vx + Math.sin(t * 0.65 + i * 1.4) * 0.42;
                f.y += f.vy;
                const lp = f.life / f.maxLife;
                if      (lp < 0.15) f.a = f.aMax * (lp / 0.15);
                else if (lp > 0.75) f.a = f.aMax * ((1 - lp) / 0.25);
                else                f.a = f.aMax;
                const gr = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 8);
                gr.addColorStop(0, `rgba(${f.col},${f.a * 0.5})`);
                gr.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 8, 0, Math.PI * 2);
                ctx.fillStyle = gr; ctx.fill();
                ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${f.col},${f.a})`; ctx.fill();
                if (f.life >= f.maxLife || f.y < -20) ff[i] = nuevaLuciernaga();
            });
        }());

    /* ══════════════════════════════════════════════════════════════
       AMANECER — Cielo cálido + sol naciente
    ══════════════════════════════════════════════════════════════ */
    } else if (esAmanecer) {
        const estrellasFade = Array.from({ length: 50 }, () => ({
            x: Math.random(), y: Math.random() * 0.55,
            r: Math.random() * 1.1 + 0.2,
            a: Math.random() * 0.35 + 0.05,
            tw: Math.random() * 0.02 + 0.003,
            ph: Math.random() * Math.PI * 2
        }));

        let t = 0;
        (function draw() {
            requestAnimationFrame(draw);
            t += 0.014;

            /* Cielo amanecer */
            const sky = ctx.createLinearGradient(0, 0, 0, H);
            sky.addColorStop(0,    '#03081e');
            sky.addColorStop(0.30, '#0d1438');
            sky.addColorStop(0.55, '#2a0e3c');
            sky.addColorStop(0.70, '#7a1428');
            sky.addColorStop(0.83, '#c83808');
            sky.addColorStop(0.93, '#f07020');
            sky.addColorStop(1,    '#ffa030');
            ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

            /* Estrellas que se desvanecen */
            estrellasFade.forEach(s => {
                const alpha = (s.a + Math.sin(t * s.tw * 40 + s.ph) * 0.06) * 0.55;
                ctx.beginPath();
                ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,230,${Math.max(0.01, alpha)})`;
                ctx.fill();
            });

            /* Sol naciente — aparece desde el borde inferior izquierdo */
            const sx = W * 0.28;
            const sy = H * 0.90;
            const sunR = Math.min(W, H) * 0.055;

            /* Resplandor atmosférico amplio */
            const atm = ctx.createRadialGradient(sx, sy, 0, sx, sy, H * 0.65);
            atm.addColorStop(0,   'rgba(255,150,30,0.30)');
            atm.addColorStop(0.35,'rgba(220,70,15,0.14)');
            atm.addColorStop(0.70,'rgba(150,30,60,0.06)');
            atm.addColorStop(1,   'rgba(0,0,0,0)');
            ctx.beginPath(); ctx.arc(sx, sy, H * 0.65, 0, Math.PI * 2);
            ctx.fillStyle = atm; ctx.fill();

            /* Halo del sol */
            const haloSol = ctx.createRadialGradient(sx, sy, sunR * 0.8, sx, sy, sunR * 4);
            haloSol.addColorStop(0,   'rgba(255,220,80,0.55)');
            haloSol.addColorStop(0.4, 'rgba(255,150,30,0.20)');
            haloSol.addColorStop(1,   'rgba(255,80,10,0)');
            ctx.beginPath(); ctx.arc(sx, sy, sunR * 4, 0, Math.PI * 2);
            ctx.fillStyle = haloSol; ctx.fill();

            /* Disco solar */
            ctx.save();
            ctx.shadowColor = 'rgba(255,200,60,0.9)';
            ctx.shadowBlur = 35;
            ctx.beginPath(); ctx.arc(sx, sy, sunR, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,235,120,0.98)'; ctx.fill();
            ctx.restore();

            /* Destello horizontal en el horizonte */
            const hLine = ctx.createLinearGradient(0, H * 0.85, 0, H);
            hLine.addColorStop(0,   'rgba(255,120,30,0)');
            hLine.addColorStop(0.4, 'rgba(255,140,40,0.22)');
            hLine.addColorStop(1,   'rgba(255,185,70,0.35)');
            ctx.fillStyle = hLine; ctx.fillRect(0, H * 0.85, W, H * 0.15);

            /* Nubes cálidas en el horizonte */
            for (let i = 0; i < 4; i++) {
                const cx = W * (0.18 + i * 0.22 + Math.sin(t * 0.035 + i * 1.2) * 0.018);
                const cy = H * (0.76 + i * 0.035);
                const cw = W * (0.10 + i * 0.03);
                const cg = ctx.createLinearGradient(cx - cw, cy, cx + cw, cy);
                cg.addColorStop(0,   'rgba(255,90,20,0)');
                cg.addColorStop(0.5, `rgba(255,${110 + i * 12},${30 + i * 8},${0.14 + i * 0.02})`);
                cg.addColorStop(1,   'rgba(255,90,20,0)');
                ctx.beginPath();
                ctx.ellipse(cx, cy, cw, H * 0.016, 0, 0, Math.PI * 2);
                ctx.fillStyle = cg; ctx.fill();
            }
        }());

    /* ══════════════════════════════════════════════════════════════
       DÍA — Sol brillante + rayos + aves
    ══════════════════════════════════════════════════════════════ */
    } else {
        const bandadas = Array.from({ length: 5 }, (_, fi) => ({
            aves: Array.from({ length: 3 + Math.floor(Math.random() * 5) }, (_, bi) => ({
                ox:  (bi % 3) * 40 + Math.random() * 14,
                oy:  Math.floor(bi / 3) * 26 + Math.random() * 9,
                ph:  Math.random() * Math.PI * 2,
                sp:  0.024 + Math.random() * 0.03
            })),
            x:   -120 - fi * 300,
            y:   50 + fi * 65 + Math.random() * 50,
            vx:  0.46 + Math.random() * 0.38,
            sz:  0.80 + Math.random() * 0.48
        }));

        /* Algunas nubes blancas suaves */
        const nubes = Array.from({ length: 5 }, (_, i) => ({
            x:  Math.random(),
            y:  0.08 + Math.random() * 0.32,
            w:  0.12 + Math.random() * 0.14,
            h:  0.04 + Math.random() * 0.04,
            vx: 0.00004 + Math.random() * 0.00006
        }));

        let t = 0;
        (function draw() {
            requestAnimationFrame(draw);
            t += 0.016;

            /* Cielo diurno brillante */
            const sky = ctx.createLinearGradient(0, 0, 0, H);
            sky.addColorStop(0,    '#0b3060');
            sky.addColorStop(0.25, '#1a5a96');
            sky.addColorStop(0.55, '#2a80bc');
            sky.addColorStop(0.80, '#50a8d4');
            sky.addColorStop(1,    '#78c0e0');
            ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

            /* Sol — posición alta y visible */
            const sx = W * 0.72 + Math.sin(t * 0.004) * 6;
            const sy = H * 0.13;
            const sunR = Math.min(W, H) * 0.06;

            /* Halo atmosférico amplio */
            const atmG = ctx.createRadialGradient(sx, sy, 0, sx, sy, sunR * 9);
            atmG.addColorStop(0,   'rgba(255,255,200,0.16)');
            atmG.addColorStop(0.4, 'rgba(255,230,100,0.07)');
            atmG.addColorStop(1,   'rgba(255,200,60,0)');
            ctx.beginPath(); ctx.arc(sx, sy, sunR * 9, 0, Math.PI * 2);
            ctx.fillStyle = atmG; ctx.fill();

            /* Rayos solares girando lentamente */
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(t * 0.005);
            for (let i = 0; i < 14; i++) {
                const angle  = (i / 14) * Math.PI * 2;
                const inner  = sunR * 1.40;
                const outer  = sunR * (i % 2 === 0 ? 3.0 : 2.0);
                const x1 = Math.cos(angle) * inner, y1 = Math.sin(angle) * inner;
                const x2 = Math.cos(angle) * outer, y2 = Math.sin(angle) * outer;
                const rg = ctx.createLinearGradient(x1, y1, x2, y2);
                rg.addColorStop(0, 'rgba(255,248,160,0.40)');
                rg.addColorStop(1, 'rgba(255,230,80,0)');
                ctx.strokeStyle = rg;
                ctx.lineWidth   = i % 2 === 0 ? 3.5 : 1.8;
                ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
            }
            ctx.restore();

            /* Halo interior del sol */
            const innerGlow = ctx.createRadialGradient(sx, sy, 0, sx, sy, sunR * 2.8);
            innerGlow.addColorStop(0,   'rgba(255,255,210,0.90)');
            innerGlow.addColorStop(0.35,'rgba(255,245,150,0.45)');
            innerGlow.addColorStop(1,   'rgba(255,210,60,0)');
            ctx.beginPath(); ctx.arc(sx, sy, sunR * 2.8, 0, Math.PI * 2);
            ctx.fillStyle = innerGlow; ctx.fill();

            /* Disco solar */
            ctx.save();
            ctx.shadowColor = 'rgba(255,240,130,0.85)';
            ctx.shadowBlur  = 50;
            ctx.beginPath(); ctx.arc(sx, sy, sunR, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,225,1.0)'; ctx.fill();
            ctx.restore();

            /* Destellos de luz (God rays) */
            for (let i = 0; i < 5; i++) {
                const angle = -0.35 + i * 0.18;
                const len   = H * (0.45 + Math.random() * 0.05);
                const rg = ctx.createLinearGradient(sx, sy, sx + Math.sin(angle) * len, sy + Math.cos(angle) * len);
                rg.addColorStop(0, 'rgba(255,245,160,0.07)');
                rg.addColorStop(1, 'rgba(255,240,120,0)');
                ctx.save();
                ctx.translate(sx, sy); ctx.rotate(angle);
                ctx.beginPath();
                ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.lineTo(60, len); ctx.lineTo(-60, len);
                ctx.closePath();
                ctx.fillStyle = rg; ctx.fill();
                ctx.restore();
            }

            /* Nubes suaves */
            nubes.forEach(n => {
                n.x = (n.x + n.vx) % 1.3;
                const nw = n.w * W, nh = n.h * H;
                const nx = n.x * W, ny = n.y * H;
                const cg = ctx.createRadialGradient(nx, ny, 0, nx, ny, nw * 0.6);
                cg.addColorStop(0, 'rgba(255,255,255,0.22)');
                cg.addColorStop(0.5,'rgba(220,235,255,0.10)');
                cg.addColorStop(1, 'rgba(200,225,255,0)');
                ctx.beginPath(); ctx.ellipse(nx, ny, nw * 0.6, nh * 0.5, 0, 0, Math.PI * 2);
                ctx.fillStyle = cg; ctx.fill();
                /* Cuerpo nube */
                const cg2 = ctx.createLinearGradient(nx - nw / 2, ny, nx + nw / 2, ny);
                cg2.addColorStop(0,   'rgba(255,255,255,0)');
                cg2.addColorStop(0.5, 'rgba(255,255,255,0.18)');
                cg2.addColorStop(1,   'rgba(255,255,255,0)');
                ctx.beginPath(); ctx.ellipse(nx, ny, nw / 2, nh / 2, 0, 0, Math.PI * 2);
                ctx.fillStyle = cg2; ctx.fill();
            });

            /* Aves */
            bandadas.forEach(bk => {
                bk.x += bk.vx;
                if (bk.x > W + 250) { bk.x = -250; bk.y = 40 + Math.random() * H * 0.38; }
                ctx.save();
                ctx.translate(bk.x, bk.y);
                ctx.scale(bk.sz, bk.sz);
                ctx.strokeStyle = 'rgba(10,20,50,0.55)';
                ctx.lineWidth = 1.8; ctx.lineCap = 'round';
                bk.aves.forEach(av => {
                    av.ph += av.sp;
                    const aleteo = Math.sin(av.ph) * 6.5;
                    ctx.beginPath();
                    ctx.moveTo(av.ox - 13, av.oy);
                    ctx.quadraticCurveTo(av.ox - 6.5, av.oy - aleteo, av.ox, av.oy);
                    ctx.quadraticCurveTo(av.ox + 6.5, av.oy - aleteo, av.ox + 13, av.oy);
                    ctx.stroke();
                });
                ctx.restore();
            });
        }());
    }

}());
