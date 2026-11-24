const VISTA = 'ps-gestionale-guida-vista';

const PASSI = [
  {
    titolo: 'Benvenuto nel gestionale',
    testo:
      'Da qui cambi testi, foto, sfondo e contatti del sito, senza toccare il codice. Ti facciamo vedere come funziona: ci vuole un minuto.'
  },
  {
    vista: 'apertura',
    bersaglio: '#menu',
    titolo: 'Le parti del sito',
    testo:
      'Ogni voce è una parte del sito, nello stesso ordine in cui la vedi scorrendo. Quando ne cambi una, accanto compare un pallino d’oro.'
  },
  {
    vista: 'apertura',
    bersaglio: '#contenuto .gruppo .voce',
    titolo: 'Cambiare un testo',
    testo:
      'Clicca nel campo e scrivi. Il campo diventa d’oro e compare «Ripristina», che rimette il testo com’era.'
  },
  {
    vista: 'apertura',
    bersaglio: '#contenuto .aiuto',
    titolo: 'Le parole in oro',
    testo:
      'Scrivi le parole tra due asterischi, *così*, e sul sito diventano d’oro. Per andare a capo premi Invio.'
  },
  {
    bersaglio: '#stato',
    titolo: 'Le modifiche',
    testo: 'Qui vedi quante modifiche hai fatto. Il sito non cambia finché non le pubblichi.'
  },
  {
    bersaglio: '#anteprima',
    titolo: 'Anteprima',
    testo:
      'Apre il sito con le tue modifiche già dentro, in una nuova scheda. Lo vedi solo tu: serve per controllare prima di pubblicare.'
  },
  {
    bersaglio: '#pubblica',
    titolo: 'Pubblica',
    testo: 'Quando hai finito, premi qui. Puoi cambiare più parti e pubblicarle tutte insieme.'
  },
  {
    bersaglio: '#annulla',
    titolo: 'Annulla',
    testo: 'Cancella le modifiche non ancora pubblicate e rimette tutto com’è adesso sul sito.'
  },
  {
    vista: 'immagini',
    bersaglio: '#contenuto .foto',
    titolo: 'Le foto',
    testo:
      'Premi «Cambia foto» e scegli un’immagine dal computer o dal telefono. Il gestionale la rimpicciolisce e la alleggerisce da solo.'
  },
  {
    vista: 'sfondo',
    bersaglio: '#contenuto .sfondi',
    titolo: 'Lo sfondo',
    testo:
      'Lo sfondo animato in cima al sito. Un clic su quello che preferisci, poi Anteprima per vederlo muoversi e Pubblica.'
  },
  {
    vista: 'contatti',
    bersaglio: '#contenuto .gruppo',
    titolo: 'Contatti',
    testo:
      'Numero e Instagram. Il numero si aggiorna in tutto il sito: chiamata, WhatsApp e modulo di richiesta.'
  },
  {
    vista: 'google',
    bersaglio: '#contenuto .gruppo',
    titolo: 'Google',
    testo: 'Il titolo e la descrizione che compaiono su Google e quando qualcuno manda il link del sito.'
  },
  {
    vista: 'impostazioni',
    bersaglio: '#cambia-password',
    titolo: 'La tua password',
    testo: 'Qui cambi utente e password. «Genera» ne crea una sicura per te: segnala prima di salvare.'
  },
  {
    vista: 'apertura',
    bersaglio: '.testata__azioni',
    titolo: 'Il sito e l’uscita',
    testo:
      '«Apri il sito» lo apre in una nuova scheda. «Esci» chiude il gestionale, che si chiude anche da solo dopo 30 minuti senza usarlo.'
  },
  {
    bersaglio: '#apri-guida',
    titolo: 'Rivedere la guida',
    testo: 'Se ti serve di nuovo, premi qui e la guida riparte dall’inizio. Buon lavoro.'
  }
];

const $ = (s, c = document) => c.querySelector(s);

export function guidaVista() {
  try {
    return localStorage.getItem(VISTA) === '1';
  } catch (e) {
    return true;
  }
}

function segnaVista() {
  try {
    localStorage.setItem(VISTA, '1');
  } catch (e) {}
}

let attiva = null;

