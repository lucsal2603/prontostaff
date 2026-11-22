export const SEZIONI = [
  { id: 'apertura', nome: 'Apertura' },
  { id: 'intro', nome: 'Introduzione' },
  { id: 'evento', nome: 'Un evento in più' },
  { id: 'figure', nome: 'Le figure' },
  { id: 'rinforzo', nome: 'Lo rinforziamo' },
  { id: 'selezione', nome: 'Selezione' },
  { id: 'carosello', nome: 'Già al lavoro' },
  { id: 'metodo', nome: 'Il metodo' },
  { id: 'piede', nome: 'Contatti e modulo' }
];

const ETICHETTE = {
  'apertura.luogo': 'Pillola della zona',
  'apertura.riga1': 'Scritta a destra, prima riga',
  'apertura.riga2': 'Scritta a destra, seconda riga',
  'apertura.pulsante': 'Pulsante',
  'intro.frase': 'Frase grande',
  'intro.testo': 'Testo a lato',
  'evento.titolo': 'Titolo',
  'figure.etichetta': 'Etichetta sopra l’elenco',
  'figure.pulsante': 'Pulsante sotto l’elenco',
  'rinforzo.titolo': 'Titolo',
  'rinforzo.testo': 'Testo',
  'rinforzo.legenda1': 'Legenda, il loro staff',
  'rinforzo.legenda2': 'Legenda, il rinforzo',
  'selezione.titolo': 'Titolo',
  'selezione.testo': 'Testo',
  'carosello.titolo': 'Titolo',
  'carosello.testo': 'Testo',
  'metodo.titolo': 'Titolo',
  'metodo.testo': 'Testo',
  'piede.titolo1': 'Titolo, prima riga',
  'piede.titolo2': 'Titolo, seconda riga',
  'richiesta.titolo': 'Titolo del modulo',
  'richiesta.nota': 'Testo del modulo',
  'richiesta.pulsante': 'Pulsante di invio'
};

export const IMMAGINI = {
  'figura-camerieri': 'Figura: Camerieri',
  'figura-bartender': 'Figura: Bartender',
  'figura-facchini': 'Figura: Facchini',
  'figura-hostess': 'Figura: Hostess',
  'carosello-1': 'Carosello, foto 1',
  'carosello-2': 'Carosello, foto 2',
  'carosello-3': 'Carosello, foto 3',
  'carosello-4': 'Carosello, foto 4'
};

function etichetta(key) {
  if (ETICHETTE[key]) return ETICHETTE[key];
  const m = key.match(/^[a-z]+\.([a-z]+)(\d)\.(titolo|testo|nome)$/);
  if (m) {
    const n = { caso: 'Caso', f: 'Figura', c: 'Criterio', p: 'Passo' }[m[1]] || 'Voce';
    return `${n} ${m[2]}, ${m[3] === 'testo' ? 'testo' : m[3] === 'nome' ? 'nome' : 'titolo'}`;
  }
  if (/^carosello\.parola\d$/.test(key)) return 'Tessera ' + key.slice(-1);
  return key;
}

function sezioneDi(key) {
  const s = key.split('.')[0];
  return s === 'richiesta' ? 'piede' : s;
}

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", apos: "'", nbsp: ' ' };

function decodifica(t) {
  return t
    .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (m, e) => {
      if (e[0] === '#')
        return String.fromCodePoint(
          e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
        );
      return ENT[e.toLowerCase()] ?? m;
    })
    .replace(/ /g, ' ');
}

function codifica(t) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// *oro*, a capo = <br>
export function inTesto(html) {
  let accento = null;
  const t = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<(span|em|b|strong)>([\s\S]*?)<\/\1>/gi, (m, tag, dentro) => {
      accento = accento || tag.toLowerCase();
      return '*' + dentro + '*';
    });
  if (/<[a-z]/i.test(t)) return null; // markup non gestito
  return { testo: decodifica(t).trim(), accento };
}

export function inHtml(testo, accento) {
  const tag = accento || 'span';
  return codifica(testo.replace(/\r/g, '').trim())
    .replace(/\*([^*\n]+)\*/g, `<${tag}>$1</${tag}>`)
    .replace(/\*/g, '')
    .replace(/\n+/g, '<br>');
}

function trovaElementi(html, attr) {
  const out = [];
  const re = new RegExp(`<([a-z0-9]+)\\b[^>]*\\s${attr}="([^"]+)"[^>]*>`, 'gi');
  let m;
  while ((m = re.exec(html))) {
    const tag = m[1].toLowerCase();
    const inizio = m.index + m[0].length;
    // tag annidati
    const scan = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
    scan.lastIndex = inizio;
    let prof = 1,
      s,
      fine = -1;
    while ((s = scan.exec(html))) {
      if (s[0].endsWith('/>')) continue;
      prof += s[1] ? -1 : 1;
      if (prof === 0) {
        fine = s.index;
        break;
      }
    }
    if (fine < 0) continue;
    out.push({ key: m[2], tag, apertura: m[0], inizio, fine, interno: html.slice(inizio, fine) });
  }
  return out;
}

