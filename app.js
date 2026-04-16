/* ============================================
   APP.JS - Logica della Web App Feedback
   
   Questo file gestisce:
   1. Il salvataggio dei feedback in localStorage
   2. Il calcolo delle statistiche (medie, totale)
   3. L'aggiornamento della dashboard
   4. La validazione e l'invio del form
   ============================================ */

// --- COSTANTI ---
// La chiave con cui salviamo i dati in localStorage.
// localStorage funziona a coppie chiave-valore (come un dizionario).
const STORAGE_KEY = 'feedbacks';

// Le sezioni da valutare. Usiamo un array di oggetti
// così possiamo scorrere con un ciclo forEach invece
// di ripetere lo stesso codice 5 volte (principio DRY: Don't Repeat Yourself)
const SEZIONI = [
    { nome: 'Azienda',            chiave: 'azienda',          inputName: 'rating-azienda' },
    { nome: 'Connettore Web/API', chiave: 'web-api',          inputName: 'rating-web-api' },
    { nome: 'Cybersicurezza',     chiave: 'cybersicurezza',   inputName: 'rating-cybersicurezza' },
    { nome: 'AI e Futuro',        chiave: 'ai-futuro',        inputName: 'rating-ai-futuro' },
    { nome: 'Attività Pratica',   chiave: 'attivita-pratica', inputName: 'rating-attivita-pratica' }
];


/* ============================================
   1. GESTIONE localStorage
   ============================================
   
   localStorage salva solo STRINGHE. Per salvare un array
   di oggetti dobbiamo:
   - JSON.stringify() → converte oggetto JS in stringa JSON
   - JSON.parse()     → converte stringa JSON in oggetto JS
   
   Esempio:
   { nome: "Marco", voto: 5 }  →  '{"nome":"Marco","voto":5}'
*/

/**
 * Legge tutti i feedback salvati in localStorage.
 * Se non ce ne sono, ritorna un array vuoto [].
 */
function getFeedbacks() {
    const dati = localStorage.getItem(STORAGE_KEY);
    
    // Se non c'è niente salvato, dati sarà null
    if (!dati) {
        return [];
    }
    
    // Convertiamo la stringa JSON in un array di oggetti
    return JSON.parse(dati);
}

/**
 * Salva l'array di feedback in localStorage.
 * Sovrascrive i dati precedenti con quelli nuovi.
 */
function salvaFeedbacks(feedbacks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(feedbacks));
}

/**
 * Aggiunge un singolo feedback all'array esistente.
 * Legge → aggiunge → riscrive. È il pattern classico
 * per "appendere" dati a localStorage.
 */
function aggiungiFeedback(feedback) {
    const feedbacks = getFeedbacks();
    feedbacks.push(feedback);
    salvaFeedbacks(feedbacks);
}


/* ============================================
   2. RACCOLTA DATI DAL FORM
   ============================================
   
   Quando l'utente clicca "Invia Feedback", dobbiamo
   leggere tutti i valori dal form e creare un oggetto
   con i dati strutturati.
*/

/**
 * Legge i valori correnti dal form e restituisce
 * un oggetto feedback pronto per essere salvato.
 * 
 * Ritorna null se mancano campi obbligatori.
 */
function raccogliDatiForm() {
    // Prendiamo il valore del campo nome
    const nome = document.getElementById('nome').value.trim();
    
    // .trim() rimuove spazi all'inizio e alla fine
    // Es: "  Marco  " diventa "Marco"
    
    if (!nome) {
        return null; // Nome obbligatorio
    }
    
    // Raccogliamo i voti per ogni sezione
    const ratings = {};
    
    for (const sezione of SEZIONI) {
        // querySelector cerca il radio button selezionato (:checked)
        // per quel gruppo di stelle (identificato da name="...")
        const selezionato = document.querySelector(
            `input[name="${sezione.inputName}"]:checked`
        );
        
        if (!selezionato) {
            return null; // Tutte le stelle sono obbligatorie
        }
        
        // .value è una stringa ("3"), parseInt la converte in numero (3)
        ratings[sezione.chiave] = parseInt(selezionato.value);
    }
    
    // Il commento è facoltativo, quindi può essere vuoto
    const commento = document.getElementById('commento').value.trim();
    
    // Creiamo l'oggetto feedback completo
    return {
        nome: nome,
        ratings: ratings,
        commento: commento,
        // new Date().toISOString() genera un timestamp come
        // "2026-04-16T10:30:00.000Z" — utile per ordinare per data
        data: new Date().toISOString()
    };
}


/* ============================================
   3. CALCOLO STATISTICHE
   ============================================
   
   Calcoliamo:
   - Il totale delle risposte
   - La media dei voti per ogni sezione
*/