export function avviaGuida({ mostra, vistaAttuale }) {
  if (attiva) attiva.chiudi();
  const ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tornaA = vistaAttuale();

  const velo = document.createElement('div');
  velo.className = 'guida';
  velo.innerHTML = `
    <div class="guida__blocco"></div>
    <div class="guida__luce"></div>
    <div class="guida__scheda" role="dialog" aria-modal="true" aria-labelledby="guida-titolo">
      <div class="guida__barra"><i></i></div>
      <p class="guida__conta"></p>
      <h2 id="guida-titolo"></h2>
      <p class="guida__testo"></p>
      <div class="guida__tasti">
        <button type="button" class="guida__salta">Salta la guida</button>
        <span>
          <button type="button" class="pulsante pulsante--vuoto pulsante--piccolo guida__indietro">Indietro</button>
          <button type="button" class="pulsante pulsante--piccolo guida__avanti">Avanti</button>
        </span>
      </div>
    </div>`;
  document.body.append(velo);
  document.documentElement.classList.add('con-guida');

  const luce = $('.guida__luce', velo);
  const scheda = $('.guida__scheda', velo);
  let i = 0;
  let bersaglio = null;

  function posiziona() {
    const largo = innerWidth;
    const alto = innerHeight;
    const telefono = largo < 640;
    if (!bersaglio) {
      luce.classList.add('guida__luce--spenta');
      Object.assign(luce.style, {
        left: largo / 2 + 'px',
        top: alto / 2 + 'px',
        width: '0px',
        height: '0px'
      });
      scheda.classList.toggle('guida__scheda--basso', telefono);
      Object.assign(
        scheda.style,
        telefono
          ? { left: '', top: '' }
          : { left: (largo - scheda.offsetWidth) / 2 + 'px', top: (alto - scheda.offsetHeight) / 2 + 'px' }
      );
      return;
    }
    luce.classList.remove('guida__luce--spenta');
    const r = bersaglio.getBoundingClientRect();
    const m = 8;
    const x = Math.max(6, r.left - m);
    const y = Math.max(6, r.top - m);
    const w = Math.min(largo - 12, r.right + m) - x;
    const h = Math.min(alto - 12, r.bottom + m) - y;
    Object.assign(luce.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });

    scheda.classList.toggle('guida__scheda--basso', telefono);
    if (telefono) {
      scheda.style.left = scheda.style.top = '';
      const sh = scheda.offsetHeight + 24;
      scheda.classList.toggle('guida__scheda--alto', y + h > alto - sh && y > sh);
      return;
    }
    scheda.classList.remove('guida__scheda--alto');
    const sw = scheda.offsetWidth;
    const sh = scheda.offsetHeight;
    let top;
    let left;
    if (alto - (y + h) > sh + 24) top = y + h + 16;
    else if (y > sh + 24) top = y - sh - 16;
    else top = Math.max(16, (alto - sh) / 2);
    if (top === Math.max(16, (alto - sh) / 2) && largo - (x + w) > sw + 32) left = x + w + 16;
    else if (top === Math.max(16, (alto - sh) / 2) && x > sw + 32) left = x - sw - 16;
    else left = Math.min(largo - sw - 16, Math.max(16, x + w / 2 - sw / 2));
    scheda.style.left = left + 'px';
    scheda.style.top = top + 'px';
  }

  function vai(n) {
    i = Math.max(0, Math.min(PASSI.length - 1, n));
    const p = PASSI[i];
    if (p.vista && vistaAttuale() !== p.vista) mostra(p.vista);
    bersaglio = p.bersaglio ? $(p.bersaglio) : null;
    if (bersaglio && !bersaglio.getClientRects().length) bersaglio = null;
    if (bersaglio) {
      const r = bersaglio.getBoundingClientRect();
      if (r.top < 70 || r.bottom > innerHeight - 160)
        bersaglio.scrollIntoView({ block: 'center', inline: 'center' });
      const nelMenu = bersaglio.closest('#menu');
      if (nelMenu && bersaglio !== nelMenu) bersaglio.scrollIntoView({ block: 'nearest', inline: 'center' });
    }
    $('.guida__conta', velo).textContent = i === 0 ? 'Guida' : `${i} di ${PASSI.length - 1}`;
    $('#guida-titolo', velo).textContent = p.titolo;
    $('.guida__testo', velo).textContent = p.testo;
    $('.guida__indietro', velo).hidden = i === 0;
    $('.guida__avanti', velo).textContent =
      i === 0 ? 'Iniziamo' : i === PASSI.length - 1 ? 'Ho capito' : 'Avanti';
    $('.guida__salta', velo).hidden = i === PASSI.length - 1;
    $('.guida__barra i', velo).style.transform = `scaleX(${i / (PASSI.length - 1)})`;
    scheda.classList.remove('guida__scheda--entra');
    void scheda.offsetWidth;
    if (!ridotto) scheda.classList.add('guida__scheda--entra');
    requestAnimationFrame(posiziona);
    $('.guida__avanti', velo).focus({ preventScroll: true });
  }

  function chiudi() {
    segnaVista();
    removeEventListener('resize', posiziona);
    removeEventListener('scroll', posiziona, true);
    removeEventListener('keydown', tasti, true);
    document.documentElement.classList.remove('con-guida');
    velo.classList.add('guida--esce');
    setTimeout(() => velo.remove(), ridotto ? 0 : 300);
    if (vistaAttuale() !== tornaA) mostra(tornaA);
    attiva = null;
    const b = $('#apri-guida');
    if (b) b.focus({ preventScroll: true });
  }

  function tasti(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      chiudi();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      i === PASSI.length - 1 ? chiudi() : vai(i + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      vai(i - 1);
    } else if (e.key === 'Tab') {
      const tab = [...velo.querySelectorAll('button:not([hidden])')];
      const k = tab.indexOf(document.activeElement);
      e.preventDefault();
      tab[(k + (e.shiftKey ? -1 : 1) + tab.length) % tab.length].focus();
    }
  }

  $('.guida__avanti', velo).addEventListener('click', () => (i === PASSI.length - 1 ? chiudi() : vai(i + 1)));
  $('.guida__indietro', velo).addEventListener('click', () => vai(i - 1));
  $('.guida__salta', velo).addEventListener('click', chiudi);
  addEventListener('resize', posiziona);
  addEventListener('scroll', posiziona, true);
  addEventListener('keydown', tasti, true);

  attiva = { chiudi };
  vai(0);
}
