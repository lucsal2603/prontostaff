// Versione dimostrativa: legge i file dal sito e salva le modifiche solo in questo browser.

const SALVATAGGIO = 'ps-gestionale-file';
const ACCESSO = 'ps-gestionale-accesso';

// utente "mura", password "prontostaff2026": cambiabile da Impostazioni
const ACCESSO_INIZIALE = '81a84ad8d7950f4a3f4141960556efdf307faf17c3063ac7db5bcb05aef33dd9';

function stato() {
  try {
    return JSON.parse(localStorage.getItem(SALVATAGGIO)) || { file: {} };
  } catch (e) {
    return { file: {} };
  }
}

export async function impronta(utente, password) {
  const dati = new TextEncoder().encode(utente.trim().toLowerCase() + '\n' + password);
  const h = await crypto.subtle.digest('SHA-256', dati);
  return Array.from(new Uint8Array(h), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function controllaAccesso(utente, password) {
  let atteso = ACCESSO_INIZIALE;
  try {
    atteso = localStorage.getItem(ACCESSO) || ACCESSO_INIZIALE;
  } catch (e) {}
  return (await impronta(utente, password)) === atteso;
}

export async function salvaAccesso(utente, password) {
  localStorage.setItem(ACCESSO, await impronta(utente, password));
}

// foto salvate in questo browser: percorso -> data URL
export function fotoSalvata(percorso) {
  const f = stato().file[percorso];
  if (!f || f.base64 == null) return null;
  return `data:image/${percorso.endsWith('.webp') ? 'webp' : 'jpeg'};base64,${f.base64}`;
}

export function azzera() {
  localStorage.removeItem(SALVATAGGIO);
}

export const archivio = {
  async leggi(percorso) {
    const s = stato().file[percorso];
    if (s && s.testo != null) return s.testo;
    const r = await fetch('../' + percorso, { cache: 'no-store' });
    if (!r.ok) throw new Error('Non riesco a leggere ' + percorso);
    return r.text();
  },
  async pubblica(file) {
    const s = stato();
    for (const [p, c] of Object.entries(file)) {
      if (c === null) delete s.file[p];
      else s.file[p] = c;
    }
    try {
      localStorage.setItem(SALVATAGGIO, JSON.stringify(s));
    } catch (e) {
      throw new Error(
        'Spazio del browser esaurito: le foto sono troppo grandi per la versione dimostrativa.'
      );
    }
    await new Promise((r) => setTimeout(r, 900));
  }
};
