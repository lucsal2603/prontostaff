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
  applicaGoogle,
  SFONDI,
  estraiSfondo,
  applicaSfondo
} from './contenuto.js';
import { archivio, controllaAccesso, salvaAccesso, fotoSalvata, azzera } from './demo.js';
import { avviaGuida, guidaVista } from './guida.js';

const $ = (s, c = document) => c.querySelector(s);
const SITO = '../';
const FILE_JS = 'assets/js/richiesta.js';
const MINUTI_INATTIVITA = 30;

let sessione = null; // { utente }
let orig = null; // contenuti come sono ora
let mod = nuoveModifiche();
let vista = 'apertura';

function nuoveModifiche() {
  return { testi: {}, immagini: {}, contatti: {}, google: {}, sfondo: null };
}
function numeroModifiche() {
  return (
    Object.keys(mod.testi).length +
    Object.keys(mod.immagini).length +
    Object.keys(mod.contatti).length +
    Object.keys(mod.google).length +
    (mod.sfondo ? 1 : 0)
  );
}

function generaPassword() {
  const alfabeto = 'abcdefghjkmnpqrstuvwxyz23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const r = crypto.getRandomValues(new Uint32Array(20));
  return Array.from(r, (n) => alfabeto[n % alfabeto.length])
    .join('')
    .match(/.{5}/g)
    .join('-');
}

function srcFoto(src) {
  return fotoSalvata(src) || SITO + src;
}

let timerAvviso;
function avviso(testo, errore = false) {
  const el = $('#avviso');
  el.textContent = testo;
  el.classList.toggle('errore', errore);
  el.classList.add('visibile');
  clearTimeout(timerAvviso);
  timerAvviso = setTimeout(() => el.classList.remove('visibile'), errore ? 7000 : 4500);
}

function messaggioErrore(e) {
  if (e instanceof TypeError) return 'Connessione assente. Controlla internet e riprova.';
  return e.message || 'Qualcosa non ha funzionato. Riprova.';
}

// accesso
let tentativi = 0;

function avvio() {
  $('#accesso').hidden = false;
  $('#modulo-accesso [name=utente]').focus();
}

$('#modulo-accesso').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  const esito = $('.esito', f);
  const pulsante = $('button[type=submit]', f);
  pulsante.disabled = true;
  pulsante.innerHTML = '<span class="attesa"></span>Verifica';
  esito.textContent = '';
  await new Promise((r) => setTimeout(r, tentativi > 2 ? Math.min(tentativi, 10) * 1000 : 500));
  const utente = f.utente.value.trim();
  const ok = await controllaAccesso(utente, f.password.value);
  pulsante.disabled = false;
  pulsante.textContent = 'Entra';
  if (!ok) {
    tentativi++;
    esito.textContent = 'Utente o password non corretti.';
    f.password.value = '';
    f.password.focus();
    f.classList.remove('trema');
    void f.offsetWidth;
    f.classList.add('trema');
    return;
  }
  sessione = { utente };
  f.password.value = '';
  $('#accesso').hidden = true;
  await entra();
});

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
    p.textContent = messaggioErrore(e);
    $('#contenuto').append(p);
    costruisciMenu();
  }
  avviaInattivita();
  if (orig && !guidaVista()) apriGuida();
}

function apriGuida() {
  avviaGuida({ mostra, vistaAttuale: () => vista });
}
$('#apri-guida').addEventListener('click', apriGuida);

async function caricaContenuti() {
  const [html, js] = await Promise.all([archivio.leggi('index.html'), archivio.leggi(FILE_JS)]);
  orig = {
    testi: Object.fromEntries(estraiTesti(html).map((t) => [t.key, t])),
    immagini: Object.fromEntries(estraiImmagini(html).map((i) => [i.slot, i])),
    contatti: estraiContatti(html),
    google: estraiGoogle(html),
    sfondo: estraiSfondo(html)
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
  voce('sfondo', 'Sfondo');
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
  if (mod.sfondo) cambiate.add('sfondo');
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
  else if (id === 'sfondo') mostraSfondo();
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

// immagini
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
    $('img', card).src = mod.immagini[img.slot] ? mod.immagini[img.slot].dataUrl : srcFoto(img.src);
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

// sfondo
function mostraSfondo() {
  const c = intestazione(
    'Sfondo',
    "Lo sfondo animato dietro al titolo, in cima al sito. Scegline uno con un clic, poi guarda l'anteprima e pubblica."
  );
  const g = document.createElement('div');
  g.className = 'sfondi';
  const scelto = mod.sfondo || orig.sfondo;
  SFONDI.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sfondo-scelta' + (s.id === scelto ? ' sfondo-scelta--attivo' : '');
    b.setAttribute('aria-pressed', s.id === scelto ? 'true' : 'false');
    b.innerHTML = `<span class="sfondo-scelta__img"><img alt="" src="sfondi/${s.id}.webp"></span><span class="sfondo-scelta__piede"><span><b></b><small></small></span><em></em></span>`;
    $('b', b).textContent = s.nome;
    $('small', b).textContent = s.nota;
    $('em', b).textContent = s.id === orig.sfondo ? 'Sul sito' : s.id === scelto ? 'Scelto' : '';
    b.addEventListener('click', () => {
      mod.sfondo = s.id === orig.sfondo ? null : s.id;
      mostraSfondo();
      aggiornaMenu();
    });
    g.append(b);
  });
  c.append(g);
}

