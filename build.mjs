/* Costruisce le pagine da src/ mettendo i tracciati del logo e la scena del logo animato. */
import fs from 'node:fs';
const p = JSON.parse(fs.readFileSync('src/logo.json', 'utf8'));
const logo = (h) => h.replaceAll('{{PRONTO}}', p.pronto).replaceAll('{{STAFF}}', p.staff).replaceAll('{{PIU}}', p.plus);
const scena = logo(fs.readFileSync('src/logo-scena.html', 'utf8'));
for (const nome of ['index.html', 'logo-animato.html']) {
  const h = logo(fs.readFileSync('src/' + nome, 'utf8')).replaceAll('{{SCENA}}', scena);
  fs.writeFileSync(nome, h);
  console.log(nome, (h.length / 1024).toFixed(0) + ' KB');
}