export function estraiTesti(html) {
  return trovaElementi(html, 'data-k')
    .map((e) => {
      const t = inTesto(e.interno);
      if (!t) return null;
      return {
        key: e.key,
        sezione: sezioneDi(e.key),
        etichetta: etichetta(e.key),
        testo: t.testo,
        accento: t.accento
      };
    })
    .filter(Boolean);
}

export function applicaTesti(html, testi) {
  const elementi = trovaElementi(html, 'data-k');
  const accenti = Object.fromEntries(elementi.map((e) => [e.key, (inTesto(e.interno) || {}).accento]));
  // dal fondo
  for (const e of elementi.slice().reverse()) {
    if (!(e.key in testi)) continue;
    const nuovo = String(testi[e.key]);
    if (nuovo.length > 2000) throw new Error('Testo troppo lungo: ' + e.key);
    html = html.slice(0, e.inizio) + inHtml(nuovo, accenti[e.key]) + html.slice(e.fine);
  }
  return html;
}

// immagini
export function estraiImmagini(html) {
  const out = {};
  const re = /<img\b[^>]*\sdata-img="([^"]+)"[^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    if (out[m[1]]) continue;
    const src = (m[0].match(/\ssrc="([^"]+)"/) || [])[1];
    out[m[1]] = { slot: m[1], etichetta: IMMAGINI[m[1]] || m[1], src };
  }
  return Object.values(out);
}

export function applicaImmagine(html, slot, src, w, h) {
  const re = new RegExp(`<img\\b[^>]*\\sdata-img="${slot}"[^>]*>`, 'gi');
  let n = 0;
  html = html.replace(re, (tag) => {
    n++;
    return tag
      .replace(/\ssrc="[^"]*"/, ` src="${src}"`)
      .replace(/\swidth="\d+"/, ` width="${w | 0}"`)
      .replace(/\sheight="\d+"/, ` height="${h | 0}"`);
  });
  if (!n) throw new Error('Immagine non trovata: ' + slot);
  return html;
}

export function fileUsati(...testi) {
  const set = new Set();
  for (const t of testi) for (const m of t.matchAll(/assets\/img\/[a-z0-9._-]+/gi)) set.add(m[0]);
  return set;
}

// contatti
export function estraiContatti(html) {
  const tel = (html.match(/tel:\+(\d{8,15})/) || [])[1] || '';
  const ig = (html.match(/instagram\.com\/([a-z0-9._]+)/i) || [])[1] || '';
  return { telefono: tel.startsWith('39') ? tel.slice(2) : tel, instagram: ig };
}

function telefonoLeggibile(n) {
  const d = n.replace(/\D/g, '');
  if (d.length === 10) return `+39 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return '+39 ' + d;
}

export function applicaContatti(testo, vecchi, nuovi) {
  const vt = vecchi.telefono.replace(/\D/g, '');
  const nt = (nuovi.telefono || '').replace(/\D/g, '').replace(/^39(?=\d{9,10}$)/, '');
  if (nt && nt !== vt) {
    if (!/^\d{6,12}$/.test(nt)) throw new Error('Numero di telefono non valido');
    testo = testo
      .split(telefonoLeggibile(vt))
      .join(telefonoLeggibile(nt))
      .split('+39' + vt)
      .join('+39' + nt)
      .split('39' + vt)
      .join('39' + nt);
  }
  const ni = (nuovi.instagram || '')
    .trim()
    .replace(/^@/, '')
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/\/.*$/, '');
  if (ni && ni !== vecchi.instagram) {
    if (!/^[a-z0-9._]{1,30}$/i.test(ni)) throw new Error('Nome Instagram non valido');
    testo = testo
      .split('instagram.com/' + vecchi.instagram)
      .join('instagram.com/' + ni)
      .split("'" + vecchi.instagram + "'")
      .join("'" + ni + "'");
  }
  return testo;
}

// Google
export function estraiGoogle(html) {
  return {
    titolo: decodifica((html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || ''),
    descrizione: decodifica((html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '')
  };
}

export function applicaGoogle(html, g) {
  const attr = (t) => codifica(t).replace(/"/g, '&quot;');
  if (g.titolo != null) {
    const t = String(g.titolo).trim().slice(0, 120);
    html = html
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${codifica(t)}</title>`)
      .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${attr(t)}$2`);
  }
  if (g.descrizione != null) {
    const d = String(g.descrizione).trim().slice(0, 300);
    html = html
      .replace(/(<meta name="description" content=")[^"]*(")/, `$1${attr(d)}$2`)
      .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${attr(d)}$2`);
  }
  return html;
}
