/*------Dati--------*/

const genres = [
    "Rock", "Pop", "Jazz", "Blues", "Soul", "Funk", "Cantautorato", "Classica", "Elettronica", "Hip Hop", "Folk", "Disco"
];

const artists = [
    "Kendrick Lamar", "Sombr", "Justin Bieber", "Trevis Scott", "Drake", "50 Cent"
];

const MIN_CHOICES = 3;

/*-------- Elementi del DOM --------*/
const btnNewUser = document.querySelector('#btn-new-user');
const welcomeModal = document.querySelector('#welcome-modal');
const btnClose = document.querySelector('#btn-close');
const genreList = document.querySelector('#genre-list');
const artistList = document.querySelector('#artist-list');
const welcomeCount = document.querySelector('#welcome-count');
const btnSkip = document.querySelector('#btn-skip');
const btnContinue = document.querySelector('#btn-continue');

/*------Stato-----*/
let selectedGenres = [];
let selectedArtists = [];
const total = selectedGenres.length + selectedArtists.length;

/*--------Funzioni--------*/

function renderModal() {
    
}



const showCount = () => {
    // totale = generi scelti + artisti scelti
    if (total === 1) {
        welcomeCount.textContent = "1 selezionato";
    } else {
        welcomeCount.textContent = `${total} selezionati`
    }
    btnContinue.disabled = total < MIN_CHOICES;
  };
  

