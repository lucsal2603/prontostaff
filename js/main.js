/* ProntoStaff+ — tutte le animazioni della pagina.
   GSAP 3.15 (ScrollTrigger, SplitText, DrawSVG) + Lenis.
   Ogni scena è una funzione; l'ordine di creazione segue l'ordine della pagina
   perché i pin spostano tutto quello che sta sotto. */
(function () {
  'use strict';

  gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const QS = new URLSearchParams(location.search);
  const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const MOBILE = () => innerWidth < 701;
  const ORO = '#f4c73e', AVORIO = '#f2eee6';
  const GRASSETTO = (c, w) => `${w}px ${w}px 0 ${c},-${w}px -${w}px 0 ${c},${w}px -${w}px 0 ${c},-${w}px ${w}px 0 ${c}`;

  /* Le foto arrivano dopo: basta mettere qui il nome (senza .jpg) di quelle
     caricate in img/ e compaiono al posto del segnaposto. */
  const FOTO_PRONTE = [];

  /* Recapiti: da compilare quando ProntoStaff+ li conferma. */
  const CONTATTI = { email: '', telefono: '' };

  const stages = {};
  let lenis = null;

  if (RIDOTTO) document.documentElement.classList.add('reduced');

  /* ================= scroll morbido ================= */

  function avviaLenis() {
    if (RIDOTTO) return;
    lenis = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  function vaiA(target) {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { duration: 1.6, offset: 0 });
    else el.scrollIntoView();
  }

  /* ================= foto ================= */

  function foto() {
    $$('[data-foto]').forEach((fig) => {
      const nome = fig.dataset.foto;
      if (!FOTO_PRONTE.includes(nome)) return;
      const img = new Image();
      img.alt = fig.dataset.alt || 'Lo staff di ProntoStaff+ al lavoro';
      img.decoding = 'async';
      img.onload = () => { fig.prepend(img); fig.classList.add('ha-foto'); };
      img.src = `img/${nome}.jpg`;
    });
  }

  /* ================= ingresso ================= */

  function ingresso(fatto) {
    const sip = $('[data-sipario]');
    if (RIDOTTO || QS.has('qa') || !sip) { if (sip) sip.remove(); fatto(); return; }

    const nastro = $('.sipario__nastro path', sip);
    const lettere = $$('.sl', sip);
    const piu = $('.sl--piu', sip);
    const oro = $('.sipario__onda--oro', sip);
    const carbone = $('.sipario__onda--carbone', sip);
    const logo = $('.sipario__logo', sip);

    gsap.set([oro, carbone], { drawSVG: '0% 100%' });
    gsap.set(nastro, { drawSVG: '0% 0%', strokeWidth: 0 });
    gsap.set(lettere, { scale: 0, rotation: () => gsap.utils.random(-25, 25), transformOrigin: '50% 60%' });

    let caricato = document.readyState === 'complete';
    let logoFinito = false;
    let uscito = false;
    addEventListener('load', () => { caricato = true; prova(); });

    const tl = gsap.timeline({ delay: 0.25, onComplete: () => { logoFinito = true; prova(); } }).timeScale(1.25);
    tl.to(nastro, { strokeWidth: 26, duration: 1, ease: 'power2.in' }, 0)
      .to(nastro, { drawSVG: '0% 7%', duration: 0.7, ease: 'power2.in' }, 0)
      .to(nastro, { drawSVG: '40% 47%', duration: 1.2, ease: 'none' }, 0.7)
      .to(nastro, { drawSVG: '100% 100%', duration: 1.1, ease: 'power2.inOut' }, '-=0.5')
      .to(nastro, { strokeWidth: 0, duration: 0.5, ease: 'power2.in' }, '-=0.55')
      .to(lettere.filter((l) => l !== piu), { scale: 1, rotation: 0, duration: 0.6, stagger: 0.06, ease: 'back.out(3)' }, '-=1.1')
      .fromTo(piu, { rotation: -180, scale: 0 }, { rotation: 0, scale: 1, duration: 0.8, ease: 'back.out(3)' }, '-=0.35')
      .to({}, { duration: 0.25 });

    setTimeout(() => { caricato = true; logoFinito = true; prova(); }, 6500);

    function prova() {
      if (!caricato || !logoFinito || uscito) return;
      uscito = true;
      const esci = gsap.timeline({
        onComplete: () => { sip.remove(); }
      });
      esci.to({}, { duration: 0.15 })
        .addLabel('via')
        .to(carbone, { drawSVG: '50% 100%', strokeWidth: 1000, x: 900, y: 1800, duration: 0.65, ease: 'power2.inOut' }, 'via')
        .to(logo, { opacity: 0, duration: 0.15, ease: 'power1.out' }, 'via+=0.13')
        .to(oro, { drawSVG: '50% 100%', strokeWidth: 1000, x: -900, y: 1800, duration: 0.65, ease: 'power2.inOut' }, 'via+=0.1625')
        .add(fatto, 'via+=0.3');
    }
  }

  /* ================= nav ================= */

  function nav() {
    const bar = $('[data-nav]');
    let ultimo = 0;
    const su = (y) => {
      const giu = y > ultimo && y > 140;
      bar.classList.toggle('is-nascosta', giu && !document.body.classList.contains('menu-aperto'));
      bar.classList.toggle('is-scesa', y > 60);
      ultimo = y;
    };
    if (lenis) lenis.on('scroll', ({ scroll }) => su(scroll));
    else addEventListener('scroll', () => su(scrollY), { passive: true });

    // pill con lo scarabocchio oro dietro
    $$('.nav__pill').forEach((p) => {
      const path = $('path', p);
      gsap.set(path, { drawSVG: '0%' });
      const tl = gsap.timeline({ paused: true })
        .to(path, { drawSVG: '100%', strokeWidth: 24, duration: 0.5, ease: 'power1.inOut' });
      p.addEventListener('mouseenter', () => { tl.timeScale(1).play(); p.classList.add('is-sopra'); });
      p.addEventListener('mouseleave', () => { tl.timeScale(1.4).reverse(); p.classList.remove('is-sopra'); });
    });

    // link interni con lo scroll morbido
    $$('a[href^="#"]').forEach((a) => {
      if (a.hasAttribute('data-apri-contatti') || a.hasAttribute('data-vai-squadra')) return;
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id.length < 2) { e.preventDefault(); vaiA(document.body); return; }
        const t = $(id);
        if (!t) return;
        e.preventDefault();
        chiudiMenu();
        vaiA(t);
      });
    });

    // menu del telefono
    const burger = $('[data-burger]');
    const menu = $('[data-menu]');
    const voci = $$('.menu__voce', menu);
    const a = $('.burger__a', burger), b = $('.burger__b', burger);
    let aperto = false;
    burger.addEventListener('click', () => (aperto ? chiudiMenu() : apriMenu()));
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && aperto) chiudiMenu(); });

    function apriMenu() {
      aperto = true;
      document.body.classList.add('menu-aperto');
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', 'Chiudi il menu');
      menu.setAttribute('aria-hidden', 'false');
      if (lenis) lenis.stop();
      gsap.killTweensOf([menu, voci, a, b]);
      gsap.set(menu, { visibility: 'visible' });
      gsap.to(menu, { opacity: 1, duration: 0.4, ease: 'power2.out' });
      gsap.to(a, { attr: { d: 'M13 13L27 27' }, duration: 0.45, ease: 'power3.inOut' });
      gsap.to(b, { attr: { d: 'M13 27L27 13' }, duration: 0.45, ease: 'power3.inOut' });
      voci.forEach((v, i) => {
        gsap.fromTo(v,
          { x: -35, y: 50, scale: 0.4, rotation: gsap.utils.random(-10, 10), opacity: 0 },
          { x: 0, y: 0, scale: 1, rotation: gsap.utils.random(-3, 3), opacity: 1, duration: 0.75, ease: 'back.out(2.2)', delay: 0.15 + i * 0.09 });
      });
    }
    function chiudiMenu() {
      if (!aperto) return;
      aperto = false;
      document.body.classList.remove('menu-aperto');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Apri il menu');
      menu.setAttribute('aria-hidden', 'true');
      if (lenis) lenis.start();
      gsap.killTweensOf([menu, voci, a, b]);
      gsap.to(voci, { opacity: 0, y: 20, scale: 0.8, duration: 0.25, stagger: 0.04, ease: 'power2.in' });
      gsap.to(menu, { opacity: 0, duration: 0.3, delay: 0.1, ease: 'power2.in', onComplete: () => gsap.set(menu, { visibility: 'hidden' }) });
      gsap.to(a, { attr: { d: 'M11 16h18' }, duration: 0.45, ease: 'power3.inOut' });
      gsap.to(b, { attr: { d: 'M11 24h18' }, duration: 0.45, ease: 'power3.inOut' });
    }
    nav.chiudiMenu = chiudiMenu;
  }
  function chiudiMenu() { if (nav.chiudiMenu) nav.chiudiMenu(); }

  /* ================= pulsanti magnetici ================= */

  function pulsanti() {
    if (!FINE || RIDOTTO) return;
    $$('.btn').forEach((btn) => {
      const dentro = [$('.btn__testo', btn), $('.btn__icona', btn)].filter(Boolean);
      const icona = $('.btn__icona svg', btn);
      const xTo = gsap.quickTo(btn, 'x', { duration: 0.3, ease: 'power2.out' });
      const yTo = gsap.quickTo(btn, 'y', { duration: 0.3, ease: 'power2.out' });
      const ixTo = dentro.map((d) => gsap.quickTo(d, 'x', { duration: 0.3, ease: 'power2.out' }));
      const iyTo = dentro.map((d) => gsap.quickTo(d, 'y', { duration: 0.3, ease: 'power2.out' }));
      let giro = null;
      btn.addEventListener('mouseenter', () => {
        if (!icona) return;
        giro = gsap.timeline({ repeat: -1, repeatDelay: 0.2 })
          .to(icona, { rotation: -25, duration: 0.22, ease: 'power2.out' })
          .to(icona, { rotation: 0, duration: 0.4, ease: 'back.out(2.5)' });
      });
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const cx = r.left + r.width / 2 - gsap.getProperty(btn, 'x');
        const cy = r.top + r.height / 2 - gsap.getProperty(btn, 'y');
        const dx = e.clientX - cx, dy = e.clientY - cy;
        xTo(dx * 0.35); yTo(dy * 0.35);
        ixTo.forEach((f) => f(dx * 0.15)); iyTo.forEach((f) => f(dy * 0.15));
      });
      btn.addEventListener('mouseleave', () => {
        if (giro) { giro.kill(); giro = null; }
        gsap.to(btn, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1.1, 0.4)', overwrite: true });
        gsap.to(dentro, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1.1, 0.4)', overwrite: true });
        if (icona) gsap.to(icona, { rotation: 0, duration: 0.35, overwrite: true });
      });
    });
  }

  /* ================= righe in maschera (titoli) ================= */

  const righeSplit = new Map();
  function righe(el) {
    if (righeSplit.has(el)) return righeSplit.get(el);
    const s = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'riga-linea' });
    s.masks.forEach((m) => m.classList.add('riga-maschera'));
    righeSplit.set(el, s);
    return s;
  }
  function entraRighe(el, opts) {
    const s = righe(el);
    return gsap.fromTo(s.lines, { yPercent: 115, opacity: 0 },
      Object.assign({ yPercent: 0, opacity: 1, duration: 0.85 / 0.75, stagger: 0.12 / 0.75, ease: 'back.out(1.4)' }, opts || {}));
  }

  function titoli() {
    $$('[data-righe]').forEach((el) => {
      if (el.closest('[data-hero]') || el.closest('[data-sabato]') || el.closest('[data-altro]')) return;
      if (RIDOTTO) return;
      const s = righe(el);
      gsap.set(s.lines, { yPercent: 115, opacity: 0 });
      ScrollTrigger.create({
        trigger: el, start: 'top 85%',
        onEnter: () => entraRighe(el)
      });
    });
    if (RIDOTTO) return;
    $$('.etichetta').forEach((e) => {
      if (e.closest('[data-chi]') || e.closest('.metodo')) return;
      gsap.from(e, { y: 16, opacity: 0, duration: 0.7, ease: 'power3.out', scrollTrigger: { trigger: e, start: 'top 88%' } });
    });
  }

  /* pop delle pill come in two26: guscio con back.out(2.5), testo in maschera */
  function popPill(pills, tl, partenza, totale) {
    pills.forEach((p, i) => {
      const r = parseFloat(getComputedStyle(p).getPropertyValue('--r')) || 0;
      const testo = $('.pill__testo', p);
      gsap.set(p, { rotation: r });
      const t = partenza + (i / pills.length) * totale * 0.7;
      tl.fromTo(p, { opacity: 0, scale: 0.4, y: 20, rotation: r }, { opacity: 1, scale: 1, y: 0, rotation: r, duration: 0.55, ease: 'back.out(2.5)' }, t);
      if (testo) tl.fromTo(testo, { yPercent: 105 }, { yPercent: 0, duration: 0.5, ease: 'back.out(1.6)' }, t + 0.15);
    });
  }

  /* ================= hero ================= */

  function hero() {
    const svg = $('[data-brigata]');
    const st = Brigata.stage(svg, [
      { tipo: 'bartender', x: 345, phase: 0.1 },
      { tipo: 'hostess', x: 640, phase: 0.55, scale: 0.97 },
      { tipo: 'facchino', x: 965, phase: 0.3, scale: 1.03 },
      { tipo: 'cameriere', x: 1255, phase: 0.8 }
    ]);
    stages.hero = st;
    /* sul telefono restano in tre, più grandi: si legge PRONTO, STAFF, + */
    const POS = { desk: [345, 640, 965, 1255], tel: [-400, 100, 350, 600] };
    const inquadra = () => {
      const tel = MOBILE();
      const xs = tel ? POS.tel : POS.desk;
      st.chars.forEach((c, i) => {
        c.x = xs[i];
        c.root.setAttribute('transform', `translate(${xs[i]} 0) scale(${c.scale})`);
        c.root.style.display = tel && i === 0 ? 'none' : '';
      });
      svg.setAttribute('viewBox', tel ? '40 -440 720 450' : '0 -440 1600 450');
    };
    inquadra();
    addEventListener('resize', inquadra);

    // clic su un omino: saltello e fumetto "Pronto!"
    svg.addEventListener('click', (e) => {
      const g = e.target.closest('.omino');
      if (!g) return;
      const c = st.chars.find((x) => x.root === g);
      saluta(c);
    });

    // passo più svelto quando si scorre
    let spinta = 0;
    gsap.ticker.add(() => {
      const v = lenis ? Math.abs(lenis.velocity) : 0;
      spinta += (Math.min(v / 18, 2.2) - spinta) * 0.08;
      st.speed = 1 + spinta;
    });

    ScrollTrigger.create({
      trigger: '[data-hero]', start: 'top bottom', end: 'bottom top',
      onToggle: (s) => (s.isActive && !RIDOTTO ? st.play() : st.pause())
    });

    if (RIDOTTO) {
      st.chars.forEach((c) => { c.stand = 1; });
      st.redraw();
      return;
    }

    // stato iniziale, prima che il sipario si apra
    const titolo = $('.hero__titolo');
    const s = righe(titolo);
    gsap.set(s.lines, { yPercent: 115, opacity: 0 });
    const pills = $$('.hero__testa .pill');
    gsap.set(pills, { opacity: 0 });
    const anelli = $$('.hero__anello path');
    gsap.set(anelli, { drawSVG: '0%', strokeWidth: 0 });
    gsap.set(st.chars.map((c) => c.inner), { y: 80, opacity: 0 });

    // nastro curvo
    const nastro = $('[data-nastro]');
    const fascia = $('.nastro__fascia', nastro);
    const maschera = $('.nastro__maschera', nastro);
    gsap.set([fascia, maschera], { drawSVG: '100% 100%' });
    nastroScorre(nastro);

    hero.entra = () => {
      st.play();
      const righeTot = s.lines.length * 0.12 + 0.5;
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } }).timeScale(0.75);
      tl.fromTo(s.lines, { yPercent: 115, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.85, stagger: 0.12, ease: 'back.out(1.4)' }, 0);
      popPill(pills, tl, 0.2, righeTot);
      anelli.forEach((p, i) => tl.to(p, { drawSVG: '100%', strokeWidth: 30, duration: 0.9 }, righeTot * 0.4 + i * 0.15));
      tl.to(st.chars.map((c) => c.inner), { y: 0, opacity: 1, duration: 0.9, stagger: 0.1, ease: 'back.out(1.4)' }, 0.25);
      tl.to([fascia, maschera], {
        drawSVG: '0% 100%', duration: 1.3, ease: 'power2.out',
        onComplete: () => $('.nastro__gruppo', nastro).removeAttribute('mask')
      }, 0.5);
    };

    // uscendo dall'hero il titolo sale e sfuma, la brigata resta
    gsap.to('.hero__testa', {
      yPercent: -30, opacity: 0.2, ease: 'none',
      scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true }
    });
  }

  function saluta(c) {
    if (!c || c.salutando) return;
    c.salutando = true;
    const NS = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'fumetto');
    const rect = document.createElementNS(NS, 'rect');
    const txt = document.createElementNS(NS, 'text');
    txt.textContent = 'Pronto!';
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('y', 8);
    g.append(rect, txt);
    c.inner.appendChild(g);
    const w = txt.getComputedTextLength() + 40;
    rect.setAttribute('x', -w / 2); rect.setAttribute('y', -22);
    rect.setAttribute('width', w); rect.setAttribute('height', 44); rect.setAttribute('rx', 22);
    gsap.set(g, { x: 20, y: -420, transformOrigin: '0% 100%', scale: 0.3, opacity: 0, rotation: -12 });
    gsap.timeline({ onComplete: () => { g.remove(); c.salutando = false; } })
      .to(c, { hop: 22, duration: 0.18, ease: 'power2.out' }, 0)
      .to(c, { hop: 0, duration: 0.42, ease: 'bounce.out' }, 0.18)
      .to(g, { scale: 1, opacity: 1, rotation: -4, duration: 0.5, ease: 'back.out(2.5)' }, 0.05)
      .to(g, { y: -440, opacity: 0, duration: 0.35, ease: 'power2.in' }, 1.5);
  }

  /* testo che scorre sul nastro curvo, più svelto se si scorre la pagina */
  function nastroScorre(nastro) {
    const tp = $('.nastro__percorso', nastro);
    const unita = $('.nastro__unita', nastro);
    tp.appendChild(unita.cloneNode(true));
    tp.appendChild(unita.cloneNode(true));
    let lung = unita.getComputedTextLength();
    let off = 0, spinta = 0;
    document.fonts.ready.then(() => { lung = unita.getComputedTextLength(); });
    gsap.ticker.add((t, dt) => {
      if (RIDOTTO) return;
      const v = lenis ? lenis.velocity : 0;
      spinta += (gsap.utils.clamp(-30, 30, v * 1.2) - spinta) * 0.1;
      off -= (75 * dt) / 1000 + Math.abs(spinta) * 0.6;
      if (off < -lung) off += lung;
      tp.setAttribute('startOffset', off.toFixed(1));
    });
  }

  /* ================= chi siamo: l'onda di lettere ================= */

  function chi() {
    const testo = $('[data-onda]');
    const s = SplitText.create(testo, { type: 'words,chars', wordsClass: 'parola', charsClass: 'char' });
    const adesivi = $$('.adesivo');
    const r = adesivi.map((a) => parseFloat(getComputedStyle(a).getPropertyValue('--r')) || 0);
    if (RIDOTTO) { gsap.set(s.chars, { color: AVORIO }); gsap.set(adesivi, { rotation: (i) => r[i] }); return; }

    const tot = s.chars.length;
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '[data-chi]', start: 'top top',
        end: () => '+=' + Math.round(innerHeight * (MOBILE() ? 1.5 : 2.4)),
        pin: true, scrub: MOBILE() ? 0.6 : 0.8, anticipatePin: 1, invalidateOnRefresh: true
      }
    });
    s.chars.forEach((ch, i) => {
      const t = (i / tot) * 85;
      tl.to(ch, { color: ORO, scale: 1.12, rotation: gsap.utils.random(-4, 4), textShadow: GRASSETTO(ORO, 0.6), duration: 3.5, ease: 'power1.out' }, t)
        .to(ch, { color: AVORIO, scale: 1, rotation: 0, textShadow: GRASSETTO('rgba(0,0,0,0)', 0), duration: 3.5, ease: 'power1.inOut' }, t + 3.5);
    });
    gsap.set(adesivi, { opacity: 0, rotation: (i) => r[i] });
    [35, 72, 96].forEach((pos, i) => {
      if (!adesivi[i]) return;
      tl.fromTo(adesivi[i], { opacity: 0, scale: 0.6, y: 24, rotation: r[i] }, { opacity: 1, scale: 1, y: 0, rotation: r[i], duration: 6, ease: 'back.out(2)' }, pos);
    });
    tl.set({}, {}, 104);

    gsap.from('[data-chi] .etichetta', { y: 16, opacity: 0, duration: 0.7, ease: 'power3.out', scrollTrigger: { trigger: '[data-chi]', start: 'top 70%' } });
  }

  /* ================= galleria: nastro di foto che cambia verso ================= */

  function galleria() {
    const track = $('[data-galleria-binario]');
    const originali = Array.from(track.children);
    let largSet = 0;
    function costruisci() {
      Array.from(track.children).slice(originali.length).forEach((n) => n.remove());
      const primo = originali[0];
      const w = track.scrollWidth;
      const copie = Math.max(3, Math.ceil((innerWidth * 3.5) / Math.max(1, w)));
      for (let c = 0; c < copie; c++) originali.forEach((o) => { const k = o.cloneNode(true); k.setAttribute('aria-hidden', 'true'); track.appendChild(k); });
      largSet = track.children[originali.length].offsetLeft - primo.offsetLeft;
    }
    costruisci();
    let attesa = null;
    addEventListener('resize', () => { clearTimeout(attesa); attesa = setTimeout(costruisci, 200); });
    if (RIDOTTO) return;

    const slides = () => Array.from(track.children);
    let x = 0, dir = -1, curDir = -1, spinta = 0, attiva = false;
    const BASE = 2.4;
    ScrollTrigger.create({
      trigger: '[data-galleria]', start: 'top bottom', end: 'bottom top',
      onToggle: (s) => { attiva = s.isActive; }
    });
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (s) => {
        dir = s.direction === 1 ? -1 : 1;
        spinta = Math.min(Math.abs(s.getVelocity()) / 220, 10) * dir;
      }
    });
    const setX = gsap.quickSetter(track, 'x', 'px');
    gsap.ticker.add(() => {
      if (!attiva || !largSet) return;
      const k = gsap.ticker.deltaRatio(60);
      curDir += (dir - curDir) * 0.06 * k;
      spinta *= Math.pow(0.92, k);
      x += (BASE * curDir + spinta) * k;
      if (x <= -largSet) x += largSet;
      if (x > 0) x -= largSet;
      setX(x);
      const centro = innerWidth / 2;
      for (const sl of slides()) {
        const c = sl.offsetLeft + x + sl.offsetWidth / 2;
        const d = Math.min(1, Math.abs(c - centro) / (innerWidth * 0.45));
        sl.style.transform = `scale(${(0.95 + 0.05 * d).toFixed(4)})`;
      }
    });
  }

  /* ================= un sabato: tre comande e la sala ================= */

  function personaSVG(cls) {
    return `<svg viewBox="0 0 20 40" aria-hidden="true"><g class="${cls}"><circle cx="10" cy="6" r="5"/><path d="M3 16Q3 12 7 12H13Q17 12 17 16V27H14V40H6V27H3Z"/></g></svg>`;
  }

  function sabato() {
    const sala = $('[data-sala]');
    const STAFF = 22, TOT = 36;
    for (let i = 0; i < TOT; i++) {
      const d = document.createElement('div');
      d.className = 'posto';
      d.innerHTML = i < STAFF ? personaSVG('persona')
        : `<svg viewBox="0 0 20 40" aria-hidden="true"><g class="persona--vuota"><circle cx="10" cy="6" r="5"/><path d="M3 16Q3 12 7 12H13Q17 12 17 16V27H14V40H6V27H3Z"/></g><g class="persona--oro"><circle cx="10" cy="6" r="5"/><path d="M3 16Q3 12 7 12H13Q17 12 17 16V27H14V40H6V27H3Z"/></g></svg>`;
      sala.appendChild(d);
    }
    const vuoti = $$('.persona--vuota', sala);
    const pieni = $$('.persona--oro', sala);
    const comande = $$('.comanda');
    const num = { servono: $('[data-conta="servono"]'), mancano: $('[data-conta="mancano"]') };
    const titolo = $('.sabato__titolo');
    const chiusa = $('.sabato__chiusa');

    if (RIDOTTO) {
      num.servono.textContent = '36'; num.mancano.textContent = '0';
      gsap.set(vuoti, { opacity: 0 });
      return;
    }

    const conta = { servono: 0, mancano: 0 };
    const scrivi = () => {
      num.servono.textContent = Math.round(conta.servono);
      num.mancano.textContent = Math.round(conta.mancano);
    };

    gsap.set(comande, { yPercent: -130, opacity: 0, rotation: -10 });
    gsap.set([...vuoti, ...pieni], { opacity: 0, scale: 0.5, transformOrigin: '50% 100%' });
    const sc = righe(chiusa);
    gsap.set(sc.lines, { yPercent: 115, opacity: 0 });
    const st = righe(titolo);
    gsap.set(st.lines, { yPercent: 115, opacity: 0 });
    ScrollTrigger.create({ trigger: '[data-sabato]', start: 'top 70%', onEnter: () => entraRighe(titolo) });

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: '[data-sabato]', start: 'top top',
        end: () => '+=' + Math.round(innerHeight * 3.2),
        pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true
      }
    });
    const passi = [[8, 0, 0], [24, 2, 2], [36, 14, 14]];
    comande.forEach((c, i) => {
      const t = 0.6 + i * 1.6;
      tl.to(c, { yPercent: 0, opacity: 1, rotation: [-1.5, 1.2, -0.8][i], duration: 1, ease: 'back.out(1.6)' }, t);
      tl.to(conta, { servono: passi[i][0], mancano: passi[i][1], duration: 0.8, ease: 'power1.inOut', onUpdate: scrivi }, t + 0.3);
      const da = i === 0 ? 0 : passi[i - 1][2];
      const nuovi = vuoti.slice(da, passi[i][2]);
      if (nuovi.length) tl.to(nuovi, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.04, ease: 'back.out(2)' }, t + 0.4);
    });
    tl.to(pieni, { opacity: 1, scale: 1, duration: 0.6, stagger: 0.09, ease: 'back.out(2.2)' }, 5.6);
    tl.to(vuoti, { opacity: 0, duration: 0.3, stagger: 0.09 }, 5.8);
    tl.to(conta, { mancano: 0, duration: 1.6, ease: 'power1.inOut', onUpdate: scrivi }, 5.6);
    tl.to(sc.lines, { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.25, ease: 'back.out(1.4)' }, 7.4);
    tl.to({}, { duration: 1 }, 8.6);
  }

  /* ================= le figure: la linea oro e gli omini dentro le parole ================= */

  const VIEWBOX = {
    cameriere: [-62, -400, 196, 410],
    bartender: [-70, -410, 170, 420],
    facchino: [-60, -400, 212, 410],
    hostess: [-56, -400, 250, 410]
  };

  function figure() {
    const corpo = $('[data-figure-corpo]');
    const via = $('[data-figure-via]');
    const chiara = $('.figure__via-chiara', via);
    const oro = $('.figure__via-oro', via);
    const ruoli = $$('.ruolo', corpo);

    const mini = ruoli.map((r) => {
      const tipo = r.dataset.ruolo;
      const svg = $('.ruolo__svg', r);
      svg.setAttribute('viewBox', VIEWBOX[tipo].join(' '));
      const st = Brigata.stage(svg, [{ tipo, x: 0, phase: Math.random() }]);
      ScrollTrigger.create({ trigger: r, start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive && !RIDOTTO ? st.play() : st.pause()) });
      return { r, tipo, st, box: $('.ruolo__omino', r), pill: $('.ruolo__pill', r), primo: $('.ruolo__nome span', r) };
    });
    stages.figure = mini.map((m) => m.st);

    const larghezza = (m) => {
      const h = m.box.getBoundingClientRect().height;
      const vb = VIEWBOX[m.tipo];
      return (h * vb[2]) / vb[3];
    };

    /* la via passa dagli omini: curva morbida calcolata sulla pagina vera */
    let lunghezze = [];
    function disegnaVia() {
      const cr = corpo.getBoundingClientRect();
      const w = cr.width, h = cr.height;
      via.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const pts = [[w * 0.94, -20]];
      mini.forEach((m) => {
        const pr = m.primo.getBoundingClientRect();
        const bx = m.box.getBoundingClientRect();
        pts.push([pr.right - cr.left + larghezza(m) / 2, bx.top - cr.top + bx.height * 0.55]);
      });
      pts.push([w * 0.08, h + 20]);
      // Catmull-Rom -> Bézier, con lunghezze cumulative per sapere quando la linea arriva a ogni omino
      let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
      const parziali = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
        const k = 0.9;
        const c1 = [p1[0] + ((p2[0] - p0[0]) / 6) * k, p1[1] + ((p2[1] - p0[1]) / 6) * k];
        const c2 = [p2[0] - ((p3[0] - p1[0]) / 6) * k, p2[1] - ((p3[1] - p1[1]) / 6) * k];
        d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
        parziali.push(d);
      }
      chiara.setAttribute('d', d);
      oro.setAttribute('d', d);
      const tot = oro.getTotalLength();
      const prova = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      via.appendChild(prova);
      lunghezze = parziali.slice(0, mini.length).map((pd) => { prova.setAttribute('d', pd); return prova.getTotalLength() / tot; });
      prova.remove();
    }

    if (RIDOTTO) {
      mini.forEach((m) => { gsap.set(m.box, { width: larghezza(m) }); gsap.set(m.pill, { scale: 1, rotation: -5 }); m.st.chars[0].stand = 1; m.st.redraw(); });
      disegnaVia();
      return;
    }

    let tl = null, misura = '';
    function costruisci() {
      const m = corpo.offsetWidth + 'x' + innerHeight;
      if (tl && m === misura) return;
      misura = m;
      const prog = tl ? tl.scrollTrigger.progress : 0;
      if (tl) { tl.scrollTrigger.kill(); tl.kill(); }
      gsap.set(mini.map((m) => m.box), { width: 0 });
      disegnaVia();
      gsap.set(oro, { drawSVG: '0%' });
      tl = gsap.timeline({
        scrollTrigger: { trigger: corpo, start: 'top 70%', end: 'bottom 70%', scrub: 1.2 }
      });
      tl.to(oro, { drawSVG: '100%', ease: 'none', duration: 1 }, 0);
      mini.forEach((m, i) => {
        const t = Math.max(0, lunghezze[i] - 0.03);
        tl.fromTo(m.box, { width: 0 }, { width: larghezza(m), duration: 0.12, ease: 'back.out(3.5)' }, t);
        tl.fromTo(m.pill, { scale: 0, rotation: 0 }, { scale: 1, rotation: -5, duration: 0.12, ease: 'back.out(3.5)' }, t + 0.03);
      });
      if (prog) tl.progress(prog);
    }
    costruisci();
    figure.costruisci = costruisci;
  }

  /* ================= gli eventi: card che si aprono e pennellata oro ================= */

  function eventi() {
    $$('.evento').forEach((ev, i) => {
      const rit = $('.evento__ritaglio', ev);
      const carta = $('.evento__carta', ev);
      const piede = $('.evento__piede', ev);
      const penn = $('.evento__pennellata path', ev);
      const dett = $('.evento__dettaglio', ev);
      const piu = $('.evento__piu', ev);

      if (!RIDOTTO) {
        gsap.set(rit, { clipPath: 'inset(42.5% 42.5% 42.5% 42.5% round 36px)' });
        gsap.set(carta, { scale: 1.45, rotationX: 25, rotationY: i % 2 ? 16 : -16, rotation: i % 2 ? 4 : -4, transformPerspective: 800 });
        gsap.set(piede, { y: 24, opacity: 0 });
        gsap.timeline({ scrollTrigger: { trigger: ev, start: 'top 85%', toggleActions: 'play none none reverse' } })
          .to(rit, { clipPath: 'inset(0% 0% 0% 0% round 16px)', duration: 1.25, ease: 'power3.out' }, 0)
          .to(carta, { scale: 1, rotationX: 0, rotationY: 0, rotation: 0, duration: 1.25, ease: 'power3.out' }, 0)
          .to(piede, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, 0.35);
      }

      // la pennellata copre la foto e sopra compare il dettaglio
      const sd = SplitText.create(dett, { type: 'words', mask: 'words' });
      gsap.set(penn, { drawSVG: '100% 100%', strokeWidth: 0 });
      const tl = gsap.timeline({ paused: true, defaults: { ease: 'power1.inOut' } })
        .to(penn, { drawSVG: '0% 100%', strokeWidth: 330, duration: 0.95 }, 0)
        .set(dett, { visibility: 'visible' }, 0.45)
        .fromTo(sd.words, { yPercent: 110 }, { yPercent: 0, duration: 0.5, stagger: 0.018, ease: 'back.out(1.6)' }, 0.45)
        .to(piu, { rotation: 135, duration: 0.6, ease: 'back.out(2.5)' }, 0);
      const apri = () => tl.timeScale(1).play();
      const chiudi = () => tl.timeScale(1.3).reverse();
      if (FINE) {
        ev.addEventListener('mouseenter', apri);
        ev.addEventListener('mouseleave', chiudi);
      } else {
        ev.addEventListener('click', () => (tl.progress() > 0.5 && !tl.reversed() ? chiudi() : apri()));
      }
      ev.addEventListener('focus', apri);
      ev.addEventListener('blur', chiudi);
    });

    // "E se il vostro evento è un altro?"
    const altro = $('[data-altro]');
    const testo = $('.altro__testo', altro);
    const pills = $$('.pill', altro);
    const btn = $('.altro__btn', altro);
    if (RIDOTTO) { pills.forEach((p) => gsap.set(p, { rotation: parseFloat(getComputedStyle(p).getPropertyValue('--r')) || 0 })); return; }
    const s = righe(testo);
    gsap.set(s.lines, { yPercent: 115, opacity: 0 });
    gsap.set([...pills, btn], { opacity: 0 });
    ScrollTrigger.create({
      trigger: altro, start: 'top 75%',
      onEnter: () => {
        const tot = s.lines.length * 0.12 + 0.5;
        const tl = gsap.timeline().timeScale(0.75);
        tl.fromTo(s.lines, { yPercent: 115, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.85, stagger: 0.12, ease: 'back.out(1.4)' }, 0);
        popPill(pills, tl, 0.2, tot);
        tl.fromTo(btn, { opacity: 0, scale: 0.4, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.55, ease: 'back.out(2.5)' }, tot + 0.15);
      }
    });
  }

  /* ================= come lavoriamo: scorre di lato, il cameriere cammina ================= */

  function metodo() {
    const binario = $('[data-metodo-binario]');
    const svg = $('[data-metodo-omino]');
    const st = Brigata.stage(svg, [{ tipo: 'cameriere', x: 0, phase: 0.2 }]);
    stages.metodo = st;
    const c = st.chars[0];
    if (RIDOTTO) { c.stand = 1; st.redraw(); return; }

    st.speed = 0;
    ScrollTrigger.create({ trigger: '[data-metodo]', start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? st.play() : st.pause()) });

    const corsa = () => binario.scrollWidth - innerWidth;
    let ultimoX = 0, fermo = null;
    const unitaPerPx = () => 440 / svg.getBoundingClientRect().height;
    const tween = gsap.to(binario, {
      x: () => -corsa(), ease: 'none',
      scrollTrigger: {
        trigger: '[data-metodo]', start: 'top top',
        end: () => '+=' + corsa(),
        pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true
      },
      onUpdate: () => {
        const x = gsap.getProperty(binario, 'x');
        const dx = ultimoX - x;
        ultimoX = x;
        if (Math.abs(dx) < 0.01) return;
        // il pavimento scorre sotto i piedi: un passo per ogni pezzo di strada
        st.walkBy(dx * unitaPerPx());
        gsap.to(c, { stand: 0, duration: 0.25, overwrite: 'auto' });
        clearTimeout(fermo);
        fermo = setTimeout(() => gsap.to(c, { stand: 1, duration: 0.5, ease: 'power2.out', overwrite: 'auto' }), 220);
      }
    });
    c.stand = 1;

    // i nomi dei passi entrano quando la carta arriva
    $$('.passo').forEach((p) => {
      const nome = $('.passo__nome', p);
      const sn = SplitText.create(nome, { type: 'words,chars', charsClass: 'char' });
      gsap.from(sn.chars, {
        yPercent: 60, opacity: 0, rotation: () => gsap.utils.random(-12, 12), duration: 0.7, stagger: 0.025, ease: 'back.out(2)',
        scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left 78%', toggleActions: 'play none none reverse' }
      });
      const fotoP = $('.passo__foto', p);
      gsap.fromTo(fotoP, { clipPath: 'inset(0% 0% 0% 100% round 10px)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 10px)', duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left 70%', toggleActions: 'play none none reverse' }
      });
    });
  }

  /* ================= le regole: il mazzo di carte ================= */

  function regole() {
    const mazzo = $('[data-mazzo]');
    const carte = $$('.carta', mazzo);
    const segni = $('[data-mazzo-segni]');
    const cursore = $('[data-mazzo-cursore]');
    const ROT = [-7.5, 6.8, -5.5, 8.2, -8.5, 6.2, -7, 7.8];
    const n = carte.length;
    let ordine = carte.map((_, i) => i); // ordine[0] = carta in cima
    let occupato = false;

    carte.forEach(() => segni.appendChild(document.createElement('span')));
    const tacche = Array.from(segni.children);

    function sistema(anim) {
      ordine.forEach((ci, pos) => {
        const carta = carte[ci];
        gsap.set(carta, { zIndex: n - pos });
        const rot = pos === 0 ? 0 : ROT[ci % ROT.length];
        if (anim) gsap.to(carta, { rotation: rot, duration: 0.35, ease: 'power2.out' });
        else gsap.set(carta, { rotation: rot });
      });
      const attiva = ordine[0];
      tacche.forEach((t, i) => gsap.to(t, { width: i === attiva ? 34 : 14, opacity: i === attiva ? 1 : 0.35, duration: 0.35, ease: 'power2.out' }));
    }
    sistema(false);

    function avanti() {
      if (occupato) return;
      occupato = true;
      const ci = ordine[0];
      const carta = carte[ci];
      const base = ROT[ci % ROT.length];
      gsap.timeline({ onComplete: () => { occupato = false; } })
        .to(carta, { yPercent: -140, rotation: base + (base > 0 ? 9 : -9), duration: RIDOTTO ? 0.01 : 0.38, ease: 'power2.inOut' })
        .add(() => { ordine.push(ordine.shift()); gsap.set(carta, { zIndex: 1 }); sistema(true); })
        .to(carta, { yPercent: 0, rotation: base, duration: RIDOTTO ? 0.01 : 0.38, ease: 'power2.out' });
    }
    function indietro() {
      if (occupato) return;
      occupato = true;
      const ci = ordine[n - 1];
      const carta = carte[ci];
      const base = ROT[ci % ROT.length];
      gsap.timeline({ onComplete: () => { occupato = false; } })
        .to(carta, { yPercent: 120, rotation: base + (base > 0 ? 8 : -8), duration: RIDOTTO ? 0.01 : 0.38, ease: 'power2.inOut' })
        .add(() => { ordine.unshift(ordine.pop()); gsap.set(carta, { zIndex: n + 10 }); })
        .to(carta, { yPercent: 0, rotation: 0, duration: RIDOTTO ? 0.01 : 0.38, ease: 'power2.out' })
        .add(() => sistema(true));
    }

    mazzo.addEventListener('click', (e) => {
      const r = mazzo.getBoundingClientRect();
      (e.clientY - r.top < r.height / 2 ? avanti : indietro)();
    });
    mazzo.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); avanti(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); indietro(); }
    });
    let y0 = null;
    mazzo.addEventListener('touchstart', (e) => { y0 = e.touches[0].clientY; }, { passive: true });
    mazzo.addEventListener('touchend', (e) => {
      if (y0 == null) return;
      const dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dy) > 30) (dy < 0 ? avanti : indietro)();
      y0 = null;
    });

    // cursore con la freccia, solo col mouse
    if (FINE && !RIDOTTO) {
      const xTo = gsap.quickTo(cursore, 'x', { duration: 0.15, ease: 'power2.out' });
      const yTo = gsap.quickTo(cursore, 'y', { duration: 0.15, ease: 'power2.out' });
      const freccia = $('svg', cursore);
      let su = true;
      mazzo.addEventListener('mouseenter', (e) => { gsap.set(cursore, { x: e.clientX, y: e.clientY }); gsap.to(cursore, { scale: 1, duration: 0.3, ease: 'back.out(2)' }); mazzo.style.cursor = 'none'; });
      mazzo.addEventListener('mouseleave', () => gsap.to(cursore, { scale: 0, duration: 0.2, ease: 'power2.in' }));
      mazzo.addEventListener('mousemove', (e) => {
        xTo(e.clientX); yTo(e.clientY);
        const r = mazzo.getBoundingClientRect();
        const ora = e.clientY - r.top < r.height / 2;
        if (ora !== su) { su = ora; gsap.to(freccia, { rotation: su ? 0 : 180, duration: 0.25, ease: 'power2.out' }); }
      });
    }

    // le carte cadono nel mazzo quando arriva
    if (!RIDOTTO) {
      gsap.from(carte, {
        yPercent: -120, opacity: 0, duration: 0.9, stagger: { each: 0.08, from: 'end' }, ease: 'back.out(1.4)',
        scrollTrigger: { trigger: mazzo, start: 'top 70%' }
      });
    }
  }

  /* ================= domande: fumetti di chat ================= */

  function domande() {
    const voci = $$('.chat__voce');
    let aperta = -1;
    let rinfresca = null;
    const larga = () => (innerWidth < 992 ? '75%' : '50%');

    function apri(i, subito) {
      if (i === aperta) return;
      if (aperta > -1) chiudi(aperta, subito);
      aperta = i;
      const v = voci[i];
      const dom = $('.chat__domanda', v);
      const ris = $('.chat__risposta', v);
      const av = $('.chat__avatar', v);
      const testo = $('.chat__bolla p', v);
      dom.setAttribute('aria-expanded', 'true');
      gsap.killTweensOf([dom, ris, av, testo]);
      gsap.set(ris, { display: 'grid' });
      if (subito || RIDOTTO) {
        gsap.set(dom, { width: larga(), borderWidth: 1 });
        gsap.set(ris, { height: 'auto', scale: 1, opacity: 1 });
        gsap.set([av, testo], { scale: 1, opacity: 1, y: 0 });
        return;
      }
      gsap.timeline({ onComplete: aggiorna })
        .to(dom, { width: larga(), borderWidth: 1, duration: 0.45, ease: 'power2.out' }, 0)
        .fromTo(ris, { height: 0, scale: 0, opacity: 1 }, { height: 'auto', scale: 1, duration: 0.5, ease: 'back.out(1.6)' }, 0.05)
        .fromTo(av, { scale: 0 }, { scale: 1, duration: 0.45, ease: 'back.out(2)' }, 0.15)
        .fromTo(testo, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0.35);
    }
    function chiudi(i, subito) {
      const v = voci[i];
      const dom = $('.chat__domanda', v);
      const ris = $('.chat__risposta', v);
      const av = $('.chat__avatar', v);
      const testo = $('.chat__bolla p', v);
      dom.setAttribute('aria-expanded', 'false');
      gsap.killTweensOf([dom, ris, av, testo]);
      if (subito || RIDOTTO) { gsap.set(dom, { width: '100%', borderWidth: 0 }); gsap.set(ris, { display: 'none', height: 0 }); return; }
      gsap.timeline({ onComplete: () => { gsap.set(ris, { display: 'none' }); aggiorna(); } })
        .to(testo, { opacity: 0, y: 15, duration: 0.22, ease: 'power2.in' }, 0)
        .to(av, { scale: 0, duration: 0.25, ease: 'power2.in' }, 0.12)
        .to(ris, { scale: 0, height: 0, opacity: 0, duration: 0.4, ease: 'power2.inOut' }, 0.15)
        .to(dom, { width: '100%', borderWidth: 0, duration: 0.45, ease: 'power2.out' }, 0.18);
    }
    function aggiorna() {
      clearTimeout(rinfresca);
      rinfresca = setTimeout(() => ScrollTrigger.refresh(), 120);
    }
    voci.forEach((v, i) => $('.chat__domanda', v).addEventListener('click', () => apri(i)));
    apri(0, true);

    // le domande entrano a scaletta
    if (!RIDOTTO) {
      gsap.from(voci.map((v) => $('.chat__domanda', v)), {
        x: 40, opacity: 0, duration: 0.7, stagger: 0.06, ease: 'back.out(1.6)',
        scrollTrigger: { trigger: '[data-chat]', start: 'top 80%' }
      });
    }

    // il cameriere che aspetta col vassoio
    const svg = $('[data-omino-attesa]');
    const st = Brigata.stage(svg, [{ tipo: 'cameriere', x: 0, fermo: true }]);
    stages.attesa = st;
    ScrollTrigger.create({ trigger: '.domande', start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive && !RIDOTTO ? st.play() : st.pause()) });
    if (!RIDOTTO) {
      // ogni tanto fa un mezzo inchino a chi legge
      const c = st.chars[0];
      gsap.timeline({ repeat: -1, repeatDelay: 4 })
        .to(c, { bow: 0.35, duration: 0.5, ease: 'power2.inOut' })
        .to(c, { bow: 0, duration: 0.7, ease: 'power2.inOut' }, '+=0.4');
    }
  }

  /* ================= contatti: componete la squadra ================= */

  function squadra() {
    const form = $('[data-squadra]');
    const fila = $('[data-fila]');
    const vuota = $('.fila__vuota', fila);
    const conti = { cameriere: 0, bartender: 0, facchino: 0, hostess: 0 };
    const NOMI = { cameriere: ['cameriere', 'camerieri'], bartender: ['bartender', 'bartender'], facchino: ['facchino', 'facchini'], hostess: ['hostess', 'hostess'] };
    const MAX = 40;

    function aggiornaVuota() {
      const tot = Object.values(conti).reduce((a, b) => a + b, 0);
      if (tot === 0 && !vuota.isConnected) { fila.appendChild(vuota); gsap.fromTo(vuota, { opacity: 0 }, { opacity: 1, duration: 0.3 }); }
      if (tot > 0 && vuota.isConnected) vuota.remove();
    }

    $$('.contatore', form).forEach((riga) => {
      const tipo = riga.dataset.figura;
      const out = $('output', riga);
      const meno = $('[data-meno]', riga);
      const piu = $('[data-piu]', riga);
      const scrivi = () => {
        out.textContent = conti[tipo];
        meno.disabled = conti[tipo] === 0;
        piu.disabled = conti[tipo] >= MAX;
        if (!RIDOTTO) gsap.fromTo(out, { scale: 0.6 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1.1, 0.4)' });
      };
      scrivi();
      piu.addEventListener('click', () => {
        if (conti[tipo] >= MAX) return;
        conti[tipo]++;
        scrivi();
        aggiornaVuota();
        const d = document.createElement('span');
        d.className = 'fila__persona';
        d.dataset.tipo = tipo;
        d.innerHTML = personaSVG('persona persona--' + tipo);
        const stessi = $$(`.fila__persona[data-tipo="${tipo}"]`, fila);
        const dopo = stessi.length ? stessi[stessi.length - 1].nextSibling : null;
        fila.insertBefore(d, dopo);
        if (!RIDOTTO) gsap.fromTo(d, { y: -40, opacity: 0, rotation: gsap.utils.random(-30, 30) }, { y: 0, opacity: 1, rotation: 0, duration: 0.6, ease: 'back.out(2)' });
      });
      meno.addEventListener('click', () => {
        if (conti[tipo] <= 0) return;
        conti[tipo]--;
        scrivi();
        const stessi = $$(`.fila__persona[data-tipo="${tipo}"]`, fila);
        const via = stessi[stessi.length - 1];
        if (!via) return;
        via.removeAttribute('data-tipo');
        gsap.to(via, { y: -24, opacity: 0, scale: 0.6, duration: 0.3, ease: 'power2.in', onComplete: () => { via.remove(); aggiornaVuota(); } });
      });
    });

    const esito = $('[data-esito]', form);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      $$('input[required]', form).forEach((inp) => {
        const campo = inp.closest('.campo');
        const vuoto = !inp.value.trim();
        campo.classList.toggle('is-errore', vuoto);
        if (vuoto) {
          ok = false;
          if (!RIDOTTO) gsap.fromTo(campo, { x: -8 }, { x: 0, duration: 0.6, ease: 'elastic.out(1.2, 0.3)' });
        }
      });
      if (!ok) { esito.textContent = 'Mancano il nome del catering e un telefono per richiamarvi.'; return; }
      const elenco = Object.entries(conti).filter(([, n]) => n > 0).map(([t, n]) => `${n} ${NOMI[t][n === 1 ? 0 : 1]}`);
      const dati = new FormData(form);
      const testo = [
        `Catering: ${dati.get('catering')}`,
        `Telefono: ${dati.get('telefono')}`,
        dati.get('data') ? `Data: ${dati.get('data')}` : '',
        dati.get('luogo') ? `Dove: ${dati.get('luogo')}` : '',
        elenco.length ? `Squadra: ${elenco.join(', ')}` : 'Squadra: da definire al telefono'
      ].filter(Boolean).join('\n');
      if (CONTATTI.email) {
        location.href = `mailto:${CONTATTI.email}?subject=${encodeURIComponent('Richiesta staff da ' + dati.get('catering'))}&body=${encodeURIComponent(testo)}`;
        esito.textContent = 'Richiesta pronta nel vostro programma di posta.';
      } else {
        esito.textContent = 'Richiesta pronta. Manca solo l\'indirizzo a cui inviarla: va collegato prima della pubblicazione.';
      }
      if (!RIDOTTO) gsap.fromTo(esito, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
    });
    $$('input', form).forEach((inp) => inp.addEventListener('input', () => inp.closest('.campo').classList.remove('is-errore')));
  }

  /* ================= link con le lettere che ballano ================= */

  function cinetici() {
    if (!FINE || RIDOTTO) return;
    $$('[data-cinetico]').forEach((a) => {
      const s = SplitText.create(a, { type: 'chars', charsClass: 'k' });
      const colore = a.closest('.pannello') ? '' : ORO;
      a.addEventListener('mouseenter', () => {
        s.chars.forEach((ch, i) => {
          gsap.killTweensOf(ch);
          gsap.timeline({ delay: i * 0.035 })
            .to(ch, Object.assign({ scale: 1.14, rotation: gsap.utils.random(-7, 7), textShadow: GRASSETTO(colore || getComputedStyle(a).color, 0.4), duration: 0.38, ease: 'back.out(1.8)' }, colore ? { color: colore } : {}))
            .to(ch, { scale: 1, rotation: 0, textShadow: GRASSETTO('rgba(0,0,0,0)', 0), duration: 0.5, ease: 'power2.out' });
        });
      });
      a.addEventListener('mouseleave', () => {
        gsap.killTweensOf(s.chars);
        gsap.to(s.chars, { scale: 1, rotation: 0, textShadow: GRASSETTO('rgba(0,0,0,0)', 0), duration: 0.35, stagger: 0.018, ease: 'power2.out', onComplete: () => gsap.set(s.chars, { clearProps: 'color' }) });
        if (colore) gsap.to(s.chars, { color: getComputedStyle(a).color, duration: 0.35, stagger: 0.018 });
      });
    });
  }

  /* ================= piede: il marchio elastico e l'inchino ================= */

  function piede() {
    const marchio = $('[data-marchio]');
    const svg = $('[data-brigata-piede]');
    const st = Brigata.stage(svg, [
      { tipo: 'bartender', x: 300, phase: 0.2, scale: 0.92 },
      { tipo: 'hostess', x: 620, phase: 0.65, scale: 0.9 },
      { tipo: 'facchino', x: 960, phase: 0.4, scale: 0.94 },
      { tipo: 'cameriere', x: 1290, phase: 0.9, scale: 0.92 }
    ]);
    stages.piede = st;
    const inquadra = () => svg.setAttribute('viewBox', MOBILE() ? '170 -440 1300 450' : '0 -440 1600 450');
    inquadra();
    addEventListener('resize', inquadra);
    ScrollTrigger.create({ trigger: '[data-piede]', start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive && !RIDOTTO ? st.play() : st.pause()) });
    if (RIDOTTO) { st.chars.forEach((c) => { c.stand = 1; }); st.redraw(); return; }

    gsap.set(marchio, { scaleY: 0.15 });
    let rimbalzato = false;
    const alzaBrigata = () => {
      const h = marchio.offsetHeight;
      gsap.set(svg, { y: h * (1 - gsap.getProperty(marchio, 'scaleY')) });
    };
    gsap.ticker.add(alzaBrigata);

    function inchino() {
      st.chars.forEach((c, i) => {
        gsap.timeline({ delay: 0.5 + i * 0.12 })
          .to(c, { stand: 1, duration: 0.45, ease: 'power2.out' })
          .to(c, { bow: 1, duration: 0.55, ease: 'power2.inOut' }, '+=0.15')
          .to(c, { bow: 0, duration: 0.7, ease: 'power2.inOut' }, '+=0.35');
      });
    }
    function riparti() {
      st.chars.forEach((c) => { gsap.killTweensOf(c); gsap.to(c, { stand: 0, bow: 0, duration: 0.4 }); });
    }

    ScrollTrigger.create({
      trigger: '.piede__marchio', start: 'top bottom', end: 'bottom bottom',
      onUpdate: (s) => {
        const v = Math.min(Math.abs(s.getVelocity()) / 1500, 0.25);
        if (s.progress >= 0.9 && !rimbalzato) {
          rimbalzato = true;
          gsap.to(marchio, { scaleY: 1, duration: 1.4, ease: 'elastic.out(1.2, 0.35)', overwrite: 'auto' });
          inchino();
        } else if (s.progress < 0.9) {
          if (rimbalzato) riparti();
          rimbalzato = false;
          const t = s.direction === 1 ? 0.15 + s.progress * 1.15 + v : 0.15 + s.progress * 0.95;
          gsap.to(marchio, { scaleY: gsap.utils.clamp(0.15, 1.4, t), duration: 0.1, ease: 'power1.out', overwrite: 'auto' });
        }
      },
      onLeave: () => {
        if (!rimbalzato) { rimbalzato = true; gsap.to(marchio, { scaleY: 1, duration: 1.4, ease: 'elastic.out(1.2, 0.35)', overwrite: 'auto' }); inchino(); }
      },
      onLeaveBack: () => { rimbalzato = false; riparti(); gsap.to(marchio, { scaleY: 0.15, duration: 0.25, ease: 'power2.out', overwrite: 'auto' }); }
    });
  }

  /* ================= pannello contatti ================= */

  function pannello() {
    const p = $('[data-pannello]');
    const penn = $$('.pannello__pennellata path', p);
    const cont = $('.pannello__contenuto', p);
    const titolo = $('.pannello__titolo', p);
    const chiudiBtn = $('[data-chiudi-pannello]', p);
    const st = SplitText.create(titolo, { type: 'chars,words', charsClass: 'char' });
    const altri = [$('.pannello__testo', p), ...$$('.pannello__recapiti > div', p), $('.pannello__btn', p)];
    let aperto = false, daChi = null, tl = null;

    gsap.set(penn, { drawSVG: '0%', strokeWidth: 0 });
    gsap.set(cont, { autoAlpha: 0 });

    function apri(e) {
      if (e) e.preventDefault();
      if (aperto) return;
      aperto = true;
      daChi = document.activeElement;
      chiudiMenu();
      if (lenis) lenis.stop();
      p.classList.add('is-aperto');
      p.setAttribute('aria-hidden', 'false');
      if (tl) tl.kill();
      tl = gsap.timeline();
      tl.to(penn, { drawSVG: '100%', strokeWidth: 420, duration: RIDOTTO ? 0.01 : 0.9, ease: 'power2.inOut', stagger: 0.06 }, 0)
        .set(cont, { autoAlpha: 1 }, RIDOTTO ? 0 : 0.45)
        .fromTo(chiudiBtn, { scale: 0.4, y: 20, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.55, ease: 'back.out(2.5)' }, RIDOTTO ? 0 : 0.5)
        .add(() => chiudiBtn.focus(), 0.6);
      if (!RIDOTTO) {
        st.chars.forEach((ch, i) => {
          tl.fromTo(ch, { opacity: 0, scale: 0.5, rotation: gsap.utils.random(-6, 6) }, { opacity: 1, scale: 1.1, duration: 0.45, ease: 'back.out(2)' }, 0.6 + i * 0.022)
            .to(ch, { scale: 1, rotation: 0, duration: 0.6, ease: 'power2.out' }, 1.05 + i * 0.022);
        });
        tl.fromTo(altri, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: 'back.out(1.6)' }, 0.95);
      }
    }
    function chiudi(poi) {
      if (!aperto) return;
      aperto = false;
      if (tl) tl.kill();
      tl = gsap.timeline({
        onComplete: () => {
          p.classList.remove('is-aperto');
          p.setAttribute('aria-hidden', 'true');
          if (lenis) lenis.start();
          if (typeof poi === 'function') poi();
          else if (daChi) daChi.focus();
        }
      });
      tl.to(cont, { autoAlpha: 0, y: -15, duration: RIDOTTO ? 0.01 : 0.3, ease: 'power2.in' }, 0)
        .to(penn, { drawSVG: '0%', strokeWidth: 0, duration: RIDOTTO ? 0.01 : 0.45, ease: 'power2.in', stagger: { each: 0.04, from: 'end' } }, RIDOTTO ? 0 : 0.1)
        .set(cont, { y: 0 });
    }
    $$('[data-apri-contatti]').forEach((b) => b.addEventListener('click', apri));
    chiudiBtn.addEventListener('click', () => chiudi());
    addEventListener('keydown', (e) => {
      if (!aperto) return;
      if (e.key === 'Escape') chiudi();
      if (e.key === 'Tab') {
        const foc = $$('a[href], button', p);
        const primo = foc[0], ultimo = foc[foc.length - 1];
        if (e.shiftKey && document.activeElement === primo) { e.preventDefault(); ultimo.focus(); }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primo.focus(); }
      }
    });
    $('[data-vai-squadra]', p).addEventListener('click', (e) => {
      e.preventDefault();
      chiudi(() => vaiA('#contatti'));
    });
  }

  /* ================= avvio ================= */

  function avvia() {
    avviaLenis();
    foto();
    nav();
    pulsanti();
    hero();
    chi();
    galleria();
    sabato();
    figure();
    eventi();
    metodo();
    regole();
    domande();
    squadra();
    cinetici();
    piede();
    pannello();
    titoli();

    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    ScrollTrigger.addEventListener('refresh', () => { if (figure.costruisci) figure.costruisci(); });

    ingresso(() => {
      document.body.classList.remove('in-caricamento');
      if (lenis) lenis.start();
      ScrollTrigger.refresh();
      if (hero.entra) hero.entra();
    });

    window.__ps = { lenis, stages, ScrollTrigger };
  }

  const fonti = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]) : Promise.resolve();
  fonti.then(avvia);
})();
