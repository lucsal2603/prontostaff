/* ProntoStaff+ — movimento del sito (GSAP + ScrollTrigger + SplitText + Lenis) */
(function () {
  'use strict';

  var ridotto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var CURVA = 'power4.inOut';

  gsap.registerPlugin(ScrollTrigger, SplitText, MorphSVGPlugin);
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
      if (aperto && !ridotto && a.closest('.menu nav')) { passaggioBicchieri(dest); return; }
      chiudiMenu();
      setTimeout(function () { vaiA(dest); }, aperto ? 500 : 0);
    });
  });

  /* ---------- il passaggio coi bicchieri ----------
     Dal menu: file di bicchieri d'oro grandi passano da destra a sinistra e coprono lo schermo;
     sotto, la pagina salta dove si è cliccato; poi le file escono a sinistra e la pagina è già lì. */
  var passaggio = $('.passaggio');
  var filePassaggio = [];
  var inPassaggio = false;
  var TIPI = ['b-coppa', 'b-flute', 'b-martini', 'b-calice', 'b-tumbler'];
  function costruisciPassaggio() {
    if (filePassaggio.length) return;
    var righe = window.innerWidth < 761 ? 6 : 5;
    var passo = window.innerWidth < 761 ? 22 : 13;
    for (var r = 0; r < righe; r++) {
      var fila = document.createElement('div');
      fila.className = 'passaggio__fila';
      fila.style.top = (r * 100 / righe) + '%';
      fila.style.height = 'calc(' + (100 / righe) + '% + 2px)';
      var html = '';
      var sfasa = (r % 2) * passo / 2;
      for (var x = -passo * 0.9 + sfasa, i = 0; x < 100 + passo * 1.2; x += passo, i++) {
        var tipo = TIPI[(r * 2 + i) % TIPI.length];
        html += '<svg class="passaggio__bicchiere" style="left:' + x.toFixed(2) + 'vw" viewBox="-90 -275 180 285"><use href="#' + tipo + '" x="-90" y="-275" width="180" height="285"/></svg>';
      }
      fila.innerHTML = html;
      passaggio.appendChild(fila);
      filePassaggio.push(fila);
    }
    gsap.set('.passaggio__bicchiere', { xPercent: -50, yPercent: -50, transformOrigin: '50% 100%' });
  }
  function passaggioBicchieri(dest) {
    if (inPassaggio) return;
    inPassaggio = true;
    costruisciPassaggio();
    var bicchieri = $$('.passaggio__bicchiere');
    var largo = window.innerWidth;
    passaggio.classList.add('attivo');
    gsap.set(filePassaggio, { x: largo * 1.3 });
    gsap.set(bicchieri, { rotation: 16 });
    var tl = gsap.timeline({
      onComplete: function () {
        passaggio.classList.remove('attivo');
        inPassaggio = false;
      }
    });
    tl.to(filePassaggio, { x: 0, duration: 0.85, ease: 'power3.inOut', stagger: { each: 0.06, from: 'center' } }, 0)
      .to(bicchieri, { rotation: 0, duration: 1.1, ease: 'elastic.out(1, 0.45)', stagger: { each: 0.008, from: 'random' } }, 0.5)
      .call(function () {
        /* coperto tutto: si chiude il menu e la pagina salta dove si è cliccato */
        chiudiMenu(true);
        if (lenis) lenis.scrollTo(dest, { immediate: true, force: true });
        else if (dest === 0) window.scrollTo(0, 0);
        else dest.scrollIntoView();
        ScrollTrigger.update();
        if (window.innerWidth > 760) gsap.set('.bottone-menu', { scale: window.scrollY > window.innerHeight * 0.12 ? 1 : 0 });
      }, null, 1.15)
      .to(bicchieri, { rotation: -14, duration: 0.45, ease: 'power2.in', stagger: { each: 0.006, from: 'random' } }, 1.35)
      .to(filePassaggio, { x: function () { return -window.innerWidth * 1.35; }, duration: 0.9, ease: 'power3.inOut', stagger: { each: 0.06, from: 'center' } }, 1.4);
  }

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
    /* una molla per ogni pulsante: segue il mouse e torna a posto con un piccolo rimbalzo,
       senza tween che si accavallano (prima il ritorno cancellava le altre animazioni) */
    var molle = [];
    $$('.magnete').forEach(function (el) {
      var dentro = $('.testo, .linee', el);
      var forza = el.querySelector('.tondo') ? 0.35 : 0.25;
      var m = { el: el, dentro: dentro, x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, ferma: true };
      var sx = gsap.quickSetter(el, 'x', 'px'), sy = gsap.quickSetter(el, 'y', 'px');
      var dx = dentro ? gsap.quickSetter(dentro, 'x', 'px') : null, dy = dentro ? gsap.quickSetter(dentro, 'y', 'px') : null;
      m.applica = function () { sx(m.x); sy(m.y); if (dx) { dx(m.x * 0.5); dy(m.y * 0.5); } };
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        m.tx = (e.clientX - (r.left - m.x + r.width / 2)) * forza;
        m.ty = (e.clientY - (r.top - m.y + r.height / 2)) * forza;
        m.ferma = false;
      });
      el.addEventListener('mouseleave', function () { m.tx = 0; m.ty = 0; m.ferma = false; });
      molle.push(m);
    });
    gsap.ticker.add(function (t, dt) {
      var k = Math.min(dt, 40) / 16.667;
      molle.forEach(function (m) {
        if (m.ferma) return;
        m.vx += (m.tx - m.x) * 0.09 * k; m.vy += (m.ty - m.y) * 0.09 * k;
        var smorza = Math.pow(0.78, k);
        m.vx *= smorza; m.vy *= smorza;
        m.x += m.vx * k; m.y += m.vy * k;
        if (Math.abs(m.tx - m.x) < 0.05 && Math.abs(m.ty - m.y) < 0.05 && Math.abs(m.vx) < 0.05 && Math.abs(m.vy) < 0.05) {
          m.x = m.tx; m.y = m.ty; m.ferma = true;
        }
        m.applica();
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
  function chiudiMenu(subito) {
    if (!html.classList.contains('menu-aperto')) return;
    var dur = ridotto || subito === true ? 0 : 0.8;
    html.classList.remove('menu-aperto');
    bottone.setAttribute('aria-expanded', 'false');
    bottone.setAttribute('aria-label', 'Apri il menu');
    pannello.setAttribute('aria-hidden', 'true');
    if (lenis) lenis.start();
    gsap.to(pannello, { x: function () { return pannello.offsetWidth + 120; }, duration: dur, ease: CURVA, overwrite: true });
    gsap.to(curvaMenu, { attr: { d: PIENA }, duration: dur, ease: CURVA });
    if (window.innerWidth > 760 && window.scrollY < 120) gsap.to('.bottone-menu', { scale: 0, duration: 0.3, ease: 'power2.out' });
  }
  /* il «+» del menu: uno solo, che scivola da una voce all'altra come una gomma */
  var segno = $('.menu__segno');
  var vociMenu = $$('.menu nav a');
  var sezioniMenu = vociMenu.map(function (a) { var id = a.getAttribute('href'); return id === '#inizio' ? document.body : $(id); });
  var vocAttiva = 0, segnoY = null;
  function centroVoce(i) { return vociMenu[i].offsetTop + vociMenu[i].offsetHeight / 2; }
  function vaiSegno(i, subito) {
    var y = centroVoce(i);
    if (subito || segnoY === null || ridotto) { gsap.set(segno, { y: y }); segnoY = y; return; }
    var d = Math.abs(y - segnoY);
    if (d < 1) return;
    segnoY = y;
    var allunga = 1 + Math.min(d / 80, 1.3);
    gsap.to(segno, { y: y, duration: 0.95, ease: 'elastic.out(1, 0.55)', overwrite: 'auto' });
    gsap.timeline({ overwrite: 'auto' })
      .to(segno, { scaleY: allunga, scaleX: 0.72, duration: 0.16, ease: 'power2.out' })
      .to(segno, { scaleY: 1, scaleX: 1, duration: 0.9, ease: 'elastic.out(1, 0.32)' });
    gsap.to(segno, { rotation: '+=90', duration: 1, ease: 'elastic.out(1, 0.45)' });
  }
  function sezioneAttuale() {
    var y = window.scrollY + window.innerHeight * 0.4, scelta = 0;
    sezioniMenu.forEach(function (s, i) { if (s && s !== document.body && s.getBoundingClientRect().top + window.scrollY <= y) scelta = i; });
    return scelta;
  }
  vociMenu.forEach(function (a, i) { a.addEventListener('mouseenter', function () { vaiSegno(i); }); });
  $('.menu nav').addEventListener('mouseleave', function () { vaiSegno(vocAttiva); });
  bottone.addEventListener('click', function () {
    if (html.classList.contains('menu-aperto')) return;
    vocAttiva = sezioneAttuale();
    vaiSegno(vocAttiva, true);
    gsap.fromTo(segno, { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 1, delay: 0.35, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' });
  });

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
    /* il rinforzo: lo staff c'è, mancano tre persone, arrivano quelle di ProntoStaff+ */
    SplitText.create('.rinforzo__frase', {
      type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: function (s) {
        return gsap.from(s.lines, { yPercent: 105, duration: 1.1, stagger: 0.1, ease: 'power4.out', scrollTrigger: { trigger: '.rinforzo', start: 'top 80%' } });
      }
    });
    var staff = $$('.omino--staff'), oro = $$('.omino--oro'), posti = $$('.posto');
    var piu = $$('.omino__piu');
    gsap.set(oro, { y: -420, opacity: 0 });
    gsap.set(piu, { scale: 0, rotation: -90, transformOrigin: '50% 50%' });
    gsap.set(posti, { opacity: 0 });
    var tlR = gsap.timeline({ scrollTrigger: { trigger: '.rinforzo__squadra', start: 'top 78%', toggleActions: 'play none none reverse' } });
    tlR.from(staff, { y: 46, opacity: 0, duration: 0.9, stagger: 0.06, ease: 'power3.out' }, 0)
      .to(posti, { opacity: 1, duration: 0.6, stagger: 0.12, ease: 'power2.out' }, 0.45)
      .fromTo(posti, { strokeDashoffset: 60 }, { strokeDashoffset: 0, duration: 1.4, ease: 'none' }, 0.45);
    oro.forEach(function (o, i) {
      var t = 1.25 + i * 0.32;
      tlR.to(o, { opacity: 1, duration: 0.2 }, t)
        .to(o, { y: 0, duration: 0.9, ease: 'power4.out' }, t)
        .to(posti[i], { opacity: 0, duration: 0.3 }, t + 0.55)
        .fromTo(o, { scaleY: 1, scaleX: 1 }, { keyframes: [{ scaleY: 0.92, scaleX: 1.05, duration: 0.1 }, { scaleY: 1, scaleX: 1, duration: 0.45, ease: 'elastic.out(1, 0.5)' }], transformOrigin: '50% 100%' }, t + 0.5)
        .to(piu[i], { scale: 1, rotation: 0, duration: 0.7, ease: 'back.out(2.4)' }, t + 0.62);
    });
    tlR.from('.rinforzo__voce', { opacity: 0, y: 14, duration: 0.8, stagger: 0.12 }, 2.4);

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
    /* sugli schermi senza mouse il nome che scorre resta sempre sullo schermo, sopra le sezioni */
    var fisso = window.matchMedia('(hover: none)').matches;
    if (fisso) {
      var nome = $('.nome-scorre');
      document.body.appendChild(nome);
      nome.classList.add('nome-scorre--fisso');
    }
    if (ridotto) {
      car.remove();
      $$('.anteprima, .cursore, .cursore-testo').forEach(function (el) { el.remove(); });
      misuraMarchio();
      gsap.set('.bottone-menu', { scale: 1 });
      return;
    }
    var tl = gsap.timeline({
      onComplete: function () {
        car.remove();
        if (lenis) lenis.start();
        ScrollTrigger.refresh();
      }
    });
    gsap.set('.apertura__dentro', { y: 160 });
    /* il logo animato: vassoio, bicchieri, cerchio, il «+» e la scritta */
    var logo = animaLogo($('.caricamento .logo-scena'));
    tl.add(logo, 0.15);
    var fine = 0.15 + logo.duration() + 0.1;
    tl.to('.caricamento .logo-scena', { y: -30, opacity: 0, duration: 0.45, ease: 'power2.in' }, fine)
      .to('.caricamento', { yPercent: -100, duration: 0.8, ease: CURVA }, fine + 0.15)
      .to('.caricamento__curva path', { attr: { d: 'M0 0 L1000 0 Q500 0 0 0Z' }, duration: 0.8, ease: CURVA }, fine + 0.45)
      .to('.apertura__dentro', { y: 0, duration: 1.2, ease: 'power4.out' }, fine + 0.3);
    if (fisso) {
      gsap.set('.nome-scorre--fisso', { y: 160 });
      tl.to('.nome-scorre--fisso', { y: 0, duration: 1.2, ease: 'power4.out' }, fine + 0.3);
    }
    costruisci();
  }

  var pronti = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([pronti, new Promise(function (r) { setTimeout(r, 2000); })]).then(entra);
})();
