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
} from "./helper.js";

const player = initPage("library");

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
        player.play(track);
        renderHistory();
    });

    heartBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFavourite(track);
        renderSidebarFavs();
        renderFavourites();
    });

    return card;
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

    const card = el(
        "div",
        {
            className: "card",
            attrs: { "data-playlist-id": playlist.id },
        },
        el("div", { className: "card-image-wrap" }, cover),
        el("h3", { className: "card-title", text: playlist.title }),
        el("p", { className: "card-sub", text: `${playlist.trackList.length} brani` })
    );

    card.addEventListener("click", () => {
        window.location.href = "playlist.html?id=" + playlist.id;
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
};

const renderFavourites = () => {
    const favourites = getFavourites().filter((t) => t.previewUrl).reverse();
    renderSection("library-favourites", favourites, renderCard);
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