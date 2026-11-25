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

import { $, el, historyDump, historyLog, getFavourites, getPlaylist, setPlaylist, killPLaylist } from "./helper.js"

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
    this.isSeeking = false; // true mentre si trascina la barra di avanzamento
    this.ui = null; // i riferimenti agli elementi vengono salvati in mount()

    // Gli elementi del footer non esistono ancora (li crea mount()),
    // quindi qui agganciamo solo gli eventi dell'audio, che esiste già.
    this.audio.addEventListener("timeupdate", () => this.updateProgress());
    this.audio.addEventListener("loadedmetadata", () => {
      if (this.ui) this.ui.timeTotal.textContent = this.formatTime(this.audio.duration);
      this.updateProgress();
    });
    this.audio.addEventListener("play", () => this.setPlayingState(true));
    this.audio.addEventListener("pause", () => this.setPlayingState(false));
    this.audio.addEventListener("ended", () => {
      this.setPlayingState(false);
      this.audio.currentTime = 0;
      this.updateProgress();
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

    // --- Icone a linea per i tasti nascondi / espandi ---
    // Disegnate qui con una linea SVG, così non serve aggiungere icone allo sprite in ogni pagina.
    // d = il percorso della linea (coordinate in un quadrato 24x24)
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
    }, lineIcon("M6 9l6 6 6-6")); // "V": da sinistra scende al centro e risale a destra

    // Freccia su (linguetta al centro del bordo superiore): aprirà la modale #expandPlayer
    const btnExpand = el("button", {
      className: "btn-expand-player",
      id: "btn-expand-player",
      attrs: { type: "button", "aria-label": "Espandi il player", "aria-haspopup": "dialog" },
    }, lineIcon("M6 15l6-6 6 6")); // "V" capovolta: sale al centro e riscende

    // --- Montaggio finale ---
    // replaceChildren sostituisce l'eventuale contenuto statico del footer: il player non si duplica
    footer.replaceChildren(playerTrack, playerCenter, playerRight, btnClose, btnExpand);

    // --- Riferimenti agli elementi ---
    this.ui = {
      cover: coverImg,
      title: footer.querySelector("#player-title"),
      artist: footer.querySelector("#player-artist-link"), // il link dentro #player-artist
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
    btnClose.addEventListener("click", () => this.close());
    btnExpand.addEventListener("click", () => this.expand());

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

    this.setVolume(0.8);
    this.restoreState();
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
    - onMove(percent): chiamata alla pressione e a ogni movimento, con la posizione da 0 a 1
    - onEnd(percent): chiamata quando si lascia (facoltativa)
    - onStart(): chiamata quando si preme (facoltativa)
    I movimenti si ascoltano sulla finestra (window), così il trascinamento continua
    anche se il mouse esce dalla barra mentre il tasto è ancora premuto.
  */
  makeDraggable(bar, onMove, onEnd, onStart) {
    let dragging = false;

    // posizione del mouse sulla barra, da 0 (inizio) a 1 (fine)
    const percentFrom = (e) => {
      const rect = bar.getBoundingClientRect();
      return Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    };

    bar.addEventListener("pointerdown", (e) => {
      dragging = true;
      bar.classList.add("is-dragging"); // nel CSS toglie la transizione: la barra segue il mouse senza ritardo
      if (onStart) onStart();
      onMove(percentFrom(e));
      e.preventDefault(); // evita di selezionare il testo trascinando
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
    // mentre si trascina la barra, non la aggiorniamo con il tempo reale (andrebbe "a scatti" all'indietro)
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
    - Scrive il nome dell'artista nel player e lo collega alla sua pagina (artist.html?id=...)
    - Se il brano non ha artistId (o track è null), il nome resta testo senza link
  */
  showArtist(track) {
    if (!this.ui) return;
    const link = this.ui.artist;
    link.textContent = track?.artistName ?? "—";
    if (track?.artistId) {
      link.href = "artist.html?id=" + track.artistId;
    } else {
      link.removeAttribute("href"); // un <a> senza href non è cliccabile
    }
  }

  /*
    expand()
    - Aprirà la modale #expandPlayer con il player a schermo intero
    - La modale non esiste ancora: finché non c'è, il click non fa nulla
  */
  expand() {
    const modal = document.querySelector("#expandPlayer");
    if (!modal) return; // modale non ancora scritta

    // TODO: aprire la modale (es. modal.classList.add("is-open")) e riempirla con this.currentTrack
  }

  /*
    close()
    - Fa uscire il player con l'animazione (classe .is-closing nel CSS)
    - Alla fine dell'animazione ferma la musica e svuota il player:
      senza immagine di copertina, il CSS nasconde la riga del player
    - Cancella lo stato salvato, così cambiando pagina il player non ricompare
  */
  close() {
    const footer = document.querySelector(".player");
    if (!footer || footer.classList.contains("is-closing")) return; // evita doppi click

    footer.classList.add("is-closing");

    footer.addEventListener("animationend", () => {
      // Prima togliamo il brano corrente: la pausa qui sotto fa scattare saveState()
      // (evento "pause"), che così non trova niente da salvare
      this.currentTrack = null;
      this.audio.pause();
      this.audio.removeAttribute("src"); // nessun brano caricato
      this.audio.load();                  // fa "dimenticare" all'audio il brano precedente
      localStorage.removeItem(STORAGE_KEY_PLAYER);

      this.ui.cover.removeAttribute("src"); // senza src il CSS nasconde il player
      this.ui.title.textContent = "Seleziona un brano";
      this.showArtist(null); // nessun artista: "—" senza link
      this.ui.progressFill.style.width = "0%";
      this.ui.timeCurrent.textContent = "0:00";
      this.ui.timeTotal.textContent = "0:00";
      $(".track-row.is-playing")?.classList.remove("is-playing");

      footer.classList.remove("is-closing");
    }, { once: true });
  }

  saveState() {
    if (!this.currentTrack) return;
    localStorage.setItem(
      STORAGE_KEY_PLAYER,
      JSON.stringify({
        track: this.currentTrack,
        time: this.audio.currentTime,
        playing: !this.audio.paused,
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
    if (!state?.track) return;

    const { track, time, playing } = state;
    this.currentTrack = track;
    this.audio.src = track.previewUrl;
    this.audio.currentTime = time;

    if (this.ui) {
      this.ui.cover.src = (track.artworkUrl100 || "").replace("100x100", "300x300");
      this.ui.title.textContent = track.trackName ?? "Titolo brano";
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

  list.replaceChildren(
    ...favs.map((track) => {
      const item = el("li", { text: `${track.trackName} - ${track.artistName}`, style: { cursor: "pointer" } });
      item.addEventListener("click", () => window.player.play(track));
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
    list,
    deleteBtn
  );
};

export const renderSidebarPlaylists = () => {
  const sidebarContainer = $("#sidebar-playlists");
  if (!sidebarContainer) return;

  const playlists = getPlaylist();
  sidebarContainer.replaceChildren();

  playlists.forEach((playlist) => {
    const dropdownList = renderPlaylistDropdown(playlist);
    const menu = dropdownList.querySelector(".dropdown-menu");
    const deleteBtn = dropdownList.querySelector(".btn-outline-danger");

    deleteBtn.addEventListener("click", (e) => {
      const id = e.currentTarget.closest("[data-playlist-id]").dataset.playlistId;
      killPLaylist(id);
    })
    const tracks = playlist.tracks ?? playlist.trackList ?? [];

    tracks.forEach((track) => {
      const li = el(
        "li",
        {
          className: "dropdown-item text-truncate",
          text: `${track.trackName} — ${track.artistName}`,
          style: { cursor: "pointer" },
        }
      );
      li.addEventListener("click", () => window.player?.play(track));
      menu.append(li);
    });

    sidebarContainer.appendChild(dropdownList);
  });
};

$("#btn-new-playlist")?.addEventListener("click", () => {
  if ($(".playList-title-input")) return;

  const input = el("input", {
    className: "form-control form-control-sm playList-title-input",
    attrs: { type: "text", placeholder: "Titolo playlist", "aria-label": "Titolo playlist" },
  });

  $("#sidebar-playlists").append(input);
  input.focus();

  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") return input.remove();
    if (e.key !== "Enter") return;

    const title = input.value.trim();
    if (!title) return input.remove();

    const playlist = playListBuilder([], title);
    setPlaylist(playlist);
    renderSidebarPlaylists();
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
  return player;
};

