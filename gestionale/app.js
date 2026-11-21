import {
  SEZIONI,
  estraiTesti,
  applicaTesti,
  estraiImmagini,
  applicaImmagine,
  fileUsati,
  estraiContatti,
  applicaContatti,
  estraiGoogle,
  applicaGoogle
} from './contenuto.js';
import { creaGithub, SITO } from './github.js';
import { cifra, decifra, generaPassword } from './cripto.js';

const $ = (s, c = document) => c.querySelector(s);
const FILE_CHIAVE = 'gestionale/chiave.json';
const FILE_JS = 'assets/js/richiesta.js';
const MINUTI_INATTIVITA = 30;

let github = null;
let sessione = null; // { utente, token }
let orig = null; // contenuti come sono ora sul sito
let mod = nuoveModifiche();
let vista = 'apertura';

function nuoveModifiche() {
  return { testi: {}, immagini: {}, contatti: {}, google: {} };
}
function numeroModifiche() {
  return (
    Object.keys(mod.testi).length +
    Object.keys(mod.immagini).length +
    Object.keys(mod.contatti).length +
    Object.keys(mod.google).length
  );
}

// --- avvisi ------------------------------------------------------------------

let timerAvviso;
function avviso(testo, errore = false) {
  const el = $('#avviso');
  el.textContent = testo;
  el.classList.toggle('errore', errore);
  el.classList.add('visibile');
  clearTimeout(timerAvviso);
  timerAvviso = setTimeout(() => el.classList.remove('visibile'), errore ? 7000 : 4500);
}

function erroreGithub(e) {
  if (e.stato === 401) return 'Il token di GitHub non è più valido. Aggiornalo in Impostazioni.';
  if (e.stato === 403 || e.stato === 404)
    return 'Il token di GitHub non ha il permesso di modificare il sito. Aggiornalo in Impostazioni.';
  if (e.stato === 409 || e.stato === 422)
    return 'Il sito è stato aggiornato nel frattempo. Riprova a pubblicare.';
  if (e instanceof TypeError) return 'Connessione assente. Controlla internet e riprova.';
  return 'Qualcosa non ha funzionato (' + (e.message || e) + '). Riprova.';
}

// --- avvio, accesso e configurazione --------------------------------------------

async function leggiChiave() {
  const r = await fetch('chiave.json', { cache: 'no-store' });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error('chiave ' + r.status);
  return r.json();
}

let chiaveFile = null;
let tentativi = 0;

async function avvio() {
  try {
    chiaveFile = await leggiChiave();
  } catch (e) {
    chiaveFile = undefined;
  }
  if (chiaveFile === null) {
    $('#configura').hidden = false;
    return;
  }
  $('#accesso').hidden = false;
  $('#modulo-accesso [name=utente]').focus();
}

$('#modulo-accesso').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  const esito = $('.esito', f);
  const pulsante = $('button[type=submit]', f);
  if (!chiaveFile) {
    esito.textContent = 'Non riesco a raggiungere il sito. Controlla la connessione e ricarica la pagina.';
    return;
  }
  pulsante.disabled = true;
  pulsante.innerHTML = '<span class="attesa"></span>Verifica';
  esito.textContent = '';
  // ogni tentativo sbagliato fa aspettare un po' di più
  if (tentativi > 2) await new Promise((r) => setTimeout(r, Math.min(tentativi, 10) * 1000));
  const utente = f.utente.value.trim();
  const segreto = await decifra(chiaveFile, utente, f.password.value);
  pulsante.disabled = false;
  pulsante.textContent = 'Entra';
  if (!segreto || !segreto.token) {
    tentativi++;
    esito.textContent = 'Utente o password non corretti.';
    f.password.value = '';
    f.password.focus();
    f.classList.remove('trema');
    void f.offsetWidth;
    f.classList.add('trema');
    return;
  }
  sessione = { utente, token: segreto.token };
  github = creaGithub(segreto.token);
  f.password.value = '';
  $('#accesso').hidden = true;
  await entra();
});

