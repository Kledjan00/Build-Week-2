export const API_BASE = "https://itunes.apple.com";
const STORAGE_KEY_HISTORY = "epitunes_history";
const STORAGE_KEY_FAVOURITES = "epitunes_favourites";
const STORAGE_KEY_PLAYLISTS = "epitunes_playlists";
export const STORAGE_KEY_LAST_SEARCH = "epitunes_last_search";
const STORAGE_KEY_TRACKLIST = "epitunes_tracklist";
const MAX_HISTORY = 12;

export function el(tag, { className, id, text, attrs, style } = {}, ...children) {
    const node = document.createElement(tag);
    if (className) node.className += className;
    if (id) node.id = id;
    if (text !== undefined) node.textContent = text;
    if (attrs) {
        for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    }
    if (style) Object.assign(node.style, style);
    node.append(...children);
    return node;
}

export function $(selector) {
    return document.querySelector(selector);
}

export function debounce(fn, delay = 400) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

export async function fetchItem(term, entity = "song", limit = 25) {
    try {
        const res = await fetch(
            `${API_BASE}/search?term=${encodeURIComponent(term)}&media=music&entity=${encodeURIComponent(entity)}&limit=${limit}`
        );
        const data = await res.json();
        return data.results;
    } catch (err) {
        console.error("Errore nel recupero dei brani:", err);
        return [];
    }
}

export async function fetchByGenre(genre, entity = "song", limit = 25) {
    try {
        const res = await fetch(
            `${API_BASE}/search?term=${encodeURIComponent(genre)}&media=music&entity=${encodeURIComponent(entity)}&attribute=genreIndex&limit=${limit}`
        );
        const data = await res.json();
        return data.results;
    } catch (err) {
        console.error("Errore nel recupero dei brani:", err);
        return [];
    }
}

export async function fetchModular(
    term = "Frank Sinatra",
    { media, entity, attribute, limit } = {},
) {
    const params = new URLSearchParams({ term });

    if (media) params.append("media", media);
    if (entity) params.append("entity", entity);
    if (attribute) params.append("attribute", attribute);
    if (limit) params.append("limit", limit);

    try {
        const res = await fetch(`${API_BASE}/search?${params}`);
        const data = await res.json();
        return data.results;
    } catch (err) {
        console.error("Errore nel recupero dei brani:", err);
        return [];
    }
}

export function historyLog(historyArray, track) {
    const filtered = (historyArray ?? []).filter((t) => t.trackId !== track.trackId);
    filtered.push(track);
    if (filtered.length > MAX_HISTORY) filtered.shift();
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(filtered));
    return filtered;
}

export function historyDump() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY)) || [];
    } catch {
        return [];
    }
}

export function historyClear() {
    localStorage.removeItem(STORAGE_KEY_HISTORY);
}

export function getFavourites() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY_FAVOURITES)) || [];
    } catch {
        return [];
    }
}

export function isFavourite(track) {
    return getFavourites().some((t) => t.trackId === track.trackId);
}

export function toggleFavourite(track) {
    const favs = getFavourites();
    const exists = favs.some((t) => t.trackId === track.trackId);
    const updated = exists
        ? favs.filter((t) => t.trackId !== track.trackId)
        : [...favs, track];
    localStorage.setItem(STORAGE_KEY_FAVOURITES, JSON.stringify(updated));
    return !exists;
}

export function setPlaylist(playlist) {
    const playlists = getPlaylist();
    playlists.push(playlist);
    localStorage.setItem(STORAGE_KEY_PLAYLISTS, JSON.stringify(playlists));
}

export function getPlaylist() {
    try {
        const playlists = JSON.parse(localStorage.getItem(STORAGE_KEY_PLAYLISTS)) || [];
        return playlists.map(({ tracks, ...playlist }) => ({
            ...playlist,
            trackList: [...(playlist.trackList ?? []), ...(tracks ?? [])],
        }));
    } catch {
        return [];
    }
}

export function addTrackToPlaylist(playlistId, track) {
    const playlists = getPlaylist();
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return false;

    if (playlist.trackList.some((t) => t.trackId === track.trackId)) return false;

    playlist.trackList.push(track);
    localStorage.setItem(STORAGE_KEY_PLAYLISTS, JSON.stringify(playlists));
    return true;
}

export function removeTrackFromPlaylist(playlistId, trackId) {
    const playlists = getPlaylist();
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return false;

    playlist.trackList = playlist.trackList.filter((t) => t.trackId !== trackId);
    localStorage.setItem(STORAGE_KEY_PLAYLISTS, JSON.stringify(playlists));
    return true;
}


export function killPLaylist(id) {
    const filtered = getPlaylist().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY_PLAYLISTS, JSON.stringify(filtered));
    document.dispatchEvent(new Event("playlists:changed"));
}


export function renamePlaylist(playlistId, newTitle) {
    const playlists = getPlaylist();
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return false;

    playlist.title = newTitle;
    localStorage.setItem(STORAGE_KEY_PLAYLISTS, JSON.stringify(playlists));
    return true;
}


export const getArtistPicture = async (term) => {
    try {
        const response = await fetch(
            `https://www.theaudiodb.com/api/v1/json/123/search.php?s=${encodeURIComponent(term)}`,
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const results = await response.json();
        const result = results.artists?.[0]?.strArtistThumb || null;

        return result;
    } catch (err) {
        console.error("Errore api:", err);
        return null;
    }
};

export function setCurrentTrackList(tracklist) {
    localStorage.setItem(STORAGE_KEY_TRACKLIST, JSON.stringify(tracklist));
}

export function getCurrentTrackList() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_TRACKLIST)) || [];
}


