export const API_BASE = "https://itunes.apple.com";
const STORAGE_KEY_HISTORY = "epitunes_history";
const STORAGE_KEY_FAVOURITES = "epitunes_favourites";
export const STORAGE_KEY_LAST_SEARCH = "epitunes_last_search";
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


