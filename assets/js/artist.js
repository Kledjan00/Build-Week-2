/* ============================================================
   artist.js — pagina dettaglio artista
   ============================================================

   COSA DEVI FARE
   1) initPage("home")
   2) Leggi l'id dell'artista dalla query string (URLSearchParams).
   3) Se manca l'id -> messaggio "Artista non trovato" e stop.
   4) fetch /lookup?id=ID&entity=song&limit=15
      - results[0] è l'artist
      - results[1..] sono le top track
   5) Costruisci #artist-hero:
      - kicker "ARTISTA"
      - nome artista grande
      - genere (primaryGenreName) + numero ascoltatori (random, es. Math.random() * 5_000_000)
      - button "Play" -> player.play(prima track)
   6) Costruisci #top-tracks come tracklist (uguale a album).
*/

import { initPage, formatTime, renderSidebarFavs } from "./common.js";
import { API_BASE, el, isFavourite, toggleFavourite, getArtistPicture } from "./helper.js";

const player = initPage("home");

const artistHero = document.querySelector("#artist-hero");
const topTracks = document.querySelector("#top-tracks");

const loadArtist = async () => {
  const id = new URLSearchParams(window.location.search).get("id");

  if (!id) {
    artistHero.textContent = "Artista non trovato";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/lookup?id=${id}&entity=song&limit=15`);
    const data = await res.json();

    const artist = data.results[0];
    const tracks = data.results.slice(1);
    const firstTrack = tracks[0];

    const listeners = Math.floor(Math.random() * 5_000_000);
    const genre = artist.primaryGenreName ?? "Musica";
    const pic = await getArtistPicture(artist.artistName);

    const playBtn = el("button", {
      className: "btn-play-big",
      text: "▶",
      attrs: { "aria-label": "Riproduci", type: "button" },
    });

    playBtn.addEventListener("click", () => player.play(firstTrack));

    artistHero.replaceChildren(
      el("img", {
        className: "hero-img",
        attrs: {
          src: pic || "assets/img/placeholderArtist.png",
          alt: artist.artistName ?? "Artista",
        },
      }),
      el(
        "div",
        { className: "hero-meta" },
        el("p", { className: "hero-kicker", text: "Artista" }),
        el("h1", { className: "hero-title", text: artist.artistName }),
        el("p", {
          className: "hero-sub",
          text: `${genre} · ${listeners.toLocaleString("it-IT")} ascoltatori`,
        }),
        el("div", { className: "hero-actions" }, playBtn)
      )
    );

    const heading = el("h2", { className: "section-title fs-4", text: "Popolari" });

    const rows = tracks.map((track, i) => {
      const rowHeart = el("button", {
        className: isFavourite(track) ? "track-fav is-fav" : "track-fav",
        text: isFavourite(track) ? "♥" : "♡",
        attrs: { "aria-label": "Preferito", type: "button" },
      });

      const row = el(
        "div",
        {
          className: "track-row",
          attrs: { "data-track-id": track.trackId },
        },
        el("span", { className: "track-num", text: i + 1 }),
        el("span", { className: "track-title", text: track.trackName ?? "Sconosciuto" }),
        el("span", { className: "track-time", text: formatTime(track.trackTimeMillis) }),
        rowHeart
      );

      row.addEventListener("click", () => player.play(track));

      rowHeart.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFavourite(track);
        renderSidebarFavs();
        rowHeart.textContent = isFavourite(track) ? "♥" : "♡";
        rowHeart.classList.toggle("is-fav", isFavourite(track));
      });

      return row;
    });

    topTracks.replaceChildren(heading, ...rows);
  } catch (err) {
    console.error("Errore nel caricamento dell'artista:", err);
    artistHero.textContent = "Artista non trovato";
  }
};

loadArtist();