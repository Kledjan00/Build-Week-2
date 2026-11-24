/* ============================================================
   search.js — ricerca con debounce
   ============================================================

   COSA DEVI FARE
   1) initPage("search")
   2) Recupera l'ultima query da localStorage (STORAGE_KEY_LAST_SEARCH).
      Se presente, popola l'input e lancia la ricerca.
   3) Aggancia l'evento "input" all'input #search-input con debounce 400ms.
   4) doSearch(term):
      - se term è vuoto -> nascondi i 3 row e svuota i grid
      - altrimenti fetch in PARALLELO (Promise.all):
          - tracks   = search?term=...&entity=song&limit=12
          - albums   = search?term=...&entity=album&limit=8
          - artists  = search?term=...&entity=musicArtist&limit=8
      - mostra ciascuna sezione solo se i risultati sono > 0
      - salva l'ultima query in localStorage
   5) Per ogni risultato crea una card:
      - track  -> click = player.play(track)
      - album  -> click = window.location.href = "album.html?id=" + albumId
      - artist -> click = window.location.href = "artist.html?id=" + artistId
*/

import { initPage, renderSidebarFavs } from "./common.js";
import { el, $, debounce, fetchItem, fetchByGenre, fetchModular, isFavourite, toggleFavourite, getFavourites } from "./helper.js";

const player = initPage("search");

const input = document.querySelector("#search-input");
const rowTracks = document.querySelector("#row-tracks");
const rowAlbums = document.querySelector("#row-albums");
const rowArtists = document.querySelector("#row-artists");
const gridTracks = document.querySelector("#grid-tracks");
const gridAlbums = document.querySelector("#grid-albums");
const gridArtists = document.querySelector("#grid-artists");

const renderCard = (track) => {
  // Cuore: .card-fav lo mette a destra di titolo e artista;
  // .is-fav lo colora di rosso mattone e lo lascia sempre visibile
  const heartBtn = el("button", {
    className: isFavourite(track) ? "card-fav is-fav" : "card-fav",
    text: isFavourite(track) ? "♥" : "♡",
    attrs: { "aria-label": "Preferito", type: "button" },
  });

  // Play: cerchio trasparente al centro della copertina, compare con l'hover
  const playBtn = el("button", {
    className: "card-play",
    text: "▶",
    attrs: { "aria-label": "Riproduci", type: "button" },
  });

  const cover = el("img", {
    attrs: {
      src: (track.artworkUrl100 || "").replace("100x100", "300x300"),
      alt: track.trackName ?? "",
      loading: "lazy",
    },
  });

  const card = el(
    "div",
    { className: "card" },
    el("div", { className: "card-image-wrap" }, cover),
    el("h3", { className: "card-title", text: track.trackName ?? "Sconosciuto" }),
    el("p", { className: "card-sub", text: track.artistName ?? "—" }),
    playBtn,
    heartBtn
  );

  // click sulla card (e sul play) -> riproduce
  card.addEventListener("click", () => {
    player.play(track);
    updateHistory();
  });

  // click sul cuore -> preferito, senza far partire il brano
  heartBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFavourite(track);
    renderSidebarFavs();
    heartBtn.textContent = isFavourite(track) ? "♥" : "♡";
    heartBtn.classList.toggle("is-fav", isFavourite(track));
  });

  return card;
};

const renderAlbumCard = (album) => {
  const cover = el("img", {
    attrs: {
      src: (album.artworkUrl100 || "").replace("100x100", "300x300"),
      alt: album.collectionName ?? "",
      loading: "lazy",
    },
  });

  // Stessa struttura delle card dei brani, senza play e cuore
  const card = el(
    "div",
    { className: "card" },
    el("div", { className: "card-image-wrap" }, cover),
    el("h3", { className: "card-title", text: album.collectionName ?? "Sconosciuto" }),
    el("p", { className: "card-sub", text: album.artistName ?? "—" })
  );

  // click sulla card -> pagina dell'album
  card.addEventListener("click", () => {
    window.location.href = "album.html?id=" + album.collectionId;
    updateHistory();
  });

  return card;
};

const getArtistPicture = async (term) => {
  try {
    const response = await fetch(
      `https://api.deezer.com/search/artist?q=${encodeURIComponent(term)}`
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const results = await response.json();
    const artist = results.data[0]; // i risultati stanno in results.data
    return artist?.picture_xl ?? null;
  } catch (err) {
    console.error("Errore Deezer:", err);
    return null;
  }
};

const renderArtistCard = async (artist) => {
  const pic = await getArtistPicture(artist.artistName);

  const frame = el("img", {
    attrs: {
      src: pic,
      alt: artist.artistName ?? "Artista",
      loading: "lazy",
    },
  });

  const card = el(
    "div",
    { className: "card" },
    el("div", { className: "card-image-wrap" }, frame),
    el("h3", { className: "card-title", text: artist.artistName ?? "Artista sconosciuto" }),
    el("p", { className: "card-sub", text: artist.primaryGenreName ?? "Artista" })
  );

  card.addEventListener("click", () => {
    window.location.href = "artist.html?id=" + artist.artistId;
  });

  return card;
};

let lastTerm = "";

const showRows = (visible) => {
  [rowTracks, rowAlbums, rowArtists].forEach((row) => (row.hidden = !visible));
};

const doSearch = async (term) => {
  lastTerm = term;

  if (!term) {
    gridTracks.replaceChildren();
    gridAlbums.replaceChildren();
    gridArtists.replaceChildren();
    showRows(false);
    return;
  }

  const [results, albums, artists] = await Promise.all([
    fetchModular(term, { media: "music", entity: "song", limit: 12 }),
    fetchModular(term, { media: "music", entity: "album", limit: 8 }),
    fetchModular(term, { media: "music", entity: "musicArtist", attribute: "artistTerm", limit: 8 }),
  ]);

  if (term !== lastTerm) return;

  const tracks = results.filter((t) => t.previewUrl);
  const albumList = albums.filter((a) => a.collectionName && a.collectionId);
  const artistsList = artists.filter((a) => a.artistName && a.artistId);

  const artistCards = await Promise.all(artistsList.map(renderArtistCard));

  gridTracks.replaceChildren(...tracks.map(renderCard));
  gridAlbums.replaceChildren(...albumList.map(renderAlbumCard));
  gridArtists.replaceChildren(...artistCards);

  rowTracks.hidden = tracks.length === 0;
  rowAlbums.hidden = albumList.length === 0;
  rowArtists.hidden = artistsList.length === 0;
};


const debouncedSearch = debounce(doSearch, 400);

input.addEventListener("input", (event) => {
  debouncedSearch(event.target.value.trim());
});

// TODO: al caricamento, recupera l'ultima query da localStorage e lancia doSearch(lastQuery)




