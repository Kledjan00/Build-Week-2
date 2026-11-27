import { initPage, bigArt, formatTime, renderSidebarFavs, renderSidebarPlaylists } from "./common.js";
import { $, el, isFavourite, toggleFavourite, getPlaylist, removeTrackFromPlaylist, killPLaylist, renamePlaylist } from "./helper.js";

const player = initPage("playlist");

const playlistHero = document.querySelector("#playlist-hero");
const tracklist = document.querySelector("#tracklist");

const id = new URLSearchParams(window.location.search).get("id");



const loadPlaylist = () => {
    const playlist = getPlaylist().find((p) => p.id === id);

    if (!playlist) {
        playlistHero.textContent = "Playlist non trovata";
        tracklist.replaceChildren();
        return;
    }

    const tracks = playlist.trackList;
    const firstTrack = tracks[0];
    const totalMs = tracks.reduce((sum, t) => sum + (t.trackTimeMillis || 0), 0);

    const playBtn = el("button", {
        className: "btn-play-big",
        text: "▶",
        attrs: { "aria-label": "Riproduci", type: "button" },
    });
    if (!firstTrack) playBtn.disabled = true;
    playBtn.title = "Avvia la playlist"
    playBtn.addEventListener("click", () => player.play(firstTrack, tracks));

    const renameBtn = el("button", {
        className: "btn-play-big",
        id: "rename-btn",
        attrs: { "aria-label": "Rinomina", type: "button" },
    });
    
    renameBtn.title = "Rinomina la playlist";

    // icona della penna d'oca, presa dallo sprite in playlist.html (#ico-edit).
    // Gli SVG si creano con createElementNS: el() crea solo elementi HTML (e innerHTML non si usa)
    const SVG_NS = "http://www.w3.org/2000/svg";
    const editIcon = document.createElementNS(SVG_NS, "svg");
    editIcon.setAttribute("class", "icon");
    editIcon.setAttribute("aria-hidden", "true");
    const editUse = document.createElementNS(SVG_NS, "use");
    editUse.setAttribute("href", "#ico-edit");
    editIcon.append(editUse);
    renameBtn.append(editIcon);

    renameBtn.addEventListener("click", (e) => {
        e.stopPropagation();

        const input = el("input", {
            className: "form-control playList-title-change",
            attrs: { type: "text", placeholder: "Titolo playlist", "aria-label": "Titolo playlist" },
        });
        input.value = playlist.title;
        $(".hero-title").replaceChildren(input);
        input.focus();
        input.select();

        let closed = false;
        const cancel = () => {
            if (closed) return;
            closed = true;
            loadPlaylist(); // ripristina il titolo
        };

        input.addEventListener("keydown", (ev) => {
            if (ev.key === "Escape") return cancel();
            if (ev.key !== "Enter") return;

            const title = input.value.trim();
            if (!title) return cancel();

            closed = true; 
            renamePlaylist(playlist.id, title);
            document.dispatchEvent(new Event("playlists:changed"));
        });

        input.addEventListener("blur", cancel); // click fuori dall'input
    });

    const delBtn = el("button", {
        className: "btn-delete-big",
        text: "X",
        attrs: { "aria-label": "Elimina", type: "button" },
    });

    delBtn.title = "Elimina la playlist"
    delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        killPLaylist(playlist.id);
        document.dispatchEvent(new Event("playlists:changed"));
        window.location.replace("library.html");
    });

    // Copertina: quella del primo brano, oppure un riquadro vuoto
    const cover = el("div", { className: "album-cover" });
    if (firstTrack) {
        cover.append(
            el("img", { attrs: { src: bigArt(firstTrack.artworkUrl100), alt: playlist.title } })
        );
    }

    playlistHero.replaceChildren(
        cover,
        el("div", { className: "hero-meta" },
            el("p", { className: "hero-kicker", text: "Playlist" }),
            el("h1", { className: "hero-title", text: playlist.title }),
            el("p", {
                className: "hero-sub",
                text: `${tracks.length} brani · ${formatTime(totalMs)}`,
            }),
            el("div", { className: "hero-actions" }, playBtn, renameBtn, delBtn)
        )
    );

    if (!tracks.length) {
        tracklist.replaceChildren(
            el("p", { className: "fst-italic", text: "Playlist vuota" })
        );
        return;
    }

    tracklist.replaceChildren(
        ...tracks.map((track, i) => {
            const rowHeart = el("button", {
                className: isFavourite(track) ? "track-fav is-fav" : "track-fav",
                text: isFavourite(track) ? "♥" : "♡",
                attrs: { "aria-label": "Preferito", type: "button" },
            });

            const removeBtn = el("button", {
                className: "btn btn-sm btn-outline-danger py-0",
                text: "X",
                attrs: {
                    type: "button",
                    "aria-label": `Rimuovi ${track.trackName} dalla playlist`,
                },
            });

            const row = el("div", {
                className: "track-row",
                attrs: {
                    "data-track-id": track.trackId,
                    "data-explicit": track.trackExplicitness === "explicit",
                },
            },
                el("span", { className: "track-num", text: i + 1 }),
                el("span", {
                    className: "track-title",
                    text: `${track.trackName ?? "Sconosciuto"} — ${track.artistName ?? ""}`,
                }),
                el("span", { className: "track-time", text: formatTime(track.trackTimeMillis) }),
                el("span", { className: "d-flex align-items-center gap-2" }, rowHeart, removeBtn)
            );

            row.addEventListener("click", () => player.play(track, tracks));

            rowHeart.addEventListener("click", (e) => {
                e.stopPropagation();
                toggleFavourite(track);
                renderSidebarFavs();
                rowHeart.textContent = isFavourite(track) ? "♥" : "♡";
                rowHeart.classList.toggle("is-fav", isFavourite(track));
            });

            removeBtn.addEventListener("click", (e) => {
                e.stopPropagation(); 
                removeTrackFromPlaylist(playlist.id, track.trackId);
                loadPlaylist();           
                renderSidebarPlaylists(); 
            });

            return row;
        })
    );

    if (player.currentTrack) {
        tracklist
            .querySelector(`.track-row[data-track-id="${player.currentTrack.trackId}"]`)
            ?.classList.add("is-playing");
    }
};

loadPlaylist();

document.addEventListener("playlists:changed", loadPlaylist);
document.addEventListener("playlist:track-removed", loadPlaylist);