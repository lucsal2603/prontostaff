# ProntoStaff+

Il sito di ProntoStaff+, personale per catering e banqueting.

Sito statico, una pagina sola: HTML, CSS e JavaScript, con GSAP (ScrollTrigger, SplitText) e Lenis per lo scorrimento morbido. Le librerie e i caratteri (Bodoni Moda, Manrope) sono nel repository, senza CDN.

## Struttura

- `src/index.html`: la pagina da modificare (i tracciati del logo sono segnaposto `{{PRONTO}}`, `{{STAFF}}`, `{{PIU}}`)
- `src/logo.json`: i tracciati vettoriali del logo
- `index.html`: la pagina finita, generata con `node build.mjs`
- `assets/css/sito.css`: lo stile
- `assets/js/sito.js`: le animazioni
- `assets/img/`: foto, logo, icona e immagine di condivisione

## Modificare

Si cambia `src/index.html`, poi:

```
node build.mjs
python3 -m http.server 8411
```

e si apre http://localhost:8411.

## Dati da completare prima della pubblicazione

Nella pagina ci sono dei segnaposto da sostituire con i dati veri:

- telefono e WhatsApp: `+39 000 000 0000` / `390000000000`
- email: `info@prontostaff.it`
- profilo Instagram: `https://www.instagram.com/prontostaffcatering`
