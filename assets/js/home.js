/* ============================================================
   home.js — costruzione della Home
   ============================================================

   COSA DEVI FARE
   1) initPage("home")  // monta sidebar + player
   2) Costruisci queste righe (sezioni) nella .home:
        - "Riprodotti di recente" (da getHistory())  -- mostra solo se non vuota
        - "I tuoi preferiti"       (da getFavourites()) -- mostra solo se non vuota
        - "Suggerimenti pop"       (fetch search term=pop entity=song limit=12)
        - "Suggerimenti rock"      (fetch search term=rock entity=song limit=12)
        - "Suggerimenti hits"   (fetch search term=hits pop entity=song limit=12)
   3) Le tre fetch dei suggerimenti vanno in PARALLELO con Promise.all
   4) Ogni card è una Track: cover, titolo, artista, button play, button cuore (favourite)
   5) Click card -> window.player.play(track)
   6) Click cover senza play -> link a album.html?id=albumId (opzionale)
*/

import { initPage } from "./common.js";
import {
  el,
  fetchModular,
  historyDump as getHistory,
  getFavourites,
  toggleFavourite,
  isFavourite,
} from "./helper.js";

const player = initPage("home");
const home = document.querySelector(".home");



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

const renderRow = (rowTitle, tracks) => {
  const playable = tracks.filter((t) => t.previewUrl);
  if (!playable.length) return;

  const grid = el(
    "div",
    { className: "row row-cols-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-6 g-3" },
    ...playable.map(renderCard)
  );

  home.append(
    el(
      "section",
      { className: "row-section mb-4" },
      el("h2", { className: "h4 mb-3", text: rowTitle }),
      grid
    )
  );
};

const loadHome = async () => {
  const [pop, rock, hits] = await Promise.all([
    fetchModular("pop", { media: "music", entity: "song", limit: 12 }),
    fetchModular("rock", { media: "music", entity: "song", limit: 12 }),
    fetchModular("hits pop", { media: "music", entity: "song", limit: 12 }),
  ]);

  const history = getHistory();
  const favourites = getFavourites();

  // renderRow salta da sola le liste vuote
  renderRow("Riprodotti di recente", history);
  renderRow("I tuoi preferiti", favourites);
  renderRow("Suggerimenti pop", pop);
  renderRow("Suggerimenti rock", rock);
  renderRow("Suggerimenti hits", hits);
};

loadHome();