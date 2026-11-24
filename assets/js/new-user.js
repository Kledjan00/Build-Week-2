/*------Dati--------*/

const genres = [
    "Rock", "Pop", "Jazz", "Blues", "Soul", "Funk", "Cantautorato", "Classica", "Elettronica", "Hip Hop", "Folk", "Disco"
]; // sono effettivamente presenti nell'API?

const artists = [
    "Kendrick Lamar", "Sombr", "Justin Bieber", "Trevis Scott", "Drake", "50 Cent"
]; //potrebbe essere generata in maniera dinamica

const MIN_CHOICES = 3;
const MIN_USERNAME = 3;
const MIN_PASSWORD = 8;

/*-------- Elementi della pagina --------*/
const btnNewUser = document.querySelector('#btn-new-user');

// modale 1 registrazione
const registerModal = document.querySelector("#register-modal")
const registerForm = document.querySelector("#register-form")
const btnRegisterClose = document.querySelector("#register-close")
const btnRegisterCancel = document.querySelector("#register-cancel")

const usurnameInput = document.querySelector("#register-usurname")
const emailInput = document.querySelector("#register-email")
const passwordInput = document.querySelector("#register-password")
const repeatInput = document.querySelector("#register-repeat")
const birthInput = document.querySelector("#register-birth")
const consentInput = document.querySelector("#register-consent")

const usurnameError = document.querySelector("#register-usurname-Error")
const emailError = document.querySelector("#register-email-Error")
const passwordError = document.querySelector("#register-password-Error")
const repeatError = document.querySelector("#register-repeat-Error")
const birthError = document.querySelector("#register-birth-Error")
const consentError = document.querySelector("#register-consent-Error")

// modale 2 scelta musica
const welcomeModal = document.querySelector('#welcome-modal');
const btnClose = document.querySelector('#btn-close');
const genreList = document.querySelector('#genre-list');
const artistList = document.querySelector('#artist-list');
const welcomeCount = document.querySelector('#welcome-count');
const btnSkip = document.querySelector('#btn-skip');
const btnContinue = document.querySelector('#btn-continue');

/*------Stato registrazione-----*/
let newUser = null;
let selectedGenres = [];
let selectedArtists = [];
let userTastes = null;


/*------ Modale 1 Registrazione--------*/

/*aprire e chiudere la registrazione*/
const openRegister = () => {
    // svuota campi, così non restano quelli precedenti
    usurnameInput.value = "";
    emailInput.value = "";
    passwordInput.value = "";
    repeatInput.value = "";
    birthInput.value = "";
    consentInput.checked = false;
    clearErrors();
    // is-open: la modale compare
    registerModal.classList.add("is-open");
};

const closeRegister = () => {
    // tolgo is open e modale scompare
    registerModal.classList.remove("is-open")
};
// collego il bottone "new user" con il click che esegue openRegister
btnNewUser.addEventListener("click", openRegister);
//la 'x' e 'annulla' chiude la registrazione
btnRegisterClose.addEventListener("click", closeRegister);
btnRegisterCancel.addEventListener("click", closeRegister);











/*--------Funzioni--------*/
function createChoiceButton(name) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = name;
    btn.className = "btn btn-outline-warning btn-sm rounded-pill";
    return btn;
}
function renderModal() {
    genreList.replaceChildren(); //per svuotare
    genres.forEach((genre) => {
    const btn = createChoiceButton(genre);
    genreList.append(btn); 
});

showCount();
}

genreList.addEventListener("click", (e) => {
    console.log("generi_cliccati")
})


const showCount = () => {
    // totale = generi scelti + artisti scelti
    const total = selectedGenres.length + selectedArtists.length;
    if (total === 1) {
        welcomeCount.textContent = "1 selezionato";
    } else {
        welcomeCount.textContent = `${total} selezionati`
    }
    btnContinue.disabled = total < MIN_CHOICES;
};


