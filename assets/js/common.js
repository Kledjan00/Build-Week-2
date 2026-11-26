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

import { $, el, historyDump, historyLog, getFavourites, getPlaylist, setPlaylist, killPLaylist, removeTrackFromPlaylist, setCurrentTrackList, getCurrentTrackList } from "./helper.js"

/* ============================ 1. Costanti ============================ */

const STORAGE_KEY_PLAYER = "epitunes_player";

/* ============================ 2. Helpers ============================ */

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

/* ============================ Impostazioni ============================ */

/*
  Impostazioni salvate in localStorage (un solo oggetto):
  - contrast, largeText, reduceMotion: interruttori di accessibilitÃ (spenti di default)
  - explicit: contenuti espliciti visibili (acceso di default)
  applySettings() le traduce in classi su <html>: tutto il resto lo fa il CSS.
*/
const STORAGE_KEY_SETTINGS = "epitunes_settings";
const DEFAULT_SETTINGS = { contrast: false, largeText: false, reduceMotion: false, explicit: true };

// interruttore della modale collegato a ogni impostazione
const SETTING_SWITCHES = {
  contrast: "#setting-contrast",
  largeText: "#setting-large-text",
  reduceMotion: "#setting-reduce-motion",
  explicit: "#setting-explicit",
};

const getSettings = () => {
  try {
    // i valori salvati sostituiscono quelli di default (se manca qualcosa resta il default)
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS)) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
};

const applySettings = (settings) => {
  const root = document.documentElement; // <html>
  root.classList.toggle("a11y-contrast", settings.contrast);
  root.classList.toggle("a11y-large-text", settings.largeText);
  root.classList.toggle("a11y-reduce-motion", settings.reduceMotion);
  root.classList.toggle("hide-explicit", !settings.explicit);
};

const initSettings = () => {
  const settings = getSettings();
  applySettings(settings); // ad ogni pagina, appena caricata

  const modal = $("#settings-modal");
  if (!modal) return;

  // interruttori: mostrano lo stato salvato; quando cambiano salvano e applicano subito
  for (const [key, selector] of Object.entries(SETTING_SWITCHES)) {
    const input = $(selector);
    input.checked = settings[key];
    input.addEventListener("change", () => {
      settings[key] = input.checked;
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
      applySettings(settings);
    });
  }

  // apertura e chiusura, come le altre modali (la classe is-open la mostra, il CSS anima)
  const open = () => modal.classList.add("is-open");
  const close = () => modal.classList.remove("is-open");

  $("#btn-settings")?.addEventListener("click", open);
  $("#settings-close").addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close(); // click sullo sfondo scuro, fuori dal riquadro
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) close();
  });
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

