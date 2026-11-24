# EPITUNES - Web app musicale

Questa repository contiene il codice sorgente di **EpiTunes**, una web app musicale ispirata a Spotify e realizzata come progetto di gruppo per il corso di sviluppo web front-end di Epicode. L'applicazione permette di esplorare brani, album e artisti tramite l'API di iTunes, ascoltare le anteprime dei brani e salvare i propri preferiti.

---

> **Stato del progetto:** layout, tema grafico e struttura HTML completati; logica JavaScript in corso (work in progress). Questo file viene aggiornato a mano a mano che il progetto viene realizzato.

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

L'applicazione offre un'interfaccia in stile Spotify, strutturata con Bootstrap 5 e CSS moderno e resa dinamica con JavaScript nativo.

**Funzionanti**

- **Layout a 3 zone**: Sidebar, main e player condivisi dalle quattro pagine (`index.html`, `search.html`, `album.html`, `artist.html`), costruiti con CSS Grid e `grid-template-areas`.
- **Sidebar e player statici**: Scritti direttamente nell'HTML di ogni pagina, con link attivo evidenziato e id già pronti per essere collegati al JavaScript.
 - **Topbar**: Barra sticky con le frecce Indietro/Avanti, il pulsante `#btn-new-user` e la pill utente. <!-- New user wip -->
- **Responsive Design**: Sidebar ridotta alle sole icone su tablet e nascosta su mobile, player su due colonne su schermi piccoli, hero e card che si adattano alla larghezza del main.
- **Tema vintage**: Stile giradischi con legno, ottone e avorio, font art déco e icone SVG personalizzate.

**Work in progress**

- **Home personalizzata** *(WIP)*: Sezioni generate dinamicamente con i brani riprodotti di recente e i preferiti (salvati in `localStorage`) e con suggerimenti per genere.
- **Ricerca** *(WIP)*: Campo di ricerca con debounce di 400ms che interroga l'API di iTunes e mostra i risultati divisi in tre sezioni (brani, album, artisti) tramite `Promise.all`. L'ultima ricerca viene salvata in `localStorage` e ripresa al caricamento della pagina.
- **Pagina Album** *(WIP)*: Lettura dell'id dalla query string con `URLSearchParams`, hero con copertina, titolo, artista, anno e numero di brani, e tracklist numerata con la durata dei brani.
- **Pagina Artista** *(WIP)*: Lettura dell'id dalla query string, hero con nome dell'artista e genere, e lista dei brani più popolari.
- **Riproduzione** *(WIP)*: Anteprime audio dei brani con comandi di riproduzione, barra di avanzamento e volume.
- **Preferiti in sidebar** *(WIP)*: Lista `#sidebar-favourites` aggiornata con i brani preferiti salvati in `localStorage`.
- **Modale "New user"** *(WIP)*: Finestra aperta dal pulsante `#btn-new-user` per scegliere generi e artisti preferiti.

## Tecnologie Utilizzate

- **HTML5**: Strutturazione semantica delle pagine.
- **CSS3 moderno**: Custom properties, nesting nativo, `grid-template-areas`, container queries, `color-mix()` e media query con range syntax.
- **Bootstrap 5.3.8**: Tema scuro (`data-bs-theme="dark"`), reboot, utility di layout, bottoni, campo di ricerca e visibilità responsive.
- **Google Fonts**: Italiana per logo e titoli, Libre Baskerville per il testo.
- **Icone SVG**: Set di icone personalizzate raccolte in uno sprite all'inizio di ogni pagina.
- **JavaScript (ES6+)**: Moduli ES (`import`/`export`), chiamate `fetch` asincrone, classi OOP, manipolazione del DOM, gestione del player e del `localStorage`.
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
│   │   └── app.css        stile personalizzato, tema vintage, variabili CSS e layout a 3 zone
│   └── js/
│       ├── helper.js      funzioni di utilità: el, $, debounce, fetch e cronologia
│       ├── common.js      classi modello, classe Player e funzioni di localStorage
│       ├── home.js        sezioni dinamiche della home (WIP)
│       ├── search.js      ricerca e rendering dei risultati (WIP)
│       ├── album.js       dettaglio album e tracklist (WIP)
│       └── artist.js      dettaglio artista e brani popolari (WIP)
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

