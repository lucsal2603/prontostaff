/* ProntoStaff+ — l'omino col vassoio che cammina in fondo allo schermo mentre si scorre la pagina.
   In cima alla pagina sta fermo a sinistra, in fondo arriva tutto a destra. I piedi non scivolano:
   il passo avanza esattamente quanto la strada fatta. */
(function () {
  'use strict';

  /* ---- valori da cambiare ---- */
  var ALTO = 86, ALTO_TELEFONO = 62;      /* altezza dell'omino sullo schermo, in pixel */
  var MARGINE = 0.035;                    /* spazio ai lati, in parte della larghezza */
  var L1 = 57, L2 = 57, ANCA = -129.4, CAVIGLIA = -15.5;
  var CAMMINA = { S: 70, st: 0.62, alza: 20, giu: 4, piega: 3 };
  var CORRE = { S: 110, st: 0.4, alza: 38, giu: 8, piega: 8 };

  var svg = document.querySelector('.camminatore');
  if (!svg) return;
  var ridotto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var q = function (s) { return svg.querySelector(s); };
  var el = {
    omino: q('.om-tutto'), verso: q('.om-verso'), busto: q('.om-busto'), testa: q('.om-testa'), piu: q('.om-piu'),
    braccioL: q('.om-braccio-dietro'), braccioR: q('.om-braccio'), gambaL: q('.om-gamba-dietro'), gambaR: q('.om-gamba'),
    ombra: q('.om-ombra'), flute: svg.querySelectorAll('.om-flute')
  };
  var piede_ = document.querySelector('.piede');

  function lerp(a, b, t) { return a + (b - a) * t; }
  var W = 0, H = 0, SC = 0.25;
  function misura() {
    W = window.innerWidth;
    var alto = W < 761 ? ALTO_TELEFONO : ALTO;
    SC = alto / 330;
    H = Math.ceil(alto + 14);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.style.height = H + 'px';
  }
  function progresso() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  }
  function posto(p) {
    var a = W * MARGINE + 60 * SC, b = W - W * MARGINE - 150 * SC;
    return a + (b - a) * p;
  }

  misura();
  var S = { x: posto(progresso()), fase: 0, dir: 1, gira: 1, fermo: 1, corsa: 0, v: 0, t: 0 };

  function par() { var o = {}; for (var n in CAMMINA) o[n] = lerp(CAMMINA[n], CORRE[n], S.corsa); return o; }
  function piede(u, P) {
    u = ((u % 1) + 1) % 1;
    if (u < P.st) return { x: P.S / 2 - P.S * u / P.st, y: CAVIGLIA };
    var s = (u - P.st) / (1 - P.st), k = 0.5 - 0.5 * Math.cos(Math.PI * s);
    return { x: -P.S / 2 + P.S * k, y: CAVIGLIA - P.alza * Math.pow(Math.sin(Math.PI * Math.min(1, s * 1.1)), 1.2) };
  }
  function gamba(hx, hy, f) {
    var dx = f.x - hx, dy = f.y - hy, d = Math.min(Math.hypot(dx, dy), L1 + L2 - 0.01);
    var th = Math.atan2(dx, dy), a = Math.acos((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)), k = th + a;
    return 'M' + hx.toFixed(2) + ' ' + hy.toFixed(2) + ' L' + (hx + L1 * Math.sin(k)).toFixed(2) + ' ' + (hy + L1 * Math.cos(k)).toFixed(2) + ' L' + f.x.toFixed(2) + ' ' + f.y.toFixed(2);
  }

  function disegna() {
    var P = par(), m = 1 - S.fermo, u = S.fase;
    var drop = (P.giu + 2.5 * Math.cos(4 * Math.PI * (u - lerp(0, 0.18, S.corsa)))) * m;
    var hy = ANCA + drop, off = lerp(20.5, 5, m);
    var pL = piede(u + 0.5, P), pR = piede(u, P);
    pL = { x: lerp(-off, pL.x - off, m), y: lerp(CAVIGLIA, pL.y, m) };
    pR = { x: lerp(off, pR.x + off, m), y: lerp(CAVIGLIA, pR.y, m) };
    el.gambaL.setAttribute('d', gamba(-off, hy, pL));
    el.gambaR.setAttribute('d', gamba(off, hy, pR));
    var respiro = S.fermo * 1.5 * Math.sin(S.t * 2.2);
    var piega = P.piega * m + 1.4 * Math.sin(4 * Math.PI * u - 0.6) * m;
    el.busto.setAttribute('transform', 'translate(0 ' + (drop + respiro).toFixed(2) + ') rotate(' + piega.toFixed(2) + ' 0 -100)');
    el.testa.setAttribute('transform', 'translate(0 ' + (2.2 * Math.sin(4 * Math.PI * u - 1.3) * m).toFixed(2) + ') rotate(' + (-piega * 0.5).toFixed(2) + ' 0 -214)');
    el.piu.setAttribute('transform', 'translate(0 ' + (3 * Math.sin(4 * Math.PI * u - 2.0) * m - 2 * Math.sin(S.t * 1.8) * S.fermo).toFixed(2) + ') rotate(' + (7 * Math.sin(2 * Math.PI * u - 1.0) * m).toFixed(2) + ' 0 -304)');
    var a = (-24 * Math.cos(2 * Math.PI * u) * m - 4 * S.fermo) * Math.PI / 180;
    var sy = -176 + drop + respiro, ex = -24 + 40 * Math.sin(-a), ey = sy + 40 * Math.cos(a);
    var hx = ex + 36 * Math.sin(-a * 1.3 - 0.12 * m), hy2 = ey + 36 * Math.cos(a * 1.3 + 0.12 * m);
    el.braccioL.setAttribute('d', 'M-24 ' + sy.toFixed(2) + ' L' + ex.toFixed(2) + ' ' + ey.toFixed(2) + ' L' + hx.toFixed(2) + ' ' + hy2.toFixed(2));
    el.braccioR.setAttribute('transform', 'rotate(' + (-piega).toFixed(2) + ' 24 -176) translate(0 ' + (2.4 * Math.sin(4 * Math.PI * u - 1.9) * m).toFixed(2) + ')');
    for (var i = 0; i < el.flute.length; i++) {
      var tr = 4 * Math.sin(4 * Math.PI * u - 2.2 - i * 0.7) * m * Math.min(1, S.v / 300 + 0.2);
      el.flute[i].setAttribute('transform', 'translate(' + (66 + i * 26) + ' -158) rotate(' + tr.toFixed(2) + ')');
    }
    el.verso.setAttribute('transform', 'scale(' + S.gira.toFixed(3) + ' ' + (1 - 0.05 * (1 - Math.abs(S.gira))).toFixed(3) + ')');
    el.omino.setAttribute('transform', 'translate(' + S.x.toFixed(2) + ' ' + (H - 4) + ') scale(' + SC.toFixed(4) + ')');
    el.ombra.setAttribute('rx', (46 - 6 * Math.abs(Math.sin(2 * Math.PI * u)) * m).toFixed(1));
  }

  /* sul piede d'oro l'omino diventa nero, sennò sparirebbe */
  function colori() {
    var sopra = piede_ && piede_.getBoundingClientRect().top < window.innerHeight - H * 0.5;
    svg.classList.toggle('camminatore--su-oro', !!sopra);
  }

  var prima = performance.now();
  function giro(ora) {
    var dt = Math.min(0.05, Math.max(0.001, (ora - prima) / 1000));
    prima = ora;
    S.t += dt;
    var meta = posto(progresso());
    var nx = ridotto ? meta : S.x + (meta - S.x) * (1 - Math.pow(0.002, dt));
    var dx = nx - S.x;
    S.x = nx;
    var vel = Math.abs(dx) / dt;
    S.v += (vel - S.v) * (1 - Math.pow(0.02, dt));
    if (Math.abs(dx) > 0.05) S.dir = dx > 0 ? 1 : -1;
    S.gira += (S.dir - S.gira) * (1 - Math.pow(0.0004, dt));
    var corsaVoluta = Math.max(0, Math.min(1, (S.v / SC * 0.25 - 230) / 220));
    S.corsa += (corsaVoluta - S.corsa) * (1 - Math.pow(0.03, dt));
    var P = par();
    if (!ridotto) S.fase += Math.abs(dx) / SC / (P.S / P.st);
    var muove = !ridotto && vel > 6;
    S.fermo += ((muove ? 0 : 1) - S.fermo) * (1 - Math.pow(muove ? 0.00001 : 0.01, dt));
    colori();
    disegna();
    requestAnimationFrame(giro);
  }
  window.addEventListener('resize', function () { misura(); S.x = posto(progresso()); });
  disegna();
  requestAnimationFrame(giro);
})();
