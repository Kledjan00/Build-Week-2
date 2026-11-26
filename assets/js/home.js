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

import { initPage, renderSidebarFavs, renderSidebarPlaylists, artistLink } from "./common.js";
import {
  API_BASE,
  el,
  $,
  fetchModular,
  historyDump as getHistory,
  getFavourites,
  toggleFavourite,
  isFavourite,
  getPlaylist,
  addTrackToPlaylist,
  getArtistPicture,
  showPlaylistModal
} from "./helper.js";

const player = initPage("home");
const home = document.querySelector(".home");

/*
  renderCard(track, _index, rowTracks)
  - Viene chiamata con .map(renderCard): map passa anche l'indice e l'array intero,
    quindi rowTracks è la lista dei brani della riga in cui sta la card.
  - Al click il brano parte con quella lista: avanti/indietro scorrono i brani della stessa riga.
*/
const renderCard = (track, _index, rowTracks) => {
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

  // Bottone +: aggiunge il brano a una playlist (in alto a destra sulla copertina)
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

  // Stessa struttura delle card scritte nell'HTML: copertina, titolo, artista, play, cuore e +
  const card = el(
    "div",
    {
      className: "card",
      attrs: { "data-track-id": track.trackId },
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
}

/* ============================ Carosello (Lisa) ============================ */

// Icona freccia dello sprite (<svg><use href="#ico-chevron-left|right">).
// Gli SVG vanno creati con createElementNS: el() crea solo elementi HTML
const chevron = (direction) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "icon");
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", `#ico-chevron-${direction}`);
  svg.append(use);
  return svg;
};

/*
  buildCarousel(track)
  - Mette la fila di card (track) dentro un carosello con una freccia per lato
  - Le frecce scorrono di una "pagina" (6 card) alla volta
  - All'inizio e alla fine della fila la freccia corrispondente si disattiva (e il CSS la nasconde)
  - Restituisce il contenitore .carousel da inserire nella sezione
*/
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
  // quando cambiano le card (updateFavs / updateHistory usano replaceChildren) ricalcola le frecce
  new MutationObserver(updateArrows).observe(track, { childList: true });
  // la prima volta va calcolato quando il carosello è già nella pagina (prima le misure sono 0)
  requestAnimationFrame(updateArrows);

  return el("div", { className: "carousel" }, prevBtn, track, nextBtn);
};

