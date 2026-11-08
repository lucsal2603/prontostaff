// cursore a +
(function () {
  'use strict';
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var el = document.querySelector('.puntatore');
  if (!el) return;
  document.documentElement.classList.add('con-puntatore');

  var x = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3.out' });
  var y = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3.out' });
  var stato = '';

  function imposta(nuovo) {
    if (nuovo === stato) return;
    stato = nuovo;
    gsap.to(el.firstElementChild, {
      scale: nuovo === 'link' ? 0.55 : nuovo === 'nascosto' ? 0 : 1,
      rotation: nuovo === 'link' ? 90 : 0,
      duration: 0.5,
      ease: 'back.out(2)',
      overwrite: true
    });
  }

  window.addEventListener('mousemove', function (e) {
    x(e.clientX);
    y(e.clientY);
    var t = e.target;
    el.classList.toggle(
      'puntatore--scuro',
      !!t.closest('.piede, .pillola--oro, .tessera--oro, .passaggio, .pieno') &&
        !t.closest('.tondo--nero, .pillola--nera')
    );
    if (t.closest('input, textarea, select, .figure__elenco')) imposta('nascosto');
    else if (t.closest('a, button, label, .voce')) imposta('link');
    else imposta('');
  });
  document.addEventListener('mouseleave', function () {
    imposta('nascosto');
  });
  document.addEventListener('mouseenter', function () {
    imposta('');
  });
  window.addEventListener('mousedown', function () {
    gsap.to(el.firstElementChild, { scale: '-=0.35', duration: 0.12 });
  });
  window.addEventListener('mouseup', function () {
    var s = stato;
    stato = 'x';
    imposta(s);
  });
})();
