import { initPage, renderSidebarFavs, renderSidebarPlaylists, artistLink } from "./common.js";
import {
    el,
    $,
    historyDump as getHistory,
    getFavourites,
    getPlaylist,
    toggleFavourite,
    isFavourite,
    addTrackToPlaylist,
    showPlaylistModal,
    killPLaylist,
} from "./helper.js";

const player = initPage("library");

const counterElement = $("#library-count");

const updateCount = () => {
    if (!counterElement) return;

    const savedIds = new Set([
        ...getFavourites().map((t) => t.trackId),
        ...getPlaylist().flatMap((p) => (p.trackList ?? []).map((t) => t.trackId)),
    ]);

    const n = savedIds.size;
    counterElement.textContent = `${n} ${n === 1 ? "brano salvato" : "brani salvati"}`;
};

const renderCard = (track) => {
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
             attrs: { "data-track-id": track.trackId, "data-explicit": track.trackExplicitness === "explicit" },
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
        player.play(track);
        renderHistory();
    });

    heartBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFavourite(track);
        renderSidebarFavs();
        renderFavourites();
        renderHistory();
    });

    return card;
};

const renderFavListItem = (track, _index, tracks) => {
    const fav = isFavourite(track);

    const cover = el("img", {
        className: "rounded object-fit-cover",
        attrs: {
            src: track.artworkUrl100 || "",
            alt: track.trackName ?? "",
            width: "44",
            height: "44",
            loading: "lazy",
        },
    });

    const heartBtn = el("button", {
        className: fav ? "btn btn-sm btn-danger" : "btn btn-sm btn-outline-danger",
        text: fav ? "♥" : "♡",
        attrs: { type: "button", "aria-label": "Preferito" },
    });

    const plusBtn = el("button", {
        className: "btn btn-sm btn-outline-secondary",
        text: "+",
        attrs: { type: "button", "aria-label": "Aggiungi a una playlist" },
    });

    const info = el(
        "div",
        { className: "flex-grow-1 min-w-0 d-flex flex-column" },
        el("span", { className: "fw-semibold text-truncate", text: track.trackName ?? "Sconosciuto" }),
        el("small", { className: "text-body-secondary text-truncate" }, artistLink(track.artistName, track.artistId))
    );

    const actions = el("div", { className: "d-flex gap-1" }, heartBtn, plusBtn);

    const row = el(
        "li",
        {
            className: "list-group-item list-group-item-action d-flex align-items-center gap-3",
            attrs: { "data-track-id": track.trackId, role: "button", "data-explicit": track.trackExplicitness === "explicit" },
        },
        cover,
        info,
        actions
    );

    row.addEventListener("click", () => {
        player.play(track, tracks);
        renderHistory();
    });

    heartBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFavourite(track);
        renderSidebarFavs();
        renderFavourites();
        renderHistory();
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
};

const renderPlaylistCard = (playlist) => {
    const firstCover = playlist.trackList[0]?.artworkUrl100;

    const cover = el("img", {
        attrs: {
            src: firstCover
                ? firstCover.replace("100x100", "300x300")
                : "assets/img/placeholderArtist.png",
            alt: playlist.title,
            loading: "lazy",
        },
    });

    const removeBtn = el("button", {
        className: "card-plus",
        text: "×",
        attrs: { "aria-label": `Elimina la playlist ${playlist.title}`, type: "button" },
    });

    const card = el(
        "div",
        {
            className: "card",
            attrs: { "data-playlist-id": playlist.id },
        },
        el("div", { className: "card-image-wrap" }, cover),
        el("h3", { className: "card-title", text: playlist.title }),
        el("p", { className: "card-sub", text: `${playlist.trackList.length} brani` }),
        removeBtn
    );

    card.addEventListener("click", () => {
        window.location.href = "playlist.html?id=" + playlist.id;
    });

    removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        killPLaylist(playlist.id);
        document.dispatchEvent(new Event("playlists:changed"));
        renderSidebarPlaylists();
    });

    return card;
};

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

const setupCarousel = (grid) => {
    if (grid.parentElement.classList.contains("carousel")) return;

    const parent = grid.parentElement;
    const nextSibling = grid.nextSibling;

    grid.classList.add("carousel-track");
    parent.insertBefore(buildCarousel(grid), nextSibling);
};

const renderSection = (key, items, renderer) => {
    const grid = $(`#grid-${key}`);
    const empty = $(`#empty-${key}`);
    if (!grid || !empty) return;

    setupCarousel(grid);
    grid.replaceChildren(...items.map(renderer));
    empty.hidden = items.length > 0;
};

const renderPlaylists = () => {
    renderSection("library-playlist", [...getPlaylist()].reverse(), renderPlaylistCard);
    updateCount();
};

const renderFavourites = () => {
    const grid = $("#grid-library-favourites");
    const empty = $("#empty-library-favourites");
    if (!grid || !empty) return;

    const favourites = [...getFavourites()].reverse().filter((t) => t.previewUrl);
    const prevListWrap = $("#library-favs-wrap");
    const prevToggle = $("#library-favs-toggle");
    const collapseEl = $("#library-favs-collapse");
    const wasOpen = collapseEl ? collapseEl.classList.contains("show") : false;

    prevListWrap?.remove();
    prevToggle?.remove();
    grid.hidden = true;
    empty.hidden = favourites.length > 0;

    if (favourites.length) {
        const heading = grid.parentElement.querySelector("h1, h2, h3");
        if (heading) {
            heading.classList.add("d-flex", "align-items-center", "gap-2");
            const toggleBtn = el("button", {
                id: "library-favs-toggle",
                className: "btn btn-sm btn-outline-secondary dropdown-toggle",
                attrs: {
                    type: "button",
                    "data-bs-toggle": "collapse",
                    "data-bs-target": "#library-favs-collapse",
                    "aria-expanded": wasOpen ? "true" : "false",
                    "aria-controls": "library-favs-collapse",
                    "aria-label": "Mostra o nascondi brani preferiti",
                },
            });
            heading.append(toggleBtn);
        }

        const list = el(
            "ul",
            { className: "list-group" },
            ...favourites.map((track, i) => renderFavListItem(track, i, favourites))
        );

        const collapseBox = el(
            "div",
            {
                id: "library-favs-collapse",
                className: wasOpen ? "collapse show" : "collapse",
            },
            list
        );

        const wrap = el("div", { id: "library-favs-wrap", className: "mt-2" }, collapseBox);
        grid.parentElement.insertBefore(wrap, grid);
    }

    updateCount();
};

const renderHistory = () => {
    const history = getHistory().reverse().slice(0, 12).filter((t) => t.previewUrl);
    renderSection("library-history", history, renderCard);
};

document.addEventListener("playlists:changed", renderPlaylists);
document.addEventListener("playlist:track-removed", renderPlaylists);

renderPlaylists();
renderFavourites();
renderHistory();