const renderRow = (rowTitle, items, id = rowTitle, type = "track") => {
  if (!items.length) return null;

  const validItems = type === "track"
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

  const favourites = getFavourites().filter((t) => t.previewUrl).reverse();
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
  const section = renderRow("Preferiti", [...favourites].reverse());
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


function songLimit(percentage) {
  // minimo 6 card, massimo 24
  return Math.min(24, Math.max(6, Math.floor(percentage / 3)));
}


/* ============================ Hero: artisti suggeriti ============================ */

const HERO_ARTISTS = 9; // quanti artisti suggerire (1 grande + gli altri nella fila)

/*
  pickSuggestedArtists(tracks, history)
  - Prende gli artisti dei brani suggeriti, senza doppioni
  - Esclude quelli che l'utente ha già ascoltato (sono "suggerimenti", quindi artisti nuovi);
    se così ne restano troppo pochi, usa anche quelli già ascoltati
  - Restituisce al massimo HERO_ARTISTS oggetti { artistId, artistName, primaryGenreName }
*/
const pickSuggestedArtists = (tracks, history) => {
  const listened = new Set(history.map((t) => t.artistId));
  const unique = new Map(); // artistId -> artista (Map tiene l'ordine e scarta i doppioni)

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
  - Scarica le foto di tutti gli artisti in parallelo (TheAudioDB) e mette per primi quelli con la foto
  - Il primo va in grande nell'hero, gli altri nella fila "Altri artisti per te"
  - Cliccando un artista della fila, diventa lui l'artista dell'hero
  - "Casuale" fa partire un brano a caso dell'artista mostrato; "⋯" porta alla sua pagina
*/
const renderHero = async (artists) => {
  const hero = $("#home-hero");
  if (!hero || !artists.length) return;

  try {
    // foto di tutti gli artisti, in parallelo
    const pics = await Promise.all(artists.map((a) => getArtistPicture(a.artistName)));
    const withPics = artists
      .map((artist, i) => ({ ...artist, pic: pics[i] }))
      .sort((a, b) => Boolean(b.pic) - Boolean(a.pic)); // prima quelli con la foto

    const bg = $("#home-hero-bg");
    const shuffleBtn = $("#hero-shuffle");
    let songs = []; // brani dell'artista mostrato, per il tasto Casuale

    // Mostra un artista in grande nell'hero
    const showArtist = async (artist) => {
      // dissolvenza della foto: sparisce, cambia immagine, ricompare
      bg.classList.add("is-changing");
      setTimeout(() => {
        bg.style.backgroundImage = artist.pic ? `url("${artist.pic}")` : ""; // senza foto: disco di riserva del CSS
        bg.classList.remove("is-changing");
      }, 300);

      $("#hero-artist-name").textContent = artist.artistName;
      $("#hero-artist-sub").textContent = artist.primaryGenreName ?? "Musica";
      $("#hero-more").href = `artist.html?id=${artist.artistId}`;

      // evidenzia l'artista scelto nella fila
      document.querySelectorAll("#hero-artists .card").forEach((card) => {
        card.classList.toggle("is-active", card.dataset.artistId === String(artist.artistId));
      });

      // brani dell'artista per "Casuale" (il primo risultato di lookup è l'artista stesso)
      shuffleBtn.disabled = true;
      try {
        const data = await fetch(`${API_BASE}/lookup?id=${artist.artistId}&entity=song&limit=25`).then((r) => r.json());
        songs = data.results.filter((r) => r.wrapperType === "track" && r.previewUrl);
      } catch {
        songs = [];
      }
      shuffleBtn.disabled = !songs.length;
    };

    // Casuale: un brano a caso dell'artista mostrato
    shuffleBtn.addEventListener("click", () => {
      if (!songs.length) return;
      const random = songs[Math.floor(Math.random() * songs.length)];
      player.play(random, songs); // avanti/indietro scorrono i brani dell'artista
      updateHistory();
    });

    // Fila degli artisti: card come quelle della ricerca (foto rotonda, nome, genere).
    // Click -> diventa l'artista dell'hero
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
        // anche con la tastiera: Invio o spazio sulla card selezionata
        card.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            showArtist(artist);
          }
        });
        return card;
      })
    );

    // Frecce ai lati: scorrono di una "pagina" (6 card) alla volta.
    // All'inizio e alla fine della fila la freccia corrispondente si disattiva (e il CSS la nasconde)
    const prevBtn = $("#hero-artists-prev");
    const nextBtn = $("#hero-artists-next");
    const updateArrows = () => {
      prevBtn.disabled = track.scrollLeft <= 0;
      nextBtn.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
    };
    prevBtn.addEventListener("click", () => track.scrollBy({ left: -track.clientWidth }));
    nextBtn.addEventListener("click", () => track.scrollBy({ left: track.clientWidth }));
    track.addEventListener("scroll", updateArrows);
    window.addEventListener("resize", updateArrows);

    await showArtist(withPics[0]);
    hero.hidden = false;
    updateArrows(); // va calcolato quando l'hero è visibile, prima le misure sono 0
  } catch (err) {
    console.error("Errore nel caricamento dell'hero:", err);
    // in caso di errore l'hero resta nascosto e la home funziona lo stesso
  }
};

