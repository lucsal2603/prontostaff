/* ProntoStaff+ — movimento del sito (GSAP + ScrollTrigger + SplitText + Lenis) */
(function () {
  'use strict';

  var ridotto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  gsap.registerPlugin(ScrollTrigger, SplitText);
  gsap.defaults({ ease: 'expo.out', duration: 1.2 });

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  /* ---------- scorrimento morbido ---------- */
  var lenis = null;
  if (!ridotto) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  /* ---------- ancore ---------- */
  function vaiA(dest) {
    if (lenis) lenis.scrollTo(dest, { duration: 1.8, easing: function (t) { return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2; } });
    else if (dest === 0) window.scrollTo(0, 0);
    else dest.scrollIntoView();
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      var dest = id === '#inizio' ? 0 : $(id);
      if (dest === null) return;
      e.preventDefault();
      var aspetta = document.documentElement.classList.contains('menu-aperto');
      chiudiMenu();
      setTimeout(function () { vaiA(dest); }, aspetta ? 450 : 0);
    });
  });

  /* ---------- testata ---------- */
  var testata = $('.testata');
  var ultimo = 0;
  function suScroll(y) {
    testata.classList.toggle('scesa', y > 40);
    if (document.documentElement.classList.contains('menu-aperto')) return;
    if (y > 240 && y > ultimo + 4) testata.classList.add('nascosta');
    else if (y < ultimo - 4 || y < 240) testata.classList.remove('nascosta');
    ultimo = y;
  }
  if (lenis) lenis.on('scroll', function (l) { suScroll(l.scroll); });
  else window.addEventListener('scroll', function () { suScroll(window.scrollY); }, { passive: true });

  /* ---------- menu del telefono ---------- */
  var menu = $('.menu');
  var bottoneMenu = $('.testata__menu');
  var tlMenu = null;
  function apriMenu() {
    document.documentElement.classList.add('menu-aperto');
    bottoneMenu.setAttribute('aria-expanded', 'true');
    bottoneMenu.setAttribute('aria-label', 'Chiudi il menu');
    menu.setAttribute('aria-hidden', 'false');
    if (lenis) lenis.stop();
    if (tlMenu) tlMenu.kill();
    gsap.set(menu, { visibility: 'visible' });
    tlMenu = gsap.timeline()
      .fromTo(menu, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: ridotto ? 0.01 : 0.9, ease: 'expo.inOut' })
      .fromTo($$('.menu nav a span'), { yPercent: ridotto ? 0 : 110 }, { yPercent: 0, duration: 1, stagger: 0.06 }, '-=0.45')
      .fromTo('.menu__piede', { opacity: 0 }, { opacity: 1, duration: 0.8 }, '-=0.7');
  }
  function chiudiMenu() {
    if (!document.documentElement.classList.contains('menu-aperto')) return;
    document.documentElement.classList.remove('menu-aperto');
    bottoneMenu.setAttribute('aria-expanded', 'false');
    bottoneMenu.setAttribute('aria-label', 'Apri il menu');
    menu.setAttribute('aria-hidden', 'true');
    if (lenis) lenis.start();
    if (tlMenu) tlMenu.kill();
    tlMenu = gsap.timeline()
      .to(menu, { clipPath: 'inset(0% 0% 100% 0%)', duration: ridotto ? 0.01 : 0.7, ease: 'expo.inOut' })
      .set(menu, { visibility: 'hidden' });
  }
  bottoneMenu.addEventListener('click', function () {
    if (document.documentElement.classList.contains('menu-aperto')) chiudiMenu(); else apriMenu();
  });
  window.addEventListener('keydown', function (e) { if (e.key === 'Escape') chiudiMenu(); });

  /* ---------- pulsanti magnetici ---------- */
  if (conHover && !ridotto) {
    $$('.magnete').forEach(function (el) {
      var mx = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.45)' });
      var my = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.45)' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * 0.28);
        my((e.clientY - r.top - r.height / 2) * 0.38);
      });
      el.addEventListener('pointerleave', function () { mx(0); my(0); });
    });
  }

  /* ---------- l'apertura: la finestra della foto ---------- */
  var foto = $('.apertura__foto');
  var fotoImg = $('.apertura__foto img');
  var finestra = { apri: 0, scorri: 0 };
  function rettangolo() {
    var w = window.innerWidth, h = window.innerHeight;
    var m = Math.max(20, Math.min(64, w * 0.04));
    if (w > 960) return { t: h * 0.19, r: w * 0.07, b: h * 0.19, l: w * 0.64 };
    if (w > 600) return { t: h * 0.42, r: m, b: h * 0.2, l: w * 0.5 };
    return { t: h * 0.47, r: m, b: h * 0.25, l: w * 0.5 };
  }
  function disegnaFinestra() {
    var R = rettangolo();
    var h = window.innerHeight;
    var q = finestra.apri, p = finestra.scorri;
    var w = window.innerWidth;
    var alto = h - R.t - R.b;
    var k = 1 - p;
    /* la cornice cresce dal basso all'ingresso, poi si allarga a tutto schermo */
    var top = (R.t + alto * (1 - q)) * k;
    var sinistra = R.l * k;
    var largo = w - (R.l + R.r) * k;
    var altezza = (alto * q) * k + h * p;
    foto.style.transform = 'translate3d(' + sinistra.toFixed(1) + 'px,' + top.toFixed(1) + 'px,0)';
    foto.style.width = largo.toFixed(1) + 'px';
    foto.style.height = altezza.toFixed(1) + 'px';
    foto.style.borderRadius = (6 * k).toFixed(1) + 'px';
  }
  window.addEventListener('resize', disegnaFinestra);
  /* nella finestra piccola si vedono i calici, non la giacca */
  function spostamento() { return 0; }

  /* ---------- reveal dei titoli ---------- */

  function costruisci() {
    /* titoli delle sezioni: righe che salgono dalla maschera */
    var sopra = SplitText.create('.apertura__sopra .titolo', { type: 'lines', mask: 'lines' });
    gsap.set(sopra.lines, { yPercent: 110 });
    $$('.sezione .titolo, .pausa .titolo, .chiamata .titolo, .passo h3, .ruolo h3, .piede__motto').forEach(function (el) {
      SplitText.create(el, {
        type: 'lines', mask: 'lines', autoSplit: true,
        onSplit: function (s) {
          return gsap.from(s.lines, {
            yPercent: 110, duration: 1.4, stagger: 0.09,
            scrollTrigger: { trigger: el, start: 'top 88%' }
          });
        }
      });
    });

    /* etichette e paragrafi */
    $$('.sezione .etichetta, .pausa .etichetta, .chiamata .etichetta, .galleria .etichetta').forEach(function (el) {
      gsap.from(el, { opacity: 0, x: -16, duration: 1.1, scrollTrigger: { trigger: el, start: 'top 92%' } });
      var segno = $('svg', el);
      if (segno) gsap.from(segno, { rotation: -180, scale: 0, transformOrigin: '50% 50%', duration: 1.4, ease: 'back.out(2.2)', scrollTrigger: { trigger: el, start: 'top 92%' } });
    });
    $$('.manifesto__firma p, .metodo__capo p, .galleria__capo p, .chiamata__frase, .caso p').forEach(function (el) {
      gsap.from(el, { opacity: 0, y: 28, duration: 1.3, scrollTrigger: { trigger: el, start: 'top 90%' } });
    });

    /* apertura: la foto si apre a tutto schermo */
    var tlA = gsap.timeline({
      scrollTrigger: { trigger: '.apertura', start: 'top top', end: '+=150%', pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true }
    });
    tlA.to(finestra, { scorri: 1, duration: 1, ease: 'power2.inOut', onUpdate: disegnaFinestra }, 0)
      .fromTo(fotoImg, { scale: 1.12, xPercent: spostamento }, { scale: 1, xPercent: 0, duration: 1, ease: 'power2.inOut' }, 0)
      .to('.apertura__testi', { yPercent: -18, opacity: 0, duration: 0.5, ease: 'power2.in' }, 0)
      .to('.apertura__velo', { opacity: 1, duration: 0.5, ease: 'none' }, 0.45)
      .to(sopra.lines, { yPercent: 0, duration: 0.45, stagger: 0.07, ease: 'power3.out' }, 0.7)
      .from('.apertura__sopra p', { opacity: 0, y: 24, duration: 0.4, ease: 'power3.out' }, 0.85)
      .to({}, { duration: 0.35 });

    /* manifesto: le parole si accendono */
    var m = SplitText.create('.manifesto__testo', { type: 'words', wordsClass: 'parola' });
    gsap.to(m.words, {
      opacity: 1, ease: 'none', stagger: 0.1,
      scrollTrigger: { trigger: '.manifesto__testo', start: 'top 78%', end: 'bottom 52%', scrub: 0.6 }
    });

    /* quando: le foto si danno il cambio */
    var immagini = $$('.quando__cornice img');
    var casi = $$('.caso');
    var attuale = 0;
    function mostra(i) {
      if (i === attuale) return;
      casi.forEach(function (c, j) { c.classList.toggle('attivo', j === i); });
      immagini.forEach(function (img, j) {
        if (j === 0) return;
        if (j <= i && j > attuale) {
          gsap.fromTo(img, { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.18 }, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.4, ease: 'expo.inOut', overwrite: true });
        } else if (j > i && j <= attuale) {
          gsap.to(img, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut', overwrite: true });
        }
      });
      attuale = i;
    }
    casi.forEach(function (c, i) {
      ScrollTrigger.create({
        trigger: c, start: 'top 62%', end: 'bottom 62%',
        onToggle: function (s) { if (s.isActive) mostra(i); }
      });
    });
    gsap.fromTo('.quando__cornice', { clipPath: 'inset(12% 8% 12% 8% round 6px)' }, {
      clipPath: 'inset(0% 0% 0% 0% round 6px)', ease: 'none',
      scrollTrigger: { trigger: '.quando', start: 'top 90%', end: 'top 10%', scrub: 0.8 }
    });

    /* figure: il binario orizzontale */
    var binario = $('.figure__binario');
    var figure = $$('.figura');
    var nomi = $$('.figure__nomi span');
    gsap.set(nomi, { yPercent: function (i) { return i === 0 ? 0 : 110; } });
    var corsa = function () { return binario.scrollWidth - window.innerWidth; };
    var nomeAttivo = 0;
    var tlF = gsap.to(binario, {
      x: function () { return -corsa(); }, ease: 'none',
      scrollTrigger: {
        trigger: '.figure', start: 'top top', end: function () { return '+=' + corsa() * 1.1; },
        pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: function (s) {
          var i = Math.min(figure.length - 1, Math.round(s.progress * (figure.length - 1)));
          if (i !== nomeAttivo) {
            var su = i > nomeAttivo;
            gsap.to(nomi[nomeAttivo], { yPercent: su ? -110 : 110, duration: 0.7, ease: 'expo.inOut', overwrite: true });
            gsap.fromTo(nomi[i], { yPercent: su ? 110 : -110 }, { yPercent: 0, duration: 0.7, ease: 'expo.inOut', overwrite: true });
            nomeAttivo = i;
          }
        }
      }
    });
    gsap.to('.figure__filo i', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.figure', start: 'top top', end: function () { return '+=' + corsa() * 1.1; }, scrub: 1, invalidateOnRefresh: true } });
    figure.forEach(function (f, i) {
      var img = $('.figura__foto img', f);
      gsap.fromTo(img, { xPercent: 8 }, { xPercent: -8, ease: 'none', scrollTrigger: { trigger: f, containerAnimation: tlF, start: 'left right', end: 'right left', scrub: true } });
      if (i === 0) return;
      gsap.from($('.figura__foto', f), { clipPath: 'inset(0% 0% 0% 100% round 6px)', ease: 'none', scrollTrigger: { trigger: f, containerAnimation: tlF, start: 'left 95%', end: 'left 35%', scrub: true } });
      gsap.from([$('.figura__nome', f), $('.figura__testo', f), $('.figura__voci', f)], { x: 120, opacity: 0, stagger: 0.08, ease: 'none', scrollTrigger: { trigger: f, containerAnimation: tlF, start: 'left 80%', end: 'left 25%', scrub: true } });
    });

    /* metodo: il filo d'oro e i segni */
    gsap.to('.passi__filo i', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.passi', start: 'top 65%', end: 'bottom 65%', scrub: 0.6 } });
    $$('.passo').forEach(function (p) {
      gsap.to($('.passo__segno', p), { scale: 1, rotation: 0, transformOrigin: '50% 50%', duration: 1.1, ease: 'back.out(2.4)', scrollTrigger: { trigger: p, start: 'top 65%', toggleActions: 'play none none reverse' } });
      gsap.from($('p', p), { opacity: 0, y: 24, duration: 1.2, scrollTrigger: { trigger: p, start: 'top 80%' } });
      gsap.from($('.passo__chi', p), { opacity: 0, duration: 1.2, delay: 0.2, scrollTrigger: { trigger: p, start: 'top 80%' } });
    });

    /* pausa: parallasse */
    gsap.fromTo('.pausa__foto', { yPercent: -9, scale: 1.08 }, { yPercent: 9, scale: 1, ease: 'none', scrollTrigger: { trigger: '.pausa', start: 'top bottom', end: 'bottom top', scrub: true } });

    /* nastro: corre sempre, accelera con lo scroll */
    var fila = $('.nastro__fila');
    var pezzo = $('.nastro__pezzo');
    fila.appendChild(pezzo.cloneNode(true));
    var giro = gsap.to(fila, { xPercent: -50, duration: 38, ease: 'none', repeat: -1 });
    var verso = 1;
    ScrollTrigger.create({
      trigger: '.nastro', start: 'top bottom', end: 'bottom top',
      onUpdate: function (s) {
        var v = s.getVelocity();
        if (Math.abs(v) > 30) verso = v > 0 ? 1 : -1;
        var spinta = Math.min(5, 1 + Math.abs(v) / 700);
        gsap.to(giro, { timeScale: verso * spinta, duration: 0.25, overwrite: true });
        gsap.to(giro, { timeScale: verso, duration: 1.2, delay: 0.25 });
      }
    });

    /* voi e noi */
    $$('.ruolo').forEach(function (r, i) {
      gsap.from(r, { yPercent: 14, opacity: 0, duration: 1.5, delay: i * 0.12, scrollTrigger: { trigger: '.ruoli__griglia', start: 'top 85%' } });
      gsap.from($$('li', r), { opacity: 0, x: -20, stagger: 0.07, duration: 1, delay: 0.3 + i * 0.12, scrollTrigger: { trigger: '.ruoli__griglia', start: 'top 75%' } });
    });

    /* galleria: colonne a velocità diverse, scatti che si aprono */
    $$('.galleria__colonna').forEach(function (c) {
      var v = parseFloat(c.getAttribute('data-velocita')) || 0;
      gsap.fromTo(c, { yPercent: -v }, { yPercent: v, ease: 'none', scrollTrigger: { trigger: '.galleria__colonne', start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('.scatto').forEach(function (s) {
      var tl = gsap.timeline({ scrollTrigger: { trigger: s, start: 'top 92%' } });
      tl.from(s, { clipPath: 'inset(100% 0% 0% 0% round 6px)', duration: 1.5, ease: 'expo.inOut' })
        .from($('img', s), { scale: 1.35, duration: 1.8, ease: 'expo.out' }, 0.15);
    });

    /* chiamata */
    gsap.fromTo('.chiamata__alone', { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, ease: 'none', scrollTrigger: { trigger: '.chiamata', start: 'top bottom', end: 'center center', scrub: true } });
    gsap.from('.chiamata__pulsanti .pillola', { y: 40, opacity: 0, stagger: 0.08, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.chiamata__pulsanti', start: 'top 92%' } });

    /* piede: il marchio sale dal bordo */
    var tlM = gsap.timeline({ scrollTrigger: { trigger: '.piede__marchio', start: 'top 95%' } });
    tlM.from('.m-pronto', { y: 360, duration: 1.6, ease: 'expo.out' })
      .from('.m-staff', { y: 360, duration: 1.6, ease: 'expo.out' }, 0.12)
      .from('.m-piu', { rotation: -180, scale: 0, transformOrigin: '50% 50%', duration: 1.6, ease: 'back.out(1.8)' }, 0.45);
    gsap.from('.piede__griglia > *', { opacity: 0, y: 30, stagger: 0.08, duration: 1.2, scrollTrigger: { trigger: '.piede', start: 'top 85%' } });
  }

  /* ---------- l'ingresso ---------- */
  function entra() {
    var car = $('.caricamento');
    var righe = $$('.apertura__titolo .riga, .apertura__motto .riga');
    gsap.set(['.apertura__titolo', '.apertura__motto', '.apertura__basso'], { visibility: 'visible' });

    gsap.set(fotoImg, { xPercent: spostamento() });
    if (ridotto) {
      car.remove();
      finestra.apri = 1; disegnaFinestra();
      costruisci();
      return;
    }

    gsap.set(righe, { yPercent: 110 });
    gsap.set('.apertura__basso', { opacity: 0, y: 20 });
    gsap.set(fotoImg, { scale: 1.35 });
    disegnaFinestra();

    var conto = { v: 0 };
    var numero = $('.caricamento__conto');
    var tl = gsap.timeline({
      onComplete: function () {
        car.remove();
        costruisci();
        if (lenis) lenis.start();
        ScrollTrigger.refresh();
      }
    });
    tl.to(conto, { v: 100, duration: 2.1, ease: 'power2.inOut', onUpdate: function () { numero.textContent = Math.round(conto.v); } }, 0)
      .to('.caricamento__barra', { scaleX: 1, duration: 2.1, ease: 'power2.inOut' }, 0)
      .from('.c-pronto', { y: 360, duration: 1.4, ease: 'expo.out' }, 0.2)
      .from('.c-staff', { y: 360, duration: 1.4, ease: 'expo.out' }, 0.36)
      .from('.c-piu', { rotation: -270, scale: 0, transformOrigin: '50% 50%', duration: 1.5, ease: 'back.out(1.7)' }, 0.7)
      .to('.c-piu', { rotation: 90, transformOrigin: '50% 50%', duration: 0.9, ease: 'expo.inOut' }, 2.0)
      .to('.caricamento__logo', { y: -40, opacity: 0, duration: 0.8, ease: 'expo.in' }, 2.35)
      .to('.caricamento__fondo', { opacity: 0, duration: 0.5, ease: 'power2.in' }, 2.35)
      .to(car, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.25, ease: 'expo.inOut' }, 2.7)
      .to(righe, { yPercent: 0, duration: 1.5, stagger: 0.1, ease: 'expo.out' }, 3.25)
      .to(finestra, { apri: 1, duration: 1.7, ease: 'expo.inOut', onUpdate: disegnaFinestra }, 3.0)
      .to(fotoImg, { scale: 1.12, duration: 2.2, ease: 'expo.out' }, 3.0)
      .to('.apertura__basso', { opacity: 1, y: 0, duration: 1.3 }, 3.8);
  }

  var pronto = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([pronto, new Promise(function (r) { setTimeout(r, 2500); })]).then(entra);
})();
