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

import { initPage, bigArt, formatTime, renderSidebarFavs } from "./common.js";
import { API_BASE, el, isFavourite, toggleFavourite } from "./helper.js";

const player = initPage("album");

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

      // Cuore grande: .is-fav lo colora di rosso mattone
      const heartBtn = el("button", {
         className: isFavourite(firstTrack) ? "btn-fav-big is-fav" : "btn-fav-big",
         text: isFavourite(firstTrack) ? "♥" : "♡",
         attrs: { "aria-label": "Preferito", type: "button" },
      });

      // Play grande in ottone
      const playBtn = el("button", {
         className: "btn-play-big",
         text: "▶",
         attrs: { "aria-label": "Riproduci", type: "button" },
      });

      playBtn.addEventListener("click", () => player.play(firstTrack));

      heartBtn.addEventListener("click", () => {
         toggleFavourite(firstTrack);
         renderSidebarFavs();
         heartBtn.textContent = isFavourite(firstTrack) ? "♥" : "♡";
         heartBtn.classList.toggle("is-fav", isFavourite(firstTrack));
      });

      // #album-hero ha già la classe album-hero nell'HTML: copertina a sinistra, testi a destra
      albumHero.replaceChildren(
         el("div", { className: "album-cover" },
            el("img", { attrs: { src: bigArt(album.artworkUrl100), alt: album.collectionName } })
         ),
         el("div", { className: "hero-meta" },
            el("p", { className: "hero-kicker", text: "Album" }),
            el("h1", { className: "hero-title", text: album.collectionName }),
            el("p", {
               className: "hero-sub",
               text: `${album.artistName} · ${year} · ${tracks.length} brani · ${formatTime(totalMs)}`,
            }),
            el("div", { className: "hero-actions" }, playBtn, heartBtn)
         )
      );

      tracklist.replaceChildren(
         ...tracks.map((track, i) => {
            // Cuore della riga: senza sfondo, rosso mattone se è tra i preferiti
            const rowHeart = el("button", {
               className: isFavourite(track) ? "track-fav is-fav" : "track-fav",
               text: isFavourite(track) ? "♥" : "♡",
               attrs: { "aria-label": "Preferito", type: "button" },
            });

            // Riga a 4 colonne: numero | titolo | durata | cuore
            const row = el("div", {
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
         })
      );
   } catch (err) {
      console.error("Errore nel caricamento dell'album:", err);
      albumHero.textContent = "Album non trovato";
   }
};

loadAlbum();
