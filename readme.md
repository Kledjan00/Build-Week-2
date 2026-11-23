# EPITUNES - Web app musicale

Questa repository contiene il codice sorgente di **EpiTunes**, una web app musicale ispirata a Spotify e realizzata come progetto di gruppo per il corso di sviluppo web front-end di Epicode. L'applicazione permette di esplorare brani, album e artisti tramite l'API di iTunes, ascoltare le anteprime dei brani e salvare i propri preferiti.

---

> **Stato del progetto:** in sviluppo. Questo file viene aggiornato a mano a mano che il progetto viene realizzato.

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

- **Home personalizzata**: Sezioni generate dinamicamente con i brani riprodotti di recente e i preferiti (salvati in `localStorage`) e con suggerimenti per genere (pop, rock, italian pop).
- **Ricerca**: Campo di ricerca con debounce di 400ms che interroga l'API di iTunes e mostra i risultati divisi in tre sezioni (brani, album, artisti) tramite `Promise.all`. L'ultima ricerca viene salvata in `localStorage` e ripresa al caricamento della pagina.
- **Pagina Album**: Lettura dell'id dalla query string con `URLSearchParams`, hero con copertina, titolo, artista, anno e numero di brani, e tracklist numerata con la durata dei brani.
- **Pagina Artista**: Lettura dell'id dalla query string, hero con nome dell'artista e genere, e lista dei brani più popolari.
- **Player**: Barra di riproduzione fissa in basso con le anteprime audio dei brani, comandi di riproduzione, barra di avanzamento e volume.
- **Preferiti**: Possibilità di aggiungere e rimuovere brani e album dai preferiti, con stato salvato in `localStorage`.

<!-- Da completare: aggiungere o correggere le funzionalità quando il JS è pronto -->

## Tecnologie Utilizzate

- **HTML5**: Strutturazione semantica delle pagine.
- **CSS3 moderno**: Custom properties, nesting nativo, `grid-template-areas`, container queries, `color-mix()` e media query con range syntax.
- **Bootstrap 5.3.8**: Tema scuro (`data-bs-theme="dark"`), reboot, utility di layout, bottoni, campo di ricerca e visibilità responsive.
- **JavaScript (ES6+)**: Chiamate `fetch` asincrone, manipolazione del DOM, gestione del player e del `localStorage`.
- **iTunes Search API**: Fonte dei dati di brani, album, artisti, copertine e anteprime audio.

## Come Eseguire il Progetto Locale

1. **Clona il repository**:
   ```bash
   git clone <!-- inserire link del repository -->
   ```

2. **Apri l'applicazione**:
   Apri il file `index.html` direttamente nel tuo browser preferito oppure utilizza un'estensione come **Live Server** su VS Code.

---

## Struttura del progetto

```text
.
├── assets/
│   ├── css/
│   │   └── app.css        stile personalizzato, variabili CSS e layout a 3 zone
│   └── js/
│       ├── common.js      sidebar e player condivisi da tutte le pagine
│       ├── home.js        sezioni dinamiche della home
│       ├── search.js      ricerca e rendering dei risultati
│       ├── album.js       dettaglio album e tracklist
│       └── artist.js      dettaglio artista e brani popolari
├── index.html             home
├── search.html            pagina di ricerca
├── album.html             pagina di dettaglio album
├── artist.html            pagina di dettaglio artista
└── README.md              documentazione del progetto
```

---

## Architettura, Responsive Design e Media Query

L'architettura del progetto è **multi-pagina**: ogni pagina (`index.html`, `search.html`, `album.html`, `artist.html`) condivide la stessa struttura a 3 zone, gestita in `app.css` con CSS Grid e `grid-template-areas`:

- **Sidebar** a sinistra con la navigazione.
- **Main** al centro con la topbar sticky e il contenuto della pagina.
- **Player** fisso in basso su tutta la larghezza.

Il layout si adatta allo schermo sfruttando i breakpoint di Bootstrap:

- **Mobile (<576px)**: Sidebar nascosta (classi `d-none d-sm-block`), layout a una colonna, player su 2 colonne senza il controllo del volume.
- **Tablet (576px - 767px)**: Sidebar ridotta a 80px con le sole icone.
- **Desktop (≥768px)**: Sidebar completa da 240px con titoli e playlist.

Oltre alle media query, il main è un **container** (`container: main / inline-size`): hero e card si adattano alla larghezza del main e non a quella della finestra.

- **Main < 720px**: Hero di album e artista in colonna, copertina ridotta a 160px.
- **Main < 540px**: Card della griglia con larghezza minima di 140px invece di 180px.

---

## Albero del dom

Struttura comune a tutte le pagine:

