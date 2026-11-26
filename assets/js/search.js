/* ============================================================
   search.js — ricerca con debounce
   ============================================================

   COSA DEVI FARE
   1) initPage("search")
   2) Recupera l'ultima query da localStorage (STORAGE_KEY_LAST_SEARCH).
      Se presente, popola l'input e lancia la ricerca.
   3) Aggancia l'evento "input" all'input #search-input con debounce 400ms.
   4) doSearch(term):
      - se term è vuoto -> nascondi i 3 row e svuota i grid
      - altrimenti fetch in PARALLELO (Promise.all):
          - tracks   = search?term=...&entity=song&limit=12
          - albums   = search?term=...&entity=album&limit=8
          - artists  = search?term=...&entity=musicArtist&limit=8
      - mostra ciascuna sezione solo se i risultati sono > 0
      - salva l'ultima query in localStorage
   5) Per ogni risultato crea una card:
      - track  -> click = player.play(track)
      - album  -> click = window.location.href = "album.html?id=" + albumId
      - artist -> click = window.location.href = "artist.html?id=" + artistId
*/

import { initPage, renderSidebarFavs, renderSidebarPlaylists, artistLink } from "./common.js";
import {
  API_BASE,
  el,
  $,
  debounce,
  fetchItem,
  fetchByGenre,
  fetchModular,
  isFavourite,
  toggleFavourite,
  getFavourites,
  STORAGE_KEY_LAST_SEARCH,
  getArtistPicture,
  addTrackToPlaylist,
  showPlaylistModal
} from "./helper.js";

const player = initPage("search");

const input = document.querySelector("#search-input");
const rowTracks = document.querySelector("#row-tracks");
const rowAlbums = document.querySelector("#row-albums");
const rowArtists = document.querySelector("#row-artists");
const gridTracks = document.querySelector("#grid-tracks");
const gridAlbums = document.querySelector("#grid-albums");
const gridArtists = document.querySelector("#grid-artists");

/*
  renderCard(track, _index, rowTracks)
  - Viene chiamata con .map(renderCard): map passa anche l'indice e l'array intero,
    quindi rowTracks sono tutti i brani trovati.
  - Al click il brano parte con quella lista: avanti/indietro scorrono i risultati della ricerca.
*/
const renderCard = (track, _index, rowTracks) => {
  // Cuore: .card-fav lo mette a destra di titolo e artista;
  // .is-fav lo colora di rosso mattone e lo lascia sempre visibile
  const heartBtn = el("button", {
    className: isFavourite(track) ? "card-fav is-fav" : "card-fav",
    text: isFavourite(track) ? "♥" : "♡",
    attrs: { "aria-label": "Preferito", type: "button" },
  });

  // Play: cerchio trasparente al centro della copertina, compare con l'hover
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

  const card = el(
    "div",
    {
      className: "card",
      attrs: { "data-explicit": track.trackExplicitness === "explicit" }
    },
    el("div", { className: "card-image-wrap" }, cover),
    el("h3", {
      className: "card-title",
      text: track.trackName ?? "Sconosciuto",
    }),
    artistLink(track.artistName, track.artistId),
    playBtn,
    heartBtn,

  );



  // click sulla card (e sul play) -> riproduce
  card.addEventListener("click", () => {
    player.play(track, rowTracks);
  });

  // click sul cuore -> preferito, senza far partire il brano
  heartBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFavourite(track);
    renderSidebarFavs();
    heartBtn.textContent = isFavourite(track) ? "♥" : "♡";
    heartBtn.classList.toggle("is-fav", isFavourite(track));
  });
  // Bottone +: aggiunge il brano a una playlist (in alto a destra sulla copertina)
  const plusBtn = el("button", {
    className: "card-plus",
    text: "+",
    attrs: { "aria-label": "Aggiungi a una playlist", type: "button" },
  });

  // click sul + -> sceglie la playlist in cui aggiungere il brano (come in home)
  plusBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showPlaylistModal(track, (playlistId) => {
      const added = addTrackToPlaylist(playlistId, track);
      if (added) document.dispatchEvent(new Event("playlists:changed"));
      renderSidebarPlaylists();
    });
  });

  card.append(plusBtn);

  return card;
};

const getAlbumTracks = async (collectionId) => {
  if (!collectionId) return [];
  try {
    const res = await fetch(`${API_BASE}/lookup?id=${encodeURIComponent(collectionId)}&entity=song`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).filter((item) => item.wrapperType === "track");
  } catch (err) {
    console.error("Errore recupero brani album:", err);
    return [];
  }
};

// true solo se l'album ha tracce e sono tutte nei preferiti
const allSaved = (tracks) => tracks.length > 0 && tracks.every((t) => isFavourite(t));