/**
 * Calcola le statistiche da tutti i feedback salvati.
 * Ritorna un oggetto con totale e medie per sezione.
 */
function calcolaStatistiche() {
    const feedbacks = getFeedbacks();
    const totale = feedbacks.length;
    
    // Se non ci sono feedback, ritorniamo tutto a zero
    if (totale === 0) {
        const medie = {};
        SEZIONI.forEach(sezione => {
            medie[sezione.chiave] = 0;
        });
        return { totale, medie };
    }
    
    // Calcoliamo la somma dei voti per ogni sezione
    const somme = {};
    SEZIONI.forEach(sezione => {
        somme[sezione.chiave] = 0;
    });
    
    // Ciclo su tutti i feedback: per ciascuno, sommiamo i voti
    feedbacks.forEach(feedback => {
        SEZIONI.forEach(sezione => {
            somme[sezione.chiave] += feedback.ratings[sezione.chiave];
        });
    });
    
    // Calcoliamo le medie dividendo ogni somma per il totale
    const medie = {};
    SEZIONI.forEach(sezione => {
        // toFixed(1) arrotonda a 1 decimale: 3.666... → "3.7"
        // parseFloat riconverte da stringa a numero: "3.7" → 3.7
        medie[sezione.chiave] = parseFloat((somme[sezione.chiave] / totale).toFixed(1));
    });
    
    return { totale, medie };
}


/* ============================================
   4. AGGIORNAMENTO DASHBOARD
   ============================================
   
   Queste funzioni aggiornano l'HTML della dashboard
   con i dati reali. Usano la "manipolazione del DOM":
   DOM = Document Object Model, è la rappresentazione
   ad albero della pagina HTML che JavaScript può modificare.
*/

/**
 * Converte un voto numerico (es. 3.7) in una stringa
 * di stelle: ★★★★☆ (stelle piene + stelle vuote)
 */
function generaStelle(voto) {
    const piene = Math.round(voto);   // Arrotonda: 3.7 → 4
    const vuote = 5 - piene;
    
    // '★'.repeat(4) → "★★★★"
    // '☆'.repeat(1) → "☆"
    return '★'.repeat(piene) + '☆'.repeat(vuote);
}

/**
 * Aggiorna tutta la sezione dashboard con le statistiche correnti.
 */
function aggiornaDashboard() {
    const stats = calcolaStatistiche();
    
    // Aggiorna il contatore totale risposte
    // querySelector cerca dentro l'elemento con id="totale-risposte"
    // il figlio con classe .stat-numero
    document.querySelector('#totale-risposte .stat-numero').textContent = stats.totale;
    
    // Aggiorna medie per ogni sezione
    SEZIONI.forEach(sezione => {
        const media = stats.medie[sezione.chiave];
        
        // Aggiorna le stelle visive
        const stelleEl = document.getElementById(`media-${sezione.chiave}`);
        stelleEl.textContent = generaStelle(media);
        
        // Aggiorna il valore numerico
        const valoreEl = document.getElementById(`media-${sezione.chiave}-valore`);
        valoreEl.textContent = media > 0 ? `${media}/5` : '-';
    });
    
    // Aggiorna la lista degli ultimi commenti
    aggiornaCommenti();
}

/**
 * Mostra gli ultimi commenti nella dashboard.
 * Mostra solo i feedback che hanno un commento non vuoto.
 * Massimo 10 commenti, dal più recente al meno recente.
 */
