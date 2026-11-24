(function () {
  'use strict';

  var form = document.getElementById('richiesta');
  if (!form) return;
  var ridotto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MESI = [
    'gennaio',
    'febbraio',
    'marzo',
    'aprile',
    'maggio',
    'giugno',
    'luglio',
    'agosto',
    'settembre',
    'ottobre',
    'novembre',
    'dicembre'
  ];
  var GIORNI = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
  var aperto = null;

  var FRECCIA =
    '<svg viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
  var CALENDARIO =
    '<svg viewBox="0 0 18 18" aria-hidden="true"><rect x="1.5" y="3" width="15" height="13.5" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M1.5 7.5h15M5.5 1v4M12.5 1v4" stroke="currentColor" stroke-width="1.4" fill="none"/></svg>';
  var PIU = '<svg viewBox="0 0 20 20" aria-hidden="true"><use href="#i-piu"/></svg>';
  var MENO = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M1.5 8.9h17v2.2h-17z"/></svg>';
  var PRIMA =
    '<svg viewBox="0 0 8 12" aria-hidden="true"><path d="M6.5 1l-5 5 5 5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
  var DOPO =
    '<svg viewBox="0 0 8 12" aria-hidden="true"><path d="M1.5 1l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';

  function crea(tag, classe, html) {
    var el = document.createElement(tag);
    if (classe) el.className = classe;
    if (html != null) el.innerHTML = html;
    return el;
  }

  function cambia(input, v) {
    input.value = v;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // pannelli
  function apri(campo, pannello, dopo) {
    if (aperto && aperto.campo !== campo) chiudi();
    aperto = { campo: campo, pannello: pannello };
    campo.classList.add('aperto');
    pannello.hidden = false;
    gsap.killTweensOf(pannello);
    gsap.fromTo(
      pannello,
      { autoAlpha: 0, y: ridotto ? 0 : -10, scale: ridotto ? 1 : 0.97 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.6)', transformOrigin: '50% 0' }
    );
    if (dopo) dopo();
    document.documentElement.classList.add('modulo-aperto');
    var sotto = pannello.getBoundingClientRect().bottom + 24 - window.innerHeight;
    if (sotto > 0) window.scrollBy({ top: sotto, behavior: ridotto ? 'auto' : 'smooth' });
  }

  function chiudi() {
    if (!aperto) return;
    var a = aperto;
    aperto = null;
    a.campo.classList.remove('aperto');
    document.documentElement.classList.remove('modulo-aperto');
    gsap.to(a.pannello, {
      autoAlpha: 0,
      y: ridotto ? 0 : -6,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: function () {
        a.pannello.hidden = true;
      }
    });
  }

  document.addEventListener('pointerdown', function (e) {
    if (aperto && !aperto.campo.contains(e.target)) chiudi();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && aperto) {
      var bottone = aperto.campo.querySelector('.scelta__campo');
      chiudi();
      if (bottone) bottone.focus();
    }
  });

  // tendina al posto del select
  function scelta(select, segnaposto) {
    var campo = select.closest('.campo') || select.parentNode;
    campo.classList.add('campo--scelta');
    var bottone = crea('button', 'scelta__campo');
    bottone.type = 'button';
    bottone.setAttribute('aria-haspopup', 'listbox');
    bottone.setAttribute('aria-expanded', 'false');
    var etichetta = crea('span', 'scelta__valore');
    bottone.append(etichetta);
    bottone.insertAdjacentHTML('beforeend', '<span class="scelta__icona">' + FRECCIA + '</span>');
    var lista = crea('ul', 'scelta__lista');
    lista.setAttribute('role', 'listbox');
    lista.setAttribute('data-lenis-prevent', '');
    lista.hidden = true;

    Array.prototype.forEach.call(select.options, function (o) {
      if (!o.value) return;
      var li = crea('li', 'scelta__voce');
      li.setAttribute('role', 'option');
      li.tabIndex = -1;
      li.dataset.valore = o.value;
      li.innerHTML = '<span class="scelta__segno">' + PIU + '</span><span></span>';
      li.lastChild.textContent = o.textContent;
      li.addEventListener('click', function () {
        cambia(select, o.value);
        aggiorna();
        chiudi();
        bottone.focus();
      });
      lista.append(li);
    });

    function aggiorna() {
      var o = select.options[select.selectedIndex];
      var vuoto = !select.value;
      etichetta.textContent = vuoto ? segnaposto || 'Scegli' : o.textContent;
      bottone.classList.toggle('vuoto', vuoto);
      lista.querySelectorAll('.scelta__voce').forEach(function (li) {
        var si = li.dataset.valore === select.value;
        li.classList.toggle('scelta__voce--scelta', si);
        li.setAttribute('aria-selected', si ? 'true' : 'false');
      });
    }

    function mostra() {
      bottone.setAttribute('aria-expanded', 'true');
      apri(campo, lista, function () {
        var scelta = lista.querySelector('.scelta__voce--scelta');
        if (scelta) lista.scrollTop = scelta.offsetTop - lista.clientHeight / 2 + scelta.offsetHeight / 2;
        else lista.scrollTop = 0;
        gsap.fromTo(
          lista.children,
          { autoAlpha: 0, y: ridotto ? 0 : 8 },
          { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.025, ease: 'power3.out', delay: 0.05 }
        );
        (scelta || lista.firstElementChild).focus({ preventScroll: true });
      });
    }

    bottone.addEventListener('click', function () {
      if (aperto && aperto.campo === campo) {
        chiudi();
        bottone.setAttribute('aria-expanded', 'false');
      } else mostra();
    });
    bottone.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        mostra();
      }
    });
    lista.addEventListener('keydown', function (e) {
      var voci = Array.prototype.slice.call(lista.children);
      var i = voci.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        var n = voci[Math.max(0, Math.min(voci.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))];
        n.focus();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (voci[i]) voci[i].click();
      } else if (e.key === 'Tab') chiudi();
    });

    select.classList.add('nascosto');
    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true');
    select.after(bottone, lista);
    select.addEventListener('change', aggiorna);
    aggiorna();
    return { bottone: bottone, aggiorna: aggiorna };
  }

  // calendario al posto di input[type=date]
  function calendario(input) {
    var campo = input.closest('.campo');
    campo.classList.add('campo--scelta');
    input.type = 'hidden';
    var bottone = crea('button', 'scelta__campo vuoto');
    bottone.type = 'button';
    bottone.setAttribute('aria-haspopup', 'dialog');
    var etichetta = crea('span', 'scelta__valore', 'Scegli la data');
    bottone.append(etichetta);
    bottone.insertAdjacentHTML('beforeend', '<span class="scelta__icona">' + CALENDARIO + '</span>');

    var pannello = crea('div', 'calendario');
    pannello.hidden = true;
    pannello.setAttribute('role', 'dialog');
    pannello.setAttribute('aria-label', "Data dell'evento");
    pannello.innerHTML =
      '<div class="calendario__testa"><button type="button" class="calendario__freccia" data-passo="-1" aria-label="Mese precedente">' +
      PRIMA +
      '</button><span class="calendario__mese" aria-live="polite"></span><button type="button" class="calendario__freccia" data-passo="1" aria-label="Mese successivo">' +
      DOPO +
      '</button></div><div class="calendario__settimana">' +
      GIORNI.map(function (g) {
        return '<span>' + g + '</span>';
      }).join('') +
      '</div><div class="calendario__giorni"></div><div class="calendario__piede"><button type="button" class="calendario__oggi">Oggi</button><span class="calendario__scelta"></span></div>';

    var oggi = new Date();
    oggi.setHours(0, 0, 0, 0);
    var vista = new Date(oggi.getFullYear(), oggi.getMonth(), 1);
    var griglia = pannello.querySelector('.calendario__giorni');

    function iso(d) {
      var p = function (n) {
        return String(n).padStart(2, '0');
      };
      return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
    }
    function scelta() {
      return input.value ? new Date(input.value + 'T00:00:00') : null;
    }
    function leggibile(d) {
      return d.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }

    function disegna(verso) {
      var mese = vista.getMonth();
      pannello.querySelector('.calendario__mese').textContent = MESI[mese] + ' ' + vista.getFullYear();
      pannello.querySelector('[data-passo="-1"]').disabled =
        vista <= new Date(oggi.getFullYear(), oggi.getMonth(), 1);
      var s = scelta();
      pannello.querySelector('.calendario__scelta').textContent = s ? leggibile(s) : '';
      griglia.innerHTML = '';
      var inizio = (new Date(vista.getFullYear(), mese, 1).getDay() + 6) % 7;
      for (var i = 0; i < inizio; i++) griglia.append(crea('span'));
      var giorni = new Date(vista.getFullYear(), mese + 1, 0).getDate();
      for (var g = 1; g <= giorni; g++) {
        var d = new Date(vista.getFullYear(), mese, g);
        var b = crea('button', 'calendario__giorno', '<span>' + g + '</span>');
        b.type = 'button';
        b.dataset.data = iso(d);
        b.setAttribute('aria-label', leggibile(d));
        if (d < oggi) b.disabled = true;
        if (+d === +oggi) b.classList.add('calendario__giorno--oggi');
        if (s && +d === +s) {
          b.classList.add('calendario__giorno--scelto');
          b.setAttribute('aria-pressed', 'true');
        }
        griglia.append(b);
      }
      if (verso && !ridotto) {
        gsap.fromTo(
          griglia,
          { x: 24 * verso, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, duration: 0.45, ease: 'power3.out' }
        );
      }
    }

    function scegli(d) {
      cambia(input, iso(d));
      etichetta.textContent = leggibile(d);
      bottone.classList.remove('vuoto');
      vista = new Date(d.getFullYear(), d.getMonth(), 1);
      disegna();
      var punto = griglia.querySelector('.calendario__giorno--scelto span');
      if (punto && !ridotto)
        gsap.fromTo(punto, { scale: 0.6 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
      setTimeout(
        function () {
          chiudi();
          bottone.focus();
        },
        ridotto ? 0 : 260
      );
    }

    griglia.addEventListener('click', function (e) {
      var b = e.target.closest('.calendario__giorno');
      if (!b || b.disabled) return;
      scegli(new Date(b.dataset.data + 'T00:00:00'));
    });
    griglia.addEventListener('keydown', function (e) {
      var passi = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
      if (!(e.key in passi)) return;
      e.preventDefault();
      var b = e.target.closest('.calendario__giorno');
      if (!b) return;
      var d = new Date(b.dataset.data + 'T00:00:00');
      d.setDate(d.getDate() + passi[e.key]);
      if (d < oggi) return;
      if (d.getMonth() !== vista.getMonth()) {
        vista = new Date(d.getFullYear(), d.getMonth(), 1);
        disegna(passi[e.key] > 0 ? 1 : -1);
      }
      var n = griglia.querySelector('[data-data="' + iso(d) + '"]');
      if (n) n.focus();
    });
    pannello.querySelectorAll('.calendario__freccia').forEach(function (f) {
      f.addEventListener('click', function () {
        var p = +f.dataset.passo;
        vista = new Date(vista.getFullYear(), vista.getMonth() + p, 1);
        disegna(p);
      });
    });
    pannello.querySelector('.calendario__oggi').addEventListener('click', function () {
      scegli(oggi);
    });

    bottone.addEventListener('click', function () {
      if (aperto && aperto.campo === campo) return chiudi();
      var s = scelta();
      vista = s
        ? new Date(s.getFullYear(), s.getMonth(), 1)
        : new Date(oggi.getFullYear(), oggi.getMonth(), 1);
      disegna();
      apri(campo, pannello, function () {
        gsap.fromTo(
          griglia.children,
          { autoAlpha: 0, scale: ridotto ? 1 : 0.6 },
          {
            autoAlpha: 1,
            scale: 1,
            duration: 0.4,
            ease: 'back.out(2)',
            stagger: { each: 0.008, from: 'start' },
            delay: 0.05
          }
        );
        var f =
          griglia.querySelector('.calendario__giorno--scelto') ||
          griglia.querySelector('button:not(:disabled)');
        if (f) f.focus({ preventScroll: true });
      });
    });

    input.after(bottone, pannello);
    form.addEventListener('reset', function () {
      etichetta.textContent = 'Scegli la data';
      bottone.classList.add('vuoto');
    });
  }

  // contatore per le persone
  function contatore(input) {
    var label = input.closest('label');
    label.classList.add('contatore');
    input.type = 'text';
    input.inputMode = 'numeric';
    input.setAttribute('autocomplete', 'off');
    var meno = crea('button', 'contatore__tasto', MENO);
    var piu = crea('button', 'contatore__tasto', PIU);
    meno.type = piu.type = 'button';
    meno.setAttribute('aria-label', 'Una persona in meno');
    piu.setAttribute('aria-label', 'Una persona in più');
    var riga = crea('span', 'contatore__riga');
    input.replaceWith(riga);
    riga.append(meno, input, piu);

    function numero() {
      var n = parseInt(input.value, 10);
      return isNaN(n) ? 0 : n;
    }
    function imposta(n, verso) {
      n = Math.max(0, Math.min(200, n));
      cambia(input, n ? String(n) : '');
      meno.disabled = n === 0;
      label.classList.toggle('contatore--pieno', n > 0);
      if (verso && !ridotto)
        gsap.fromTo(
          input,
          { y: 10 * verso, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.35, ease: 'back.out(2)' }
        );
    }
    function premi(t) {
      if (!ridotto)
        gsap.fromTo(t, { scale: 0.86 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.45)' });
    }
    meno.addEventListener('click', function () {
      premi(meno);
      imposta(numero() - 1, -1);
    });
    piu.addEventListener('click', function () {
      premi(piu);
      imposta(numero() + 1, 1);
    });
    input.addEventListener('input', function () {
      var pulito = input.value.replace(/\D/g, '').slice(0, 3);
      if (pulito !== input.value) input.value = pulito;
      meno.disabled = numero() === 0;
      label.classList.toggle('contatore--pieno', numero() > 0);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        imposta(numero() + (e.key === 'ArrowUp' ? 1 : -1), e.key === 'ArrowUp' ? 1 : -1);
      }
    });
    meno.disabled = numero() === 0;
  }

  // orari: dalle / alle
  function orari(input) {
    var campo = input.closest('.campo');
    input.type = 'hidden';
    var ore = [];
    for (var m = 6 * 60; m <= 28 * 60; m += 30) {
      var h = Math.floor(m / 60) % 24;
      ore.push(String(h).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'));
    }
    var riga = crea('span', 'orari');
    campo.append(riga);
    var scelte = ['Dalle', 'Alle'].map(function (nome) {
      var parte = crea('span', 'orari__parte');
      var s = crea('select');
      s.innerHTML =
        '<option value="">' +
        nome +
        '</option>' +
        ore
          .map(function (o) {
            return '<option>' + o + '</option>';
          })
          .join('');
      parte.append(s);
      riga.append(parte);
      s.addEventListener('input', aggiorna);
      return { select: s, parte: parte };
    });
    function aggiorna() {
      var a = scelte[0].select.value;
      var b = scelte[1].select.value;
      cambia(input, a || b ? (a || '?') + ' – ' + (b || '?') : '');
    }
    scelte.forEach(function (s, i) {
      s.parte.classList.add('campo');
      scelta(s.select, i ? 'Alle' : 'Dalle');
    });
  }

  calendario(form.elements.data);
  scelta(form.elements.servizio, 'Scegli il servizio');
  ['camerieri', 'bartender', 'facchini', 'hostess'].forEach(function (n) {
    contatore(form.elements[n]);
  });
  orari(form.elements.orari);
})();
