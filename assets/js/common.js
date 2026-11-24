/* ============================================================
   common.js — codice condiviso tra tutte le pagine
   ============================================================

   REGOLE GENERALI
   - Solo const e let (mai var)
   - DOM: querySelector / querySelectorAll
   - Eventi: addEventListener (mai onclick inline)
   - fetch + async/await + try/catch
   - localStorage: setItem / getItem / removeItem (salva sempre stringhe)
   - Pattern OOP: classi Track, Album, Artist, Player

   COSA CONTIENE QUESTO FILE
   1) Costanti (URL base API, chiavi localStorage)
   2) Helpers (fetchJSON, formatTime, bigArt, debounce)
   3) Classi modello: Track, Album, Artist
   4) Classe Player (gestisce <audio>)
   5) localStorage helpers (history, favourites)
   6) Render sidebar e player footer
   7) Inizializzazione al DOMContentLoaded

   ESEMPIO USO DELL'ELEMENTO <audio>
   --------------------------------
     const audio = document.querySelector("#audio-element");
     audio.src = "https://...preview.m4a"; // URL della preview MP3
     audio.play();                         // avvia la riproduzione
     audio.pause();                        // mette in pausa
     audio.currentTime = 10;               // salta a 10 secondi
     audio.duration;                       // durata in secondi
     audio.volume = 0.5;                   // volume tra 0 e 1

     audio.addEventListener("timeupdate", () => {
       // chiamato continuamente durante la riproduzione
       const percent = (audio.currentTime / audio.duration) * 100;
     });

     audio.addEventListener("ended", () => {
       // brano finito
     });

   ESEMPIO USO DELL'API iTunes
   ---------------------------
     // Ricerca brani
     fetch("https://itunes.apple.com/search?term=eminem&entity=song&limit=10")

     // Ricerca album
     fetch("https://itunes.apple.com/search?term=pink+floyd&entity=album&limit=10")

     // Ricerca artisti
     fetch("https://itunes.apple.com/search?term=jovanotti&entity=musicArtist&limit=5")

     // Dettagli album (con tracce)
     fetch("https://itunes.apple.com/lookup?id=1440831203&entity=song")

     // Top tracks artista
     fetch("https://itunes.apple.com/lookup?id=909253&entity=song&limit=10")
*/

/* ============================ 1. Costanti ============================ */



/* ============================ 2. Helpers ============================ */
import { $, el, historyClear, historyDump, historyLog, getFavourites } from "./helper.js"
const historyArray = [];

/*

  bigArt(url)
  - L'API iTunes ritorna artwork 100x100 (artworkUrl100)
  - Sostituisce "100x100bb" con "600x600bb" per avere una cover più grande
*/
export const bigArt = (url) => {
  if (!url) return "";
  return url.replace("100x100", "600x600");
};

/*
  formatTime(ms)
  - Converte millisecondi in stringa "m:ss"
  - Esempio: 65000 -> "1:05"
*/
export const formatTime = (ms) => {
  if (!ms) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
};

/*
  debounce(fn, ms)
  - Restituisce una nuova funzione che chiama fn solo dopo "ms" millisecondi
    di pausa rispetto all'ultima chiamata. Usata per la ricerca al type.
*/
const debounce = (fn, ms) => {
  let timerId = null;
  return (...args) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn(...args), ms);
  };
};

/* ============================ 3. Classi modello ============================ */

/*
  Classe Track
  Modella un brano restituito dall'API iTunes (wrapperType === "track").
  Campi utili dell'API: trackId, trackName, artistName, collectionName,
  collectionId, artistId, artworkUrl100, previewUrl, trackTimeMillis.
*/
class Track {
  constructor(_trackId, _trackName, _artistName, _collectionName,
    _collectionId, _artistId, _artworkUrl100, _previewUrl, _trackTimeMillis, _primaryGenreName) {
    // TODO: assegna alle property di this i valori da raw
    // (id, title, artist, album, albumId, artistId, cover, previewUrl, durationMs)
    this.trackId = _trackId;
    this.trackName = _trackName;
    this.artistName = _artistName;
    this.collectionName = _collectionName;
    this.collectionId = _collectionId;
    this.artistId = _artistId;
    this.artworkUrl100 = _artworkUrl100;
    this.previewUrl = _previewUrl;
    this.trackTimeMillis = _trackTimeMillis;
    this.primaryGenreName = _primaryGenreName;
  }
}

/*
  Classe Album
  Modella un album (wrapperType === "collection").
  Campi utili: collectionId, collectionName, artistName, artworkUrl100,
  releaseDate, trackCount.
*/
class Album {
  constructor(_wrapperType, _collectionId, _collectionName, _artistName, _artworkUrl100,
    _releaseDate, _trackCount, _primaryGenreName) {
    this.wrapperType = _wrapperType;
    this.collectionId = _collectionId;
    this.collectionName = _collectionName;
    this.artistName = _artistName;
    this.artworkUrl100 = _artworkUrl100;
    this.releaseDate = _releaseDate;
    this.trackCount = _trackCount;
    this.primaryGenreName = _primaryGenreName;
  }
}

