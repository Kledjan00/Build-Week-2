import { initPage, bigArt, formatTime, renderSidebarFavs, renderSidebarPlaylists } from "./common.js";
import { el, isFavourite, toggleFavourite, getPlaylist, removeTrackFromPlaylist, setCurrentTrackList } from "./helper.js";

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
    player.getTracklist(tracks);
    const totalMs = tracks.reduce((sum, t) => sum + (t.trackTimeMillis || 0), 0);

    // Play grande: parte dal primo brano (disabilitato se la playlist è vuota)
    const playBtn = el("button", {
        className: "btn-play-big",
        text: "▶",
        attrs: { "aria-label": "Riproduci", type: "button" },
    });
    if (!firstTrack) playBtn.disabled = true;
    playBtn.addEventListener("click", () => player.play(firstTrack));

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
            el("div", { className: "hero-actions" }, playBtn)
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

            // Riga a 4 colonne: numero | titolo | durata | azioni (cuore + X)
            const row = el("div", {
                className: "track-row",
                attrs: { "data-track-id": track.trackId },
            },
                el("span", { className: "track-num", text: i + 1 }),
                el("span", {
                    className: "track-title",
                    text: `${track.trackName ?? "Sconosciuto"} — ${track.artistName ?? ""}`,
                }),
                el("span", { className: "track-time", text: formatTime(track.trackTimeMillis) }),
                el("span", { className: "d-flex align-items-center gap-2" }, rowHeart, removeBtn)
            );

            row.addEventListener("click", () => player.play(track));

            rowHeart.addEventListener("click", (e) => {
                e.stopPropagation();
                toggleFavourite(track);
                renderSidebarFavs();
                rowHeart.textContent = isFavourite(track) ? "♥" : "♡";
                rowHeart.classList.toggle("is-fav", isFavourite(track));
            });

            removeBtn.addEventListener("click", (e) => {
                e.stopPropagation(); // non deve far partire il brano
                removeTrackFromPlaylist(playlist.id, track.trackId);
                loadPlaylist();         // aggiorna hero (conteggio, durata) e righe
                renderSidebarPlaylists(); // aggiorna il menu nella sidebar
            });

            return row;
        })
    );
};

loadPlaylist();

// Se la playlist cambia altrove ridisegna la pagina
document.addEventListener("playlists:changed", loadPlaylist);