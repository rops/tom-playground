/* ============================================
   APP.JS - Logica della Web App Feedback
   
   Questo file gestisce:
   1. Il salvataggio dei feedback in localStorage (backup locale)
   2. L'invio dei feedback a Google Sheets (dati condivisi)
   3. Il caricamento dei feedback remoti da Google Sheets
   4. Il calcolo delle statistiche (medie, totale)
   5. L'aggiornamento della dashboard
   6. La validazione e l'invio del form
   ============================================ */

// --- COSTANTI ---
// La chiave con cui salviamo i dati in localStorage.
// localStorage funziona a coppie chiave-valore (come un dizionario).
const STORAGE_KEY = 'feedbacks';

// URL del Google Apps Script (Web App)
// Questo è l'endpoint che riceve (POST) e restituisce (GET) i feedback.
// Funziona come un mini-server gratuito gestito da Google.
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzrddJdWMKJ2vz4KuWl5-1mHTqJdFY4IAyR_brDWhgiID3202iI39DvGDY5o6fgZZQ2lg/exec';

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

// Variabile globale che conterrà i feedback scaricati da Google Sheets.
// La usiamo per evitare di riscaricare i dati ogni volta che aggiorniamo la dashboard.
let feedbackRemoti = [];


/* ============================================
   1. GESTIONE localStorage (BACKUP LOCALE)
   ============================================
   
   localStorage salva solo STRINGHE. Per salvare un array
   di oggetti dobbiamo:
   - JSON.stringify() → converte oggetto JS in stringa JSON
   - JSON.parse()     → converte stringa JSON in oggetto JS
   
   Esempio:
   { nome: "Marco", voto: 5 }  →  '{"nome":"Marco","voto":5}'
   
   Manteniamo localStorage come BACKUP: se Google Sheets
   non è raggiungibile, i dati non si perdono.
*/

/**
 * Legge tutti i feedback salvati in localStorage.
 * Se non ce ne sono, ritorna un array vuoto [].
 */
function getFeedbacksLocali() {
    const dati = localStorage.getItem(STORAGE_KEY);
    
    // Se non c'è niente salvato, dati sarà null
    if (!dati) {
        return [];
    }
    
    // Convertiamo la stringa JSON in un array di oggetti
    return JSON.parse(dati);
}

/**
 * Salva un singolo feedback in localStorage (backup).
 * Legge → aggiunge → riscrive.
 */
function salvaFeedbackLocale(feedback) {
    const feedbacks = getFeedbacksLocali();
    feedbacks.push(feedback);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(feedbacks));
}


/* ============================================
   2. COMUNICAZIONE CON GOOGLE SHEETS
   ============================================
   
   Usiamo fetch() per comunicare con Google Apps Script.
   
   fetch() è una funzione nativa del browser che fa richieste
   HTTP (come quando il browser carica una pagina web, ma
   lo facciamo da JavaScript in modo "invisibile").
   
   Le operazioni di rete sono ASINCRONE: non danno risultato
   immediato (il server deve ricevere la richiesta, elaborarla
   e rispondere). Per questo usiamo async/await:
   
   - async → dice che la funzione contiene operazioni asincrone
   - await → "aspetta qui finché non arriva la risposta"
   
   Senza await, il codice continuerebbe SENZA aspettare
   la risposta del server, e i dati non sarebbero pronti!
*/

/**
 * Invia un feedback a Google Sheets tramite richiesta POST.
 * 
 * POST è il metodo HTTP usato per INVIARE dati a un server.
 * (GET è per RICHIEDERE dati, POST per INVIARLI)
 * 
 * Ritorna true se l'invio è andato a buon fine, false se c'è stato un errore.
 */
async function inviaFeedbackRemoto(feedback) {
    try {
        // fetch() fa la richiesta HTTP
        const risposta = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',           // Metodo: stiamo INVIANDO dati
            mode: 'no-cors',          // Necessario per Google Apps Script
            headers: {
                'Content-Type': 'application/json'  // Diciamo al server che i dati sono in formato JSON
            },
            body: JSON.stringify(feedback)  // Convertiamo l'oggetto in stringa JSON
        });
        
        // mode: 'no-cors' non ci permette di leggere la risposta,
        // ma se arriviamo qui senza errori, l'invio è andato a buon fine
        console.log('Feedback inviato a Google Sheets!');
        return true;
        
    } catch (errore) {
        // Se c'è un errore (es. nessuna connessione internet),
        // lo logghiamo ma NON blocchiamo l'app.
        // Il feedback è comunque salvato in localStorage!
        console.error('Errore invio a Google Sheets:', errore);
        return false;
    }
}

