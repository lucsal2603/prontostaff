// modulo "richiedi personale"
// finché non ci sono numero ed email veri la richiesta parte su Instagram (testo copiato negli appunti)
(function () {
  'use strict';

  var CONTATTI = {
    whatsapp: '', // es. '393331234567'
    email: '',
    instagram: 'prontostaffcatering'
  };

  var form = document.getElementById('richiesta');
  if (!form) return;
  var esito = form.querySelector('.richiesta__esito');

  function valore(nome) {
    var el = form.elements[nome];
    return el ? el.value.trim() : '';
  }

  function dataLeggibile(v) {
    if (!v) return '';
    var d = new Date(v + 'T12:00:00');
    try {
      return d.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return v;
    }
  }

  function messaggio() {
    var figure = ['camerieri', 'bartender', 'facchini', 'hostess']
      .filter(function (n) {
        return parseInt(valore(n), 10) > 0;
      })
      .map(function (n) {
        return valore(n) + ' ' + n;
      });
    var righe = [
      'Buongiorno ProntoStaff+, vorrei richiedere personale per un evento.',
      '',
      'Catering / azienda: ' + valore('azienda'),
      'Data: ' + dataLeggibile(valore('data')),
      'Luogo: ' + valore('luogo'),
      'Servizio: ' + valore('servizio'),
      'Persone: ' + (figure.length ? figure.join(', ') : 'da definire')
    ];
    if (valore('orari')) righe.push('Orari: ' + valore('orari'));
    if (valore('note')) righe.push('Note: ' + valore('note'));
    righe.push('Recapito: ' + valore('recapito'));
    return righe.join('\n');
  }

  function copia(testo) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(testo);
    return new Promise(function (ok, ko) {
      var t = document.createElement('textarea');
      t.value = testo;
      t.setAttribute('readonly', '');
      t.style.position = 'fixed';
      t.style.opacity = '0';
      document.body.appendChild(t);
      t.select();
      var riuscito = document.execCommand('copy');
      t.remove();
      riuscito ? ok() : ko();
    });
  }

  form.addEventListener('input', function (e) {
    e.target.classList.remove('errore');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var mancanti = Array.prototype.filter.call(form.querySelectorAll('[required]'), function (el) {
      return !el.value.trim();
    });
    mancanti.forEach(function (el) {
      el.classList.add('errore');
    });
    if (mancanti.length) {
      esito.textContent =
        'Mancano alcuni dati: data, luogo, tipo di servizio e un recapito ci servono per risponderti.';
      mancanti[0].focus();
      return;
    }

    var testo = messaggio();
    if (CONTATTI.whatsapp) {
      window.open('https://wa.me/' + CONTATTI.whatsapp + '?text=' + encodeURIComponent(testo), '_blank');
      esito.textContent = 'Si apre WhatsApp con la richiesta già scritta: basta inviarla.';
    } else if (CONTATTI.email) {
      location.href =
        'mailto:' +
        CONTATTI.email +
        '?subject=' +
        encodeURIComponent('Richiesta personale – ' + valore('data') + ' – ' + valore('luogo')) +
        '&body=' +
        encodeURIComponent(testo);
      esito.textContent = 'Si apre la tua email con la richiesta già scritta: basta inviarla.';
    } else {
      var apri = function () {
        window.open('https://ig.me/m/' + CONTATTI.instagram, '_blank');
      };
      copia(testo).then(
        function () {
          esito.textContent = 'Richiesta copiata. Si apre Instagram: incolla il messaggio e invialo.';
          apri();
        },
        function () {
          esito.textContent = 'Scrivici su Instagram (@' + CONTATTI.instagram + ') con questi dati.';
          apri();
        }
      );
    }
  });
})();