$('#modulo-configura [data-genera]').addEventListener('click', () => {
  $('#modulo-configura [name=password]').value = generaPassword();
});

$('#modulo-configura').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  const esito = $('.esito', f);
  esito.className = 'esito';
  const token = f.token.value.trim();
  const utente = f.utente.value.trim();
  const password = f.password.value;
  if (password.length < 14) {
    esito.textContent = 'La password deve avere almeno 14 caratteri.';
    return;
  }
  const pulsante = $('button[type=submit]', f);
  pulsante.disabled = true;
  pulsante.innerHTML = '<span class="attesa"></span>Controllo il token';
  try {
    const g = creaGithub(token);
    if (!(await g.verifica())) throw Object.assign(new Error('permessi'), { stato: 403 });
    const cifrato = await cifra({ token }, utente, password);
    await g.pubblica(
      { [FILE_CHIAVE]: { testo: JSON.stringify(cifrato, null, 1) + '\n' } },
      'Gestionale: configurazione accesso'
    );
    esito.className = 'esito esito--ok';
    esito.textContent = 'Fatto. Tra un paio di minuti ricarica questa pagina ed entra con utente e password.';
    f.token.value = '';
    pulsante.textContent = 'Attivato';
  } catch (err) {
    pulsante.disabled = false;
    pulsante.textContent = 'Salva e attiva';
    esito.textContent =
      err.stato === 401
        ? 'Il token non è valido.'
        : err.stato
          ? 'Il token non può modificare questo sito: controlla i permessi (Contents: Read and write).'
          : erroreGithub(err);
  }
});

// --- dentro ----------------------------------------------------------------------

async function entra() {
  $('#app').hidden = false;
  $('#contenuto').innerHTML = '<p class="nota"><span class="attesa"></span>Carico i contenuti del sito…</p>';
  try {
    await caricaContenuti();
    costruisciMenu();
    mostra(vista);
  } catch (e) {
    $('#contenuto').innerHTML = '';
    const p = document.createElement('p');
    p.className = 'nota';
    p.textContent = erroreGithub(e);
    $('#contenuto').append(p);
    costruisciMenu();
  }
  avviaInattivita();
}

async function caricaContenuti() {
  const [html, js] = await Promise.all([github.leggi('index.html'), github.leggi(FILE_JS)]);
  orig = {
    testi: Object.fromEntries(estraiTesti(html).map((t) => [t.key, t])),
    immagini: Object.fromEntries(estraiImmagini(html).map((i) => [i.slot, i])),
    contatti: estraiContatti(html),
    google: estraiGoogle(html)
  };
  void js;
}

function costruisciMenu() {
  const menu = $('#menu');
  menu.innerHTML = '';
  const titolo = (t) => {
    const el = document.createElement('p');
    el.className = 'menu__titolo';
    el.textContent = t;
    menu.append(el);
  };
  const voce = (id, nome) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.vista = id;
    b.innerHTML = '<span></span>';
    b.firstChild.textContent = nome;
    b.addEventListener('click', () => mostra(id));
    menu.append(b);
  };
  titolo('Testi');
  SEZIONI.forEach((s) => voce(s.id, s.nome));
  titolo('Sito');
  voce('immagini', 'Immagini');
  voce('contatti', 'Contatti');
  voce('google', 'Google');
  titolo('Account');
  voce('impostazioni', 'Impostazioni');
  aggiornaMenu();
}

function aggiornaMenu() {
  const cambiate = new Set(Object.keys(mod.testi).map((k) => orig.testi[k].sezione));
  if (Object.keys(mod.immagini).length) cambiate.add('immagini');
  if (Object.keys(mod.contatti).length) cambiate.add('contatti');
  if (Object.keys(mod.google).length) cambiate.add('google');
  document.querySelectorAll('#menu button').forEach((b) => {
    b.classList.toggle('attivo', b.dataset.vista === vista);
    const p = b.querySelector('.pallino');
    if (cambiate.has(b.dataset.vista) && !p)
      b.insertAdjacentHTML('beforeend', '<span class="pallino" aria-label="modificata"></span>');
    if (!cambiate.has(b.dataset.vista) && p) p.remove();
  });
  const n = numeroModifiche();
  const stato = $('#stato');
  stato.textContent = n
    ? n === 1
      ? '1 modifica da pubblicare'
      : `${n} modifiche da pubblicare`
    : 'Nessuna modifica';
  stato.classList.toggle('ci-sono', n > 0);
  $('#pubblica').disabled = $('#annulla').disabled = $('#anteprima').disabled = n === 0;
}

