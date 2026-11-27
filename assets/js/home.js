
import { initPage, renderSidebarFavs, renderSidebarPlaylists, artistLink} from "./common.js";
import {
  API_BASE,
  el,
  $,
  fetchModular,
  historyDump as getHistory,
  getFavourites,
  toggleFavourite,
  isFavourite,
  addTrackToPlaylist,
  getArtistPicture,
  showPlaylistModal,
  getSelected,
} from "./helper.js";

const player = initPage("home");
const home = document.querySelector(".home");

// Arrivo da un'altra pagina con "Log in" (link index.html#login): apre subito la modale di login
if (location.hash === "#login") {
  $("#login-modal")?.classList.add("is-open");
  window.history.replaceState(null, "", "index.html");
}

/* ============================ Card brano ============================ */

/*
  renderCard(track, _index, rowTracks)
  - Chiamata con .map(renderCard): rowTracks è la lista dei brani della riga.
  - Al click il brano parte con quella lista: avanti/indietro scorrono la stessa riga.
*/
const renderCard = (track, _index, rowTracks) => {
  const heartBtn = el("button", {
    className: isFavourite(track) ? "card-fav is-fav" : "card-fav",
    text: isFavourite(track) ? "♥" : "♡",
    attrs: { "aria-label": "Preferito", type: "button" },
  });

  const playBtn = el("button", {
    className: "card-play",
    text: "▶",
    attrs: { "aria-label": "Riproduci", type: "button" },
  });

  const plusBtn = el("button", {
    className: "card-plus",
    text: "+",
    attrs: { "aria-label": "Aggiungi a una playlist", type: "button" },
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
    {
      className: "card",
      attrs: {
        "data-track-id": track.trackId,
        "data-explicit": track.trackExplicitness === "explicit",
      },
    },
    el("div", { className: "card-image-wrap" }, cover),
    el("h3", { className: "card-title", text: track.trackName ?? "Sconosciuto" }),
    artistLink(track.artistName, track.artistId),
    playBtn,
    heartBtn,
    plusBtn
  );

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

  card.addEventListener("click", () => {
    player.play(track, rowTracks);
    updateHistory();
  });

  heartBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFavourite(track);

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

/* ============================ Carosello ============================ */

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
  new MutationObserver(updateArrows).observe(track, { childList: true });
  requestAnimationFrame(updateArrows);

  return el("div", { className: "carousel" }, prevBtn, track, nextBtn);
};

const renderRow = (rowTitle, items, id = rowTitle, type = "track") => {
  if (!items.length) return null;

  const validItems =
    type === "track"
      ? items.filter((t) => t.previewUrl)
      : items.filter((a) => a.collectionId);

  if (!validItems.length) return null;

  const renderer = type === "album" ? renderAlbumCard : renderCard;
  const grid = el("div", { className: "grid carousel-track", id }, ...validItems.map(renderer));

  const section = el(
    "article",
    { className: "row", attrs: { "data-row": id } },
    el("h2", { text: rowTitle }),
    buildCarousel(grid)
  );

  home.append(section);
  return section;
};

function updateFavs() {
  renderSidebarFavs();

  const favourites = [...getFavourites()].reverse().slice(0, 12);
  const existing = $('[data-row="Preferiti"]');

  if (!favourites.length) {
    existing?.remove();
    return;
  }

  if (existing) {
    existing.querySelector(".grid").replaceChildren(...favourites.map(renderCard));
    return;
  }

  const section = renderRow("Preferiti", favourites);
  if (!section) return;
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
  if (section) home.prepend(section);
}

/* ============================ Hero: artisti suggeriti ============================ */

const HERO_ARTISTS = 9; // quanti artisti suggerire (1 grande + gli altri nella fila)

// Cerca un artista per nome e ne ricava l'id (serve per "Scopri di più" e "Casuale")
const resolveArtist = async (name) => {
  try {
    const res = await fetch(`${API_BASE}/search?term=${encodeURIComponent(name)}&entity=musicArtist&limit=1`);
    const data = await res.json();
    const a = data.results?.[0];
    if (!a) return null;
    return { artistId: a.artistId, artistName: a.artistName, primaryGenreName: a.primaryGenreName };
  } catch {
    return null;
  }
};

/*
  pickSuggestedArtists(tracks, history)
  - Con la cronologia vuota usa gli artisti scelti alla registrazione.
    Quelli che non compaiono nei brani vengono cercati per nome, così hanno sempre un artistId.
    Se non se ne ottiene nessuno, si passa alla logica standard.
  - Altrimenti prende gli artisti dei brani suggeriti, preferendo quelli mai ascoltati.
*/
const pickSuggestedArtists = async (tracks, history) => {
  if (!history?.length) {
    const selected = getSelected("selected_artists");
    if (selected.length) {
      const resolved = await Promise.all(
        selected.slice(0, HERO_ARTISTS).map((name) => {
          const t = tracks.find((track) => track.artistName === name);
          if (t?.artistId) {
            return { artistId: t.artistId, artistName: t.artistName, primaryGenreName: t.primaryGenreName };
          }
          return resolveArtist(name);
        })
      );

      const unique = new Map();
      for (const a of resolved) {
        if (a?.artistId && !unique.has(a.artistId)) unique.set(a.artistId, a);
      }
      if (unique.size) return [...unique.values()];
    }
  }

  const listened = new Set((history ?? []).map((t) => t.artistId));
  const unique = new Map();

  for (const t of tracks) {
    if (!t.artistId || unique.has(t.artistId)) continue;
    unique.set(t.artistId, {
      artistId: t.artistId,
      artistName: t.artistName,
      primaryGenreName: t.primaryGenreName,
    });
  }

  const all = [...unique.values()];
  const fresh = all.filter((a) => !listened.has(a.artistId));
  return (fresh.length >= 3 ? fresh : all).slice(0, HERO_ARTISTS);
};

/*
  renderHero(artists)
  - Ogni chiamata annulla la precedente (AbortController): listener e fetch della vecchia
    chiamata si fermano, così dopo "tastes:changed" non si sommano.
  - Dopo ogni await si controlla signal.aborted: una chiamata annullata non tocca più il DOM.
*/
let heroAbort = null;

const renderHero = async (artists) => {
  const hero = $("#home-hero");
  const valid = (artists ?? []).filter((a) => a?.artistId);
  if (!hero || !valid.length) return;

  heroAbort?.abort();
  heroAbort = new AbortController();
  const { signal } = heroAbort;

  try {
    const pics = await Promise.all(valid.map((a) => getArtistPicture(a.artistName)));
    if (signal.aborted) return;

    const withPics = valid
      .map((artist, i) => ({ ...artist, pic: pics[i] }))
      .sort((a, b) => Boolean(b.pic) - Boolean(a.pic)); 

    const bg = $("#home-hero-bg");
    const shuffleBtn = $("#hero-shuffle");
    let songs = [];  
    let showId = 0;  

    const showArtist = async (artist) => {
      const myId = ++showId;

      bg.classList.add("is-changing");
      setTimeout(() => {
        bg.style.backgroundImage = artist.pic ? `url("${artist.pic}")` : "";
        bg.classList.remove("is-changing");
      }, 300);

      $("#hero-artist-name").textContent = artist.artistName;
      $("#hero-artist-sub").textContent = artist.primaryGenreName ?? "Musica";
      $("#hero-more").href = `artist.html?id=${artist.artistId}`;

      document.querySelectorAll("#hero-artists .card").forEach((card) => {
        card.classList.toggle("is-active", card.dataset.artistId === String(artist.artistId));
      });

      shuffleBtn.disabled = true;
      let found = [];
      try {
        const res = await fetch(`${API_BASE}/lookup?id=${artist.artistId}&entity=song&limit=25`, { signal });
        const data = await res.json();
        found = data.results.filter((r) => r.wrapperType === "track" && r.previewUrl);
      } catch (err) {
        if (err.name === "AbortError") return;
      }
      if (signal.aborted || myId !== showId) return;

      songs = found;
      shuffleBtn.disabled = !songs.length;
    };

    shuffleBtn.addEventListener(
      "click",
      () => {
        if (!songs.length) return;
        const random = songs[Math.floor(Math.random() * songs.length)];
        player.play(random, songs);
        updateHistory();
      },
      { signal }
    );

    const track = $("#hero-artists");
    track.replaceChildren(
      ...withPics.map((artist) => {
        const card = el(
          "div",
          {
            className: "card",
            attrs: { "data-artist-id": artist.artistId, role: "button", tabindex: "0" },
          },
          el(
            "div",
            { className: "card-image-wrap round" },
            el("img", {
              attrs: {
                src: artist.pic || "assets/img/placeholderArtist.png",
                alt: artist.artistName ?? "Artista",
                loading: "lazy",
              },
            })
          ),
          el("h3", { className: "card-title", text: artist.artistName ?? "Artista" }),
          el("p", { className: "card-sub", text: artist.primaryGenreName ?? "Artista" })
        );
        card.addEventListener("click", () => showArtist(artist));
        card.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            showArtist(artist);
          }
        });
        return card;
      })
    );

    const prevBtn = $("#hero-artists-prev");
    const nextBtn = $("#hero-artists-next");
    const updateArrows = () => {
      prevBtn.disabled = track.scrollLeft <= 0;
      nextBtn.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
    };
    prevBtn.addEventListener("click", () => track.scrollBy({ left: -track.clientWidth }), { signal });
    nextBtn.addEventListener("click", () => track.scrollBy({ left: track.clientWidth }), { signal });
    track.addEventListener("scroll", updateArrows, { signal });
    window.addEventListener("resize", updateArrows, { signal });

    await showArtist(withPics[0]);
    if (signal.aborted) return;

    hero.hidden = false;
    updateArrows(); 
  } catch (err) {
    if (err.name === "AbortError") return;
    console.error("Errore nel caricamento dell'hero:", err);
  }
};