function aggiornaCommenti() {
    const feedbacks = getFeedbacks();
    const container = document.getElementById('lista-commenti');
    
    // Filtriamo solo i feedback CON commento
    // .filter() crea un nuovo array con solo gli elementi
    // che passano il test (commento non vuoto)
    const conCommento = feedbacks
        .filter(fb => fb.commento && fb.commento.length > 0)
        .reverse()    // Dal più recente
        .slice(0, 10); // Massimo 10
    
    // Se non ci sono commenti, mostriamo il placeholder
    if (conCommento.length === 0) {
        container.innerHTML = '<p class="placeholder-commenti">Nessun commento ancora. Sii il primo!</p>';
        return;
    }
    
    // Creiamo l'HTML per ogni commento
    // .map() trasforma ogni oggetto in una stringa HTML
    // .join('') le unisce tutte in una sola stringa
    container.innerHTML = conCommento.map(fb => {
        // Formattiamo la data in modo leggibile
        const data = new Date(fb.data);
        const dataFormattata = data.toLocaleDateString('it-IT', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Usiamo i template literal (backtick `) per creare HTML
        // con variabili inserite dentro ${...}
        // 
        // SICUREZZA: usiamo escapeHTML() per prevenire attacchi XSS
        // (Cross-Site Scripting). Se qualcuno scrive <script>...</script>
        // nel commento, non verrà eseguito come codice!
        return `
            <div class="commento-item">
                <div class="commento-autore">${escapeHTML(fb.nome)}</div>
                <div class="commento-testo">${escapeHTML(fb.commento)}</div>
                <div class="commento-data">${dataFormattata}</div>
            </div>
        `;
    }).join('');
}

/**
 * Funzione di sicurezza: "sanifica" il testo sostituendo
 * i caratteri speciali HTML con le entità corrispondenti.
 * Es: <script> diventa &lt;script&gt;
 * 
 * Questo previene attacchi XSS: se un utente scrive codice
 * malevolo nel campo commento, verrà mostrato come testo
 * e NON eseguito dal browser.
 */
function escapeHTML(testo) {
    const div = document.createElement('div');
    div.textContent = testo;
    return div.innerHTML;
}


/* ============================================
   5. GESTIONE INVIO FORM
   ============================================
   
   L'"event listener" è il modo in cui JavaScript
   reagisce alle azioni dell'utente. Qui ascoltiamo
   l'evento "submit" del form (quando clicca "Invia").
*/

/**
 * Mostra un messaggio di conferma verde sopra il form.
 * Il messaggio scompare dopo 3 secondi.
 */
function mostraConferma(messaggio) {
    // Creiamo un nuovo elemento <div> via JavaScript
    const div = document.createElement('div');
    div.className = 'messaggio-conferma';
    div.textContent = messaggio;
    
    // Lo inseriamo prima del form
    const form = document.getElementById('form-feedback');
    form.parentNode.insertBefore(div, form);
    
    // setTimeout esegue una funzione dopo X millisecondi
    // 3000 ms = 3 secondi
    setTimeout(() => {
        div.remove(); // Rimuove l'elemento dal DOM
    }, 3000);
}

/**
 * Resetta il form: cancella tutti i campi e deseleziona le stelle.
 */
function resetForm() {
    document.getElementById('form-feedback').reset();
    // .reset() è un metodo nativo dei <form> che riporta
    // tutti i campi al loro valore iniziale
}

/**
 * Gestisce l'evento di invio del form.
 * È la funzione principale che orchestra tutto:
 * 1. Raccoglie i dati
 * 2. Li salva in localStorage
 * 3. Aggiorna la dashboard
 * 4. Mostra conferma e resetta il form
 */
function gestisciInvio(evento) {
    // preventDefault() impedisce al browser di ricaricare la pagina.
    // Di default, quando invii un <form>, il browser ricarica.
    // Noi vogliamo gestire tutto con JavaScript senza ricaricare!
    evento.preventDefault();
    
    // 1. Raccogliamo i dati
    const feedback = raccogliDatiForm();
    
    if (!feedback) {
        // Non dovrebbe succedere grazie a "required" nell'HTML,
        // ma è buona pratica avere una doppia validazione
        // (lato HTML + lato JavaScript)
        alert('Per favore compila tutti i campi obbligatori e seleziona tutte le stelle.');
        return;
    }
    
    // 2. Salviamo in localStorage
    aggiungiFeedback(feedback);
    
    // 3. Aggiorniamo la dashboard
    aggiornaDashboard();
    
    // 4. Conferma e reset
    mostraConferma(`Grazie ${feedback.nome}! Il tuo feedback è stato salvato.`);
    resetForm();
    
    // Scrolla dolcemente verso la dashboard per vedere i risultati
    document.getElementById('dashboard').scrollIntoView({
        behavior: 'smooth',  // Animazione fluida
        block: 'start'       // Si posiziona all'inizio della sezione
    });
}


/* ============================================
   6. INIZIALIZZAZIONE
   ============================================
   
   DOMContentLoaded è l'evento che si attiva quando
   l'HTML è stato completamente caricato e parsato.
   È il momento sicuro per iniziare a manipolare il DOM.
   
   Se provassimo a cercare elementi prima di questo evento,
   potremmo non trovarli perché non sono ancora stati creati!
*/

document.addEventListener('DOMContentLoaded', function() {
    
    // Colleghiamo l'evento submit del form alla nostra funzione
    const form = document.getElementById('form-feedback');
    form.addEventListener('submit', gestisciInvio);
    
    // Carichiamo la dashboard con i dati esistenti
    // (se ci sono feedback salvati da sessioni precedenti)
    aggiornaDashboard();
    
    // Log in console per debug (visibile con F12 → Console)
    console.log('App Feedback inizializzata!');
    console.log(`Feedback salvati: ${getFeedbacks().length}`);
});
