// sfondo dell'apertura: griglia di + che si accendono sotto due luci calde
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

    // alone delle luci
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

    // i +
    var r2 = r * r,
      rc2 = r * r * 0.36;
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
