/* ProntoStaff+ — movimento del sito (GSAP + ScrollTrigger + SplitText + Lenis) */
(function () {
  'use strict';

  var ridotto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var CURVA = 'power4.inOut';

  gsap.registerPlugin(ScrollTrigger, SplitText);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  /* ---------- scorrimento morbido ---------- */
  var lenis = null;
  if (!ridotto) {
    lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  function vaiA(dest) {
    if (lenis) lenis.scrollTo(dest, { duration: 1.6, easing: function (t) { return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2; } });
    else if (dest === 0) window.scrollTo(0, 0);
    else dest.scrollIntoView();
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      var dest = id === '#inizio' ? 0 : $(id);
      if (dest === null) return;
      e.preventDefault();
      var aperto = document.documentElement.classList.contains('menu-aperto');
      chiudiMenu();
      setTimeout(function () { vaiA(dest); }, aperto ? 500 : 0);
    });
  });

  /* ---------- marchio: «Staff by Pronto» diventa «ProntoStaff+» ---------- */
  var marchio = $('.marchio');
  function misuraMarchio() {
    var riga = $('.marchio__riga');
    var pezzi = riga.children;
    var a = pezzi[0].getBoundingClientRect().width;
    var b = pezzi[1].getBoundingClientRect().width;
    var c = pezzi[2].getBoundingClientRect().width;
    marchio.style.setProperty('--a', a + 'px');
    marchio.style.setProperty('--w1', (a + b + 1) + 'px');
    marchio.style.setProperty('--w2', (b + c + 1) + 'px');
  }

  /* ---------- pulsanti magnetici ---------- */
  if (conMouse && !ridotto) {
    $$('.magnete').forEach(function (el) {
      var dentro = $('.testo, .linee', el) || el.firstElementChild;
      var forza = el.classList.contains('bottone-menu') || el.querySelector('.tondo') ? 0.35 : 0.25;
      var ex = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'power3.out' });
      var ey = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'power3.out' });
      var tx = dentro ? gsap.quickTo(dentro, 'x', { duration: 0.8, ease: 'power3.out' }) : null;
      var ty = dentro ? gsap.quickTo(dentro, 'y', { duration: 0.8, ease: 'power3.out' }) : null;
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - r.left - r.width / 2;
        var dy = e.clientY - r.top - r.height / 2;
        ex(dx * forza); ey(dy * forza);
        if (tx) { tx(dx * forza * 0.5); ty(dy * forza * 0.5); }
      });
      el.addEventListener('mouseleave', function () {
        gsap.to(el, { x: 0, y: 0, duration: 1.4, ease: 'elastic.out(1, 0.3)', overwrite: true });
        if (dentro) gsap.to(dentro, { x: 0, y: 0, duration: 1.4, ease: 'elastic.out(1, 0.3)', overwrite: true });
      });
    });

    /* il riempimento che sale dal basso: un cerchio grande quanto serve a coprire tutto il pulsante */
    $$('.tondo, .pillola').forEach(function (b) {
      var riempi = $('.riempi', b);
      if (!riempi) return;
      var D = 0, H = 0, uscita = null;
      function misura() {
        var w = b.offsetWidth; H = b.offsetHeight;
        D = Math.ceil(Math.sqrt(w * w + H * H) * 1.15);
        gsap.set(riempi, { width: D, height: D, left: (w - D) / 2, top: 0 });
      }
      misura();
      gsap.set(riempi, { y: H });
      window.addEventListener('resize', function () {
        misura();
        gsap.set(riempi, { y: b.classList.contains('pieno') ? (H - D) / 2 : H });
      });
      b.addEventListener('mouseenter', function () {
        if (uscita) { uscita.kill(); uscita = null; }
        if (!b.classList.contains('pieno')) { misura(); gsap.set(riempi, { y: H }); }
        b.classList.add('pieno');
        gsap.to(riempi, { y: (H - D) / 2, duration: 0.5, ease: 'power3.out', overwrite: true });
      });
      b.addEventListener('mouseleave', function () {
        b.classList.remove('pieno');
        uscita = gsap.to(riempi, {
          y: -D, duration: 0.45, ease: 'power3.in', overwrite: true,
          onComplete: function () { gsap.set(riempi, { y: H }); uscita = null; }
        });
      });
    });
  }

  /* ---------- il globo che gira ---------- */
  var meridiani = $$('.globo-meridiano, .globo-meridiano-2');
  if (meridiani.length && !ridotto) {
    var ang = 0;
    gsap.ticker.add(function (t, dt) {
      ang += dt * 0.0012;
      meridiani[0].setAttribute('rx', (14 * Math.abs(Math.cos(ang))).toFixed(2));
      meridiani[1].setAttribute('rx', (14 * Math.abs(Math.cos(ang + Math.PI / 2))).toFixed(2));
    });
  }

  /* ---------- menu ---------- */
  var html = document.documentElement;
  var pannello = $('.menu');
  var bottone = $('.bottone-menu button');
  var curvaMenu = $('.menu__curva path');
  var PIENA = 'M100 0 L100 1000 Q-100 500 100 0';
  var PIATTA = 'M100 0 L100 1000 Q100 500 100 0';
  function apriMenu() {
    html.classList.add('menu-aperto');
    bottone.setAttribute('aria-expanded', 'true');
    bottone.setAttribute('aria-label', 'Chiudi il menu');
    pannello.setAttribute('aria-hidden', 'false');
    if (lenis) lenis.stop();
    gsap.to(pannello, { x: 0, duration: ridotto ? 0 : 0.8, ease: CURVA, overwrite: true });
    gsap.fromTo(curvaMenu, { attr: { d: PIENA } }, { attr: { d: PIATTA }, duration: ridotto ? 0 : 1, ease: CURVA });
    gsap.fromTo($$('.menu nav a'), { x: ridotto ? 0 : 80 }, { x: 0, duration: 0.8, stagger: 0.05, ease: CURVA, delay: 0.05 });
    gsap.to('.bottone-menu', { scale: 1, duration: 0.3, ease: 'power2.out' });
  }
  function chiudiMenu() {
    if (!html.classList.contains('menu-aperto')) return;
    html.classList.remove('menu-aperto');
    bottone.setAttribute('aria-expanded', 'false');
    bottone.setAttribute('aria-label', 'Apri il menu');
    pannello.setAttribute('aria-hidden', 'true');
    if (lenis) lenis.start();
    gsap.to(pannello, { x: function () { return pannello.offsetWidth + 120; }, duration: ridotto ? 0 : 0.8, ease: CURVA, overwrite: true });
    gsap.to(curvaMenu, { attr: { d: PIENA }, duration: ridotto ? 0 : 0.8, ease: CURVA });
    if (window.innerWidth > 760 && window.scrollY < 120) gsap.to('.bottone-menu', { scale: 0, duration: 0.3, ease: 'power2.out' });
  }
  bottone.addEventListener('click', function () { if (html.classList.contains('menu-aperto')) chiudiMenu(); else apriMenu(); });
  $('.velo-menu').addEventListener('click', chiudiMenu);
  window.addEventListener('keydown', function (e) { if (e.key === 'Escape') chiudiMenu(); });

  /* ---------- orologio di Milano ---------- */
  var orologio = $('.orologio');
  function ora() {
    try {
      orologio.textContent = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' }).format(new Date());
    } catch (e) { orologio.textContent = ''; }
  }
  ora(); setInterval(ora, 10000);

  /* ---------- tutte le animazioni allo scroll ---------- */
  function costruisci() {
    misuraMarchio();
    var mm = gsap.matchMedia();

    /* il nome che scorre: va sempre, cambia verso con lo scroll */
    var parole = $$('.nome-scorre__fila p');
    var xP = 0, verso = -1;
    gsap.ticker.add(function (t, dt) {
      if (xP <= -100) xP = 0;
      if (xP > 0) xP = -100;
      gsap.set(parole, { xPercent: xP });
      xP += 0.0055 * dt * verso;
    });
    gsap.to('.nome-scorre__fila', {
      x: '-=300px', ease: 'none',
      scrollTrigger: {
        trigger: document.documentElement, start: 0, end: function () { return window.innerHeight; }, scrub: 0.25,
        onUpdate: function (s) { verso = s.direction * -1; }
      }
    });

    /* l'apertura scivola più lenta della pagina */
    gsap.to('.apertura__dentro', {
      yPercent: 30, ease: 'none',
      scrollTrigger: { trigger: '.apertura', start: 'top top', end: 'bottom top', scrub: true }
    });

    /* il bottone tondo del menu compare quando la testata esce */
    mm.add('(min-width: 761px)', function () {
      ScrollTrigger.create({
        trigger: document.documentElement, start: 0, end: function () { return window.innerHeight * 0.12; },
        onLeave: function () { gsap.to('.bottone-menu', { scale: 1, duration: 0.25, ease: 'power1.out' }); },
        onEnterBack: function () {
          if (!html.classList.contains('menu-aperto')) gsap.to('.bottone-menu', { scale: 0, duration: 0.25, ease: 'power1.out' });
        }
      });
      gsap.set('.bottone-menu', { scale: window.scrollY > window.innerHeight * 0.12 ? 1 : 0 });
    });
    mm.add('(max-width: 760px)', function () { gsap.set('.bottone-menu', { scale: 1 }); });

    /* intro: le parole salgono dalla maschera */
    SplitText.create('.intro__frase', {
      type: 'words', mask: 'words', autoSplit: true,
      onSplit: function (s) {
        return gsap.from(s.words, { yPercent: 100, duration: 0.8, stagger: 0.012, ease: 'power3.out', scrollTrigger: { trigger: '.intro', start: 'top 75%' } });
      }
    });
    gsap.from('.intro__lato p', { opacity: 0, duration: 1.2, scrollTrigger: { trigger: '.intro', start: 'top 70%' } });
    gsap.from('.intro__tondo', { scale: 0.6, opacity: 0, duration: 1, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.intro__tondo', start: 'top 92%' } });

    /* figure: le righe entrano */
    $$('.voce').forEach(function (v) {
      gsap.from(v, { y: 50, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: v, start: 'top 92%' } });
    });

    /* la cornice che segue il mouse, col cerchio d'oro */
    if (conMouse && window.innerWidth > 760) {
      var anteprima = $('.anteprima'), cerchio = $('.cursore'), scritta = $('.cursore-testo');
      var binario = $('.anteprima__binario');
      gsap.set([anteprima, cerchio, scritta], { scale: 0 });
      var ax = gsap.quickTo(anteprima, 'x', { duration: 0.8, ease: 'power3.out' }), ay = gsap.quickTo(anteprima, 'y', { duration: 0.8, ease: 'power3.out' });
      var cx = gsap.quickTo(cerchio, 'x', { duration: 0.5, ease: 'power3.out' }), cy = gsap.quickTo(cerchio, 'y', { duration: 0.5, ease: 'power3.out' });
      var sx = gsap.quickTo(scritta, 'x', { duration: 0.45, ease: 'power3.out' }), sy = gsap.quickTo(scritta, 'y', { duration: 0.45, ease: 'power3.out' });
      var elenco = $('.figure__elenco');
      var mostra = function (si) {
        gsap.to([anteprima, cerchio, scritta], { scale: si ? 1 : 0, duration: 0.4, ease: si ? 'power3.out' : 'power3.in', overwrite: 'auto' });
      };
      window.addEventListener('mousemove', function (e) {
        ax(e.clientX); ay(e.clientY); cx(e.clientX); cy(e.clientY); sx(e.clientX); sy(e.clientY);
      });
      $$('.voce').forEach(function (v) {
        v.addEventListener('mouseenter', function () {
          binario.style.top = (-100 * parseInt(v.getAttribute('data-indice'), 10)) + '%';
          mostra(true);
        });
      });
      elenco.addEventListener('mouseleave', function () { mostra(false); });
    }

    gsap.from('.figure__altro', { y: 30, opacity: 0, duration: 1, scrollTrigger: { trigger: '.figure__altro', start: 'top 95%' } });

    /* le due file vanno in versi opposti */
    /* il carosello: due file che vanno sempre, in versi opposti, e accelerano con lo scroll */
    var giri = [];
    $$('.fila').forEach(function (f, i) {
      $$('.tessera', f).forEach(function (t) {
        var copia = t.cloneNode(true);
        copia.setAttribute('aria-hidden', 'true');
        f.appendChild(copia);
      });
      giri.push(i === 0
        ? gsap.fromTo(f, { xPercent: 0 }, { xPercent: -50, duration: 46, ease: 'none', repeat: -1 })
        : gsap.fromTo(f, { xPercent: -50 }, { xPercent: 0, duration: 46, ease: 'none', repeat: -1 }));
    });
    ScrollTrigger.create({
      trigger: '.file', start: 'top bottom', end: 'bottom top',
      onUpdate: function (s) {
        var spinta = Math.min(6, 1 + Math.abs(s.getVelocity()) / 400);
        giri.forEach(function (g) {
          gsap.to(g, {
            timeScale: spinta, duration: 0.2, overwrite: true,
            onComplete: function () { gsap.to(g, { timeScale: 1, duration: 1.2, ease: 'power2.out' }); }
          });
        });
      }
    });

    /* metodo */
    SplitText.create('.metodo__capo h2', {
      type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: function (s) {
        return gsap.from(s.lines, { yPercent: 105, duration: 1.1, stagger: 0.08, ease: 'power4.out', scrollTrigger: { trigger: '.metodo', start: 'top 80%' } });
      }
    });
    gsap.from('.metodo__capo p', { opacity: 0, duration: 1.2, scrollTrigger: { trigger: '.metodo', start: 'top 75%' } });
    var passi = $$('.passo');
    gsap.from(passi.map(function (p) { return $('.passo__linea', p); }), { scaleX: 0, duration: 1.4, stagger: 0.1, ease: CURVA, scrollTrigger: { trigger: '.passi', start: 'top 85%' } });
    gsap.from(passi.map(function (p) { return $('.passo__segno', p); }), { scale: 0, rotation: -90, transformOrigin: '50% 50%', duration: 0.9, stagger: 0.1, delay: 0.3, ease: 'back.out(2)', scrollTrigger: { trigger: '.passi', start: 'top 85%' } });
    gsap.from(passi.map(function (p) { return [$('h3', p), $('p', p)]; }).flat(), { y: 30, opacity: 0, duration: 1, stagger: 0.06, delay: 0.25, ease: 'power3.out', scrollTrigger: { trigger: '.passi', start: 'top 85%' } });

    /* la curva si ritira e il piede sale da sotto */
    var ellisse = $('.curva i');
    gsap.set(ellisse, { xPercent: -50 });
    gsap.fromTo(ellisse, { yPercent: 0 }, { yPercent: -13.4, ease: 'none', scrollTrigger: { trigger: '.piede', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    gsap.fromTo('.piede__dentro, .piede__fondo', { yPercent: -22 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.piede', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    gsap.fromTo('.piede__freccia', { rotation: 45 }, { rotation: 0, ease: 'none', scrollTrigger: { trigger: '.piede', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    gsap.fromTo('.piede__chiama', { xPercent: 40 }, { xPercent: 0, ease: 'none', scrollTrigger: { trigger: '.piede', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  }

  /* ---------- l'ingresso ---------- */
  function entra() {
    var car = $('.caricamento');
    if (ridotto) {
      car.remove();
      $$('.anteprima, .cursore, .cursore-testo').forEach(function (el) { el.remove(); });
      misuraMarchio();
      gsap.set('.bottone-menu', { scale: 1 });
      return;
    }
    var parola = $('.caricamento__parola span');
    var benvenuti = ['Benvenuti', 'Welcome', 'Bienvenue', 'Bienvenidos', 'Willkommen', 'Bem-vindos', 'Välkommen', 'Καλώς ήρθατε', 'Benvenuti'];
    var tl = gsap.timeline({
      onComplete: function () {
        car.remove();
        if (lenis) lenis.start();
        ScrollTrigger.refresh();
      }
    });
    gsap.set('.apertura__dentro', { y: 160 });
    tl.to('.caricamento__parola', { opacity: 0.85, duration: 0.6, ease: 'power2.out' }, 0.25);
    benvenuti.forEach(function (w, i) {
      if (i === 0) return;
      tl.call(function () { parola.textContent = w; }, null, 1.05 + (i - 1) * 0.16);
    });
    var fine = 1.05 + (benvenuti.length - 1) * 0.16 + 0.25;
    tl.to('.caricamento__parola', { opacity: 0, duration: 0.3, ease: 'power2.in' }, fine)
      .to('.caricamento', { yPercent: -100, duration: 0.8, ease: CURVA }, fine + 0.15)
      .to('.caricamento__curva path', { attr: { d: 'M0 0 L1000 0 Q500 0 0 0Z' }, duration: 0.8, ease: CURVA }, fine + 0.45)
      .to('.apertura__dentro', { y: 0, duration: 1.2, ease: 'power4.out' }, fine + 0.3);
    costruisci();
  }

  var pronti = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([pronti, new Promise(function (r) { setTimeout(r, 2000); })]).then(entra);
})();
