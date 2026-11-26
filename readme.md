# EPITUNES - Web app musicale

Questa repository contiene il codice sorgente di **EpiTunes**, una web app musicale ispirata a Spotify e realizzata come progetto di gruppo per il corso di sviluppo web front-end di Epicode. L'applicazione permette di esplorare brani, album e artisti tramite l'API di iTunes, ascoltare le anteprime dei brani, salvare i propri preferiti e registrare un nuovo utente.

---

> **Stato del progetto:** funzionalità principali completate e funzionanti, in fase di rifinitura. Questo file viene aggiornato a mano a mano che il progetto viene realizzato.

## Indice

- [Funzionalità](#funzionalità)
- [Tecnologie Utilizzate](#tecnologie-utilizzate)
- [Come Eseguire il Progetto Locale](#come-eseguire-il-progetto-locale)
- [Struttura del progetto](#struttura-del-progetto)
- [Architettura, Responsive Design e Media Query](#architettura-responsive-design-e-media-query)
- [Albero del dom](#albero-del-dom)
- [Come funziona](#come-funziona)
- [Aspetto grafico](#aspetto-grafico)
- [Extra e dettagli](#extra-e-dettagli)
- [Convenzioni di codice](#convenzioni-di-codice)
- [Aggiornamenti](#aggiornamenti)
- [Realizzato da](#realizzato-da)

### Funzionalità

L'applicazione offre un'interfaccia in stile Spotify, strutturata con Bootstrap 5 e CSS moderno e resa dinamica con JavaScript nativo:

- **Layout a 3 zone**: Sidebar, main e player condivisi dalle quattro pagine (`index.html`, `search.html`, `album.html`, `artist.html`), costruiti con CSS Grid e `grid-template-areas`.
- **Sidebar statica e player dinamico**: La sidebar è scritta direttamente nell'HTML di ogni pagina, con il link della pagina corrente evidenziato. Il player viene generato da `Player.mount()` in `common.js`; nell'HTML ne resta una copia statica identica, che si vede anche se il JavaScript della pagina non parte.
- **Home personalizzata**: Sezioni generate dinamicamente con i brani riprodotti di recente, i preferiti (salvati in `localStorage`) e i suggerimenti per genere. Ogni sezione mostra solo i brani che hanno un'anteprima audio.
- **Ricerca**: Campo di ricerca con debounce di 400ms che interroga l'API di iTunes e mostra i risultati divisi in tre sezioni (brani, album, artisti) tramite `Promise.all`. Le sezioni senza risultati restano nascoste e l'ultima ricerca viene salvata in `localStorage`.
- **Pagina Album**: Lettura dell'id dalla query string con `URLSearchParams`, hero con copertina, titolo, artista, anno, numero di brani e durata totale, e tracklist numerata con la durata di ogni brano.
- **Pagina Artista**: Lettura dell'id dalla query string, hero con nome dell'artista e genere, e lista dei brani più popolari.
- **Riproduzione**: Anteprime audio dei brani con play/pausa, barra di avanzamento e volume cliccabili; il brano in ascolto viene evidenziato nella tracklist.
- **Preferiti**: Cuore su card e righe della tracklist per aggiungere o togliere un brano dai preferiti, con la lista `#sidebar-favourites` aggiornata nella sidebar.
- **Registrazione nuovo utente**: Il pulsante `#btn-new-user` apre una modale con un form di registrazione (nome utente, email, password, conferma password, data di nascita e consenso al trattamento dei dati) e i messaggi di errore sotto ogni campo.
- **Responsive Design**: Sidebar ridotta alle sole icone su tablet e nascosta su mobile, player su due colonne su schermi piccoli, hero e card che si adattano alla larghezza del main.

## Tecnologie Utilizzate

- **HTML5**: Strutturazione semantica delle pagine.
- **CSS3 moderno**: Custom properties, nesting nativo, `grid-template-areas`, container queries, `color-mix()`, animazioni con `@keyframes` e media query con range syntax.
- **Bootstrap 5.3.8**: Tema scuro (`data-bs-theme="dark"`), reboot, utility di layout, bottoni, campo di ricerca e visibilità responsive.
- **Google Fonts**: Italiana per logo e titoli, Libre Baskerville per il testo.
- **Icone SVG**: Set di icone personalizzate raccolte in uno sprite all'inizio di ogni pagina.
- **JavaScript (ES6+)**: Moduli ES (`import`/`export`), chiamate `fetch` asincrone, classi OOP, manipolazione del DOM con `createElement`, gestione del player e del `localStorage`.
- **iTunes Search API**: Fonte dei dati di brani, album, artisti, copertine e anteprime audio.

## Come Eseguire il Progetto Locale

1. **Clona il repository**:
   ```bash
   git clone <!-- inserire link del repository -->
   ```

2. **Apri l'applicazione**:
   Apri il progetto con un'estensione come **Live Server** su VS Code e avvia `index.html`. Il JavaScript è organizzato in moduli ES, che il browser blocca se la pagina viene aperta direttamente dal file (indirizzo `file://`).

---

## Struttura del progetto

```text
.
├── assets/
│   ├── css/
│   │   └── app.css        stile personalizzato, tema vintage, variabili CSS e layout a 3 zone
│   └── js/
│       ├── helper.js      funzioni di utilità: el, $, debounce, fetch e cronologia
│       ├── common.js      classi modello, classe Player, funzioni di localStorage e initPage
│       ├── home.js        sezioni dinamiche della home
│       ├── search.js      ricerca e rendering dei risultati
│       ├── album.js       dettaglio album e tracklist
│       ├── artist.js      dettaglio artista e brani popolari
│       └── new-user.js    modale di registrazione del nuovo utente
├── index.html             home
├── search.html            pagina di ricerca
├── album.html             pagina di dettaglio album
├── artist.html            pagina di dettaglio artista
└── README.md              documentazione del progetto
```

---

## Architettura, Responsive Design e Media Query

L'architettura del progetto è **multi-pagina**: ogni pagina (`index.html`, `search.html`, `album.html`, `artist.html`) condivide la stessa struttura a 3 zone, gestita in `app.css` con CSS Grid e `grid-template-areas`:

- **Sidebar** a sinistra con la navigazione e i preferiti.
- **Main** al centro con la topbar sticky e il contenuto della pagina.
- **Player** fisso in basso su tutta la larghezza.

La sidebar è **statica**: è scritta nell'HTML e l'unica parte dinamica è la lista dei preferiti (`#sidebar-favourites`). Il player è **dinamico**: `initPage()` in `common.js` crea il player con `Player.mount()` e lo sostituisce alla copia statica presente nell'HTML.

Il layout si adatta allo schermo sfruttando i breakpoint di Bootstrap:

- **Mobile (<576px)**: Sidebar nascosta (classi `d-none d-sm-block`), layout a una colonna, player su 2 colonne senza il controllo del volume, campi della modale uno sotto l'altro.
- **Tablet (576px - 767px)**: Sidebar ridotta a 80px con le sole icone.
- **Desktop (≥768px)**: Sidebar completa da 240px con titoli e preferiti.

Oltre alle media query, il main è un **container** (`container: main / inline-size`): hero e card si adattano alla larghezza del main e non a quella della finestra.

- **Main < 720px**: Hero di album e artista in colonna, copertina ridotta a 160px.
- **Main < 540px**: Card della griglia con larghezza minima di 140px invece di 180px.

---

## Albero del dom

Struttura comune a tutte le pagine:

* **Sprite delle icone (`<svg style="display: none">`)**: Raccolta di `<symbol>` (`#ico-home`, `#ico-search`, `#ico-chevron-left`, `#ico-chevron-right`, `#ico-shuffle`, `#ico-prev`, `#ico-next`, `#ico-repeat`, `#ico-volume`) richiamati con `<use href="#ico-...">`.
* **Contenitore (`<div class="app">`)**: Griglia a 3 zone che contiene tutta l'interfaccia.
  * **Sidebar (`<aside class="sidebar">`)**:
    * `.brand`: Logo a disco (`.brand-mark`) e nome `EpiTunes`.
    * `.sidebar-nav`: Link Home e Cerca con le icone SVG, quello della pagina corrente con classe `active`.
    * `.sidebar-section-title` "I tuoi preferiti" e lista `#sidebar-favourites`, con "Nessuno ancora" quando è vuota.
  * **Contenuto (`<main class="main">`)**:
    * **Topbar (`<header class="topbar">`)**: Bottoni `.nav-btn` Indietro/Avanti, pulsante `#btn-new-user` e pill utente.
    * **Sezione della pagina**: Cambia in base alla pagina (vedi sotto).
  * **Player (`<footer class="player">`)**, generato da `Player.mount()`:
    * `.player-track`: Copertina `#player-cover` con l'immagine `#player-cover-img`, titolo `#player-title` e artista `#player-artist`.
    * `.player-center`: Comandi `#btn-shuffle`, `#btn-prev`, `#btn-play`, `#btn-next`, `#btn-repeat` e barra di avanzamento (`#time-current`, `#progress-bar`, `#progress-fill`, `#time-total`).
    * `.player-right`: Icona del volume e barra `#volume-bar` / `#volume-fill`.
* **Modale "New user" (`<div class="welcome-overlay" id="register-modal">`)**:
  * `.welcome-box`: Riquadro della modale con il pulsante di chiusura `#register-close`, il titolo `#register-title` e il testo introduttivo.
  * `#register-form`: Campi `#register-username`, `#register-email`, `#register-password`, `#register-repeat`, `#register-birth` e la checkbox `#register-consent`, ognuno con il suo messaggio di errore `.register-error`; in fondo i pulsanti `#register-cancel` e "Registrati".
* **Audio (`<audio id="audio-element">`)**: Elemento che riproduce le anteprime dei brani.

Sezioni delle singole pagine:

* **Home (`<section class="home">`)**:
  * Sezioni `<article class="row">` generate dal JS, con titolo `h2` e griglia `.grid` di card. Ogni `.card` contiene `.card-image-wrap` (copertina), `.card-title` (titolo), `.card-sub` (artista), il play `.card-play` e il cuore `.card-fav`.
* **Ricerca (`<section class="search">`)**:
  * Campo di ricerca `#search-input`.
  * Tre sezioni nascoste di default (`#row-tracks`, `#row-albums`, `#row-artists`) con le griglie `#grid-tracks`, `#grid-albums`, `#grid-artists`.
* **Album (`<section class="album-page">`)**:
  * `#album-hero`: Copertina (`.album-cover`), testi (`.hero-meta` con `.hero-kicker`, `.hero-title`, `.hero-sub`) e pulsanti `.btn-play-big` e `.btn-fav-big`.
  * `#tracklist`: Righe `.track-row` con numero, titolo, durata e cuore.
* **Artista (`<section class="artist-page">`)**:
  * `#artist-hero`: Foto e dati dell'artista.
  * `#top-tracks`: Lista dei brani popolari, con le stesse righe della tracklist.

---

## Come funziona

Il codice JavaScript è organizzato in **moduli ES**: ogni pagina carica `common.js` e il proprio file, che importa quello che gli serve.

1. **Funzioni di utilità (`helper.js`)**:
   - `el()` crea un elemento con `createElement`, assegnandogli classi, id, testo, attributi, stile e figli; `$()` è una scorciatoia di `querySelector`.
   - `debounce()` ritarda l'esecuzione di una funzione finché l'utente non smette di scrivere.
   - `fetchItem()`, `fetchByGenre()` e `fetchModular()` interrogano l'API di iTunes; `fetchByGenre()` usa `attribute=genreIndex` per cercare per genere invece che per titolo.
   - `historyLog()`, `historyDump()` e `historyClear()` salvano, leggono e cancellano la cronologia nel `localStorage`.
2. **Funzioni comuni (`common.js`)**:
   - `fetchJSON()` esegue una richiesta e, in caso di errore, restituisce un risultato vuoto invece di bloccare la pagina.
   - `bigArt()` trasforma la copertina 100x100 dell'API in una 600x600; `formatTime()` converte i millisecondi in `m:ss`.
   - Le classi `Track`, `Album` e `Artist` modellano i dati ricevuti dall'API.
   - La classe `Player` gestisce l'elemento `<audio>`. `mount()` costruisce il player con `el()` e lo inserisce nel footer con `replaceChildren`, così non si duplica; le icone SVG dei comandi sono create dalla funzione `icon()` con `createElementNS`. Il pulsante `#btn-play` alterna ▶ e ⏸ in base agli eventi `play` e `pause` dell'audio, mentre `timeupdate` aggiorna la barra di avanzamento.
   - `getHistory()` e `addToHistory()` gestiscono la cronologia degli ascolti (massimo 12 brani, senza duplicati); `getFavourites()`, `isFavourite()` e `toggleFavourite()` gestiscono i preferiti.
   - `initPage()` monta il player in ogni pagina e lo restituisce.
3. **Home (`home.js`)**:
   - `renderCard()` crea una card per brano: il clic sulla card avvia il brano con `player.play()`, il clic sul cuore aggiunge o toglie il preferito (con `stopPropagation()`, così il brano non parte) e aggiorna la classe `is-fav`.
   - `renderRow()` crea una sezione `<article class="row">` con il titolo e la griglia delle card, solo se ci sono brani con anteprima audio.
4. **Ricerca (`search.js`)**:
   - L'evento `input` su `#search-input` lancia la ricerca con un debounce di 400ms.
   - Le tre chiamate (brani, album, artisti) partono in parallelo con `Promise.all`; ogni sezione viene mostrata solo se ha risultati.
   - `renderCard()` crea le card dei brani, `renderAlbumCard()` quelle degli album: il clic su un album apre `album.html?id=...`.
5. **Album (`album.js`)**:
   - `loadAlbum()` legge l'id con `URLSearchParams` e chiama `lookup?id=...&entity=song`: il primo risultato è l'album, gli altri sono i brani.
   - Calcola l'anno dalla data di uscita e la durata totale sommando le durate dei brani con `reduce()`.
   - Costruisce l'hero e la tracklist; il clic su una riga avvia il brano, che viene evidenziato con la classe `is-playing`.
6. **Artista (`artist.js`)**: Legge l'id con `URLSearchParams`, chiama `lookup?id=...&entity=song&limit=15` e costruisce l'hero dell'artista e la lista dei brani popolari.
7. **Nuovo utente (`new-user.js`)**: Apre la modale al clic su `#btn-new-user`, la chiude con `#register-close` e `#register-cancel` e controlla i campi del form, mostrando gli errori nei rispettivi `.register-error`.

---

## Aspetto grafico

L'applicazione ha un tema **vintage ispirato ai giradischi**, con un layout a 3 zone che resta uguale in tutte le pagine. La palette si basa sui toni del legno: marrone quasi nero per lo sfondo (`#1e1410`), marrone scuro per card e tracklist (`#2b1d15`), sidebar in noce scuro liscio e player in legno di noce con le venature orizzontali, separato dal resto da un profilo in ottone. L'ottone (`#c9a227`) è il colore d'accento di link attivi, bordi, pulsanti e brano in riproduzione; l'avorio (`#f3e6c8`) è usato per il testo principale e il beige (`#bfa98a`) per le informazioni secondarie, mentre il rosso mattone (`#b5432f`) è riservato ai preferiti e agli errori. Il logo e i titoli usano il font art déco **Italiana**, il testo il serif **Libre Baskerville**. Le icone sono disegnate a linea sottile con estremità arrotondate e le copertine hanno una leggera tinta seppia. Al passaggio del mouse le card si sollevano, la copertina si scurisce e compare al centro un pulsante play trasparente, mentre il cuore sta a destra di titolo e artista. Nelle pagine di album e artista i testi sono affiancati alla copertina e i pulsanti play e preferiti sono due cerchi uguali in ottone; nella pagina artista la foto prende la forma di un vinile. La modale di registrazione riprende lo stesso stile, con il riquadro in legno scuro, il profilo in ottone e il titolo in Italiana.

---

## Extra e dettagli

- **Bootstrap 5.3.8 e CSS moderno** Il layout è stato rifatto con Bootstrap e CSS moderno (nesting nativo, container queries, `color-mix()`), mantenendo gli stessi nomi di classe usati dal JavaScript. Gestito da css.
- **Tema vintage giradischi** Palette legno, ottone e avorio, venature del legno nel player, copertine con tinta seppia e foto dell'artista a forma di vinile. Gestito da css.
- **Font art déco** Italiana per logo e titoli, Libre Baskerville per il testo. Gestito da css.
- **Icone SVG personalizzate** Icone a linea sottile in uno sprite SVG, colorate con il colore del testo. Gestite da html, css e js.
- **Logo a disco animato** Il logo è un piccolo vinile con l'etichetta in ottone: con il passaggio del mouse gira a circa 33 giri e si solleva, quando il mouse esce rallenta per inerzia fino a fermarsi. Gestito da css.
- **Card in stile Spotify** Con il passaggio del mouse la copertina si scurisce e compare un pulsante play trasparente al centro; il cuore dei preferiti sta accanto al testo e resta rosso quando il brano è tra i preferiti. Gestito da css e js.
- **Barre facili da cliccare** Le barre di avanzamento e del volume restano sottili, ma hanno un'area cliccabile invisibile più alta e si ispessiscono al passaggio del mouse. Gestito da css.
- **Sidebar statica e player di riserva** La sidebar è scritta nell'HTML e il player ha una copia statica che resta visibile anche se il JavaScript della pagina non parte. Gestito da html.
- **Registrazione nuovo utente** Modale con form di registrazione nello stile del tema vintage, con messaggi di errore sotto ogni campo. Gestito da html, css e js.

---

## Convenzioni di codice

- **camelCase** per variabili, funzioni e metodi: searchInput, renderAlbum(), formatTime().
- **PascalCase** per le classi: Album, Track, Player.
- **UPPER_SNAKE_CASE** solo per le costanti "vere", cioè valori fissi di configurazione noti prima di eseguire il codice: API_URL, DEBOUNCE_MS = 400, STORAGE_KEY_FAVOURITES.
- **const** di default, let solo se la variabile viene riassegnata, mai var e niente `innerHTML`.
- **Nomi descrittivi, doppi apici e commenti** Nomi in lingua inglese e commenti in italiano.

---

## Aggiornamenti

| Versione | Descrizione |
| :--- | :--- |
| **ver. 0.0** | Commit iniziale e impostazione del progetto |
| **ver. 1.0** | **HTML:** aggiunto Bootstrap 5.3.8 (solo CSS) in tutte le pagine, sprite di icone SVG, sidebar e player scritti direttamente nell'HTML e topbar con il pulsante "+ New user"; **CSS:** tema vintage da giradischi con palette legno, ottone e avorio, font Italiana e Libre Baskerville, logo a vinile animato, pulsanti play in ottone, foto artista a forma di vinile e copertine con tinta seppia; **JavaScript:** nuove funzioni in helper.js (fetchModular, cronologia e preferiti), classi Track, Album, Artist e Player in common.js, righe di suggerimenti in home.js, ricerca con debounce in search.js e hero dell'album in album.js |
| **ver. 2.0** | **HTML e CSS:** aggiunte le modali di registrazione e "Cosa ascolti di solito?", CSS riorganizzato con classi proprie al posto di Bootstrap per card, hero e righe dei brani; **JavaScript (album e home):** tracklist completa, cuori dei preferiti sincronizzati, righe "Riprodotti di recente" e "Preferiti" aggiornate in tempo reale; **JavaScript (ricerca):** la ricerca trova anche gli album e un clic apre la loro pagina; **In corso:** apertura e controllo della registrazione, passaggio alla scelta di generi e artisti |
| **ver. 2.1** | HTML e CSS: form di registrazione con i controlli del browser, app.css commentato; JavaScript: pagina artista funzionante, la ricerca ora trova anche gli artisti con la loro foto. In corso: new-user.js, mancano il controllo dei campi e il passaggio alla scelta della musica.
| **ver. 2.2** | **HTML e CSS:** barra di ricerca nell'header, nuovo sfondo, modali "New user" anche in search.html; **JavaScript:** player con barre trascinabili, home con suggerimenti per genere, registrazione con controllo password. **In corso:** scelta di generi e artisti |
| **ver. 3.2** | **HTML e CSS:** pagina Libreria, hero "Suggerito per te" in home con carosello di artisti, modali di registrazione con foto e di scelta musica con stile; **JavaScript:** playlist (crea, aggiungi con +, elimina), suggerimenti artisti in home, scelta di generi e artisti funzionante |
| **ver. 3.3** | libreria e playlist, player avanti/indietro, sidebar mobile, grafica artista, setup server login
| **ver. 4.3** | **HTML e CSS:** vista giradischi, modali "Log in", "Impostazioni" e "Condividi"; **JavaScript:** registrazione e login con json-server-auth, casuale e ripeti nel player, finestra per scegliere la playlist col "+", rinomina playlist, biografia e Facebook dell'artista, opzioni di accessibilità |

## Realizzato da

| Persona | Ruolo |
| :--- | :--- |
| Lisa Irene Sciacca | Team leader, README, Layout |
| Kledjan Lleshi | Gestore Git e LiveShare, JavaScript |
| Matteo Brucculeri | Responsabile API, JavaScript |
| Mattia Pirró | JavaScript, Testing/QA |
| Giuseppe Cascini | JavaScript, Testing/QA |