/* ============================ Card album ============================ */

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

  const cover = el("img", {
    attrs: {
      src: (album.artworkUrl100 || "").replace("100x100", "300x300"),
      alt: album.collectionName ?? "",
      loading: "lazy",
    },
  });

  const plusBtn = el("button", {
    className: "card-plus",
    text: "+",
    attrs: { "aria-label": "Aggiungi a una playlist", type: "button" },
  });

  const card = el(
    "div",
    { className: "card", attrs: { "data-collection-id": album.collectionId } },
    el("div", { className: "card-image-wrap" }, cover),
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

    updateFavs();
  });

  card.addEventListener("click", () => {
    window.location.href = "album.html?id=" + album.collectionId;
  });

  return card;
};

/* ============================ Caricamento home ============================ */

const MAX_GENRES = 3;

function countGenres(genres) {
  const counts = new Map();
  for (const g of genres) {
    if (!g) continue;
    counts.set(g, (counts.get(g) ?? 0) + 1);
  }
  return counts;
}

function genrePercentage(ranked) {
  const total = ranked.reduce((sum, [, count]) => sum + count, 0);
  if (!total) return [];

  const rows = ranked.map(([genre, count]) => {
    const exact = (count / total) * 100;
    return { genre, pct: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });

  const missing = 100 - rows.reduce((sum, r) => sum + r.pct, 0);

  [...rows]
    .sort((a, b) => b.remainder - a.remainder)
    .slice(0, missing)
    .forEach((r) => r.pct++);

  return rows.map(({ genre, pct }) => [genre, pct]);
}

// Ogni loadHome ha un numero: se ne parte una nuova mentre la vecchia è ancora in corso,
// la vecchia si ferma prima di scrivere nel DOM (niente righe duplicate)
let loadToken = 0;

const loadHome = async () => {
  const myToken = ++loadToken;

  const history = getHistory().reverse().slice(0, 12);
  const favourites = [...getFavourites()].reverse().slice(0, 12);

  const genres = history.map((t) => t.primaryGenreName).filter(Boolean);
  const ranked = [...countGenres(genres)].sort((a, b) => b[1] - a[1]);

  // Generi scelti alla registrazione, oppure pop/rock se non c'è nulla
  const selectedGenres = getSelected("selected_genres");
  const fallbackGenres = selectedGenres.length ? selectedGenres : ["pop", "rock"];

  const uniqueGenres = [...new Set([...ranked.map((r) => r[0]), ...fallbackGenres])];
  const topGenres = uniqueGenres.slice(0, MAX_GENRES);

  const [songResults, albumResults] = await Promise.all([
    Promise.all(
      topGenres.map((genre) =>
        fetchModular(genre, { media: "music", entity: "song", attribute: "genreIndex", limit: 12 })
      )
    ),
    Promise.all(
      topGenres.map((genre) =>
        fetchModular(genre, { media: "music", entity: "album", limit: 8 })
      )
    ),
  ]);

  if (myToken !== loadToken) return; // nel frattempo è partito un altro caricamento

  const playedTrackIds = new Set(history.map((t) => t.trackId));
  const playedAlbumIds = new Set(history.map((t) => t.collectionId));

  const songRows = songResults.map((row) => row.filter((t) => !playedTrackIds.has(t.trackId)));
  const albumRows = albumResults.map((row) => row.filter((a) => !playedAlbumIds.has(a.collectionId)));

  renderRow("Riprodotti di recente", history);
  renderRow("Preferiti", favourites);

  topGenres.forEach((genre, i) => {
    if (songRows[i]?.length) {
      renderRow(`Suggerimenti Canzoni: ${genre}`, songRows[i], `Suggerimenti Canzoni: ${genre}`, "track");
    }
  });

  topGenres.forEach((genre, i) => {
    if (albumRows[i]?.length) {
      renderRow(`Suggerimenti Album: ${genre}`, albumRows[i], `Suggerimenti Album: ${genre}`, "album");
    }
  });

  const artists = await pickSuggestedArtists(songRows.flat(), history);
  if (myToken !== loadToken) return;

  renderHero(artists);
};


loadHome();



// Dopo la scelta dei gusti (evento emesso da new-user.js) la home si ridisegna
document.addEventListener("tastes:changed", () => {
  home.querySelectorAll("article.row").forEach((row) => row.remove());
  loadHome();
});
