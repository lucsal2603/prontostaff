/* Costruisce index.html da src/index.html mettendo i tracciati del logo. */
import fs from 'node:fs';
const p = JSON.parse(fs.readFileSync('src/logo.json', 'utf8'));
let h = fs.readFileSync('src/index.html', 'utf8');
h = h.replaceAll('{{PRONTO}}', p.pronto).replaceAll('{{STAFF}}', p.staff).replaceAll('{{PIU}}', p.plus);
fs.writeFileSync('index.html', h);
console.log('index.html', (h.length / 1024).toFixed(0) + ' KB');