const renderAlbumCard = (album) => {
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
    { className: "card" },
    el("div", { className: "card-image-wrap" }, cover),
    el("h3", {
      className: "card-title",
      text: album.collectionName ?? "Sconosciuto",
    }),
    artistLink(album.artistName, album.artistId),
    plusBtn
  );

  plusBtn.addEventListener("click", (e) => {
    e.stopPropagation();

    showPlaylistModal(album, (playlistId) => {
      const added = addTrackToPlaylist(playlistId, album);
      if (added) {
        document.dispatchEvent(new Event("playlists:changed"));
      }
      renderSidebarPlaylists();
    });
  });

  card.addEventListener("click", () => {
    window.location.href = "album.html?id=" + album.collectionId;
  });

  return card;
};

const MAX_GENRES = 3;

const loadHome = async () => {
  const history = getHistory().reverse().slice(0, 12);
  const favourites = getFavourites();

  // Estraiamo i generi dai brani ascoltati
  const genres = history.map((t) => t.primaryGenreName).filter(Boolean);
  const ranked = [...countGenres(genres)].sort((a, b) => b[1] - a[1]);

  // Generi di fallback se la history è vuota
  const fallbackGenres = ["Pop", "Rock", "Hip-Hop/Rap", "R&B", "Dance", "Alternative"];

  // Uniamo i generi preferiti dell'utente con i fallback per garantire di avere sempre abbastanza generi unici
  const uniqueGenres = [...new Set([...ranked.map(r => r[0]), ...fallbackGenres])];

  const topGenres = uniqueGenres.slice(0, MAX_GENRES * 2);

  const songGenres = topGenres.slice(0, MAX_GENRES);
  const albumGenres = topGenres.slice(MAX_GENRES, MAX_GENRES * 2);

  // Eseguiamo le fetch in parallelo
  const [songResults, albumResults] = await Promise.all([
    Promise.all(
      songGenres.map((genre) =>
        fetchModular(genre, {
          media: "music",
          entity: "song",
          attribute: "genreIndex",
          limit: 12,
        })
      )
    ),
    Promise.all(
      albumGenres.map((genre) =>
        // Per gli album usiamo la ricerca testuale del genere per garantire risultati affidabili
        fetchModular(genre, {
          media: "music",
          entity: "album",
          limit: 8,
        })
      )
    ),
  ]);

  renderRow("Riprodotti di recente", history);
  renderRow("Preferiti", favourites);

  songGenres.forEach((genre, i) => {
    if (songResults[i]?.length) {
      renderRow(`Suggerimenti Canzoni: ${genre}`, songResults[i], `Suggerimenti Canzoni: ${genre}`, "track");
    }
  });

  albumGenres.forEach((genre, i) => {
    if (albumResults[i]?.length) {
      renderRow(`Suggerimenti Album: ${genre}`, albumResults[i], `Suggerimenti Album: ${genre}`, "album");
    }
  });

  renderHero(pickSuggestedArtists([...songResults.flat()], history));
};

function countGenres(genres) {
  const counts = new Map();
  for (const g of genres) {
    if (!g) continue; // salta undefined / stringhe vuote
    counts.set(g, (counts.get(g) ?? 0) + 1);
  }
  return counts;
}


const history = getHistory().reverse().slice(0, 12);
const genres = history.map((t) => t.primaryGenreName);
const counts = countGenres(genres);
const ranked = [...counts].sort((a, b) => b[1] - a[1]);




console.log(ranked);
console.log(genrePercentage(ranked))

function genrePercentage(ranked) {
  const total = ranked.reduce((sum, [, count]) => sum + count, 0);
  if (!total) return [];

  const rows = ranked.map(([genre, count]) => {
    const exact = (count / total) * 100;
    return { genre, pct: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });

  // punti persi dall'arrotondamento per difetto
  let missing = 100 - rows.reduce((sum, r) => sum + r.pct, 0);

  // li assegno a chi ha il resto più alto
  [...rows]
    .sort((a, b) => b.remainder - a.remainder)
    .slice(0, missing)
    .forEach((r) => r.pct++);

  return rows.map(({ genre, pct }) => [genre, pct]);
}


loadHome();