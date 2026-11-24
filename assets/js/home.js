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

import { initPage, renderSidebarFavs } from "./common.js";
import {
  el,
  $,
  fetchModular,
  historyDump as getHistory,
  getFavourites,
  toggleFavourite,
  isFavourite,
} from "./helper.js";

const player = initPage("home");
const home = document.querySelector(".home");

const renderCard = (track) => {
  // Cuore: .card-fav lo posiziona e lo mostra con l'hover;
  // .is-fav lo colora di rosso mattone e lo lascia sempre visibile se il brano è tra i preferiti
  const heartBtn = el("button", {
    className: isFavourite(track) ? "card-fav is-fav" : "card-fav",
    text: isFavourite(track) ? "♥" : "♡",
    attrs: { "aria-label": "Preferito", type: "button" },
  });

  // Play: pulsante in ottone che compare al passaggio del mouse sulla card
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

  // Stessa struttura delle card scritte nell'HTML: copertina, titolo, artista, play e cuore
  const card = el(
    "div",
    {
      className: "card",
      attrs: { "data-track-id": track.trackId }
    },
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

    // sincronizza il cuore di ogni card con questa traccia
    document
      .querySelectorAll(`.card[data-track-id="${track.trackId}"] .card-fav`)
      .forEach((btn) => {
        btn.textContent = isFavourite(track) ? "♥" : "♡";
        btn.classList.toggle("is-fav", isFavourite(track));
      });

    updateFavs();
  });

  return card;
};

const renderRow = (rowTitle, tracks, id = rowTitle) => {
  const playable = tracks.filter((t) => t.previewUrl);
  if (!playable.length) return null;

  const grid = el("div", { className: "grid", id }, ...playable.map(renderCard));
  const section = el(
    "article",
    { className: "row", attrs: { "data-row": id } },
    el("h2", { text: rowTitle }),
    grid
  );
  home.append(section);
  return section;
};

function updateFavs() {
  renderSidebarFavs();

  const favourites = getFavourites().filter((t) => t.previewUrl);
  const existing = $('[data-row="Preferiti"]');

  // nessun preferito: rimuovi l'intera riga
  if (!favourites.length) {
    existing?.remove();
    return;
  }

  // riga già presente: svuota e ridisegna
  if (existing) {
    existing.querySelector(".grid").replaceChildren(...favourites.map(renderCard));
    return;
  }

  // riga assente (primo preferito): creala e mettila in cima, dopo la history
  const section = renderRow("Preferiti", favourites);
  const history = $('[data-row="Riprodotti di recente"]');
  if (history) history.after(section);
  else home.prepend(section);
}

function updateHistory() {
  const history = getHistory().reverse().slice(0, 12).filter((t) => t.previewUrl);
  const existing = $('[data-row="Riprodotti di recente"]');

  if (!history.length) {
    existing?.remove();
    return;
  }

  if (existing) {
    existing.querySelector(".grid").replaceChildren(...history.map(renderCard));
    return;
  }

  const section = renderRow("Riprodotti di recente", history);
  home.prepend(section);
}


const loadHome = async () => {
  const [pop, rock, hits] = await Promise.all([
    fetchModular("pop", { media: "music", entity: "song", limit: 12 }),
    fetchModular("rock", { media: "music", entity: "song", limit: 12 }),
    fetchModular("hits pop", { media: "music", entity: "song", limit: 12 }),
  ]);

  const history = getHistory().reverse().slice(0, 12);
  const favourites = getFavourites();

  // renderRow salta da sola le liste vuote
  renderRow("Riprodotti di recente", history);
  renderRow("Preferiti", favourites);
  renderRow("Suggerimenti pop", pop);
  renderRow("Suggerimenti rock", rock);
  renderRow("Suggerimenti hits", hits);
};



loadHome();