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

import { initPage, formatTime, renderSidebarFavs, renderSidebarPlaylists } from "./common.js";
import {
  API_BASE,
  el,
  isFavourite,
  toggleFavourite,
  getArtistPicture,
  addTrackToPlaylist,
  showPlaylistModal,
} from "./helper.js";

const player = initPage("home");

const artistHero = document.querySelector("#artist-hero");
const topTracks = document.querySelector("#top-tracks");

const getFacebookUrl = async (artistName) => {
  try {
    const res = await fetch(
      `https://www.theaudiodb.com/api/v1/json/123/search.php?s=${encodeURIComponent(artistName)}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const raw = data.artists?.[0]?.strFacebook;
    if (!raw) return null;

    // aggiunge https:// 
    return `https://${raw}`;
  } catch (err) {
    console.error("Errore link Facebook:", err);
    return null;
  }
};

const getBio = async (artistName) => {
  try {
    const res = await fetch(
      `https://www.theaudiodb.com/api/v1/json/123/search.php?s=${encodeURIComponent(artistName)}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const artist = data.artists?.[0];

    let bio = artist?.strBiographyIT;
    if (!bio) bio = artist?.strBiography; // fallback: biografia in inglese

    return bio || null;
  } catch (err) {
    console.error("Errore biografia:", err);
    return null;
  }
};



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
    const tracks = data.results.slice(1).filter((item) => item.wrapperType === "track");
    const firstTrack = tracks[0];

    const listeners = Math.floor(Math.random() * 5_000_000);
    const genre = artist.primaryGenreName ?? "Musica";
    const [pic, facebookUrl, bio] = await Promise.all([
      getArtistPicture(artist.artistName),
      getFacebookUrl(artist.artistName),
      getBio(artist.artistName),
    ]);

    const playBtn = el("button", {
      className: "btn-play-big",
      text: "▶",
      attrs: { "aria-label": "Riproduci", type: "button" },
    });


    const socialBtn = el("button", {
      className: "btn-social-big",
      text: "F",
      attrs: { "aria-label": "Facebook", type: "button" },
    });

    const bioAside = el("aside", {
      className: "bio-aside",
      text: bio,
      attrs: { "aria-label": "biografia" },
    });
    


    if (facebookUrl) {
      socialBtn.addEventListener("click", () => {
        window.open(facebookUrl, "_blank", "noopener,noreferrer");
      });
    } else {
      socialBtn.disabled = true;
      socialBtn.title = "Pagina Facebook non disponibile";
    }

    playBtn.addEventListener("click", () => {
      if (firstTrack) player.play(firstTrack, tracks);
    });

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
        el("div", { className: "hero-actions" }, playBtn, socialBtn)
      ),
      bioAside
    );

    const heading = el("h2", { className: "section-title fs-4", text: "Popolari" });

    const rows = tracks.map((track, i) => {
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

      const row = el(
        "div",
        {
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
        rowHeart.textContent = isFavourite(track) ? "♥" : "♡";
        rowHeart.classList.toggle("is-fav", isFavourite(track));
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
    });

    topTracks.replaceChildren(heading, ...rows);
  } catch (err) {
    console.error("Errore nel caricamento dell'artista:", err);
    artistHero.textContent = "Artista non trovato";
  }
};

loadArtist();