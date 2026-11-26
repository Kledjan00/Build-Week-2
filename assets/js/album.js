import { initPage, bigArt, formatTime, renderSidebarFavs, renderSidebarPlaylists } from "./common.js";
import { API_BASE, el, isFavourite, toggleFavourite, addTrackToPlaylist, showPlaylistModal } from "./helper.js";

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
      if (!album) {
         albumHero.textContent = "Album non trovato";
         return;
      }

      const tracks = data.results.slice(1).filter((item) => item.wrapperType === "track");
      const firstTrack = tracks[0];

      const year = new Date(album.releaseDate).getFullYear();
      const totalMs = tracks.reduce((sum, t) => sum + (t.trackTimeMillis || 0), 0);

      const syncHearts = () => {
         const allFavs = tracks.length > 0 && tracks.every((t) => isFavourite(t));
         heartBtn.textContent = allFavs ? "♥" : "♡";
         heartBtn.classList.toggle("is-fav", allFavs);

         tracklist.querySelectorAll(".track-row").forEach((row) => {
            const trackId = Number(row.dataset.trackId);
            const t = tracks.find((item) => item.trackId === trackId);
            const btn = row.querySelector(".track-fav");
            if (!t || !btn) return;
            const fav = isFavourite(t);
            btn.textContent = fav ? "♥" : "♡";
            btn.classList.toggle("is-fav", fav);

         });
      };

      const allFavsInitial = tracks.length > 0 && tracks.every((t) => isFavourite(t));

      // Cuore album: .is-fav lo colora di rosso mattone
      const heartBtn = el("button", {
         className: allFavsInitial ? "btn-fav-big is-fav" : "btn-fav-big",
         text: allFavsInitial ? "♥" : "♡",
         attrs: { "aria-label": "Album preferito", type: "button" },
      });

      // Bottone +: aggiunge tutti i brani dell'album a una playlist
      const plusBtn = el("button", {
         className: "btn-plus-big",
         text: "+",
         attrs: { "aria-label": "Aggiungi album a una playlist", type: "button" },
      });

      // Play grande in ottone
      const playBtn = el("button", {
         className: "btn-play-big",
         text: "▶",
         attrs: { "aria-label": "Riproduci", type: "button" },
      });

      playBtn.addEventListener("click", () => {
         if (firstTrack) player.play(firstTrack, tracks);
      });

      heartBtn.addEventListener("click", () => {
         if (!tracks.length) return;
         const allFavs = tracks.every((t) => isFavourite(t));
         for (const track of tracks) {
            if (allFavs) {
               if (isFavourite(track)) toggleFavourite(track);
            } else {
               if (!isFavourite(track)) toggleFavourite(track);
            }
         }
         renderSidebarFavs();
         syncHearts();
      });

      plusBtn.addEventListener("click", () => {
         if (!tracks.length) return;
         showPlaylistModal(album, (playlistId) => {
            let anyAdded = false;
            for (const track of tracks) {
               if (addTrackToPlaylist(playlistId, track)) {
                  anyAdded = true;
               }
            }
            if (anyAdded) {
               document.dispatchEvent(new Event("playlists:changed"));
            }
            renderSidebarPlaylists();
         }, tracks);
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
            el("div", { className: "hero-actions" }, playBtn, heartBtn, plusBtn)
         )
      );

      tracklist.replaceChildren(
         ...tracks.map((track, i) => {
            const rowHeart = el("button", {
               className: isFavourite(track) ? "track-fav is-fav" : "track-fav",
               text: isFavourite(track) ? "♥" : "♡",
               attrs: { "aria-label": "Preferito", type: "button" },
            });

            const plusBtn = el("button", {
               className: "btn btn-sm btn-outline-secondary py-0",
               text: "+",
               attrs: {
                  type: "button",
                  "aria-label": `Aggiungi ${track.trackName} a una playlist`,
               },
            });

            const row = el("div", {
               className: "track-row",
               attrs: { "data-track-id": track.trackId, "data-explicit": track.trackExplicitness === "explicit" },
            },
               el("span", { className: "track-num", text: i + 1 }),
               el("span", { className: "track-title", text: track.trackName ?? "Sconosciuto" }),
               el("span", { className: "track-time", text: formatTime(track.trackTimeMillis) }),
               el("span", { className: "d-flex align-items-center gap-2" }, rowHeart, plusBtn)
            );

            row.addEventListener("click", () => player.play(track, tracks));

            rowHeart.addEventListener("click", (e) => {
               e.stopPropagation();
               toggleFavourite(track);
               renderSidebarFavs();
               syncHearts();
            });

            plusBtn.addEventListener("click", (e) => {
               e.stopPropagation();
               showPlaylistModal(track, (playlistId) => {
                  const added = addTrackToPlaylist(playlistId, track);
                  if (added) {
                     document.dispatchEvent(new Event("playlists:changed"));
                  }
                  renderSidebarPlaylists();
               });
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