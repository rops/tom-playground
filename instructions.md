# Attivita Pratica - Web App Feedback Visita in Azienda

## Obiettivo

Costruire **da zero** una web app per raccogliere e visualizzare il feedback sulla visita in azienda, utilizzando un AI coding agent (**OpenCode** + Claude Opus 4.6).

Non dovete scrivere codice voi: dovete **spiegare all'AI cosa volete**, step by step, e lei lo costruira per voi. Il vostro compito e comunicare in modo chiaro e preciso.

---

## Tecnologie da utilizzare

- **HTML5** - struttura della pagina
- **CSS3** - stile e layout (responsive, mobile-first)
- **JavaScript vanilla** - logica applicativa, manipolazione DOM, eventi
- **localStorage** - per salvare i dati nel browser
- **Nessun framework** - no React, no Vue, no Angular. Solo HTML, CSS e JS puro

---

## Funzionalita richieste

### 1. Form di inserimento feedback
- Campo nome dello studente
- Voto da 1 a 5 (stelle o punteggio) per ogni sezione della visita:
  - Presentazione Azienda
  - Case Study: Connettore Web/API
  - Case Study: Cybersicurezza
  - Intelligenza Artificiale e Futuro
  - Attivita Pratica (questa!)
- Campo commento libero (opzionale)
- Pulsante di invio

### 2. Dashboard statistiche
- Media voti per ogni sezione
- Numero totale di feedback ricevuti
- Voto medio complessivo
- Visualizzazione grafica (barre, stelle, o grafici)
- Lista degli ultimi commenti

### 3. Design
- Responsive: deve funzionare bene su desktop E su mobile
- Moderno: colori coerenti, spaziature, font leggibili
- Animazioni semplici per rendere l'esperienza piacevole

---

## Come interagire con l'AI

### Regole d'oro

1. **Sii specifico**: "Crea un form con un campo nome e 5 rating da 1 a 5 stelle" e meglio di "Fai un form"
2. **Dai contesto**: "Stiamo costruendo una web app di feedback per una visita scolastica in azienda. Sara usata da ~10 studenti"
3. **Procedi per step**: non chiedere tutto in un singolo messaggio. Costruisci un pezzo alla volta
4. **Se non ti piace, dillo**: "Il colore di sfondo non mi piace, cambialo in blu scuro" oppure "Le stelle sono troppo piccole"
5. **Sperimenta**: prova a chiedere cose creative - animazioni, grafici, effetti hover, dark mode
6. **Chiedi spiegazioni**: se non capite cosa ha fatto il codice, chiedete "Spiegami cosa fa questa parte"

### Step suggeriti

Seguite questo ordine per costruire la webapp pezzo per pezzo:

**Step 1 - Struttura base**
> "Crea un file index.html con la struttura base di una web app di feedback. Deve avere un titolo, un form per inserire il feedback e una sezione per le statistiche."

**Step 2 - Form di input**
> "Aggiungi al form: un campo per il nome, un sistema di voto da 1 a 5 stelle per queste 5 sezioni: [elencare le sezioni], un campo commento e un pulsante invia."

**Step 3 - Stile CSS**
> "Crea uno stile CSS moderno: sfondo scuro, card con bordi arrotondati, font sans-serif, responsive per mobile. Le stelle devono essere cliccabili e diventare gialle quando selezionate."

**Step 4 - Logica JavaScript**
> "Implementa la logica: quando l'utente clicca Invia, salva i dati in localStorage. Mostra un messaggio di conferma."

**Step 5 - Dashboard**
> "Crea la sezione dashboard: leggi i feedback da localStorage e mostra la media per ogni sezione con barre colorate, il numero totale di risposte e gli ultimi commenti."

**Step 6 - Migliorie** (se avete tempo)
> "Aggiungi animazioni di transizione quando si invia il feedback", "Aggiungi un grafico a barre", "Aggiungi la possibilita di cancellare un feedback", "Aggiungi dark mode / light mode"

---

## Risultato atteso

Alla fine dell'attivita avrete:
- Una web app funzionante nel browser
- Che raccoglie feedback con voti e commenti
- Che mostra statistiche aggregate
- Costruita interamente tramite comunicazione con un'AI

Il codice sara nel file `index.html` (e eventuali `style.css` / `app.js`) in questa directory.

---

## Consigli finali

- Non abbiate paura di sbagliare: l'AI puo sempre correggere
- Se qualcosa non funziona, copiate l'errore e incollatelo nel prompt
- Guardate il risultato nel browser dopo ogni step (aprite il file HTML)
- Divertitevi e sperimentate!