/*
  Classe Artist
  Modella un artista (wrapperType === "artist").
  Campi utili: artistId, artistName, primaryGenreName.
*/
class Artist {
  constructor(_wrapperType, _artistId, _artistName, _primaryGenreName) {
    this.wrapperType = _wrapperType;
    this.artistId = _artistId;
    this.artistName = _artistName;
    this.primaryGenreName = _primaryGenreName;
  }
}

/* ============================ 4. Classe Player ============================ */

/*
  Classe Player
  Gestisce la riproduzione audio e la UI del player footer.

  Stato interno:
    - currentTrack: Track corrente (null se nessun brano)
    - isPlaying: true/false

  Metodi pubblici:
    - mount()        -> rende la UI del player nel footer (.player)
    - play(track)    -> imposta currentTrack, src audio, avvia, salva in history
    - togglePlay()   -> alterna play/pause sul brano corrente
    - setVolume(v)   -> v tra 0 e 1
    - seek(percent)  -> sposta currentTime a percent% della durata

  Eventi audio da agganciare:
    - "timeupdate" per aggiornare la progress bar
    - "ended" per fermarsi a fine brano
*/

/*
  icon(name)
  - Crea un'icona SVG dello sprite: <svg class="icon"><use href="#ico-name"></use></svg>
  - Gli elementi SVG vanno creati con createElementNS (createElement e el() non funzionano)
  - Lo sprite con i <symbol id="ico-..."> deve essere presente all'inizio del <body>
*/
const SVG_NS = "http://www.w3.org/2000/svg";

const icon = (name) => {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "icon");
  const use = document.createElementNS(SVG_NS, "use");
  use.setAttribute("href", `#ico-${name}`);
  svg.append(use);
  return svg;
};

class Player {
  constructor() {
    this.audio = $("#audio-element");
    this.currentTrack = null;
    this.isPlaying = false;
    this.ui = null; // i riferimenti agli elementi vengono salvati in mount()

    // Gli elementi del footer non esistono ancora (li crea mount()),
    // quindi qui agganciamo solo gli eventi dell'audio, che esiste già.
    this.audio.addEventListener("timeupdate", () => this.updateProgress());
    this.audio.addEventListener("loadedmetadata", () => {
      if (this.ui) this.ui.timeTotal.textContent = this.formatTime(this.audio.duration);
    });
    this.audio.addEventListener("play", () => this.setPlayingState(true));
    this.audio.addEventListener("pause", () => this.setPlayingState(false));
    this.audio.addEventListener("ended", () => {
      this.setPlayingState(false);
      this.audio.currentTime = 0;
      this.updateProgress();
    });
  }

  mount() {
    const footer = document.querySelector(".player");
    if (!footer) return;

    // --- Colonna sinistra: traccia corrente ---
    const coverImg = el("img", { id: "player-cover-img", attrs: { alt: "" } });

    const playerTrack = el("div", { className: "player-track" },
      el("div", { className: "player-cover", id: "player-cover" }, coverImg),
      el("div", { className: "player-meta" },
        el("p", { className: "player-title", id: "player-title", text: "Seleziona un brano" }),
        el("p", { className: "player-artist", id: "player-artist", text: "—" })
      )
    );

    // --- Colonna centrale: controlli + progress ---
    // I pulsanti secondari usano le icone SVG dello sprite (stile del tema vintage)
    const ctrlButton = (id, label, iconName) =>
      el("button", { className: "btn-ctrl", id, attrs: { type: "button", "aria-label": label } },
        icon(iconName)
      );

    const playerControls = el("div", { className: "player-controls" },
      ctrlButton("btn-shuffle", "Riproduzione casuale", "shuffle"),
      ctrlButton("btn-prev", "Brano precedente", "prev"),
      // Il play resta testuale: setPlayingState() alterna ▶ e ⏸ con textContent
      el("button", { className: "btn-play", id: "btn-play", text: "▶", attrs: { type: "button", "aria-label": "Riproduci" } }),
      ctrlButton("btn-next", "Brano successivo", "next"),
      ctrlButton("btn-repeat", "Ripeti", "repeat")
    );

    const playerProgress = el("div", { className: "player-progress" },
      el("span", { id: "time-current", text: "0:00" }),
      el("div", { className: "progress-bar", id: "progress-bar" },
        el("div", { className: "progress-fill", id: "progress-fill" })
      ),
      el("span", { id: "time-total", text: "0:00" })
    );

    const playerCenter = el("div", { className: "player-center" },
      playerControls,
      playerProgress
    );

    // --- Colonna destra: volume ---
    const playerRight = el("div", { className: "player-right" },
      el("span", { className: "volume-ico", attrs: { "aria-hidden": "true" } }, icon("volume")),
      el("div", { className: "volume-bar", id: "volume-bar" },
        el("div", { className: "volume-fill", id: "volume-fill", style: { width: "80%" } })
      )
    );

    // --- Montaggio finale ---
    // replaceChildren sostituisce l'eventuale contenuto statico del footer: il player non si duplica
    footer.replaceChildren(playerTrack, playerCenter, playerRight);

    // --- Riferimenti agli elementi ---
    this.ui = {
      cover: coverImg,
      title: footer.querySelector("#player-title"),
      artist: footer.querySelector("#player-artist"),
      btnToggle: footer.querySelector("#btn-play"),
      progressBar: footer.querySelector("#progress-bar"),
      progressFill: footer.querySelector("#progress-fill"),
      timeCurrent: footer.querySelector("#time-current"),
      timeTotal: footer.querySelector("#time-total"),
      volumeBar: footer.querySelector("#volume-bar"),
      volumeFill: footer.querySelector("#volume-fill"),
    };

    // --- Eventi ---
    this.ui.btnToggle.addEventListener("click", () => this.togglePlay());

    this.ui.progressBar.addEventListener("click", (e) => {
      const rect = this.ui.progressBar.getBoundingClientRect();
      this.seek((e.clientX - rect.left) / rect.width);
    });

    this.ui.volumeBar.addEventListener("click", (e) => {
      const rect = this.ui.volumeBar.getBoundingClientRect();
      this.setVolume((e.clientX - rect.left) / rect.width);
    });

    this.setVolume(0.8);
  }