/*
  Classe PlayList
  Campi utili: _trackList, _id, _title.
  
*/
class Playlist {
  constructor(_trackList = [], _id, _title) {
    this.trackList = _trackList
    this.id = _id
    this.title = _title
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
    - play(track, trackList) -> imposta currentTrack, src audio, avvia, salva in history;
                                se riceve trackList la usa per avanti/indietro
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
    this.isSeeking = false; // true mentre si trascina la barra di avanzamento
    this.repeat = false;    // true: a fine lista riparte dal primo brano
    this.ui = null; // i riferimenti agli elementi vengono salvati in mount()
    this.trackList = getCurrentTrackList() || [];

    this.audio.addEventListener("timeupdate", () => this.updateProgress());
    this.audio.addEventListener("loadedmetadata", () => {
      if (this.ui) this.ui.timeTotal.textContent = this.formatTime(this.audio.duration);
      this.updateProgress();
    });
    this.audio.addEventListener("play", () => this.setPlayingState(true));
    this.audio.addEventListener("pause", () => this.setPlayingState(false));
    // A fine brano parte il successivo; se era l'ultimo: con la ripetizione attiva
    // riparte dal primo, altrimenti il player si ferma e torna all'inizio
    this.audio.addEventListener("ended", () => {
      const i = this.currentIndex();
      if (i !== -1 && this.trackList[i + 1]) {
        this.next();
      } else if (this.repeat && this.trackList.length) {
        this.play(this.trackList[0]);
      } else {
        this.setPlayingState(false);
        this.audio.currentTime = 0;
        this.updateProgress();
      }
    });
    this.audio.addEventListener("timeupdate", () => this.saveState());
    this.audio.addEventListener("pause", () => this.saveState());
    window.addEventListener("pagehide", () => this.saveState());
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
        // il nome dell'artista è un link alla sua pagina (l'href lo imposta showArtist())
        el("p", { className: "player-artist", id: "player-artist" },
          el("a", { className: "artist-link", id: "player-artist-link", text: "—" })
        )
      )
    );

    // --- Colonna centrale: controlli + progress ---
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

    // --- Icone a linea per i tasti nascondi / espandi ---
    const lineIcon = (d) => {
      const svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("class", "icon");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("aria-hidden", "true");
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "currentColor");
      path.setAttribute("stroke-width", "2");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      svg.append(path);
      return svg;
    };

    // Freccia giù (in alto a destra): nasconde il player
    const btnClose = el("button", {
      className: "btn-ctrl btn-close-player",
      id: "btn-close-player",
      attrs: { type: "button", "aria-label": "Nascondi il player" },
    }, lineIcon("M6 9l6 6 6-6"));

    // Freccia su (linguetta al centro del bordo superiore): apre #expandPlayer
    const btnExpand = el("button", {
      className: "btn-expand-player",
      id: "btn-expand-player",
      attrs: { type: "button", "aria-label": "Espandi il player", "aria-haspopup": "dialog" },
    }, lineIcon("M6 15l6-6 6 6"));

    // --- Montaggio finale ---
    footer.replaceChildren(playerTrack, playerCenter, playerRight, btnClose, btnExpand);

    // --- Riferimenti agli elementi ---
    this.ui = {
      cover: coverImg,
      title: footer.querySelector("#player-title"),
      artist: footer.querySelector("#player-artist-link"),
      btnToggle: footer.querySelector("#btn-play"),
      btnRepeat: footer.querySelector("#btn-repeat"),
      progressBar: footer.querySelector("#progress-bar"),
      progressFill: footer.querySelector("#progress-fill"),
      timeCurrent: footer.querySelector("#time-current"),
      timeTotal: footer.querySelector("#time-total"),
      volumeBar: footer.querySelector("#volume-bar"),
      volumeFill: footer.querySelector("#volume-fill"),
    };

    // --- Eventi ---
    this.ui.btnToggle.addEventListener("click", () => this.togglePlay());
    footer.querySelector("#btn-prev").addEventListener("click", () => this.prev());
    footer.querySelector("#btn-next").addEventListener("click", () => this.next());
    footer.querySelector("#btn-shuffle").addEventListener("click", () => this.shuffle());

    // Ripeti: interruttore acceso/spento
    const btnRepeat = this.ui.btnRepeat;
    btnRepeat?.addEventListener("click", () => {
      this.repeat = !this.repeat;
      btnRepeat.classList.toggle("is-active", this.repeat);
      btnRepeat.setAttribute("aria-pressed", String(this.repeat));
      this.saveState();
    });

    btnClose.addEventListener("click", () => this.close());
    btnExpand.addEventListener("click", () => this.expand());

    // giradischi: si chiude con la freccia in alto a destra o con Esc
    const expandModal = $("#expandPlayer");
    $("#expand-close")?.addEventListener("click", () => expandModal.classList.remove("is-open"));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") expandModal?.classList.remove("is-open");
    });


    // Barra di avanzamento: mentre si trascina si sposta solo la barra (e il tempo),
    // il brano salta al punto scelto quando si lascia il mouse
    this.makeDraggable(
      this.ui.progressBar,
      (percent) => this.previewSeek(percent), // durante il trascinamento
      (percent) => {                          // al rilascio
        this.seek(percent);
        this.isSeeking = false;
      },
      () => { this.isSeeking = true; }        // all'inizio
    );

    // Barra del volume: il volume cambia subito mentre si trascina
    this.makeDraggable(this.ui.volumeBar, (percent) => this.setVolume(percent));

    this.setVolume(0.5);
    this.restoreState();
  }

  /*
    setTrackList(trackList)
    - Imposta la lista su cui lavorano avanti/indietro (e il passaggio automatico a fine brano)
    - La salva in localStorage, così cambiando pagina avanti/indietro continuano a funzionare
  */
  setTrackList(trackList) {
    this.trackList = trackList;
    setCurrentTrackList(trackList);
  }

  // Vecchio nome di setTrackList: resta solo perché qualche pagina potrebbe ancora usarlo
  getTracklist(trackList) {
    this.setTrackList(trackList);
  }

  // indice del brano corrente nella trackList (-1 se non c'è)
  currentIndex() {
    if (!this.currentTrack) return -1;
    return this.trackList.findIndex((t) => t.trackId === this.currentTrack.trackId);
  }

  next() {
    const i = this.currentIndex();
    if (i === -1) return; // nessuna lista o brano fuori lista
    const track = this.trackList[i + 1] ?? (this.repeat ? this.trackList[0] : null);
    if (!track) return; // ultimo brano e ripetizione spenta
    this.play(track);
  }

  prev() {
    // se il brano è avanti più di 3 secondi, "indietro" lo fa ripartire dall'inizio
    if (this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
      return;
    }
    const i = this.currentIndex();
    const track = this.trackList[i - 1];
    if (i === -1 || !track) return; // nessuna lista, brano fuori lista o primo brano
    this.play(track);
  }

  // Casuale: un brano a caso della lista corrente (diverso da quello in riproduzione, se possibile)
  shuffle() {
    if (!this.trackList.length) return;
    const others = this.trackList.filter((t) => t.trackId !== this.currentTrack?.trackId);
    const pool = others.length ? others : this.trackList;
    const random = pool[Math.floor(Math.random() * pool.length)];
    this.play(random); // senza lista: avanti/indietro restano sulla stessa lista
  }

  /*
    play(track, trackList)
    - trackList (facoltativa): la lista da cui parte il brano (riga della home, album, preferiti...).
      Se c'è, diventa la lista di avanti/indietro.
  */
  play(track, trackList) {
    if (trackList) this.setTrackList(trackList);
    historyLog(historyDump(), track);
    this.currentTrack = track;
    this.audio.src = track.previewUrl;
    this.audio.play().catch((err) => {
      // AbortError capita se cambi brano mentre il precedente sta ancora caricando
      if (err.name !== "AbortError") console.error("Errore di riproduzione:", err);
    });

    // Aggiorna UI
    if (this.ui) {
      this.ui.cover.src = (track.artworkUrl100 || "").replace("100x100", "300x300");
      this.ui.title.textContent = track.trackName ?? "Titolo brano";
      this.ui.title.dataset.explicit = track.trackExplicitness === "explicit";
      this.showArtist(track);
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

  /*
    makeDraggable(bar, onMove, onEnd, onStart)
    - Rende una barra trascinabile con mouse e dito (eventi pointer)
    - onMove(percent): alla pressione e a ogni movimento, con la posizione da 0 a 1
    - onEnd(percent): quando si lascia (facoltativa)
    - onStart(): quando si preme (facoltativa)
  */
  makeDraggable(bar, onMove, onEnd, onStart) {
    let dragging = false;

    const percentFrom = (e) => {
      const rect = bar.getBoundingClientRect();
      return Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    };

    bar.addEventListener("pointerdown", (e) => {
      dragging = true;
      bar.classList.add("is-dragging");
      if (onStart) onStart();
      onMove(percentFrom(e));
      e.preventDefault();
    });

    window.addEventListener("pointermove", (e) => {
      if (dragging) onMove(percentFrom(e));
    });

    const stop = (e) => {
      if (!dragging) return;
      dragging = false;
      bar.classList.remove("is-dragging");
      if (onEnd) onEnd(percentFrom(e));
    };
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
  }

  // Durante il trascinamento: sposta la barra e aggiorna il tempo, senza toccare l'audio
  previewSeek(percent) {
    if (!this.ui || !this.audio.duration) return;
    this.ui.progressFill.style.width = `${percent * 100}%`;
    this.ui.timeCurrent.textContent = this.formatTime(this.audio.duration * percent);
  }

  updateProgress() {
    if (!this.ui || !this.audio.duration || this.isSeeking) return;
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

  /*
    showArtist(track)
    - Scrive il nome dell'artista nel player e lo collega alla sua pagina
    - Se il brano non ha artistId (o track è null), il nome resta testo senza link
  */
  showArtist(track) {
    if (!this.ui) return;
    const link = this.ui.artist;
    link.textContent = track?.artistName ?? "—";
    if (track?.artistId) {
      link.href = "artist.html?id=" + track.artistId;
    } else {
      link.removeAttribute("href");
    }
  }

  /*
    expand()
    - Apre il giradischi (#expandPlayer); se è già aperto lo chiude
  */
  expand() {
    const modal = $("#expandPlayer");
    if (!modal) return;

    if (modal.classList.contains("is-open")) {
      modal.classList.remove("is-open");
      return;
    }

    this.showExpandCover(this.currentTrack);
    modal.classList.toggle("is-playing", this.isPlaying);
    modal.classList.add("is-open");
  }

  // Copertina grande al centro del vinile
  showExpandCover(track) {
    const cover = $("#expand-cover");
    if (!cover) return;
    if (track?.artworkUrl100) {
      cover.src = bigArt(track.artworkUrl100);
    } else {
      cover.removeAttribute("src");
    }
  }

  /*
    close()
    - Fa uscire il player con l'animazione (.is-closing), poi ferma la musica e lo svuota
    - Cancella lo stato salvato, così cambiando pagina il player non ricompare
  */
  close() {
    $("#expandPlayer")?.classList.remove("is-open");
    const footer = document.querySelector(".player");
    if (!footer || footer.classList.contains("is-closing")) return; // evita doppi click

    footer.classList.add("is-closing");

    footer.addEventListener("animationend", () => {
      this.currentTrack = null;
      this.audio.pause();
      this.audio.removeAttribute("src");
      this.audio.load();
      localStorage.setItem(
        STORAGE_KEY_PLAYER,
        JSON.stringify({ repeat: Boolean(this.repeat) })
      );

      this.ui.cover.removeAttribute("src");
      this.ui.title.textContent = "Seleziona un brano";
      delete this.ui.title.dataset.explicit;
      this.showArtist(null);
      this.ui.progressFill.style.width = "0%";
      this.ui.timeCurrent.textContent = "0:00";
      this.ui.timeTotal.textContent = "0:00";
      $(".track-row.is-playing")?.classList.remove("is-playing");

      footer.classList.remove("is-closing");
    }, { once: true });
  }

  saveState() {
    let existing = {};
    try {
      existing = JSON.parse(localStorage.getItem(STORAGE_KEY_PLAYER)) || {};
    } catch {
      existing = {};
    }

    localStorage.setItem(
      STORAGE_KEY_PLAYER,
      JSON.stringify({
        ...existing,
        track: this.currentTrack ?? null,
        time: this.currentTrack ? this.audio.currentTime : 0,
        playing: this.currentTrack ? !this.audio.paused : false,
        repeat: Boolean(this.repeat),
      })
    );
  }

  restoreState() {
    let state;
    try {
      state = JSON.parse(localStorage.getItem(STORAGE_KEY_PLAYER));
    } catch {
      return;
    }

    if (typeof state?.repeat === "boolean") {
      this.repeat = state.repeat;
      const btnRepeat = this.ui?.btnRepeat;
      if (btnRepeat) {
        btnRepeat.classList.toggle("is-active", this.repeat);
        btnRepeat.setAttribute("aria-pressed", String(this.repeat));
      }
    }

    if (!state?.track) return;

    const { track, time, playing } = state;
    this.currentTrack = track;
    this.audio.src = track.previewUrl;
    this.audio.currentTime = time;

    if (this.ui) {
      this.ui.cover.src = (track.artworkUrl100 || "").replace("100x100", "300x300");
      this.ui.title.textContent = track.trackName ?? "Titolo brano";
      this.ui.title.dataset.explicit = track.trackExplicitness === "explicit";
      this.showArtist(track);
    }

    if (playing) this.audio.play().catch(() => { });
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

  // dal più recente al più vecchio, come vengono mostrati
  const ordered = [...favs].reverse();

  list.replaceChildren(
    ...ordered.slice(0, 5).map((track) => {
      const item = el("li", { text: `${track.trackName} - ${track.artistName}`, style: { cursor: "pointer" } });
      // la lista di avanti/indietro sono tutti i preferiti, nello stesso ordine della sidebar
      item.addEventListener("click", () => window.player.play(track, ordered));
      return item;
    })
  );
};

const initNavButtons = () => {
  $('button[aria-label="Indietro"]')?.addEventListener("click", () => history.back());
  $('button[aria-label="Avanti"]')?.addEventListener("click", () => history.forward());
};

export const artistLink = (name, id) => {
  const p = el("p", { className: "card-sub" });

  if (!id) {
    p.textContent = name ?? "—";
    return p;
  }

  const link = el("a", {
    className: "artist-link",
    text: name ?? "—",
    attrs: { href: "artist.html?id=" + id },
  });

  link.addEventListener("click", (e) => e.stopPropagation());

  p.append(link);
  return p;
};

/* ============================ 7. Inizializzazione ============================ */

/*
  initPage(activePage)
  - Chiamata da home.js / search.js / album.js / artist.js
  - Monta sidebar, monta player, restituisce il player per essere usato.
*/

function playListBuilder(tracks = [], title) {
  const id = self.crypto.randomUUID();
  return new Playlist(tracks, id, title);
}

const renderPlaylistDropdown = (playlist) => {
  const toggle = el("button", {
    className: "btn btn-sm btn-outline-light dropdown-toggle flex-grow-1 text-start",
    text: playlist.title,
    attrs: {
      type: "button",
      "data-bs-toggle": "dropdown",
      "data-bs-auto-close": "outside",
      "aria-expanded": "false",
    },
  });

  const list = el("ul", {
    className: "dropdown-menu dropdown-menu-dark w-100",
    id: `playlist-${playlist.id}`,
  });

  const deleteBtn = el("button", {
    className: "btn btn-sm btn-outline-danger ms-2",
    text: "X",
    attrs: {
      type: "button",
      "aria-label": `Elimina playlist ${playlist.title}`,
    },
  });


  return el(
    "div",
    {
      className: "dropdown d-flex align-items-center mb-1",
      attrs: { "data-playlist-id": playlist.id },
    },
    toggle,
    list
  );
};

// Chiude il menu dei brani di una playlist quando si clicca fuori da quella playlist.
// Il "true" finale fa partire il controllo PRIMA degli altri clic della pagina:
// così funziona anche sui pulsanti che usano stopPropagation (cuore, +, card...).
document.addEventListener(
  "click",
  (e) => {
    const openToggles = document.querySelectorAll("#sidebar-playlists .dropdown-toggle.show");
    openToggles.forEach((toggle) => {
      const playlistBox = toggle.closest(".dropdown"); // la riga della playlist: nome, menu e X
      if (!playlistBox.contains(e.target)) {
        bootstrap.Dropdown.getInstance(toggle)?.hide();
      }
    });
  },
  true
);

const emptyItem = () =>
  el(
    "li",
    {},
    el("span", {
      className: "dropdown-item-text fst-italic",
      text: "Nessun brano",
    }),
  );


export const renderSidebarPlaylists = () => {
  const sidebarContainer = $("#sidebar-playlists");
  if (!sidebarContainer) return;

  const playlists = getPlaylist() ?? [];
  sidebarContainer.replaceChildren();

  [...playlists].reverse().slice(0, 5).forEach((playlist) => {
    const dropdownList = renderPlaylistDropdown(playlist);
    const menu = dropdownList.querySelector(".dropdown-menu");


    const tracks = playlist.trackList;
    if (!tracks.length) menu.append(emptyItem());

    tracks.forEach((track) => {
      const playBtn = el("button", {
        className: "dropdown-item w-auto flex-grow-1 text-truncate",
        text: `${track.trackName} — ${track.artistName}`,
        attrs: { type: "button", "data-explicit": track.trackExplicitness === "explicit" },
      });
      // la lista di avanti/indietro è la playlist
      playBtn.addEventListener("click", () => window.player?.play(track, tracks));


      const li = el(
        "li",
        { className: "d-flex align-items-center" },
        playBtn,
      );


      menu.append(li);
    });

    sidebarContainer.appendChild(dropdownList);
  });
};

$("#btn-new-playlist")?.addEventListener("click", (e) => {
  e.stopPropagation();
  if ($(".playList-title-input")) return;

  const input = el("input", {
    className: "form-control form-control-sm playList-title-input",
    attrs: { type: "text", placeholder: "Titolo playlist", "aria-label": "Titolo playlist" },
  });

  $("#sidebar-playlists").append(input);
  input.focus();

  const closeInput = (ev) => {
    if (!input.isConnected) {
      document.removeEventListener("click", closeInput, true);
      return;
    }
    if (ev.target === input || $("#btn-new-playlist")?.contains(ev.target)) return;
    input.remove();
    document.removeEventListener("click", closeInput, true);
  };

  document.addEventListener("click", closeInput, true);

  input.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") {
      input.remove();
      document.removeEventListener("click", closeInput, true);
      return;
    }
    if (ev.key !== "Enter") return;

    const title = input.value.trim();
    document.removeEventListener("click", closeInput, true);
    if (!title) return input.remove();

    const playlist = playListBuilder([], title);
    setPlaylist(playlist);
    document.dispatchEvent(new Event("playlists:changed"));
  });
});

document.addEventListener("playlists:changed", () => {
  renderSidebarPlaylists();
});

export const initPage = (activePage) => {
  const player = new Player();
  player.mount();
  renderSidebarFavs();
  initNavButtons();
  renderSidebarPlaylists();
  window.player = player;
  initSettings();
  return player;
};