export function getSelected(key) {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    try {
        const value = JSON.parse(raw);
        return Array.isArray(value) ? value : [];
    } catch {
        return raw.split(",").filter(Boolean);
    }
}

/*
  showPlaylistModal(item, onSelect, albumTracks)
  - Modale "Aggiungi a playlist", stessa grafica delle altre modali (welcome-box)
  - Elenca solo le playlist che non contengono già il brano (o l'album intero)
  - Ogni playlist è un pulsante con copertina del primo brano, titolo e numero di brani
  - In fondo "Nuova playlist": al clic diventa un campo; con Invio crea la playlist
*/
export const showPlaylistModal = (item, onSelect, albumTracks = null) => {
    document.querySelector(".playlist-modal-overlay")?.remove();

    const isAlbum = Array.isArray(albumTracks) && albumTracks.length > 0;

    const createPlusIcon = () => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "icon");
        const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
        use.setAttribute("href", "#ico-plus");
        svg.append(use);
        return el("span", { className: "ico", attrs: { "aria-hidden": "true" } }, svg);
    };

    const isAlreadyInPlaylist = (pl) => {
        const list = pl.trackList ?? [];
        if (isAlbum) {
            return albumTracks.every((t) => list.some((pt) => pt.trackId === t.trackId));
        }
        return list.some((t) => t.trackId === item.trackId);
    };

    // Esc chiude la modale, come le altre (ma se si sta scrivendo il nome di una nuova playlist,
    // Esc chiude solo il campo: lì lo gestisce il keydown dell'input)
    const onKeydown = (e) => {
        if (e.key === "Escape" && !e.target.classList.contains("pl-modal-input")) close();
    };
    document.addEventListener("keydown", onKeydown);

    // chiude la modale e toglie il listener di Esc, così non resta attivo dopo
    const close = () => {
        overlay.remove();
        document.removeEventListener("keydown", onKeydown);
    };

    const listEl = el("ul", { className: "pl-modal-list" });

    const renderRow = (pl) => {
        const firstTrack = pl.trackList?.[0];
        const cover = firstTrack?.artworkUrl100
            ? el("img", { className: "pl-modal-cover", attrs: { src: firstTrack.artworkUrl100, alt: "" } })
            : el("span", { className: "pl-modal-cover", attrs: { "aria-hidden": "true" } });

        const count = pl.trackList?.length ?? 0;

        const btn = el("button", { className: "pl-modal-item", attrs: { type: "button" } },
            cover,
            el("span", { className: "pl-modal-info" },
                el("span", { className: "pl-modal-name", text: pl.title }),
                el("span", { className: "pl-modal-count", text: count === 1 ? "1 brano" : `${count} brani` })
            ),
            createPlusIcon()
        );

        btn.addEventListener("click", () => {
            onSelect(pl.id);
            close();
        });

        return el("li", {}, btn);
    };

    const renderList = () => {
        const playlists = getPlaylist();
        const availablePlaylists = playlists.filter((pl) => !isAlreadyInPlaylist(pl));

        if (playlists.length === 0) {
            listEl.replaceChildren(el("li", { className: "pl-modal-empty", text: "Nessuna playlist disponibile" }));
        } else if (availablePlaylists.length === 0) {
            listEl.replaceChildren(el("li", {
                className: "pl-modal-empty",
                text: isAlbum ? "L'album è già presente in tutte le playlist" : "Il brano è già in tutte le playlist",
            }));
        } else {
            listEl.replaceChildren(...availablePlaylists.map(renderRow));
        }
    };

    const newPlaylistBtn = el("button", { className: "pl-modal-new", attrs: { type: "button" } },
        createPlusIcon(),
        el("span", { text: "Nuova playlist" })
    );
    const createWrap = el("div", { className: "pl-modal-create" }, newPlaylistBtn);

    newPlaylistBtn.addEventListener("click", () => {
        const input = el("input", {
            className: "pl-modal-input",
            attrs: { type: "text", placeholder: "Titolo playlist", "aria-label": "Titolo playlist" },
        });

        createWrap.replaceChildren(input);
        input.focus();

        input.addEventListener("keydown", (e) => {
            if (e.key === "Escape") return createWrap.replaceChildren(newPlaylistBtn);
            if (e.key !== "Enter") return;

            const title = input.value.trim();
            createWrap.replaceChildren(newPlaylistBtn);
            if (!title) return;

            const newPlaylist = {
                id: self.crypto.randomUUID(),
                title,
                trackList: [],
            };
            const currentPlaylists = getPlaylist();
            currentPlaylists.push(newPlaylist);
            localStorage.setItem(STORAGE_KEY_PLAYLISTS, JSON.stringify(currentPlaylists));
            document.dispatchEvent(new Event("playlists:changed"));
            renderList();
        });
    });

    renderList();

    const closeBtn = el("button", {
        className: "welcome-close",
        text: "×",
        attrs: { type: "button", "aria-label": "Chiudi" },
    });
    closeBtn.addEventListener("click", close);

    const modalBody = el("div", {
        className: "welcome-box pl-modal-box",
        attrs: { role: "dialog", "aria-modal": "true", "aria-labelledby": "pl-modal-title" },
    },
        closeBtn,
        el("p", { className: "welcome-kicker", text: "Aggiungi a" }),
        el("h2", { className: "welcome-title", id: "pl-modal-title", text: "Le tue playlist" }),
        listEl,
        createWrap
    );

    // welcome-overlay is-open: stesso sfondo scuro e sfocato delle altre modali
    const overlay = el("div", { className: "welcome-overlay is-open playlist-modal-overlay" }, modalBody);

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) close();
    });

    document.body.appendChild(overlay);
};