* **Contenitore (`<div class="app">`)**: Griglia a 3 zone che contiene tutta l'interfaccia.
  * **Sidebar (`<aside class="sidebar">`)**:
    * Vuota nell'HTML, popolata via JS da `common.js` con brand, navigazione e playlist.
  * **Contenuto (`<main class="main">`)**:
    * **Topbar (`<header class="topbar">`)**: Bottoni `.nav-btn` Indietro/Avanti e pill utente.
    * **Sezione della pagina**: Cambia in base alla pagina (vedi sotto).
  * **Player (`<footer class="player">`)**:
    * Vuoto nell'HTML, popolato via JS da `common.js` con brano corrente, comandi, avanzamento e volume.
* **Audio (`<audio id="audio-element">`)**: Elemento che riproduce le anteprime dei brani.

Sezioni delle singole pagine:

* **Home (`<section class="home">`)**:
  * Sezioni `.music-row` generate via JS, ognuna con titolo `h2` e griglia `.grid` di card.
* **Ricerca (`<section class="search">`)**:
  * Campo di ricerca `#search-input`.
  * Tre sezioni nascoste di default (`#row-tracks`, `#row-albums`, `#row-artists`) con le griglie `#grid-tracks`, `#grid-albums`, `#grid-artists`.
* **Album (`<section class="album-page">`)**:
  * `#album-hero`: Copertina e dati dell'album.
  * `#tracklist`: Lista dei brani.
* **Artista (`<section class="artist-page">`)**:
  * `#artist-hero`: Nome e dati dell'artista.
  * `#top-tracks`: Lista dei brani popolari.

---

## Come funziona

<!-- Da completare con funzioni, variabili ed eventi reali quando il JS è pronto -->

1. **Elementi condivisi (`common.js`)**: Genera sidebar e player in tutte le pagine e gestisce la riproduzione tramite `#audio-element`.
2. **Home (`home.js`)**: Legge recenti e preferiti dal `localStorage`, recupera i suggerimenti per genere dall'API e genera le sezioni `.music-row` con le card.
3. **Ricerca (`search.js`)**:
   - Ascolta l'evento `input` su `#search-input` con un debounce di 400ms.
   - Esegue tre chiamate `fetch` all'API di iTunes (brani, album, artisti) con `Promise.all`.
   - Mostra le sezioni con i risultati e salva l'ultima query nel `localStorage`.
   - Il click su un brano lo avvia nel player; il click su album o artista apre `album.html?id=...` o `artist.html?id=...`.
4. **Album (`album.js`)**: Legge l'id con `URLSearchParams`, chiama `lookup?id=...&entity=song` e usa il primo risultato per l'hero e gli altri per la tracklist.
5. **Artista (`artist.js`)**: Legge l'id con `URLSearchParams`, chiama `lookup?id=...&entity=song&limit=10` e usa il primo risultato per l'hero e gli altri per i brani popolari.

---

## Aspetto grafico

L'applicazione riprende l'aspetto di Spotify, con un tema scuro e un layout a 3 zone che resta uguale in tutte le pagine. La palette si basa su sfondi neri e grigi molto scuri (`#121212` per lo sfondo, `#181818` per card e player, `#000000` per la sidebar), testo bianco (`#ffffff`) e grigio chiaro (`#b3b3b3`) per le informazioni secondarie. Il verde (`#1ed760`) è riservato ai pulsanti di riproduzione e al brano in ascolto, il rosso (`#e25555`) ai preferiti e il giallo Epicode (`#f7d800`) al marchio. Le card si schiariscono al passaggio del mouse e mostrano il pulsante play con una breve animazione, mentre la topbar resta fissa in alto con uno sfondo semitrasparente sfocato. Il font è quello di sistema, con titoli molto marcati nelle pagine di album e artista.

---

## Extra e dettagli

<!-- Inserire SOLO le aggiunte fatte di propria iniziativa, non quanto richiesto dalla traccia -->

- **Nome extra** Descrizione. Gestito da js / css.

---

## Convenzioni di codice

- **camelCase** per variabili, funzioni e metodi: searchInput, renderAlbum(), formatTime().
- **PascalCase** per le classi: Album, Track, Player.
- **UPPER_SNAKE_CASE** solo per le costanti "vere", cioè valori fissi di configurazione noti prima di eseguire il codice: API_URL, DEBOUNCE_MS = 400, STORAGE_KEY_FAVOURITES.
- **const** di default, let solo se la variabile viene riassegnata, mai var e niente innerHtml.
- **Talking Names lol** in lingua inglese
- **Doppi apici**
- **commenti ove possibile**

---

## Aggiornamenti

| Versione | Descrizione |
| :--- | :--- |
| **ver. 0.0** | Commit iniziale e impostazione del progetto |


---

## Realizzato da

| Persona | Ruolo |
| :--- | :--- |
| Lisa Irene Sciacca | Team leader, README, Layout |
| Kledjan Leisci | Gestore Git e LiveShare, Layout |
| Matteo Brucculeri | Responsabile API, JavaScript |
| Mattia Pirró | JavaScript, Testing/QA |
| Giuseppe Cascini | JavaScript, Testing/QA |
