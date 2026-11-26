import { renderSidebarPlaylists } from "./common.js"

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
        for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v); //k, v da sostituire
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
            `https://itunes.apple.com/search?term=${term}&media=music&entity=${entity}&limit=${limit}`
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
            `https://itunes.apple.com/search?term=${genre}&media=music&entity=${entity}&attribute=genreIndex&limit=${limit}`  //attribute=genreIndex fa in modo che "term" sia matchato con la "primaryGenreName" property dell'item invece che con il titolo.
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
    const params = new URLSearchParams({ term }); //ritorna "term=${term}"

    if (media) params.append("media", media);
    if (entity) params.append("entity", entity);
    if (attribute) params.append("attribute", attribute);
    if (limit) params.append("limit", limit);

    try {
        const res = await fetch(`https://itunes.apple.com/search?${params}`
        );
        const data = await res.json();
        return data.results;
    } catch (err) {
        console.error("Errore nel recupero dei brani:", err);
        return [];
    }
}

//term = qualsiasi stringa
//entity = ["musicArtist", "musicTrack", "album", "musicVideo", "mix", "song"]

/*http
    attributi: mixTerm, genreIndex, artistTerm, composerTerm, albumTerm, ratingIndex, songTerm
    ES.
    `https://itunes.apple.com/search?term=${term}&media=music&entity=song&attribute=genreIndex&limit=${limit}`, 
	
	
	
    explicit:	Yes, No  --- Flag per includere contenuti espliciti tra i risultati della ricerca (default: Yes)
    Es.
    https://itunes.apple.com/search?term=venom&media=music&entity=song&explicit=No
*/


//FUNZIONI BASE DEL LOCALE_STORAGE

// history
export function historyLog(historyArray, track) {
    // evita doppioni: se il brano c'è già, lo togliamo e lo rimettiamo in coda
    const filtered = historyArray.filter((t) => t.trackId !== track.trackId);
    filtered.push(track);
    if (filtered.length > MAX_HISTORY) filtered.shift(); // toglie il più vecchio
    localStorage.setItem("STORAGE_KEY_HISTORY", JSON.stringify(filtered));
    historyArray = JSON.parse(localStorage.getItem("STORAGE_KEY_HISTORY"))
}

export function historyDump() {
    try {
        return JSON.parse(localStorage.getItem("STORAGE_KEY_HISTORY")) || [];
    } catch {
        return [];
    }
}

export function historyClear() {
    localStorage.removeItem("STORAGE_KEY_HISTORY");
}

//preferiti
export function getFavourites() {
    try {
        return JSON.parse(localStorage.getItem("STORAGE_KEY_FAVOURITES")) || [];
    } catch {
        return [];
    }
}

export function isFavourite(track) {
    return getFavourites().some((t) => t.trackId === track.trackId); // ritorna true se l'ID della traccia è nei preferiti del localStorage 
}

export function toggleFavourite(track) {
    const favs = getFavourites();
    const exists = favs.some((t) => t.trackId === track.trackId);  //true se la track selezionata è già tra i preferiti 
    const updated = exists
        ? favs.filter((t) => t.trackId !== track.trackId)   // se true restituisce l'array dei preferiti meno la track selezionata
        : [...favs, track]; //se false la aggiunge
    localStorage.setItem("STORAGE_KEY_FAVOURITES", JSON.stringify(updated)); //aggiorna il localStorage
    return !exists; // true se ha aggiunto, false se ha rimosso
}

export function setPlaylist(playlist) {
    const playlists = getPlaylist();
    playlists.push(playlist);
    localStorage.setItem(STORAGE_KEY_PLAYLISTS, JSON.stringify(playlists));
}

export function getPlaylist() {
    try {
        const playlists = JSON.parse(localStorage.getItem(STORAGE_KEY_PLAYLISTS)) || [];
        // le playlist vecchie possono avere i brani in "tracks": li unisco in "trackList"
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



export const showPlaylistModal = (track, onSelect) => {
    document.querySelector(".playlist-modal-overlay")?.remove();

    const playlists = getPlaylist();

    const availablePlaylists = playlists.filter(pl => {
        return !pl.trackList.some(t => t.trackId === track.trackId);
    });

    let listItems;

    if (playlists.length === 0) {
        listItems = [el("li", { className: "list-group-item text-muted fst-italic bg-dark border-secondary", text: "Nessuna playlist disponibile" })];
    } else if (availablePlaylists.length === 0) {
        listItems = [el("li", { className: "list-group-item text-muted fst-italic bg-dark border-secondary", text: "Il brano è già in tutte le playlist" })];
    } else {
        listItems = availablePlaylists.map(pl => {
            const li = el("li", {
                className: "list-group-item list-group-item-action bg-dark text-white border-secondary",
                text: pl.title,
                style: { cursor: "pointer" }
            });

            li.addEventListener("click", () => {
                onSelect(pl.id);
                overlay.remove();
            });

            return li;
        });
    }

    const modalBody = el(
        "div",
        { className: "card bg-dark text-white p-3 shadow-lg border-secondary", style: { maxWidth: "400px", width: "100%" } },
        el("div", { className: "d-flex justify-content-between align-items-center mb-3" },
            el("h5", { className: "m-0", text: "Aggiungi a playlist" }),
            el("button", { className: "btn-close btn-close-white", attrs: { type: "button", "aria-label": "Chiudi" } })
        ),
        el("ul", { className: "list-group list-group-flush bg-transparent" }, ...listItems)
    );

    const closeBtn = modalBody.querySelector(".btn-close");
    if (closeBtn) {
        closeBtn.addEventListener("click", () => overlay.remove());
    }

    const overlay = el(
        "div",
        { className: "playlist-modal-overlay position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center", style: { backgroundColor: "rgba(0,0,0,0.6)", zIndex: "1050" } },
        modalBody
    );

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);
};