function intestazione(titolo, nota) {
  const c = $('#contenuto');
  c.innerHTML = '';
  const h = document.createElement('h2');
  h.textContent = titolo;
  c.append(h);
  if (nota) {
    const p = document.createElement('p');
    p.className = 'nota';
    p.textContent = nota;
    c.append(p);
  }
  return c;
}

function campoTesto({ etichetta, valore, originale, lungo, alCambio, maxlength }) {
  const lab = document.createElement('label');
  lab.className = 'campo voce';
  const s = document.createElement('span');
  s.textContent = etichetta;
  const area = document.createElement(lungo ? 'textarea' : 'input');
  if (lungo) area.rows = 1;
  if (maxlength) area.maxLength = maxlength;
  area.value = valore;
  area.spellcheck = true;
  area.lang = 'it';
  const rip = document.createElement('button');
  rip.type = 'button';
  rip.className = 'voce__ripristina';
  rip.textContent = 'Ripristina';
  const adatta = () => {
    if (!lungo) return;
    area.style.height = 'auto';
    area.style.height = area.scrollHeight + 2 + 'px';
  };
  const segna = () => {
    const cambiata = area.value !== originale;
    lab.classList.toggle('cambiata', cambiata);
    rip.hidden = !cambiata;
  };
  area.addEventListener('input', () => {
    adatta();
    segna();
    alCambio(area.value);
  });
  rip.addEventListener('click', (e) => {
    e.preventDefault();
    area.value = originale;
    adatta();
    segna();
    alCambio(originale);
  });
  lab.append(s, area, rip);
  segna();
  requestAnimationFrame(adatta);
  return lab;
}

function mostra(id) {
  vista = id;
  if (!orig) return aggiornaMenu();
  if (id === 'immagini') mostraImmagini();
  else if (id === 'contatti') mostraContatti();
  else if (id === 'google') mostraGoogle();
  else if (id === 'impostazioni') mostraImpostazioni();
  else mostraSezione(id);
  aggiornaMenu();
  window.scrollTo(0, 0);
}

function mostraSezione(id) {
  const sez = SEZIONI.find((s) => s.id === id);
  const c = intestazione(sez.nome, 'Modifica i testi e premi «Pubblica» quando hai finito.');
  const aiuto = document.createElement('div');
  aiuto.className = 'aiuto';
  aiuto.innerHTML =
    'Metti tra <b>*asterischi*</b> le parole da mostrare in oro. Per andare a capo usa Invio.';
  c.append(aiuto);
  const g = document.createElement('div');
  g.className = 'gruppo';
  g.style.marginTop = '24px';
  Object.values(orig.testi)
    .filter((t) => t.sezione === id)
    .forEach((t) => {
      g.append(
        campoTesto({
          etichetta: t.etichetta,
          valore: mod.testi[t.key] ?? t.testo,
          originale: t.testo,
          lungo: true,
          maxlength: 2000,
          alCambio: (v) => {
            if (v === t.testo) delete mod.testi[t.key];
            else mod.testi[t.key] = v;
            aggiornaMenu();
          }
        })
      );
    });
  c.append(g);
}

// --- immagini ----------------------------------------------------------------------