Sidebar e player sono **statici**: sono scritti direttamente nell'HTML di ogni pagina. L'unica parte dinamica prevista nella sidebar è la lista dei preferiti (`#sidebar-favourites`).

Il layout si adatta allo schermo sfruttando i breakpoint di Bootstrap:

- **Mobile (<576px)**: Sidebar nascosta (classi `d-none d-sm-block`), layout a una colonna, player su 2 colonne senza il controllo del volume.
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
    * **Topbar (`<header class="topbar">`)**: Bottoni `.nav-btn` Indietro/Avanti, pulsante `#btn-new-user` (per ora solo in `index.html`) e pill utente.
    * **Sezione della pagina**: Cambia in base alla pagina (vedi sotto).
  * **Player (`<footer class="player">`)**:
    * `.player-track`: Copertina `#player-cover`, titolo `#player-title` e artista `#player-artist`.
    * `.player-center`: Comandi `#btn-shuffle`, `#btn-prev`, `#btn-play`, `#btn-next`, `#btn-repeat` e barra di avanzamento (`#time-current`, `#progress-bar`, `#progress-fill`, `#time-total`).
    * `.player-right`: Icona del volume e barra `#volume-bar` / `#volume-fill`.
* **Modale "New user"**: Contenitore della modale, per ora solo in `index.html` *(WIP)*.
* **Audio (`<audio id="audio-element">`)**: Elemento che riproduce le anteprime dei brani.

Sezioni delle singole pagine:

* **Home (`<section class="home">`)**:
  * Sezioni `<article class="row">` con titolo `h2` e griglia `.grid` di card. Ogni `.card` contiene `.card-image-wrap` (copertina), `.card-title` (titolo) e `.card-sub` (artista).
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

Il codice JavaScript è organizzato in **moduli ES**. Al momento sono pronte le funzioni di base, mentre la costruzione delle pagine è in corso.

1. **Funzioni di utilità (`helper.js`)**:
   - `el()` crea un elemento con `createElement`, assegnandogli classi, id, testo, attributi, stile e figli; `$()` è una scorciatoia di `querySelector`.
   - `debounce()` ritarda l'esecuzione di una funzione finché l'utente non smette di scrivere.
   - `fetchItem()`, `fetchByGenre()` e `fetchModular()` interrogano l'API di iTunes; `fetchByGenre()` usa `attribute=genreIndex` per cercare per genere invece che per titolo.
   - `historyLog()`, `historyDump()` e `historyClear()` salvano, leggono e cancellano la cronologia nel `localStorage`.
2. **Funzioni comuni (`common.js`)**:
   - `fetchJSON()` esegue una richiesta e, in caso di errore, restituisce un risultato vuoto invece di bloccare la pagina.
   - `bigArt()` trasforma la copertina 100x100 dell'API in una 600x600; `formatTime()` converte i millisecondi in `m:ss`.
   - Le classi `Track`, `Album` e `Artist` modellano i dati ricevuti dall'API.
   - La classe `Player` gestisce l'elemento `<audio>`: riproduzione, pausa, avanzamento, volume e aggiornamento dell'icona play/pausa *(collegamento al player statico in corso)*.
   - `getHistory()` e `addToHistory()` gestiscono la cronologia degli ascolti (massimo 12 brani, senza duplicati); `getFavourites()`, `isFavourite()` e `toggleFavourite()` gestiscono i preferiti.
3. **Pagine (`home.js`, `search.js`, `album.js`, `artist.js`)**: *Work in progress.*

---

## Aspetto grafico

