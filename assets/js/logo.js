// intro: vassoio -> bicchieri -> + -> logo
(function () {
  'use strict';

  var CENTRO = { x: 1155, y: 190 };
  var PIU = { x: 2169, y: 209 };
  var GIRO = 300;
  var GRANDE = 2.2;
  var VASSOIO_Y = 370;
  var POSTI = [-336, -168, 0, 168, 336];
  var BASE = 1.45;

  var PEZZI = [
    'M-84 -18 L-16 -18 L-16 18 L-84 18 Z',
    'M-18 -84 L18 -84 L18 -16 L-18 -16 Z',
    'M-18 -18 L18 -18 L18 18 L-18 18 Z',
    'M-18 16 L18 16 L18 84 L-18 84 Z',
    'M16 -18 L84 -18 L84 18 L16 18 Z'
  ];

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  window.animaLogo = function (svg, opzioni) {
    opzioni = opzioni || {};
    var q = function (s) {
      return svg.querySelector(s);
    };
    var qq = function (s) {
      return Array.prototype.slice.call(svg.querySelectorAll(s));
    };
    var bicchieri = qq('.ls-bicchiere');
    var forme = qq('.ls-forma');
    var riflessi = qq('.ls-riflesso');
    var vassoio = q('.ls-vassoio');
    var angoli = bicchieri.map(function (b, i) {
      return -Math.PI / 2 + i * ((Math.PI * 2) / 5);
    });

    var S = { k: 0, R: 0, phi: 0, m: 0, mv: 0, alza: 0 };
    var su = { b0: 0, b1: 0, b2: 0, b3: 0, b4: 0 };
    function disegna() {
      var cx = lerp(CENTRO.x, PIU.x, S.mv);
      var cy = lerp(CENTRO.y, PIU.y, S.mv);
      var grande = lerp(GRANDE, 1, S.mv);
      bicchieri.forEach(function (b, i) {
        var a = angoli[i] + S.phi;
        var bx = CENTRO.x + POSTI[i],
          by = VASSOIO_Y - S.alza * 40;
        var ox = CENTRO.x + S.R * Math.cos(a),
          oy = CENTRO.y + S.R * Math.sin(a);
        var x = lerp(lerp(bx, ox, S.k), cx, S.m);
        var y = lerp(lerp(by, oy, S.k), cy, S.m);
        var giro = ((a * 180) / Math.PI + 90) * S.k * (1 - S.m);
        var sc = lerp(lerp(BASE, 0.62, S.k), grande, S.m);
        var sy = Math.max(0.001, su['b' + i]);
        b.setAttribute(
          'transform',
          'translate(' +
            x.toFixed(2) +
            ' ' +
            y.toFixed(2) +
            ') rotate(' +
            giro.toFixed(2) +
            ') scale(' +
            sc.toFixed(4) +
            ' ' +
            (sc * sy).toFixed(4) +
            ')'
        );
      });
    }

    var tl = gsap.timeline({ paused: !!opzioni.ferma, onUpdate: disegna });
    gsap.set([q('.ls-pronto'), q('.ls-staff')], { y: 380 });
    gsap.set(q('.ls-piu-vero'), { opacity: 0 });
    gsap.set(riflessi, { opacity: 0.55 });
    gsap.set(vassoio, { opacity: 1, attr: { transform: 'translate(1155 330) scale(0 1)' } });
    disegna();

    tl.to(
      { v: 0 },
      {
        v: 1,
        duration: 0.8,
        ease: 'expo.out',
        onUpdate: function () {
          vassoio.setAttribute(
            'transform',
            'translate(1155 ' +
              VASSOIO_Y +
              ') scale(' +
              (this.targets()[0].v * BASE).toFixed(4) +
              ' ' +
              BASE +
              ')'
          );
        }
      },
      0
    );

    bicchieri.forEach(function (b, i) {
      var fine = {};
      fine['b' + i] = 1;
      tl.to(su, Object.assign(fine, { duration: 0.8, ease: 'back.out(2.4)' }), 0.32 + i * 0.08);
    });

    tl.to(S, { alza: 1, duration: 0.35, ease: 'power2.out' }, 1.25)
      .to(vassoio, { opacity: 0, duration: 0.45, ease: 'power2.in' }, 1.3)
      .to(
        { v: 0 },
        {
          v: 1,
          duration: 0.5,
          ease: 'power2.in',
          onUpdate: function () {
            var v = this.targets()[0].v;
            vassoio.setAttribute(
              'transform',
              'translate(1155 ' +
                (VASSOIO_Y + v * 50) +
                ') scale(' +
                ((1 - v * 0.25) * BASE).toFixed(4) +
                ' ' +
                BASE +
                ')'
            );
          }
        },
        1.3
      )
      .to(riflessi, { opacity: 0, duration: 0.4 }, 1.35)
      .to(S, { k: 1, R: GIRO, duration: 0.7, ease: 'power3.inOut' }, 1.4)
      .to(S, { phi: Math.PI * 1.6, duration: 1.75, ease: 'power2.inOut' }, 1.4)

      .to(S, { R: 0, duration: 0.65, ease: 'power3.in' }, 2.45)
      .to(S, { m: 1, duration: 0.75, ease: 'power3.inOut' }, 2.45);
    forme.forEach(function (f, i) {
      tl.to(f, { morphSVG: PEZZI[i], duration: 0.7, ease: 'power3.inOut' }, 2.5);
    });

    tl.to(S, { mv: 1, duration: 1, ease: 'expo.inOut' }, 3.35)
      .to(q('.ls-pronto'), { y: 0, duration: 1.1, ease: 'expo.out' }, 3.8)
      .to(q('.ls-staff'), { y: 0, duration: 1.1, ease: 'expo.out' }, 3.92)
      .set(q('.ls-piu-vero'), { opacity: 1 }, 4.38)
      .set(bicchieri, { opacity: 0 }, 4.4)
      .to(
        q('.ls-piu-vero'),
        { rotation: 90, svgOrigin: PIU.x + ' ' + PIU.y, duration: 0.9, ease: 'back.inOut(1.6)' },
        4.45
      );

    return tl;
  };

  window.logoFermo = function (svg) {
    var q = function (s) {
      return svg.querySelector(s);
    };
    Array.prototype.slice.call(svg.querySelectorAll('.ls-bicchiere, .ls-vassoio')).forEach(function (e) {
      e.style.display = 'none';
    });
    q('.ls-piu-vero').setAttribute('opacity', '1');
  };
})();