async function preparaFoto(file) {
  if (!/^image\//.test(file.type)) throw new Error('Il file non è un’immagine.');
  if (file.size > 25 * 1024 * 1024) throw new Error('La foto è troppo grande (massimo 25 MB).');
  const bmp = await createImageBitmap(file);
  const lato = 1800;
  const k = Math.min(1, lato / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * k);
  const h = Math.round(bmp.height * k);
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  cv.getContext('2d').drawImage(bmp, 0, 0, w, h);
  const webp = cv.toDataURL('image/webp', 0.84);
  const dataUrl = webp.startsWith('data:image/webp') ? webp : cv.toDataURL('image/jpeg', 0.86);
  return { dataUrl, w, h, ext: dataUrl.startsWith('data:image/webp') ? 'webp' : 'jpg' };
}

function mostraImmagini() {
  const c = intestazione(
    'Immagini',
    'Carica una foto nuova per sostituire quella attuale. Viene ridimensionata e ottimizzata da sola.'
  );
  const g = document.createElement('div');
  g.className = 'immagini';
  Object.values(orig.immagini).forEach((img) => {
    const card = document.createElement('div');
    card.className = 'foto' + (mod.immagini[img.slot] ? ' cambiata' : '');
    card.innerHTML = `<div class="foto__img"><img alt=""></div><div class="foto__piede"><span class="foto__nome"></span><div class="foto__azioni"><label class="pulsante pulsante--vuoto pulsante--piccolo">Cambia foto<input type="file" accept="image/*"></label></div></div>`;
    $('img', card).src = mod.immagini[img.slot] ? mod.immagini[img.slot].dataUrl : SITO + img.src;
    $('.foto__nome', card).textContent = img.etichetta;
    if (mod.immagini[img.slot]) {
      const a = document.createElement('button');
      a.type = 'button';
      a.className = 'pulsante pulsante--vuoto pulsante--piccolo';
      a.textContent = 'Annulla';
      a.addEventListener('click', () => {
        delete mod.immagini[img.slot];
        mostraImmagini();
        aggiornaMenu();
      });
      $('.foto__azioni', card).append(a);
    }
    $('input', card).addEventListener('change', async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      try {
        mod.immagini[img.slot] = await preparaFoto(f);
        mostraImmagini();
        aggiornaMenu();
      } catch (err) {
        avviso(err.message || 'Non riesco a leggere questa foto.', true);
      }
    });
    g.append(card);
  });
  c.append(g);
}

// --- contatti e Google ---------------------------------------------------------

function mostraContatti() {
  const c = intestazione(
    'Contatti',
    'Il numero vale per chiamate, WhatsApp e per il modulo di richiesta. Viene aggiornato in tutto il sito.'
  );
  const g = document.createElement('div');
  g.className = 'gruppo';
  const voci = [
    ['telefono', 'Numero di telefono e WhatsApp', 'es. 351 547 1414'],
    ['instagram', 'Profilo Instagram', 'senza @']
  ];
  voci.forEach(([k, et]) => {
    g.append(
      campoTesto({
        etichetta: et,
        valore: mod.contatti[k] ?? orig.contatti[k],
        originale: orig.contatti[k],
        alCambio: (v) => {
          if (v === orig.contatti[k]) delete mod.contatti[k];
          else mod.contatti[k] = v;
          aggiornaMenu();
        }
      })
    );
  });
  c.append(g);
}

function mostraGoogle() {
  const c = intestazione(
    'Google',
    'Il titolo e la descrizione che compaiono nei risultati di Google e quando si condivide il link.'
  );
  const g = document.createElement('div');
  g.className = 'gruppo';
  [
    ['titolo', 'Titolo (consigliati fino a 60 caratteri)', false, 120],
    ['descrizione', 'Descrizione (consigliati fino a 160 caratteri)', true, 300]
  ].forEach(([k, et, lungo, max]) => {
    g.append(
      campoTesto({
        etichetta: et,
        valore: mod.google[k] ?? orig.google[k],
        originale: orig.google[k],
        lungo,
        maxlength: max,
        alCambio: (v) => {
          if (v === orig.google[k]) delete mod.google[k];
          else mod.google[k] = v;
          aggiornaMenu();
        }
      })
    );
  });
  c.append(g);
}

// --- impostazioni ---------------------------------------------------------------

