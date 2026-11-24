(function () {
  'use strict';

  var canvas = document.querySelector('.sfondo');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var ridotto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  var W = 0,
    H = 0,
    dpr = 1,
    passo = 46,
    punti = [];
  var cursore = { x: -9999, y: -9999, tx: -9999, ty: -9999, forza: 0 };
  var visibile = true;
  var modo = (new URLSearchParams(location.search).get('sfondo') || 'piu').toLowerCase();
  var tavoli = [],
    bolle = [],
    fili = [];

  function misura() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    passo = W < 760 ? 34 : 46;
    punti = [];
    var ox = ((W % passo) + passo) / 2,
      oy = ((H % passo) + passo) / 2;
    for (var y = oy; y < H; y += passo) {
      for (var x = ox; x < W; x += passo) punti.push([x, y, Math.random()]);
    }

    tavoli = [];
    var pt = W < 760 ? 96 : 132;
    var riga = 0;
    for (var ty = pt * 0.45; ty < H + pt; ty += pt * 0.86, riga++) {
      for (var tx = (riga % 2 ? pt / 2 : 0) + pt * 0.2; tx < W + pt; tx += pt) {
        tavoli.push({
          x: tx,
          y: ty,
          r: pt * (0.17 + Math.random() * 0.03),
          g: Math.random() * 6.28,
          s: Math.random()
        });
      }
    }

    bolle = [];
    var nb = Math.round((W * H) / (W < 760 ? 3200 : 4200));
    for (var i = 0; i < nb; i++) bolle.push(nuovaBolla(true));

    fili = [];
    var nf = W < 760 ? 18 : 28;
    for (var f = 0; f < nf; f++)
      fili.push({ y: (H * (f + 0.5)) / nf, f: Math.random() * 6.28, v: 0.6 + Math.random() * 0.8 });
  }

  function nuovaBolla(ovunque) {
    return {
      x: Math.random() * W,
      y: ovunque ? Math.random() * H : H + 10,
      r: 1 + Math.pow(Math.random(), 2) * 5,
      v: 10 + Math.random() * 26,
      f: Math.random() * 6.28,
      o: 0
    };
  }

  function intensita(x, y, l1, l2, r2, rc2) {
    var dx = x - l1.x,
      dy = y - l1.y;
    var k = Math.max(0, 1 - (dx * dx + dy * dy) / r2);
    dx = x - l2.x;
    dy = y - l2.y;
    k += 0.8 * Math.max(0, 1 - (dx * dx + dy * dy) / r2);
    if (cursore.forza > 0.01) {
      dx = x - cursore.x;
      dy = y - cursore.y;
      k += 1.2 * cursore.forza * Math.max(0, 1 - (dx * dx + dy * dy) / rc2);
    }
    return Math.min(1, k);
  }

  function colore(k, base) {
    return k > 0.15
      ? 'rgba(233,184,60,' + (0.08 + k * k * 0.7).toFixed(3) + ')'
      : 'rgba(242,237,227,' + (base + k * 0.3).toFixed(3) + ')';
  }

  function disegnaTavoli(t, l1, l2, r2, rc2) {
    ctx.lineWidth = 1;
    for (var i = 0; i < tavoli.length; i++) {
      var tv = tavoli[i];
      var k = intensita(tv.x, tv.y, l1, l2, r2, rc2);
      ctx.strokeStyle = colore(k, 0.07);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath();
      ctx.arc(tv.x, tv.y, tv.r, 0, 6.2832);
      ctx.stroke();
      var giro = tv.g + t * 0.04 * (tv.s - 0.5);
      var apri = tv.r + 7 + k * 4;
      for (var c = 0; c < 8; c++) {
        var a = giro + (c / 8) * 6.2832;
        var cx = tv.x + Math.cos(a) * apri,
          cy = tv.y + Math.sin(a) * apri;
        ctx.beginPath();
        ctx.arc(cx, cy, 2.6 + k * 1.2, a + 1.9, a + 4.4);
        ctx.stroke();
      }
      if (k > 0.35) {
        ctx.beginPath();
        ctx.arc(tv.x, tv.y, 1.4 + k * 1.4, 0, 6.2832);
        ctx.fill();
      }
    }
  }

  var ultimo = 0;
  function disegnaBolle(t, l1, l2, r2, rc2) {
    var dt = Math.min(0.05, t - ultimo || 0);
    ultimo = t;
    ctx.lineWidth = 1;
    for (var i = 0; i < bolle.length; i++) {
      var b = bolle[i];
      b.y -= b.v * dt;
      b.o = Math.min(1, b.o + dt * 0.8);
      var x = b.x + Math.sin(t * 1.4 + b.f) * (3 + b.r);
      if (cursore.forza > 0.01) {
        var dx = x - cursore.x,
          dy = b.y - cursore.y,
          d = Math.sqrt(dx * dx + dy * dy);
        if (d < 120) b.x += (dx / (d || 1)) * (1 - d / 120) * 2.2 * cursore.forza;
      }
      if (b.y < -10) {
        bolle[i] = nuovaBolla(false);
        continue;
      }
      var k = intensita(x, b.y, l1, l2, r2, rc2);
      ctx.strokeStyle = colore(k, 0.14);
      ctx.globalAlpha = b.o * Math.min(1, b.y / (H * 0.25));
      ctx.beginPath();
      ctx.arc(x, b.y, b.r, 0, 6.2832);
      ctx.stroke();
      if (k > 0.3 && b.r > 2) {
        ctx.beginPath();
        ctx.arc(x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.22, 0, 6.2832);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function disegnaFili(t, l1, l2, r2, rc2) {
    ctx.lineWidth = 1;
    var tratto = W < 760 ? 10 : 14;
    for (var i = 0; i < fili.length; i++) {
      var fl = fili[i];
      var prec = null;
      for (var x = -tratto; x <= W + tratto; x += tratto) {
        var y =
          fl.y +
          Math.sin(x * 0.006 + t * 0.35 * fl.v + fl.f) * 14 +
          Math.sin(x * 0.013 - t * 0.22 + i * 0.4) * 7;
        if (cursore.forza > 0.01) {
          var dx = x - cursore.x,
            dy = y - cursore.y,
            d2 = dx * dx + dy * dy;
          y += Math.tanh(dy / 18) * 28 * cursore.forza * Math.exp(-d2 / 12000);
        }
        if (prec) {
          var k = intensita(x, y, l1, l2, r2, rc2);
          ctx.strokeStyle = colore(k, 0.06);
          ctx.beginPath();
          ctx.moveTo(prec[0], prec[1]);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
        prec = [x, y];
      }
    }
  }

  function luce(t, a, b, c, d) {
    return {
      x: W * (0.5 + 0.38 * Math.sin(t * a + c)),
      y: H * (0.45 + 0.32 * Math.sin(t * b + d))
    };
  }

  function disegna(t) {
    ctx.clearRect(0, 0, W, H);
    var l1 = luce(t, 0.11, 0.17, 0.4, 1.3);
    var l2 = luce(t, 0.08, 0.13, 3.1, 4.2);
    var r = Math.max(W, H) * 0.42;

    [l1, l2].forEach(function (l, i) {
      var g = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, r);
      g.addColorStop(0, i ? 'rgba(233,184,60,0.13)' : 'rgba(233,184,60,0.18)');
      g.addColorStop(1, 'rgba(233,184,60,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    });
    if (cursore.forza > 0.01) {
      var gc = ctx.createRadialGradient(cursore.x, cursore.y, 0, cursore.x, cursore.y, r * 0.6);
      gc.addColorStop(0, 'rgba(233,184,60,' + 0.12 * cursore.forza + ')');
      gc.addColorStop(1, 'rgba(233,184,60,0)');
      ctx.fillStyle = gc;
      ctx.fillRect(0, 0, W, H);
    }

    var r2 = r * r,
      rc2 = r * r * 0.36;
    if (modo === 'tavoli') return disegnaTavoli(t, l1, l2, r2, rc2);
    if (modo === 'bollicine') return disegnaBolle(t, l1, l2, r2, rc2);
    if (modo === 'fili') return disegnaFili(t, l1, l2, r2, rc2);
    for (var i = 0; i < punti.length; i++) {
      var p = punti[i];
      var dx = p[0] - l1.x,
        dy = p[1] - l1.y,
        d1 = dx * dx + dy * dy;
      dx = p[0] - l2.x;
      dy = p[1] - l2.y;
      var d2 = dx * dx + dy * dy;
      var k = Math.max(0, 1 - d1 / r2) + 0.8 * Math.max(0, 1 - d2 / r2);
      if (cursore.forza > 0.01) {
        dx = p[0] - cursore.x;
        dy = p[1] - cursore.y;
        k += 1.2 * cursore.forza * Math.max(0, 1 - (dx * dx + dy * dy) / rc2);
      }
      k = Math.min(1, k);
      var scintilla = 0.5 + 0.5 * Math.sin(t * 1.3 + p[2] * 20);
      var a = 0.07 + k * k * (0.55 + 0.25 * scintilla);
      var s = 2.4 + k * 2.6;
      ctx.fillStyle =
        k > 0.15
          ? 'rgba(233,184,60,' + a.toFixed(3) + ')'
          : 'rgba(242,237,227,' + (0.06 + k * 0.3).toFixed(3) + ')';
      ctx.fillRect(p[0] - s, p[1] - 0.6, s * 2, 1.2);
      ctx.fillRect(p[0] - 0.6, p[1] - s, 1.2, s * 2);
    }
  }

  var inizio = performance.now();
  function giro(ora) {
    if (visibile) {
      cursore.x += (cursore.tx - cursore.x) * 0.08;
      cursore.y += (cursore.ty - cursore.y) * 0.08;
      disegna((ora - inizio) / 1000 + 6);
    }
    requestAnimationFrame(giro);
  }

  misura();
  window.addEventListener('resize', function () {
    misura();
    if (ridotto) disegna(6);
  });

  if (ridotto) {
    disegna(6);
    return;
  }
  if (mouse) {
    var ap = document.querySelector('.apertura');
    ap.addEventListener('mousemove', function (e) {
      var b = canvas.getBoundingClientRect();
      cursore.tx = e.clientX - b.left;
      cursore.ty = e.clientY - b.top;
      if (cursore.x < -9000) {
        cursore.x = cursore.tx;
        cursore.y = cursore.ty;
      }
      gsap.to(cursore, { forza: 1, duration: 0.6, overwrite: true });
    });
    ap.addEventListener('mouseleave', function () {
      gsap.to(cursore, { forza: 0, duration: 0.8, overwrite: true });
    });
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      visibile = e[0].isIntersecting;
    }).observe(canvas);
  }
  requestAnimationFrame(giro);
})();
