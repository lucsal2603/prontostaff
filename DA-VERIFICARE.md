# ProntoStaff+: cosa va verificato con il cliente

Questa è una base. Molti testi vengono dalla loro email e dalla bio Instagram, ma diversi dettagli li ho scritti io per riempire le sezioni. Prima di pubblicare vanno confermati voce per voce. La lista serve anche come scaletta per la riunione con loro.

## Le tre cose più rischiose

1. **Le regole della casa** (il mazzo di carte oro): "si arriva prima del briefing", "la divisa la decidete voi", "lo staff segue il vostro responsabile". Sono promesse operative scritte da me. Se non le rispettano davvero, vanno tolte.
2. **Il sabato con tre eventi**: tutti i numeri (22 persone di staff, 8 + 16 + 12 = 36 necessarie, 14 mancanti), gli orari e i dettagli (300 persone, 140 ospiti, 90 coperti) sono un esempio inventato. Sulla pagina c'è scritto "Un esempio", ma va bene solo se a loro sta bene raccontarsi così.
3. **Il modulo "Componete la squadra" non invia niente**. Compone il riepilogo, ma manca l'indirizzo a cui mandarlo: `CONTATTI.email` in `js/main.js` è vuoto. Serve anche la casella del consenso privacy prima della pubblicazione.

## Testi, voce per voce

| Dove | Testo usato | Fonte o nota |
|---|---|---|
| Hero, pill | Personale per catering | dalla bio IG ("Staff per catering, fiere ed eventi") |
| Hero, pill | Anche last minute | bio IG ("Disponibilità anche last minute") |
| Hero, pill | Milano e Lombardia | bio IG |
| Hero, titolo e nastro | Voi pensate all'evento. Al personale aggiuntivo pensiamo noi. | firma della loro email |
| Chi siamo | "...anche tre nello stesso giorno" | la mail dice "più appuntamenti nello stesso giorno"; il "tre" l'ho scelto io |
| Chi siamo, adesivi | Un solo referente | mail ("interlocutore dedicato") |
| Chi siamo, adesivi | Squadre su misura | **inventato**, plausibile |
| Le figure | descrizioni di camerieri, bartender, facchini, hostess | **inventate**: verificare compiti reali (es. "con le vostre ricette", "guardaroba, tableau") |
| Gli eventi | matrimoni, cene di gala, congressi, coffee break, domicilio | sono i servizi di Ruzzenenti citati nella mail, usati come tipi di evento in cui ProntoStaff+ affianca i catering |
| Gli eventi | Eventi aziendali; Feste private, Inaugurazioni, Lanci di prodotto | **inventati** |
| Come lavoriamo | i quattro passi | dalla mail (telefonata di 10 minuti, individuare e organizzare, interlocutore dedicato); "dall'arrivo in location alla fine del servizio" è mio |
| Domande | anticipo, ruolo, coordinamento, zone | dalla mail e dalla bio |
| Domande | divisa, stesse persone, costo e "preventivo voce per voce", "fuori regione valutiamo" | **inventate** |
| Piede | "Fine servizio." | titolo mio |

## Dati mancanti

- Email, telefono e partita IVA: nella pagina compaiono come "da inserire" (piede e pannello "Prenota 10 minuti").
- **Instagram**: la pagina punta a `@prontostaffcatering` (il profilo che ho visto), ma la loro email firma `@prontostaffservices`. Quale dei due è quello giusto?
- **Logo**: l'ho ricostruito in testo (Mona Sans, "Pronto" avorio + "Staff+" oro). Serve il file vettoriale originale.
- **Oro del marchio**: `#F4C73E`, campionato dal logo su Instagram. Chiedere il codice ufficiale.

## Foto (tutte segnaposto)

Si mettono in `img/` con questi nomi (JPG). Poi va aggiunto il nome in `FOTO_PRONTE` dentro `js/main.js` e la foto compare al posto del segnaposto.

| Nome | Dove | Formato consigliato |
|---|---|---|
| galleria-1 … galleria-6 | nastro di foto sotto "Chi siamo" | quadrate, almeno 1200 px |
| matrimoni, cene-di-gala, congressi, coffee-break, domicilio, aziendali | card degli eventi | verticali 3:4, almeno 1000×1350 |
| la-chiamata, la-squadra, il-referente, l-evento | "Come lavoriamo" | verticali 4:5, almeno 1000 px di lato corto |

Servono foto vere del loro staff al lavoro (in divisa, in sala, al banco, in allestimento), non foto di repertorio.

## Prima della pubblicazione

- Togliere `<meta name="robots" content="noindex, nofollow">` da `index.html`.
- **Font**: Mona Sans oggi arriva dai server di Google. Per il GDPR conviene ospitarlo in locale (è open source, licenza OFL).
- Pagina privacy (il link nel piede ora è `#`) e consenso nel modulo.
- Collegare l'invio del modulo (Formspree o simile, oppure una mail diretta).