/**
 * Carica tutti i feedback da Google Sheets tramite richiesta GET.
 * 
 * GET è il metodo HTTP usato per RICHIEDERE dati da un server.
 * È il metodo di default di fetch() (non serve specificarlo).
 * 
 * Ritorna l'array di feedback, o un array vuoto se c'è un errore.
 */
async function caricaFeedbackRemoti() {
    try {
        const risposta = await fetch(GOOGLE_SCRIPT_URL);
        
        // .json() converte la risposta del server da stringa JSON a oggetto JS
        // (è l'equivalente di JSON.parse, ma per le risposte fetch)
        const dati = await risposta.json();
        
        // Verifichiamo che sia effettivamente un array
        if (Array.isArray(dati)) {
            feedbackRemoti = dati;
            console.log(`Caricati ${dati.length} feedback da Google Sheets`);
            return dati;
        }
        
        console.warn('Risposta inattesa da Google Sheets:', dati);
        return [];
        
    } catch (errore) {
        console.error('Errore caricamento da Google Sheets:', errore);
        // Se non riusciamo a caricare da remoto, usiamo i dati locali come fallback
        console.log('Uso dati locali come fallback');
        feedbackRemoti = getFeedbacksLocali();
        return feedbackRemoti;
    }
}


/* ============================================
   3. RACCOLTA DATI DAL FORM
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
   4. CALCOLO STATISTICHE
   ============================================
   
   Calcoliamo:
   - Il totale delle risposte
   - La media dei voti per ogni sezione
   
   Ora usa i dati REMOTI (da Google Sheets) invece dei locali,
   così tutti i visitatori vedono le stesse statistiche!
*/

/**
 * Calcola le statistiche da un array di feedback.
 * Accetta un parametro: l'array di feedback da analizzare.
 * Ritorna un oggetto con totale e medie per sezione.
 */