function mostraImpostazioni() {
  const c = intestazione('Impostazioni');
  c.insertAdjacentHTML(
    'beforeend',
    `<form class="gruppo" id="cambia-password" style="margin-top:20px">
      <h3 style="margin:0;font-weight:400;font-size:20px">Cambia utente o password</h3>
      <label class="campo"><span>Password attuale</span><input name="attuale" type="password" autocomplete="current-password" required></label>
      <label class="campo"><span>Utente</span><input name="utente" autocomplete="username" autocapitalize="off" required></label>
      <label class="campo"><span>Nuova password</span><span class="riga"><input name="nuova" type="text" autocomplete="new-password" minlength="14" required spellcheck="false"><button class="pulsante pulsante--vuoto" type="button" data-genera>Genera</button></span></label>
      <p class="nota nota--piccola">Almeno 14 caratteri. Salvala prima di confermare.</p>
      <label class="campo"><span>Token di GitHub (solo se va sostituito)</span><input name="token" type="password" autocomplete="off" spellcheck="false" placeholder="lascia vuoto per tenere quello attuale"></label>
      <div><button class="pulsante" type="submit">Salva</button></div>
      <p class="esito" role="alert"></p>
    </form>`
  );
  const f = $('#cambia-password');
  f.utente.value = sessione.utente;
  $('[data-genera]', f).addEventListener('click', () => (f.nuova.value = generaPassword()));
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const esito = $('.esito', f);
    esito.className = 'esito';
    const verificato = await decifra(chiaveFile, sessione.utente, f.attuale.value);
    if (!verificato) {
      esito.textContent = 'La password attuale non è corretta.';
      return;
    }
    if (f.nuova.value.length < 14) {
      esito.textContent = 'La nuova password deve avere almeno 14 caratteri.';
      return;
    }
    const btn = $('button[type=submit]', f);
    btn.disabled = true;
    btn.innerHTML = '<span class="attesa"></span>Salvo';
    try {
      let token = sessione.token;
      if (f.token.value.trim()) {
        const g = creaGithub(f.token.value.trim());
        if (!(await g.verifica())) throw Object.assign(new Error('permessi'), { stato: 403 });
        token = f.token.value.trim();
      }
      const nuovo = await cifra({ token }, f.utente.value.trim(), f.nuova.value);
      await creaGithub(token).pubblica(
        { [FILE_CHIAVE]: { testo: JSON.stringify(nuovo, null, 1) + '\n' } },
        'Gestionale: aggiornamento accesso'
      );
      chiaveFile = nuovo;
      sessione = { utente: f.utente.value.trim(), token };
      github = creaGithub(token);
      f.reset();
      f.utente.value = sessione.utente;
      esito.className = 'esito esito--ok';
      esito.textContent = 'Salvato. Dalla prossima volta entra con i nuovi dati.';
    } catch (err) {
      esito.textContent = erroreGithub(err);
    }
    btn.disabled = false;
    btn.textContent = 'Salva';
  });
}

// --- applicare le modifiche ---------------------------------------------------------

function nomeFile(slot, ext) {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `assets/img/${slot}-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.${ext}`;
}

async function costruisci() {
  const [html0, js0] = await Promise.all([github.leggi('index.html'), github.leggi(FILE_JS)]);
  const contattiOra = estraiContatti(html0);
  let html = applicaTesti(html0, mod.testi);
  let js = js0;
  if (Object.keys(mod.contatti).length) {
    const nuovi = { ...contattiOra, ...mod.contatti };
    html = applicaContatti(html, contattiOra, nuovi);
    js = applicaContatti(js, contattiOra, nuovi);
  }
  if (Object.keys(mod.google).length) html = applicaGoogle(html, mod.google);
  const nuoveFoto = {};
  const vecchie = new Set();
  for (const [slot, f] of Object.entries(mod.immagini)) {
    const vecchia = (estraiImmagini(html).find((i) => i.slot === slot) || {}).src;
    if (vecchia) vecchie.add(vecchia);
    const percorso = nomeFile(slot, f.ext);
    html = applicaImmagine(html, slot, percorso, f.w, f.h);
    nuoveFoto[percorso] = f;
  }
  const usati = fileUsati(html, js);
  const daTogliere = [...vecchie].filter((v) => !usati.has(v));
  return { html, js, html0, js0, nuoveFoto, daTogliere };
}