// contatti e Google
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

// impostazioni
function mostraImpostazioni() {
  const c = intestazione('Impostazioni');
  c.insertAdjacentHTML(
    'beforeend',
    `<form class="gruppo" id="cambia-password" style="margin-top:20px">
      <h3 style="margin:0;font-weight:400;font-size:20px">Cambia utente o password</h3>
      <label class="campo"><span>Password attuale</span><input name="attuale" type="password" autocomplete="current-password" required></label>
      <label class="campo"><span>Utente</span><input name="utente" autocomplete="username" autocapitalize="off" required></label>
      <label class="campo"><span>Nuova password</span><span class="riga"><input name="nuova" type="text" autocomplete="new-password" minlength="10" required spellcheck="false"><button class="pulsante pulsante--vuoto" type="button" data-genera>Genera</button></span></label>
      <p class="nota nota--piccola">Almeno 10 caratteri. Salvala prima di confermare.</p>
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
    if (!(await controllaAccesso(sessione.utente, f.attuale.value))) {
      esito.textContent = 'La password attuale non è corretta.';
      return;
    }
    if (f.nuova.value.length < 10) {
      esito.textContent = 'La nuova password deve avere almeno 10 caratteri.';
      return;
    }
    await salvaAccesso(f.utente.value.trim(), f.nuova.value);
    sessione = { utente: f.utente.value.trim() };
    f.reset();
    f.utente.value = sessione.utente;
    esito.className = 'esito esito--ok';
    esito.textContent = 'Salvato. Dalla prossima volta entra con i nuovi dati.';
  });

  c.insertAdjacentHTML(
    'beforeend',
    `<div class="gruppo" style="margin-top:48px">
      <h3 style="margin:0;font-weight:400;font-size:20px">Ripristina i contenuti</h3>
      <p class="nota">Cancella tutte le modifiche salvate e torna ai testi e alle foto originali.</p>
      <div><button class="pulsante pulsante--pericolo" type="button" id="ripristina-tutto">Ripristina</button></div>
    </div>`
  );
  $('#ripristina-tutto').addEventListener('click', async () => {
    if (!confirm('Vuoi davvero tornare ai contenuti originali? Le modifiche salvate andranno perse.')) return;
    azzera();
    mod = nuoveModifiche();
    await caricaContenuti();
    avviso('Contenuti ripristinati.');
    aggiornaMenu();
  });
}

// salvataggio
function nomeFile(slot, ext) {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `assets/img/${slot}-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.${ext}`;
}

async function costruisci() {
  const [html0, js0] = await Promise.all([archivio.leggi('index.html'), archivio.leggi(FILE_JS)]);
  const contattiOra = estraiContatti(html0);
  let html = applicaTesti(html0, mod.testi);
  let js = js0;
  if (Object.keys(mod.contatti).length) {
    const nuovi = { ...contattiOra, ...mod.contatti };
    html = applicaContatti(html, contattiOra, nuovi);
    js = applicaContatti(js, contattiOra, nuovi);
  }
  if (Object.keys(mod.google).length) html = applicaGoogle(html, mod.google);
  if (mod.sfondo) html = applicaSfondo(html, mod.sfondo);
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
    let h = html.replace(
      '<head>',
      `<head>\n<base href="${new URL(SITO, location.href).href}">\n<style>.caricamento{display:none}</style>`
    );
    h = h.replace('<html lang="it">', '<html lang="it" data-senza-caricamento>');
    h = h.replace(/assets\/img\/[a-z0-9._-]+/gi, (p) => fotoSalvata(p) || p);
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
    avviso(messaggioErrore(e), true);
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
    if (mod.sfondo) parti.push('sfondo');
    if (Object.keys(file).length)
      await archivio.pubblica(file, 'Aggiornato dal gestionale: ' + parti.join(', '));
    mod = nuoveModifiche();
    await caricaContenuti();
    mostra(vista);
    avviso('Modifiche salvate.');
  } catch (e) {
    avviso(e.message && !e.stato && !(e instanceof TypeError) ? e.message : messaggioErrore(e), true);
    aggiornaMenu();
  }
  btn.textContent = 'Pubblica';
  aggiornaMenu();
});

function esci() {
  sessione = null;
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