const setHeart = (btn, filled) => {
  btn.textContent = filled ? "♥" : "♡";
  btn.classList.toggle("is-fav", filled);
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
    attrs: {
      type: "button",
      "aria-label": "Aggiungi album a una playlist",
    },
  });

  const heartBtn = el("button", {
    className: "card-fav",
    text: "♡",
    attrs: {
      type: "button",
      "aria-label": "Album preferito",
    },
  });

  getAlbumTracks(album.collectionId).then((tracks) => setHeart(heartBtn, allSaved(tracks)));

  const card = el(
    "div",
    {
      className: "card",
      attrs: { "data-collection-id": album.collectionId },
    },
    el("div", { className: "card-image-wrap" }, cover),
    el("h3", {
      className: "card-title",
      text: album.collectionName ?? "Sconosciuto",
    }),
    artistLink(album.artistName, album.artistId),
    plusBtn,
    heartBtn
  );

  plusBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    const tracks = await getAlbumTracks(album.collectionId);
    if (!tracks.length) return;

    showPlaylistModal(album, (playlistId) => {
      let anyAdded = false;
      for (const track of tracks) {
        if (addTrackToPlaylist(playlistId, track)) {
          anyAdded = true;
        }
      }
      if (anyAdded) document.dispatchEvent(new Event("playlists:changed"));
      renderSidebarPlaylists();
    }, tracks);
  });

  heartBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    const tracks = await getAlbumTracks(album.collectionId);
    if (!tracks.length) return;

    const allFavs = tracks.every((t) => isFavourite(t));
    for (const track of tracks) {
      if (allFavs) {
        if (isFavourite(track)) toggleFavourite(track);
      } else {
        if (!isFavourite(track)) toggleFavourite(track);
      }
    }

    const nowAllFavs = tracks.every((t) => isFavourite(t));
    document
      .querySelectorAll(`.card[data-collection-id="${album.collectionId}"] .card-fav`)
      .forEach((btn) => {
        btn.textContent = nowAllFavs ? "♥" : "♡";
        btn.classList.toggle("is-fav", nowAllFavs);
      });

    renderSidebarFavs();
  });

  card.addEventListener("click", () => {
    window.location.href = "album.html?id=" + album.collectionId;
  });

  return card;
};

const renderArtistCard = (artist, pic) => {
  const frame = el("img", {
    attrs: {
      // percorso senza "/" iniziale: con la "/" su GitHub Pages l'immagine non si trova
      src: pic || "assets/img/placeholderArtist.png",
      alt: artist.artistName ?? "Artista",
      loading: "lazy",
    },
  });

  const card = el(
    "div",
    { className: "card" },
    el("div", { className: "card-image-wrap" }, frame),
    el("h3", {
      className: "card-title",
      text: artist.artistName ?? "Artista sconosciuto",
    }),
    el("p", {
      className: "card-sub",
      text: artist.primaryGenreName ?? "Artista",
    }),
  );

  card.addEventListener("click", () => {
    window.location.href = "artist.html?id=" + artist.artistId;
  });

  return card;
};

// scarica le foto in parallelo e scarta i duplicati
const buildArtistCards = async (artistsList) => {
  const withPics = await Promise.all(
    artistsList.map(async (artist) => ({
      artist,
      pic: await getArtistPicture(artist.artistName),
    })),
  );

  const seenIds = new Set();
  const seenPics = new Set();

  return withPics
    .filter(({ artist, pic }) => {
      if (seenIds.has(artist.artistId)) return false; // stesso artista ripetuto
      seenIds.add(artist.artistId);

      if (pic) {
        if (seenPics.has(pic)) return false; // stessa immagine di un altro
        seenPics.add(pic);
      }
      return true; // i null (senza foto) non si confrontano tra loro
    })
    .map(({ artist, pic }) => renderArtistCard(artist, pic));
};

let lastTerm = "";

const showRows = (visible) => {
  [rowTracks, rowAlbums, rowArtists].forEach((row) => (row.hidden = !visible));
};

const doSearch = async (term) => {
  lastTerm = term;
  localStorage.setItem(STORAGE_KEY_LAST_SEARCH, term);

  if (!term) {
    gridTracks.replaceChildren();
    gridAlbums.replaceChildren();
    gridArtists.replaceChildren();
    showRows(false);
    return;
  }

  const [results, albums, artists] = await Promise.all([
    fetchModular(term, { media: "music", entity: "song", limit: 12 }),
    fetchModular(term, { media: "music", entity: "album", limit: 8 }),
    fetchModular(term, {
      media: "music",
      entity: "musicArtist",
      attribute: "artistTerm",
      limit: 8,
    }),
  ]);

  if (term !== lastTerm) return;

  const tracks = results.filter((t) => t.previewUrl);
  const albumList = albums.filter((a) => a.collectionName && a.collectionId);
  const artistsList = artists.filter((a) => a.artistName && a.artistId);

  const artistCards = await buildArtistCards(artistsList);

  // le foto degli artisti richiedono tempo: se intanto l'utente ha scritto altro, questi risultati sono vecchi
  if (term !== lastTerm) return;

  gridTracks.replaceChildren(...tracks.map(renderCard));
  gridAlbums.replaceChildren(...albumList.map(renderAlbumCard));
  gridArtists.replaceChildren(...artistCards);

  rowTracks.hidden = tracks.length === 0;
  rowAlbums.hidden = albumList.length === 0;
  rowArtists.hidden = artistCards.length === 0;
};

const debouncedSearch = debounce(doSearch, 400);

input.addEventListener("input", (event) => {
  debouncedSearch(event.target.value.trim());
});

// TODO: al caricamento, recupera l'ultima query da localStorage e lancia doSearch(lastQuery)

const lastQuery = localStorage.getItem(STORAGE_KEY_LAST_SEARCH);
if (lastQuery) {
  input.value = lastQuery;
  doSearch(lastQuery);
}