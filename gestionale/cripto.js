// Il token di GitHub è salvato cifrato (AES-GCM). La chiave si ricava da utente + password (PBKDF2, 600.000 giri).

const GIRI = 600000;
const enc = new TextEncoder();
const dec = new TextDecoder();

function inB64(buf) {
  let s = '';
  new Uint8Array(buf).forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
}
function daB64(s) {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

async function chiave(utente, password, sale, giri) {
  const base = await crypto.subtle.importKey(
    'raw',
    enc.encode(utente.trim().toLowerCase() + '\n' + password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: sale, iterations: giri },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function cifra(segreto, utente, password) {
  const sale = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const k = await chiave(utente, password, sale, GIRI);
  const dati = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, enc.encode(JSON.stringify(segreto)));
  return { v: 1, giri: GIRI, sale: inB64(sale), iv: inB64(iv), dati: inB64(dati) };
}

// restituisce il segreto, oppure null se utente o password sono sbagliati
export async function decifra(file, utente, password) {
  try {
    const k = await chiave(utente, password, daB64(file.sale), file.giri);
    const chiaro = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: daB64(file.iv) }, k, daB64(file.dati));
    return JSON.parse(dec.decode(chiaro));
  } catch (e) {
    return null;
  }
}

// 4 gruppi di 5 caratteri senza simboli che si confondono (0/O, 1/l): oltre 100 bit, non indovinabile
export function generaPassword() {
  const alfabeto = 'abcdefghjkmnpqrstuvwxyz23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const r = crypto.getRandomValues(new Uint32Array(20));
  const c = Array.from(r, (n) => alfabeto[n % alfabeto.length]).join('');
  return c.match(/.{5}/g).join('-');
}
