const SALVATAGGIO = 'ps-gestionale-file';
const ACCESSO = 'ps-gestionale-accesso';
const DB = 'ps-gestionale';

const ACCESSO_INIZIALE = '81a84ad8d7950f4a3f4141960556efdf307faf17c3063ac7db5bcb05aef33dd9';

const indirizzi = new Map();

function stato() {
  try {
    return JSON.parse(localStorage.getItem(SALVATAGGIO)) || { file: {} };
  } catch (e) {
    return { file: {} };
  }
}

function apriDb() {
  return new Promise((ok, ko) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore('file');
    r.onsuccess = () => ok(r.result);
    r.onerror = () => ko(r.error);
  });
}

async function db(modo, fn) {
  const d = await apriDb();
  return new Promise((ok, ko) => {
    const t = d.transaction('file', modo);
    const st = t.objectStore('file');
    const r = fn(st);
    t.oncomplete = () => ok(r && r.result);
    t.onerror = () => ko(t.error);
    t.onabort = () => ko(t.error);
  });
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

// carica in memoria le foto e i video salvati, per poterli mostrare subito
export async function preparaArchivio() {
  indirizzi.forEach((u) => URL.revokeObjectURL(u));
  indirizzi.clear();
  try {
    const chiavi = await db('readonly', (st) => st.getAllKeys());
    const valori = await db('readonly', (st) => st.getAll());
    chiavi.forEach((k, i) => indirizzi.set(k, URL.createObjectURL(valori[i])));
  } catch (e) {}
}

export function fotoSalvata(percorso) {
  if (indirizzi.has(percorso)) return indirizzi.get(percorso);
  const f = stato().file[percorso];
  if (!f || f.base64 == null) return null;
  return `data:image/${percorso.endsWith('.webp') ? 'webp' : 'jpeg'};base64,${f.base64}`;
}

export async function azzera() {
  localStorage.removeItem(SALVATAGGIO);
  try {
    await db('readwrite', (st) => st.clear());
  } catch (e) {}
  await preparaArchivio();
}

function daBase64(b64, percorso) {
  const bin = atob(b64);
  const a = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
  return new Blob([a], { type: percorso.endsWith('.webp') ? 'image/webp' : 'image/jpeg' });
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
    const binari = {};
    for (const [p, c] of Object.entries(file)) {
      delete s.file[p];
      if (c === null) binari[p] = null;
      else if (c.blob) binari[p] = c.blob;
      else if (c.base64 != null) binari[p] = daBase64(c.base64, p);
      else s.file[p] = c;
    }
    try {
      await db('readwrite', (st) => {
        for (const [p, b] of Object.entries(binari)) b ? st.put(b, p) : st.delete(p);
      });
    } catch (e) {
      throw new Error('Spazio del browser esaurito: il file è troppo grande per la versione dimostrativa.');
    }
    try {
      localStorage.setItem(SALVATAGGIO, JSON.stringify(s));
    } catch (e) {
      throw new Error('Spazio del browser esaurito.');
    }
    await preparaArchivio();
    await new Promise((r) => setTimeout(r, 900));
  }
};