  play(track) {
    historyLog(historyDump(), track);
    this.currentTrack = track;
    this.audio.src = track.previewUrl;
    this.audio.play().catch((err) => {
      // AbortError capita se cambi brano mentre il precedente sta ancora caricando
      if (err.name !== "AbortError") console.error("Errore di riproduzione:", err);
    });

    // Aggiorna UI
    if (this.ui) {
      // artworkUrl100 -> versione più grande per il player
      this.ui.cover.src = (track.artworkUrl100 || "").replace("100x100", "300x300");
      this.ui.title.textContent = track.trackName ?? "Titolo brano";
      this.ui.artist.textContent = track.artistName ?? "—";
      this.ui.timeTotal.textContent = "0:00"; // si aggiorna su loadedmetadata
      this.ui.progressFill.style.width = "0%";
    }

    // Evidenzia la riga nella tracklist
    $(".track-row.is-playing")?.classList.remove("is-playing");
    $(`.track-row[data-track-id="${track.trackId}"]`)?.classList.add("is-playing");
  }

  togglePlay() {
    if (!this.audio.src) return; // nessun brano selezionato
    if (this.audio.paused) {
      this.audio.play().catch(console.error);
    } else {
      this.audio.pause();
    }
    // l'icona viene aggiornata dagli eventi "play"/"pause" in setPlayingState()
  }

  setVolume(v) {
    v = Math.min(1, Math.max(0, v));
    this.audio.volume = v;
    if (this.ui) this.ui.volumeFill.style.width = `${v * 100}%`;
  }

  seek(percent) {
    if (!this.audio.duration) return;
    percent = Math.min(1, Math.max(0, percent));
    this.audio.currentTime = this.audio.duration * percent;
  }

  // --- Metodi di supporto ---

  setPlayingState(playing) {
    this.isPlaying = playing;
    if (this.ui) {
      this.ui.btnToggle.textContent = playing ? "⏸" : "▶";
      this.ui.btnToggle.setAttribute("aria-label", playing ? "Pausa" : "Riproduci");
    }
  }

  updateProgress() {
    if (!this.ui || !this.audio.duration) return;
    const percent = (this.audio.currentTime / this.audio.duration) * 100;
    this.ui.progressFill.style.width = `${percent}%`;
    this.ui.timeCurrent.textContent = this.formatTime(this.audio.currentTime);
  }

  formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }
}



/* ============================ 6. Render sidebar ============================ */


// TODO: popola #sidebar-favourites con i titoli dei preferiti
export const renderSidebarFavs = () => {
  const list = $("#sidebar-favourites");
  if (!list) return;

  const favs = getFavourites();

  if (!favs.length) {
    list.replaceChildren(el("li", { className: "fst-italic", text: "Nessuno ancora" }));
    return;
  }

  list.replaceChildren(...favs.map((track) => el("li", { text: `${track.trackName} - ${track.artistName}` })));
};


/* ============================ 7. Inizializzazione ============================ */

/*
  initPage(activePage)
  - Chiamata da home.js / search.js / album.js / artist.js
  - Monta sidebar, monta player, restituisce il player per essere usato.
*/
export const initPage = (activePage) => {
  const player = new Player();
  player.mount();
  renderSidebarFavs();
  window.player = player;
  return player;
};