$('#anteprima').addEventListener('click', async () => {
  const finestra = window.open('', '_blank');
  try {
    const { html, nuoveFoto } = await costruisci();
    let h = html.replace('<head>', `<head>\n<base href="${SITO}">`);
    for (const [percorso, f] of Object.entries(nuoveFoto)) h = h.split(percorso).join(f.dataUrl);
    h = h.replace(
      '<body>',
      '<body><div style="position:fixed;z-index:9999;left:50%;top:12px;transform:translateX(-50%);padding:8px 16px;border-radius:99px;background:#e9b83c;color:#0b0b0a;font:500 13px system-ui">Anteprima, non ancora pubblicata</div>'
    );
    const url = URL.createObjectURL(new Blob([h], { type: 'text/html' }));
    if (finestra) finestra.location = url;
    else window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (e) {
    if (finestra) finestra.close();
    avviso(erroreGithub(e), true);
  }
});

$('#annulla').addEventListener('click', () => {
  if (!confirm('Vuoi annullare tutte le modifiche non pubblicate?')) return;
  mod = nuoveModifiche();
  mostra(vista);
});

$('#pubblica').addEventListener('click', async () => {
  const btn = $('#pubblica');
  btn.disabled = true;
  btn.innerHTML = '<span class="attesa"></span>Pubblico';
  try {
    const { html, js, html0, js0, nuoveFoto, daTogliere } = await costruisci();
    const file = {};
    if (html !== html0) file['index.html'] = { testo: html };
    if (js !== js0) file[FILE_JS] = { testo: js };
    for (const [percorso, f] of Object.entries(nuoveFoto))
      file[percorso] = { base64: f.dataUrl.split(',')[1] };
    daTogliere.forEach((p) => (file[p] = null));
    const parti = [];
    const nt = Object.keys(mod.testi).length;
    const ni = Object.keys(mod.immagini).length;
    if (nt) parti.push(nt === 1 ? '1 testo' : `${nt} testi`);
    if (ni) parti.push(ni === 1 ? '1 foto' : `${ni} foto`);
    if (Object.keys(mod.contatti).length) parti.push('contatti');
    if (Object.keys(mod.google).length) parti.push('Google');
    if (Object.keys(file).length)
      await github.pubblica(file, 'Aggiornato dal gestionale: ' + parti.join(', '));
    mod = nuoveModifiche();
    await caricaContenuti();
    mostra(vista);
    avviso('Pubblicato. Il sito si aggiorna entro un paio di minuti.');
  } catch (e) {
    avviso(e.message && !e.stato && !(e instanceof TypeError) ? e.message : erroreGithub(e), true);
    aggiornaMenu();
  }
  btn.textContent = 'Pubblica';
  aggiornaMenu();
});

// --- uscita -------------------------------------------------------------------

function esci() {
  sessione = null;
  github = null;
  location.reload();
}
$('#esci').addEventListener('click', () => {
  if (numeroModifiche() && !confirm('Ci sono modifiche non pubblicate. Uscire lo stesso?')) return;
  mod = nuoveModifiche();
  esci();
});

window.addEventListener('beforeunload', (e) => {
  if (numeroModifiche()) {
    e.preventDefault();
    e.returnValue = '';
  }
});

function avviaInattivita() {
  let t;
  const riparti = () => {
    clearTimeout(t);
    t = setTimeout(() => {
      mod = nuoveModifiche();
      esci();
    }, MINUTI_INATTIVITA * 60000);
  };
  ['pointerdown', 'keydown', 'scroll'].forEach((ev) =>
    window.addEventListener(ev, riparti, { passive: true })
  );
  riparti();
}

avvio();