function calcolaStatistiche(feedbacks) {
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
   5. AGGIORNAMENTO DASHBOARD
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
 * Usa i feedback remoti (da Google Sheets) come fonte dati principale.
 */
function aggiornaDashboard() {
    const stats = calcolaStatistiche(feedbackRemoti);
    
    // Aggiorna il contatore totale risposte con animazione
    animaContatore(stats.totale);
    
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
 * 
 * ANIMAZIONE: ogni commento ha un ritardo crescente (--delay)
 * che crea l'effetto "scivolano dentro uno dopo l'altro".
 */
function aggiornaCommenti() {
    const container = document.getElementById('lista-commenti');
    
    // Filtriamo solo i feedback CON commento
    const conCommento = feedbackRemoti
        .filter(fb => fb.commento && fb.commento.length > 0)
        .reverse()    // Dal più recente
        .slice(0, 10); // Massimo 10
    
    // Se non ci sono commenti, mostriamo il placeholder
    if (conCommento.length === 0) {
        container.innerHTML = '<p class="placeholder-commenti">Nessun commento ancora. Sii il primo!</p>';
        return;
    }
    
    // Creiamo l'HTML per ogni commento
    // L'indice (i) viene usato per calcolare il ritardo dell'animazione:
    // il primo commento entra subito, il secondo dopo 0.1s, il terzo dopo 0.2s, ecc.
    container.innerHTML = conCommento.map((fb, i) => {
        const data = new Date(fb.data);
        const dataFormattata = data.toLocaleDateString('it-IT', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // style="--delay: 0.1s" → la variabile CSS custom viene usata
        // in style.css come animation-delay: var(--delay)
        return `
            <div class="commento-item" style="--delay: ${i * 0.1}s">
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
   6. GESTIONE INVIO FORM
   ============================================
   
   L'"event listener" è il modo in cui JavaScript
   reagisce alle azioni dell'utente. Qui ascoltiamo
   l'evento "submit" del form (quando clicca "Invia").
   
   La funzione è ora ASYNC perché deve aspettare
   la risposta di Google Sheets (operazione di rete).
*/

/**
 * Mostra un messaggio sopra il form.
 * Il parametro "tipo" può essere 'successo' o 'errore'.
 * Il messaggio scompare dopo 3 secondi.
 */
function mostraMessaggio(messaggio, tipo) {
    const div = document.createElement('div');
    div.className = tipo === 'errore' ? 'messaggio-errore' : 'messaggio-conferma';
    div.textContent = messaggio;
    
    const form = document.getElementById('form-feedback');
    form.parentNode.insertBefore(div, form);
    
    // setTimeout esegue una funzione dopo X millisecondi
    // 3000 ms = 3 secondi
    setTimeout(() => {
        div.remove();
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
 * 2. Li salva in localStorage (backup)
 * 3. Li invia a Google Sheets (condivisi)
 * 4. Ricarica i dati remoti e aggiorna la dashboard
 * 5. Mostra conferma e resetta il form
 */
async function gestisciInvio(evento) {
    // preventDefault() impedisce al browser di ricaricare la pagina.
    evento.preventDefault();
    
    // 1. Raccogliamo i dati
    const feedback = raccogliDatiForm();
    
    if (!feedback) {
        alert('Per favore compila tutti i campi obbligatori e seleziona tutte le stelle.');
        return;
    }
    
    // Disabilitiamo il bottone durante l'invio per evitare doppi click
    const btnInvia = document.getElementById('btn-invia');
    btnInvia.disabled = true;
    btnInvia.textContent = 'Invio in corso...';
    
    // 2. Salviamo in localStorage (backup locale)
    salvaFeedbackLocale(feedback);
    
    // 3. Inviamo a Google Sheets
    const invioRiuscito = await inviaFeedbackRemoto(feedback);
    
    // 4. Ricarichiamo i dati remoti e aggiorniamo la dashboard
    // Aspettiamo un attimo che Google Sheets processi i dati
    // (il salvataggio su Sheets non è istantaneo)
    setTimeout(async () => {
        await caricaFeedbackRemoti();
        aggiornaDashboard();
    }, 1500);
    
    // 5. Conferma e reset
    if (invioRiuscito) {
        mostraMessaggio(`Grazie ${feedback.nome}! Il tuo feedback è stato salvato.`, 'successo');
    } else {
        mostraMessaggio(`Feedback salvato localmente. Connessione al server non riuscita.`, 'errore');
    }
    resetForm();
    
    // Riabilitiamo il bottone
    btnInvia.disabled = false;
    btnInvia.textContent = 'Invia Feedback';
    
    // Scrolla dolcemente verso la dashboard per vedere i risultati
    document.getElementById('dashboard').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}


/* ============================================
   7. INIZIALIZZAZIONE
   ============================================
   
   DOMContentLoaded è l'evento che si attiva quando
   l'HTML è stato completamente caricato e parsato.
   È il momento sicuro per iniziare a manipolare il DOM.
   
   All'avvio, carichiamo i feedback da Google Sheets
   per mostrare le statistiche condivise di tutti gli utenti.
*/

/* ============================================
   8. ANIMAZIONI
   ============================================
   
   Qui gestiamo le animazioni che richiedono JavaScript:
   - IntersectionObserver per il fade-in allo scroll
   - Bounce delle stelle al click
   - Contatore animato del totale risposte
*/

/**
 * INTERSECTION OBSERVER - Fade-in allo scroll
 * 
 * IntersectionObserver è un'API del browser che "osserva"
 * quando un elemento entra o esce dalla viewport (la parte
 * visibile della pagina).
 * 
 * Quando un elemento con classe .animato diventa visibile,
 * gli aggiungiamo la classe .visibile che attiva la transizione
 * CSS (opacity + translateY).
 * 
 * threshold: 0.1 → l'animazione scatta quando almeno il 10%
 * dell'elemento è visibile.
 */
function inizializzaFadeIn() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visibile');
                // Una volta animato, smettiamo di osservarlo (performance)
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });
    
    // Aggiungiamo la classe .animato a tutti gli elementi da animare
    // e li registriamo nell'observer
    const elementiDaAnimare = document.querySelectorAll('section, .stat-card, .medie-container, .commenti-container');
    elementiDaAnimare.forEach(el => {
        el.classList.add('animato');
        observer.observe(el);
    });
}

/**
 * STELLE BOUNCE - Effetto rimbalzo al click
 * 
 * Quando clicchi su una stella, aggiungiamo la classe .bounce
 * alla label corrispondente e a tutte le label "sorelle" che
 * si colorano. Dopo che l'animazione finisce (400ms), rimuoviamo
 * la classe così può ripartire al prossimo click.
 */
function inizializzaStelleBounce() {
    // Selezioniamo tutti i radio button delle stelle
    const stelleRadio = document.querySelectorAll('.stelle input[type="radio"]');
    
    stelleRadio.forEach(radio => {
        radio.addEventListener('change', function() {
            // Troviamo il contenitore .stelle di questo radio button
            const container = this.closest('.stelle');
            const labels = container.querySelectorAll('label');
            
            // Aggiungiamo .bounce a tutte le label
            labels.forEach(label => {
                label.classList.remove('bounce'); // Reset (necessario per ri-triggerare)
                // Piccolo trucco: forziamo il browser a "ricalcolare" lo stile
                // prima di riaggiungere la classe, altrimenti non riparte l'animazione
                void label.offsetWidth;
                label.classList.add('bounce');
            });
            
            // Rimuoviamo .bounce dopo che l'animazione finisce (400ms)
            setTimeout(() => {
                labels.forEach(label => label.classList.remove('bounce'));
            }, 400);
        });
    });
}

/**
 * CONTATORE ANIMATO - Il numero conta da 0 al valore reale
 * 
 * Invece di mostrare subito "15 risposte", il numero parte da 0
 * e conta rapidamente fino al valore finale. L'effetto è dato da
 * requestAnimationFrame, che chiede al browser di eseguire una
 * funzione ad ogni frame (circa 60 volte al secondo).
 * 
 * La durata totale dell'animazione è proporzionale al numero,
 * con un minimo di 500ms e un massimo di 1500ms.
 */
function animaContatore(valoreFinale) {
    const elemento = document.querySelector('#totale-risposte .stat-numero');
    
    // Se il valore è 0, non serve animare
    if (valoreFinale === 0) {
        elemento.textContent = '0';
        return;
    }
    
    const durata = Math.min(1500, Math.max(500, valoreFinale * 50)); // ms
    const inizio = performance.now(); // Timestamp preciso di quando inizia
    
    function aggiorna(tempoCorrente) {
        // Calcoliamo la percentuale di completamento (0 → 1)
        const progresso = Math.min((tempoCorrente - inizio) / durata, 1);
        
        // easeOutQuad: la velocità rallenta verso la fine (effetto naturale)
        // Invece di contare a velocità costante, accelera all'inizio
        // e decelera alla fine, come un oggetto che frena.
        const easing = 1 - (1 - progresso) * (1 - progresso);
        
        // Calcoliamo il valore corrente e lo mostriamo
        const valoreMostrato = Math.round(easing * valoreFinale);
        elemento.textContent = valoreMostrato;
        
        // Se non abbiamo finito, chiediamo un altro frame
        if (progresso < 1) {
            requestAnimationFrame(aggiorna);
        }
    }
    
    // Avviamo l'animazione
    requestAnimationFrame(aggiorna);
}


/* ============================================
   9. INIZIALIZZAZIONE
   ============================================
   
   DOMContentLoaded è l'evento che si attiva quando
   l'HTML è stato completamente caricato e parsato.
   È il momento sicuro per iniziare a manipolare il DOM.
   
   All'avvio, carichiamo i feedback da Google Sheets
   per mostrare le statistiche condivise di tutti gli utenti,
   e inizializziamo tutte le animazioni.
*/

document.addEventListener('DOMContentLoaded', async function() {
    
    // Colleghiamo l'evento submit del form alla nostra funzione
    const form = document.getElementById('form-feedback');
    form.addEventListener('submit', gestisciInvio);
    
    // Inizializziamo le animazioni
    inizializzaFadeIn();        // Fade-in allo scroll
    inizializzaStelleBounce();  // Bounce delle stelle al click
    
    // Carichiamo i feedback da Google Sheets (dati condivisi)
    console.log('Caricamento feedback da Google Sheets...');
    await caricaFeedbackRemoti();
    
    // Aggiorniamo la dashboard con i dati remoti
    aggiornaDashboard();
    
    // Animiamo il contatore del totale risposte
    animaContatore(feedbackRemoti.length);
    
    // Log in console per debug (visibile con F12 → Console)
    console.log('App Feedback inizializzata con animazioni!');
    console.log(`Feedback remoti: ${feedbackRemoti.length}`);
    console.log(`Feedback locali (backup): ${getFeedbacksLocali().length}`);
});
