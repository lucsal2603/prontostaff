# ProntoStaff+

Sito one-page per ProntoStaff+, staff aggiuntivo per catering e banqueting (Milano e Lombardia). Nero, avorio e l'oro del marchio. Animazioni prese da [two26.studio](https://two26.studio/) e adattate. Prima di pubblicare leggere [DA-VERIFICARE.md](DA-VERIFICARE.md).

## Avvio

```bash
python3 -m http.server 8110 --directory /Users/lucas/prontostaff
```

Con `?qa` nell'indirizzo si salta l'ingresso.

## Struttura

- `index.html`: tutte le sezioni
- `css/style.css`: stile; un solo carattere, Mona Sans (stretto e pesante per i titoli)
- `js/brigata.js`: gli omini in SVG (cameriere, hostess, facchino, bartender). Le gambe sono in cinematica inversa, quindi il piede d'appoggio non scivola. Ci sono anche la posa ferma, l'inchino e il passo guidato da fuori (`walkBy`).
- `js/main.js`: GSAP 3.15 (ScrollTrigger, SplitText, DrawSVG) + Lenis, una funzione per ogni sezione

## Sezioni e animazioni

| Sezione | Cosa succede |
|---|---|
| Ingresso | nastro oro che si disegna, lettere del logo che saltano su, uscita con due pennellate (come two26) |
| Hero | titolo a righe, pill storte che rimbalzano, anelli oro, brigata che cammina (più svelta se si scorre, "Pronto!" al clic), nastro curvo che scorre |
| Chi siamo | pin con onda di lettere oro e segnaposto che saltano fuori |
| Galleria | nastro infinito di foto che cambia verso con lo scroll |
| Un sabato | pin: tre comande che cadono, contatori, sala che si riempie di staff oro |
| Le figure | linea oro che si disegna; ogni parola si apre e dentro c'è l'omino che cammina |
| Gli eventi | card che si aprono dal centro in 3D, pennellata oro in hover |
| Come lavoriamo | scorrimento orizzontale, il cameriere cammina al passo dello scroll |
| Le regole | mazzo di carte (clic sopra o sotto, swipe, frecce) con cursore a freccia |
| Domande | fumetti di chat, uno sempre aperto; il cameriere aspetta e ogni tanto si inchina |
| Contatti | contatori che riempiono la fila di omini |
| Piede | marchio gigante che si allunga e rimbalza, la brigata si inchina |
| Prenota 10 minuti | pannello con la pennellata oro a tutto schermo |

Con "riduci movimento" attivo nel sistema la pagina resta completa e ferma.