L'applicazione ha un tema **vintage ispirato ai giradischi**, con un layout a 3 zone che resta uguale in tutte le pagine. La palette si basa sui toni del legno: marrone quasi nero per lo sfondo (`#1e1410`), marrone scuro per card e tracklist (`#2b1d15`), sidebar in noce scuro liscio e player in legno di noce con le venature orizzontali, separato dal resto da un profilo in ottone. L'ottone (`#c9a227`) è il colore d'accento di link attivi, bordi, pulsanti play e brano in riproduzione; l'avorio (`#f3e6c8`) è usato per il testo principale e il beige (`#bfa98a`) per le informazioni secondarie, mentre il rosso mattone (`#b5432f`) è riservato ai preferiti. Il logo e i titoli usano il font art déco **Italiana**, il testo il serif **Libre Baskerville**. Le icone sono disegnate a linea sottile con estremità arrotondate, le copertine hanno una leggera tinta seppia e, nella pagina artista, la foto prende la forma di un vinile. Le card si sollevano leggermente al passaggio del mouse.

---

## Extra e dettagli

- **Bootstrap 5.3.8 e CSS moderno** Il layout è stato rifatto con Bootstrap e CSS moderno (nesting nativo, container queries, `color-mix()`), mantenendo gli stessi nomi di classe usati dal JavaScript. Gestito da css.
- **Tema vintage giradischi** Palette legno, ottone e avorio, venature del legno nel player, copertine con tinta seppia e foto dell'artista a forma di vinile. Gestito da css.
- **Font art déco** Italiana per logo e titoli, Libre Baskerville per il testo. Gestito da css.
- **Icone SVG personalizzate** Icone a linea sottile in uno sprite SVG, colorate con il colore del testo. Gestite da html e css.
- **Logo a disco** Il logo è un piccolo vinile con l'etichetta in ottone. Gestito da css.
- **Sidebar e player statici** Sidebar e player sono scritti direttamente nell'HTML invece di essere generati dal JavaScript. Gestiti da html.

---

## Convenzioni di codice

- **camelCase** per variabili, funzioni e metodi: searchInput, renderAlbum(), formatTime().
- **PascalCase** per le classi: Album, Track, Player.
- **UPPER_SNAKE_CASE** solo per le costanti "vere", cioè valori fissi di configurazione noti prima di eseguire il codice: API_URL, DEBOUNCE_MS = 400, STORAGE_KEY_FAVOURITES.
- **const** di default, let solo se la variabile viene riassegnata, mai var e niente `innerHTML`.
- **Nomi descrittivi e doppi apici in JS** in lingua inglese e commentato ove possibile.


---

## Aggiornamenti

| Versione | Descrizione |
| :--- | :--- |
| **ver. 0.0** | Commit iniziale e impostazione del progetto |
| **ver. 1.0** | **HTML:** aggiunto Bootstrap 5.3.8 (solo CSS) in tutte le pagine, sprite di icone SVG, sidebar e player scritti direttamente nell'HTML e topbar con il pulsante "+ New user" |
| **ver. 1.0** | **CSS:** tema vintage da giradischi con palette legno, ottone e avorio, font Italiana e Libre Baskerville, logo a vinile animato, pulsanti play in ottone, foto artista a forma di vinile e copertine con tinta seppia |
| **ver. 1.0** | **JavaScript:** nuove funzioni in helper.js (fetchModular, cronologia e preferiti), classi Track, Album, Artist e Player in common.js, righe di suggerimenti in home.js, ricerca con debounce in search.js e hero dell'album in album.js |

---

## Realizzato da

| Persona | Ruolo |
| :--- | :--- |
| Lisa Irene Sciacca | Team leader, README, Layout |
| Kledjan Lleshi | Gestore Git e LiveShare, Layout |
| Matteo Brucculeri | Responsabile API, JavaScript |
| Mattia Pirró | JavaScript, Testing/QA |
| Giuseppe Cascini | JavaScript, Testing/QA |