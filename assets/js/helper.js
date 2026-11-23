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
    document.querySelector(selector);
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



//term = qualsiasi stringa
//entity = ["musicArtist", "musicTrack", "album", "musicVideo", "mix", "song"]