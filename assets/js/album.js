/* ============================================================
   album.js — pagina dettaglio album
   ============================================================

   COSA DEVI FARE
   1) initPage("home")
   2) Leggi l'id dell'album dalla query string:
        const id = new URLSearchParams(window.location.search).get("id");
   3) Se manca l'id -> messaggio "Album non trovato" e stop.
   4) fetch /lookup?id=ID&entity=song
      - results[0] è la collection (album)
      - results[1..] sono le track
   5) Costruisci #album-hero con:
      - cover grande (bigArt)
      - kicker "ALBUM"
      - titolo album
      - sotto-riga: artista · anno · numero brani · durata totale
      - button "Play" che chiama player.play sulla prima track
      - button "Cuore" (favourite) sulla prima track
   6) Costruisci #tracklist:
      - una riga per track: numero, titolo, durata, cuore
      - click sulla riga -> player.play(track)
      - click sul cuore -> toggleFavourite(track)
*/

import { initPage, bigArt, formatTime } from "./common.js";
import { API_BASE, el, isFavourite, toggleFavourite } from "./helper.js";

const player = initPage("home");

const albumHero = document.querySelector("#album-hero");
const tracklist = document.querySelector("#tracklist");

const loadAlbum = async () => {
   const id = new URLSearchParams(window.location.search).get("id");

   if (!id) {
      albumHero.textContent = "Album non trovato";
      return;
   }

   try {
      const res = await fetch(`${API_BASE}/lookup?id=${id}&entity=song`);
      const data = await res.json();

      const album = data.results[0];
      const tracks = data.results.slice(1);
      const firstTrack = tracks[0];

      const year = new Date(album.releaseDate).getFullYear();
      const totalMs = tracks.reduce((sum, t) => sum + (t.trackTimeMillis || 0), 0);

      const heartBtn = el("button", {
         className: "btn btn-sm btn-dark rounded-circle",
         text: isFavourite(firstTrack) ? "♥" : "♡",
         attrs: { "aria-label": "Preferito", type: "button" },
      });

      const playBtn = el("button", {
         className: "btn btn-success btn-sm rounded-circle",
         text: "▶",
         attrs: { "aria-label": "Riproduci", type: "button" },
      });

      playBtn.addEventListener("click", () => player.play(firstTrack));

      heartBtn.addEventListener("click", () => {
         toggleFavourite(firstTrack);
         heartBtn.textContent = isFavourite(firstTrack) ? "♥" : "♡";
      });

      albumHero.replaceChildren(
         el("div", { className: "d-flex flex-column flex-md-row align-items-md-end gap-4" },
            el("img", {
               className: "rounded shadow",
               style: { width: "232px", height: "232px" },
               attrs: { src: bigArt(album.artworkUrl100), alt: album.collectionName },
            }),
            el("div", {},
               el("p", { className: "small text-secondary fw-bold mb-1", text: "ALBUM" }),
               el("h1", { className: "display-5 fw-bold", text: album.collectionName }),
               el("p", {
                  className: "text-secondary",
                  text: `${album.artistName} · ${year} · ${tracks.length} brani · ${formatTime(totalMs)}`,
               }),
               el("div", { className: "d-flex align-items-center gap-2" }, playBtn, heartBtn)
            )
         )
      );

      tracklist.replaceChildren(
         ...tracks.map((track, i) => {
            const rowHeart = el("button", {
               className: "btn btn-sm btn-dark rounded-circle",
               text: isFavourite(track) ? "♥" : "♡",
               attrs: { "aria-label": "Preferito", type: "button" },
            });

            const row = el("div", {
               className: "track-row d-flex align-items-center gap-3 p-2 rounded",
               style: { cursor: "pointer" },
               attrs: { "data-track-id": track.trackId },
            },
               el("span", { className: "text-secondary", style: { width: "2rem" }, text: i + 1 }),
               el("span", { className: "flex-grow-1 text-truncate", text: track.trackName ?? "Sconosciuto" }),
               el("span", { className: "text-secondary", text: formatTime(track.trackTimeMillis) }),
               rowHeart
            );

            row.addEventListener("click", () => player.play(track));

            rowHeart.addEventListener("click", (e) => {
               e.stopPropagation();
               toggleFavourite(track);
               rowHeart.textContent = isFavourite(track) ? "♥" : "♡";
            });

            return row;
         })
      );
   } catch (err) {
      console.error("Errore nel caricamento dell'album:", err);
      albumHero.textContent = "Album non trovato";
   }
};

loadAlbum();
