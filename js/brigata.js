/* Brigata: gli omini di ProntoStaff+ disegnati e animati in SVG.
   Gambe in cinematica inversa: il piede d'appoggio resta piantato sul pavimento
   che scorre, quindi niente piedi che pattinano. Braccia in cinematica diretta.
   Gli oggetti in mano (vassoio, cartello, cassa, shaker) seguono il passo con
   un filo di ritardo. Unità: un omino è alto circa 360. Il suolo è y = 0. */
(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const C = {
    ink: '#000',
    ivory: '#F2EEE6',
    gold: '#F4C73E',
    coal: '#1A1917',
    farFill: '#0F0E0D',
    farLine: '#8E897F'
  };
  const LINE = 2.4;
  const TAU = Math.PI * 2;
  const D2R = Math.PI / 180;

  /* Scheletro comune. stride e period si ricavano dalla velocità del pavimento,
     così tutti i passi tornano col suolo anche con cadenze diverse. */
  const R = {
    thigh: 78, shin: 74, upper: 60, fore: 56,
    hipY: -158, shY: -282,
    ankle: 10, lift: 15,
    v: 104 // velocità del pavimento in unità al secondo, a velocità 1
  };

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => t * t * (3 - 2 * t);
  const f = (n) => Math.round(n * 10) / 10;

  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  /* Un arto: due segmenti con contorno. Disegno prima i due contorni, poi i due
     riempimenti, così al ginocchio e al gomito il contorno si fonde senza giunte. */
  function limb(parent, w1, w2, fill, line) {
    const common = { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
    const o1 = el('path', { ...common, stroke: line, 'stroke-width': w1 + LINE * 2 }, parent);
    const o2 = el('path', { ...common, stroke: line, 'stroke-width': w2 + LINE * 2 }, parent);
    const i1 = el('path', { ...common, stroke: fill, 'stroke-width': w1 }, parent);
    const i2 = el('path', { ...common, stroke: fill, 'stroke-width': w2 }, parent);
    return function set(ax, ay, bx, by, cx, cy) {
      const d1 = `M${f(ax)} ${f(ay)}L${f(bx)} ${f(by)}`;
      const d2 = `M${f(bx)} ${f(by)}L${f(cx)} ${f(cy)}`;
      o1.setAttribute('d', d1); i1.setAttribute('d', d1);
      o2.setAttribute('d', d2); i2.setAttribute('d', d2);
    };
  }

  /* Ciclo del piede. ph in [0,1): appoggio fino a 0.6, poi volo. */
  function foot(ph, stride, lift) {
    if (ph < 0.6) {
      const p = ph / 0.6;
      let ang = 0;
      if (p < 0.12) ang = -12 * (1 - p / 0.12);
      else if (p > 0.7) ang = 28 * smooth((p - 0.7) / 0.3);
      return { x: stride / 2 - stride * p, y: 0, ang };
    }
    const t = (ph - 0.6) / 0.4;
    const e = 0.5 - 0.5 * Math.cos(Math.PI * t);
    return {
      x: -stride / 2 + stride * e,
      y: -lift * Math.sin(Math.PI * Math.pow(t, 0.85)),
      ang: lerp(28, -12, smooth(t))
    };
  }

  function ik(hx, hy, ax, ay, L1, L2) {
    let dx = ax - hx, dy = ay - hy;
    let d = Math.hypot(dx, dy);
    const max = L1 + L2 - 0.5;
    if (d > max) { const k = max / d; dx *= k; dy *= k; d = max; }
    const th = Math.atan2(dy, dx);
    const al = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    const ka = th - al;
    return { kx: hx + L1 * Math.cos(ka), ky: hy + L1 * Math.sin(ka), ax: hx + dx, ay: hy + dy };
  }

  /* a: angolo del braccio dal basso (+ in avanti); b: flessione del gomito. */
  function fk(sx, sy, a, b) {
    const ar = a * D2R, br = (a + b) * D2R;
    const ex = sx + R.upper * Math.sin(ar), ey = sy + R.upper * Math.cos(ar);
    return { ex, ey, hx: ex + R.fore * Math.sin(br), hy: ey + R.fore * Math.cos(br), ang: a + b };
  }

  /* ---------- pezzi di disegno comuni ---------- */

  const SHOE = {
    scarpa: 'M-9 -3L-9 8Q-9 10 -7 10L19 10Q26 10 26 4Q26 -1 18 -2L7 -5Q-2 -7 -9 -3Z',
    tacco: 'M-8 -4L-8 3L-6 10L-3 10L-2 5L12 6L22 10Q26 10 25 6Q23 1 15 -1L4 -5Q-3 -7 -8 -4Z',
    scarpone: 'M-10 -6L-10 8Q-10 11 -7 11L21 11Q28 11 28 4Q28 -2 19 -3L9 -6L8 -10Q-1 -12 -10 -6Z'
  };

  function shoe(parent, kind, far) {
    return el('path', {
      d: SHOE[kind],
      fill: far ? C.farFill : C.coal,
      stroke: far ? C.farLine : C.ivory,
      'stroke-width': LINE,
      'stroke-linejoin': 'round'
    }, parent);
  }

  function shape(parent, d, fill, stroke, extra) {
    return el('path', Object.assign({
      d,
      fill: fill || 'none',
      stroke: stroke || 'none',
      'stroke-width': LINE,
      'stroke-linejoin': 'round',
      'stroke-linecap': 'round'
    }, extra || {}), parent);
  }

  /* Busto in profilo, rivolto a destra: spalle a -282, vita a -184. */
  const TORSO = 'M-20 -289C-6 -294 9 -292 16 -286C23 -274 24 -254 22 -236C20 -216 16 -198 15 -182L-19 -182C-21 -203 -25 -228 -25 -252C-25 -272 -26 -285 -20 -289Z';
  const PELVIS = 'M-19 -186L15 -186C16 -172 17 -158 12 -147C6 -139 -8 -138 -15 -144C-20 -152 -21 -170 -19 -186Z';
  const PELVIS_LINE = 'M13.5 -150C16.5 -160 16 -174 15 -186L-19 -186C-21 -172 -20 -160 -16 -150';

  function head(parent, hair) {
    const g = el('g', {}, parent);
    shape(g, 'M-1 -292L4 -306', null, C.ivory, { 'stroke-width': 12 });
    el('circle', { cx: 5, cy: -324, r: 21, fill: C.ivory }, g);
    shape(g, 'M24 -330L31 -321L23 -318Z', C.ivory, C.ivory, { 'stroke-width': 1 });
    shape(g, 'M2 -330C-4 -330 -4 -320 2 -320', null, C.ink, { 'stroke-width': 2.2 });
    const eye = el('g', { transform: 'translate(17 -329)' }, g);
    shape(eye, 'M0 -2.5L0 2.5', null, C.ink, { 'stroke-width': 2.6 });
    hair(g);
    return { g, eye };
  }

  const HAIR = {
    liscio(g) {
      shape(g, 'M24 -336C21 -347 7 -350 -5 -347C-17 -343 -23 -332 -21 -319C-20 -312 -17 -309 -14 -309C-13 -318 -9 -325 -3 -329C7 -333 17 -333 24 -336Z', C.coal, C.ivory);
      shape(g, 'M6 -347C2 -341 -4 -337 -11 -335', null, C.ivory, { 'stroke-width': 1.4 });
    },
    chignon(g) {
      el('circle', { cx: -20, cy: -340, r: 10, fill: C.coal, stroke: C.ivory, 'stroke-width': LINE }, g);
      shape(g, 'M25 -335C22 -350 4 -352 -8 -347C-20 -341 -25 -327 -21 -312C-18 -318 -14 -326 -6 -331C6 -335 16 -334 25 -335Z', C.coal, C.ivory);
    },
    berretto(g) {
      shape(g, 'M-20 -326C-20 -346 0 -352 14 -346C22 -342 25 -336 25 -331L-20 -326Z', C.coal, C.ivory);
      shape(g, 'M21 -333C31 -333 39 -331 41 -328C33 -327 25 -328 19 -328Z', C.coal, C.ivory);
    },
    ciuffo(g) {
      shape(g, 'M27 -337C30 -350 18 -358 4 -356C-10 -354 -22 -344 -22 -330C-22 -320 -18 -312 -14 -309C-12 -319 -8 -326 -1 -330C8 -334 18 -334 27 -337Z', C.coal, C.ivory);
      shape(g, 'M-14 -309L-14 -318', null, C.ivory, { 'stroke-width': 1.4 });
    }
  };

  /* ---------- i quattro personaggi ---------- */

  const TYPES = {
    cameriere: {
      cadence: 1, bob: 4, lean: 2, shoe: 'scarpa', hair: 'liscio',
      sleeve: [C.ivory, C.ink],
      torso(g) {
        shape(g, TORSO, C.ivory);
        shape(g, 'M-20 -289C-12 -292 -2 -292 6 -290L12 -262C17 -244 17 -214 15 -184L-19 -184C-21 -206 -25 -230 -25 -254C-25 -274 -26 -286 -20 -289Z', C.coal, C.ivory);
        shape(g, 'M10 -290L17 -286L12 -276Z', C.ivory, C.ink, { 'stroke-width': 1.6 });
        shape(g, 'M16 -287L25 -292L26 -281ZM16 -287L9 -292L9 -282Z', C.gold, C.ink, { 'stroke-width': 1.6 });
      },
      near: 'vassoio', far: 'swing',
      apron: true
    },
    hostess: {
      cadence: 1.12, bob: 3, lean: 1.5, shoe: 'tacco', hair: 'chignon',
      sleeve: [C.coal, C.ivory],
      torso(g) {
        shape(g, TORSO, C.coal, C.ivory);
        shape(g, 'M14 -287L9 -238', null, C.ivory, { 'stroke-width': 1.6 });
        shape(g, 'M0 -293C8 -297 17 -295 19 -289C21 -283 15 -277 11 -270L7 -279C3 -283 -1 -287 0 -293Z', C.gold, C.ink, { 'stroke-width': 1.6 });
      },
      near: 'cartello', far: 'cartello'
    },
    facchino: {
      cadence: 0.92, bob: 5, lean: -3, shoe: 'scarpone', hair: 'berretto',
      sleeve: [C.coal, C.ivory], fore: [C.ivory, C.ink],
      torso(g) {
        shape(g, TORSO, C.coal, C.ivory);
        shape(g, 'M3 -258h10M8 -263v10', null, C.gold, { 'stroke-width': 3.2, 'stroke-linecap': 'butt' });
      },
      near: 'cassa', far: 'cassa'
    },
    bartender: {
      cadence: 1.04, bob: 4, lean: 1, shoe: 'scarpa', hair: 'ciuffo',
      sleeve: [C.ivory, C.ink],
      torso(g) {
        shape(g, TORSO, C.ivory);
        shape(g, 'M-20 -289C-12 -292 -4 -292 2 -290L9 -264C15 -246 16 -214 15 -184L-19 -184C-21 -206 -25 -230 -25 -254C-25 -274 -26 -286 -20 -289Z', C.coal, C.ivory);
        shape(g, 'M-19 -186L15 -186L18 -118L-20 -120Z', C.coal, C.ivory);
      },
      near: 'shaker', far: 'swing'
    }
  };

  /* ---------- montaggio di un omino ---------- */

  function make(type, opts) {
    const T = TYPES[type];
    const scale = opts.scale || 1;
    const root = el('g', { class: 'omino omino--' + type, 'data-tipo': type });
    const inner = el('g', {}, root);
    // area da cliccare: il disegno ha molti vuoti tra braccia e gambe
    el('rect', { x: -70, y: -370, width: 150, height: 372, fill: 'transparent', class: 'omino__presa' }, inner);

    const L = {
      back: el('g', {}, inner),
      legFar: el('g', {}, inner),
      legNear: el('g', {}, inner),
      mid: el('g', {}, inner),
      apron: el('g', {}, inner),
      front: el('g', {}, inner)
    };

    // gambe
    const legFar = limb(L.legFar, 25, 21, C.farFill, C.farLine);
    const shoeFar = shoe(L.legFar, T.shoe, true);
    const legNear = limb(L.legNear, 27, 22, C.coal, C.ivory);
    const shoeNear = shoe(L.legNear, T.shoe, false);

    // busto, bacino, testa
    T.torso(L.mid);
    shape(L.mid, PELVIS, C.coal);
    shape(L.mid, PELVIS_LINE, null, C.ivory);
    const H = head(L.mid, HAIR[T.hair]);

    // braccia e oggetti
    const sleeveFill = T.sleeve[0], sleeveLine = T.sleeve[1];
    const farArm = limb(L.back, 16, 14, C.farFill, C.farLine);
    const farHand = el('circle', { r: 7, fill: C.farLine }, L.back);
    const prop = buildProp(T.near, L.front);
    const nearArm = limb(L.front, 17, 15, sleeveFill, sleeveLine);
    const foreFill = T.fore ? T.fore[0] : sleeveFill;
    if (T.fore) nearArm.fore = T.fore;
    const nearHand = el('circle', { r: 7.5, fill: C.ivory, stroke: C.ink, 'stroke-width': 2 }, L.front);
    // per il facchino l'avambraccio è nudo: ridisegno solo il segmento basso
    let nearFore = null;
    if (T.fore) nearFore = limb(L.front, 0.01, 15, foreFill, T.fore[1]);
    if (T.fore) L.front.appendChild(nearHand);

    // grembiule del cameriere
    let apron = null;
    if (T.apron) apron = shape(L.apron, '', C.ivory, C.ink);

    const stride = R.v * 0.6 / T.cadence; // periodo = 1/cadence secondi
    const state = {
      root, type, scale,
      phase: opts.phase || 0,
      t: Math.random() * 10,
      blinkAt: 1 + Math.random() * 3,
      tray: 0, trayV: 0,
      hop: 0,
      stand: opts.fermo ? 1 : 0, // 0 cammina, 1 fermo in piedi
      bow: 0                     // 0 dritto, 1 inchino
    };

    function update(dt, speed) {
      state.t += dt;
      state.phase = (state.phase + dt * speed * T.cadence) % 1;
      const ph = state.phase;

      const st = state.stand;
      const walkBob = -T.bob * Math.cos(TAU * 2 * (ph - 0.3)) * 0.5 - T.bob * 0.5;
      const breath = -1.2 * (0.5 - 0.5 * Math.cos(state.t * TAU * 0.28));
      const bob = lerp(walkBob, breath, st) - state.hop + state.bow * 6;
      const hipX = 0, hipY = R.hipY + bob;
      const upperT = `translate(0 ${f(bob)}) rotate(${f(T.lean * (1 - st) + state.bow * 34)} 0 ${R.hipY})`;
      L.back.setAttribute('transform', upperT);
      L.mid.setAttribute('transform', upperT);
      L.front.setAttribute('transform', upperT);

      // gambe
      const lift = R.lift;
      const legs = [[ph, legNear, shoeNear], [(ph + 0.5) % 1, legFar, shoeFar]];
      let knees = [];
      let side = 1;
      for (const [p, set, sh] of legs) {
        const ft = foot(p, stride, lift);
        if (st > 0) {
          ft.x = lerp(ft.x, 5 * side - state.bow * 4, st);
          ft.y = lerp(ft.y, 0, st);
          ft.ang = lerp(ft.ang, 0, st);
        }
        side = -1;
        let ay = -R.ankle + ft.y - state.hop;
        if (ft.ang > 0 && ft.y === 0) ay -= 24 * Math.sin(ft.ang * D2R);
        if (ft.ang < 0 && ft.y === 0) ay -= 8 * Math.sin(-ft.ang * D2R);
        const s = ik(hipX, hipY, ft.x, ay, R.thigh, R.shin);
        set(hipX, hipY, s.kx, s.ky, s.ax, s.ay);
        sh.setAttribute('transform', `translate(${f(s.ax)} ${f(s.ay)}) rotate(${f(ft.ang)})`);
        knees.push(s);
      }

      // grembiule: segue le ginocchia
      if (apron) {
        const kx1 = Math.min(knees[0].kx, knees[1].kx), kx2 = Math.max(knees[0].kx, knees[1].kx);
        const by = -96 + bob * 0.6;
        const top = -184 + bob;
        apron.setAttribute('d',
          `M-12 ${f(top)}L17 ${f(top)}C20 ${f(top + 30)} ${f(kx2 + 16)} ${f(by - 40)} ${f(kx2 + 18)} ${f(by)}` +
          `L${f(kx1 - 8)} ${f(by + 2)}C${f(kx1 - 12)} ${f(by - 40)} -14 ${f(top + 40)} -12 ${f(top)}Z`);
      }

      // braccia
      const swing = 20 * Math.cos(TAU * (ph - 0.05)) * (1 - st);
      const a = arms(T, ph, state.t, swing);
      const fs = fk(-4, R.shY - 2, a.far[0], a.far[1]);
      farArm(-4, R.shY - 2, fs.ex, fs.ey, fs.hx, fs.hy);
      farHand.setAttribute('cx', f(fs.hx)); farHand.setAttribute('cy', f(fs.hy));
      const ns = fk(0, R.shY, a.near[0], a.near[1]);
      nearArm(0, R.shY, ns.ex, ns.ey, ns.hx, ns.hy);
      if (nearFore) nearFore(ns.ex, ns.ey, ns.ex, ns.ey, ns.hx, ns.hy);
      nearHand.setAttribute('cx', f(ns.hx)); nearHand.setAttribute('cy', f(ns.hy));

      // l'oggetto in mano ritarda un poco sul su e giù (molla smorzata)
      const target = -bob * 0.9;
      const k = 120, damp = 12;
      state.trayV += (k * (target - state.tray) - damp * state.trayV) * Math.min(dt, 0.05);
      state.tray += state.trayV * Math.min(dt, 0.05);
      prop.place(ns, fs, state.tray, state.t, ph);

      // battito di ciglia
      state.blinkAt -= dt;
      let sy = 1;
      if (state.blinkAt < 0) {
        const b = -state.blinkAt;
        sy = b < 0.07 ? 1 - b / 0.07 * 0.9 : b < 0.14 ? 0.1 + (b - 0.07) / 0.07 * 0.9 : 1;
        if (b > 0.14) state.blinkAt = 2.2 + Math.random() * 3.5;
      }
      H.eye.setAttribute('transform', `translate(17 -329) scale(1 ${f(Math.max(0.1, sy))})`);
    }

    state.update = update;
    state.head = H;
    state.inner = inner;
    return state;
  }

  function arms(T, ph, t, swing) {
    const out = { near: [-swing, 20 + Math.max(0, -swing) * 0.5], far: [swing, 20 + Math.max(0, swing) * 0.5] };
    if (T.near === 'vassoio') out.near = [24 + 1.2 * Math.sin(TAU * 2 * ph), 70];
    if (T.near === 'cartello') { out.near = [26, 66]; out.far = [30, 62]; }
    if (T.near === 'cassa') { out.near = [14, 58]; out.far = [18, 54]; }
    if (T.near === 'shaker') {
      const shake = Math.sin(t * TAU * 3.2);
      out.near = [84 + shake * 5, 90 + shake * 16];
    }
    return out;
  }

  /* ---------- oggetti ---------- */

  function buildProp(kind, parent) {
    const g = el('g', {}, parent);
    if (kind === 'vassoio') {
      const tr = el('g', {}, g);
      shape(tr, 'M-40 -1L40 -1L36 6L-36 6Z', C.gold, C.ink, { 'stroke-width': 2 });
      shape(tr, 'M-5.5 -46h11v16h16v11h-16v16h-11v-16h-16v-11h16Z', C.gold, C.ink, { 'stroke-width': 2, transform: 'translate(0 2)' });
      return {
        place(ns, fs, lag) {
          tr.setAttribute('transform', `translate(${f(ns.hx + 6)} ${f(ns.hy - 8 + lag * 0.35)}) rotate(${f(lag * 0.6)})`);
        }
      };
    }
    if (kind === 'cartello') {
      const card = el('g', {}, g);
      shape(card, 'M-78 -40H78V40H-78Z', C.ink, C.ivory);
      shape(card, 'M-70 -32H70V32H-70Z', null, C.gold, { 'stroke-width': 1 });
      const tx = el('text', { x: 0, y: 9, 'text-anchor': 'middle', fill: C.ivory, class: 'omino__scritta' }, card);
      tx.textContent = 'PRONTO';
      return {
        place(ns, fs, lag) {
          card.setAttribute('transform', `translate(${f(ns.hx + 26)} ${f(ns.hy - 34 + lag * 0.3)}) rotate(${f(-lag * 0.35)})`);
        }
      };
    }
    if (kind === 'cassa') {
      const box = el('g', {}, g);
      shape(box, 'M-62 -46H62V46H-62Z', C.coal, C.ivory);
      shape(box, 'M-62 -24H62M-62 2H62', null, C.ivory, { 'stroke-width': 1.2, opacity: 0.35 });
      const tx = el('text', { x: 4, y: 33, 'text-anchor': 'middle', fill: C.gold, class: 'omino__scritta' }, box);
      tx.textContent = 'STAFF';
      return {
        place(ns, fs, lag) {
          box.setAttribute('transform', `translate(${f(ns.hx + 12)} ${f(ns.hy + 6 + lag * 0.4)}) rotate(${f(-lag * 0.25)})`);
        }
      };
    }
    if (kind === 'shaker') {
      const sh = el('g', {}, g);
      shape(sh, 'M-11 0L-9 34Q-9 38 -5 38L5 38Q9 38 9 34L11 0Z', C.gold, C.ink, { 'stroke-width': 2 });
      shape(sh, 'M-10 0L-7 -12L7 -12L10 0Z', C.gold, C.ink, { 'stroke-width': 2 });
      shape(sh, 'M-4 -12L-3 -19L3 -19L4 -12Z', C.gold, C.ink, { 'stroke-width': 2 });
      return {
        place(ns) {
          sh.setAttribute('transform', `translate(${f(ns.hx)} ${f(ns.hy)}) rotate(${f(180 - ns.ang + 180)})`);
        }
      };
    }
    return { place() {} };
  }

  /* ---------- palco ---------- */

  function stage(svg, list, opts) {
    opts = opts || {};
    const layer = el('g', { class: 'brigata' }, svg);
    const chars = list.map((c) => {
      const s = make(c.tipo, c);
      s.x = c.x; s.y = c.y || 0;
      s.root.setAttribute('transform', `translate(${c.x} ${s.y}) scale(${s.scale})`);
      layer.appendChild(s.root);
      return s;
    });
    const api = {
      chars,
      speed: opts.speed == null ? 1 : opts.speed,
      running: false,
      floorSpeed() { return R.v * api.speed; },
      /* passo guidato da fuori: distanza in unità del disegno */
      walkBy(units) { for (const c of chars) { c.phase = (((c.phase + units / (R.v / TYPES[c.type].cadence)) % 1) + 1) % 1; c.update(1 / 60, 0); } },
      redraw() { for (const c of chars) c.update(0, 0); },
      tick(dt) { for (const c of chars) c.update(dt, api.speed); },
      play() {
        if (api.running) return;
        api.running = true;
        if (window.gsap) gsap.ticker.add(onTick);
        else loop();
      },
      pause() {
        api.running = false;
        if (window.gsap) gsap.ticker.remove(onTick);
      }
    };
    let last = 0;
    function onTick(time, deltaTime) { api.tick(Math.min(deltaTime, 50) / 1000); }
    function loop(now) {
      if (!api.running) return;
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
      last = now; api.tick(dt);
      requestAnimationFrame(loop);
    }
    api.tick(0);
    return api;
  }

  window.Brigata = { stage, make, TYPES, R, C };
})();
