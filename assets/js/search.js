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

import { initPage } from "./common.js";
import {el, $, debounce, fetchItem, fetchByGenre, fetchModular, isFavourite, toggleFavourite, getFavourites } from "./helper.js";

const player = initPage("search");

const input = document.querySelector("#search-input");
const rowTracks = document.querySelector("#row-tracks");
const rowAlbums = document.querySelector("#row-albums");
const rowArtists = document.querySelector("#row-artists");
const gridTracks = document.querySelector("#grid-tracks");
const gridAlbums = document.querySelector("#grid-albums");
const gridArtists = document.querySelector("#grid-artists");

const renderCard = (track) => {
  const heartBtn = el("button", {
    className: "btn btn-sm btn-dark position-absolute top-0 end-0 m-2 rounded-circle",
    text: isFavourite(track) ? "♥" : "♡",
    attrs: { "aria-label": "Preferito", type: "button" },
  });

  const playBtn = el("button", {
    className: "btn btn-success btn-sm position-absolute bottom-0 end-0 m-2 rounded-circle",
    text: "▶",
    attrs: { "aria-label": "Riproduci", type: "button" },
  });

  const cover = el("img", {
    className: "card-img-top",
    attrs: {
      src: (track.artworkUrl100 || "").replace("100x100", "300x300"),
      alt: track.trackName ?? "",
      loading: "lazy",
    },
  });

  const card = el(
    "div",
    { className: "card h-100 bg-dark text-light border-0 shadow-sm", style: { cursor: "pointer" } },
    el("div", { className: "position-relative" }, cover, heartBtn, playBtn),
    el(
      "div",
      { className: "card-body p-2" },
      el("h3", { className: "card-title fs-6 mb-1 text-truncate", text: track.trackName ?? "Sconosciuto" }),
      el("p", { className: "card-text small text-secondary mb-0 text-truncate", text: track.artistName ?? "—" })
    )
  );

  // click sulla card (e sul play) -> riproduce
  card.addEventListener("click", () => player.play(track));

  // click sul cuore -> preferito, senza far partire il brano
  heartBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFavourite(track);
    heartBtn.textContent = isFavourite(track) ? "♥" : "♡";
  });

  return el("div", { className: "col" }, card);
};
const renderAlbumCard = (album) => { /* TODO */ };
const renderArtistCard = (artist) => { /* TODO */ };

let lastTerm = "";

const showRows = (visible) => {
  [rowTracks, rowAlbums, rowArtists].forEach((row) => (row.hidden = !visible));
};

const doSearch = async (term) => {
  lastTerm = term;

  if (!term) {
    gridTracks.replaceChildren();
    showRows(false);
    return;
  }

  const results = await fetchItem(term);
  if (term !== lastTerm) return; // risposta obsoleta

  const tracks = results.filter((t) => t.previewUrl);
  gridTracks.replaceChildren(...tracks.map(renderCard));
  showRows(true);
};

const debouncedSearch = debounce(doSearch, 400);

input.addEventListener("input", (event) => {
  debouncedSearch(event.target.value.trim());
});



// TODO: al caricamento, recupera l'ultima query da localStorage e lancia doSearch(lastQuery)
