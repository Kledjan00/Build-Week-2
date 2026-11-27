import { initPage, formatTime, renderSidebarFavs, renderSidebarPlaylists, artistLink } from "./common.js";
import {
  API_BASE,
  el,
  isFavourite,
  toggleFavourite,
  getFavourites,
  getArtistPicture,
  addTrackToPlaylist,
  showPlaylistModal,
} from "./helper.js";

const player = initPage("home");

const artistHero = document.querySelector("#artist-hero");
const topTracks = document.querySelector("#top-tracks");

const chevron = (direction) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "icon");
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", `#ico-chevron-${direction}`);
  svg.append(use);
  return svg;
};

const buildCarousel = (track) => {
  const prevBtn = el(
    "button",
    { className: "carousel-arrow carousel-arrow-prev", attrs: { type: "button", "aria-label": "Indietro" } },
    chevron("left")
  );
  const nextBtn = el(
    "button",
    { className: "carousel-arrow carousel-arrow-next", attrs: { type: "button", "aria-label": "Avanti" } },
    chevron("right")
  );

  const updateArrows = () => {
    prevBtn.disabled = track.scrollLeft <= 0;
    nextBtn.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
  };

  prevBtn.addEventListener("click", () => track.scrollBy({ left: -track.clientWidth }));
  nextBtn.addEventListener("click", () => track.scrollBy({ left: track.clientWidth }));
  track.addEventListener("scroll", updateArrows);
  window.addEventListener("resize", updateArrows);
  requestAnimationFrame(updateArrows);

  return el("div", { className: "carousel" }, prevBtn, track, nextBtn);
};

const getAlbumTracks = async (collectionId) => {
  if (!collectionId) return [];
  try {
    const res = await fetch(`${API_BASE}/lookup?id=${collectionId}&entity=song`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).filter((item) => item.wrapperType === "track");
  } catch {
    return [];
  }
};

const allSaved = (tracks) => tracks.length > 0 && tracks.every((t) => isFavourite(t));

const isAlbumSaved = (album) => {
  if (!album.trackCount) return false;
  const saved = getFavourites().filter((t) => t.collectionId === album.collectionId).length;
  return saved >= album.trackCount;
};

const setHeart = (btn, filled) => {
  btn.textContent = filled ? "♥" : "♡";
  btn.classList.toggle("is-fav", filled);
};

const renderAlbumCard = (album) => {
  const saved = isAlbumSaved(album);

  const heartBtn = el("button", {
    className: saved ? "card-fav is-fav" : "card-fav",
    text: saved ? "♥" : "♡",
    attrs: { "aria-label": "Preferito", type: "button" },
  });

  const plusBtn = el("button", {
    className: "card-plus",
    text: "+",
    attrs: { "aria-label": "Aggiungi a una playlist", type: "button" },
  });

  const card = el(
    "div",
    { className: "card", attrs: { "data-collection-id": album.collectionId } },
    el(
      "div",
      { className: "card-image-wrap" },
      el("img", {
        attrs: {
          src: (album.artworkUrl100 || "").replace("100x100", "300x300"),
          alt: album.collectionName ?? "",
          loading: "lazy",
        },
      })
    ),
    el("h3", { className: "card-title", text: album.collectionName ?? "Sconosciuto" }),
    artistLink(album.artistName, album.artistId),
    heartBtn,
    plusBtn
  );

  plusBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    plusBtn.disabled = true;
    const tracks = await getAlbumTracks(album.collectionId);
    plusBtn.disabled = false;
    if (!tracks.length) return;

    showPlaylistModal(
      tracks[0],
      (playlistId) => {
        let anyAdded = false;
        for (const track of tracks) {
          if (addTrackToPlaylist(playlistId, track)) anyAdded = true;
        }
        if (anyAdded) document.dispatchEvent(new Event("playlists:changed"));
        renderSidebarPlaylists();
      },
      tracks
    );
  });

  heartBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    heartBtn.disabled = true;
    const tracks = await getAlbumTracks(album.collectionId);
    heartBtn.disabled = false;
    if (!tracks.length) return;

    const allFavs = tracks.every((t) => isFavourite(t));
    for (const track of tracks) {
      if (allFavs === isFavourite(track)) toggleFavourite(track);
    }

    const nowAllFavs = allSaved(tracks);
    document
      .querySelectorAll(`.card[data-collection-id="${album.collectionId}"] .card-fav`)
      .forEach((btn) => setHeart(btn, nowAllFavs));

    renderSidebarFavs();
  });

  card.addEventListener("click", () => {
    window.location.href = "album.html?id=" + album.collectionId;
  });

  return card;
};

const loadRecommendedAlbums = async (artistId, artistName) => {
  try {
    const res = await fetch(`${API_BASE}/lookup?id=${artistId}&entity=album&limit=13`);
    const data = await res.json();
    const albums = data.results.filter((a) => a.wrapperType === "collection").slice(0, 12);
    if (!albums.length) return;

    const grid = el("div", { className: "grid carousel-track" }, ...albums.map(renderAlbumCard));
    topTracks.after(
      el("article", { className: "row" }, el("h2", { text: `Album consigliati di ${artistName}` }), buildCarousel(grid))
    );
  } catch (err) {
    console.error("Errore album dell'artista:", err);
  }
};

const getFacebookUrl = async (artistName) => {
  try {
    const res = await fetch(
      `https://www.theaudiodb.com/api/v1/json/123/search.php?s=${encodeURIComponent(artistName)}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const raw = data.artists?.[0]?.strFacebook;
    if (!raw || !raw.includes(".")) return null;

    return raw.startsWith("http") ? raw : `https://${raw}`;
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
    if (!bio) bio = artist?.strBiography;

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
    const res = await fetch(`${API_BASE}/lookup?id=${id}&entity=song&limit=50`);
    const data = await res.json();

    const artist = data.results[0];
    const tracks = data.results.slice(1).filter((item) => item.wrapperType === "track").slice(0, 10);
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
      className: "btn-social",
      text: "F",
      attrs: { "aria-label": "Facebook", type: "button" },
    });

    const bioText = el("p", { className: "bio-text", text: bio ?? "" });

    const bioMore = el("button", {
      className: "bio-more",
      text: "Leggi di più",
      attrs: { type: "button", popovertarget: "bio-modal", "aria-haspopup": "dialog" },
    });

    const bioAside = el("aside", {
      className: "bio-aside",
      attrs: { "aria-label": "Biografia" },
    }, bioText, bioMore);

    document.querySelector("#bio-modal-img").src = pic || "assets/img/placeholderArtist.png";
    document.querySelector("#bio-modal-title").textContent = artist.artistName ?? "Artista";
    document.querySelector("#bio-modal-text").textContent = bio ?? "";

    if (!bio) bioAside.hidden = true;
    if (bio && bio.length < 300) bioMore.hidden = true;


    if (facebookUrl) {
      socialBtn.addEventListener("click", () => {
        window.open(facebookUrl, "_blank", "noopener,noreferrer");
      });
    } else {
      socialBtn.setAttribute("aria-disabled", "true");
      socialBtn.dataset.tooltip = "Pagina Facebook non disponibile";
      socialBtn.setAttribute("aria-label", "Facebook, pagina non disponibile");
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
    loadRecommendedAlbums(artist.artistId, artist.artistName);
  } catch (err) {
    console.error("Errore nel caricamento dell'artista:", err);
    artistHero.textContent = "Artista non trovato";
  }
};

loadArtist();