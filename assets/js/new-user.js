

import { el } from "./helper.js"

/*------Dati--------*/

const genres = [
    "Rock", "Pop", "Jazz", "Blues", "Soul", "Funk", "Cantautorato", "Classica", "Elettronica", "Hip Hop", "Folk", "Disco"
]; // sono effettivamente presenti nell'API?

const artists = [
    "Kendrick Lamar", "Sombr", "Justin Bieber", "Travis Scott", "Drake", "50 Cent"
]; //potrebbe essere generata in maniera dinamica

const MIN_CHOICES = 3;

/*-------- Elementi della pagina --------*/
const btnNewUser = document.querySelector('#btn-new-user');

// modale 1 registrazione
const registerModal = document.querySelector("#register-modal")
const registerForm = document.querySelector("#register-form")
const btnRegisterClose = document.querySelector("#register-close")
const btnRegisterCancel = document.querySelector("#register-cancel")

const usernameInput = document.querySelector("#register-username")
const emailInput = document.querySelector("#register-email")
const passwordInput = document.querySelector("#register-password")
const repeatInput = document.querySelector("#register-repeat")
const birthInput = document.querySelector("#register-birth")
const consentInput = document.querySelector("#register-consent")

const repeatError = document.querySelector("#register-repeat-error")
const birthError = document.querySelector("#register-birth-error")

// modale 2 scelta musica
const welcomeModal = document.querySelector('#welcome-modal');
const btnClose = document.querySelector('#welcome-close');
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
    usernameInput.value = "";
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

/*--Controllo del form di registrazione--*/
//required già in html, dobbiamo fare le password diverse e data nel futuro

//mostrare l'errore in rosso
const showError = (errorElement, message, input) => {  // errorElement = il p dell'errore, message = il testo, input = il campo da colorare
    errorElement.textContent = message // messaggio dentro p 
    input.setAttribute("aria-invalid", "true");
};

/*cancellare gli errori*/
const clearErrors = () => {
    registerForm.querySelectorAll(".register-error").forEach((p) => { // tutti i <p> degli errori
        p.textContent = ""; // svuoto il messaggio
    });
    registerForm.querySelectorAll(".register-input").forEach((input) => { // tutti i campi
        input.setAttribute("aria-invalid", "false"); // tolgo il rosso 
    });
};

/*Invio del Form*/
registerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    clearErrors(); //toglie errori della volta prima


let isValid = true;

if (repeatInput.value !== passwordInput.value) {
    showError(repeatError, "Le password non coincidono", repeatInput);
    isValid = false;
}
    if(new Date(birthInput.value) > new Date()) {
        showError(birthError, "la data non può essere nel futuro", birthInput);
        isValid = false;
    }

    if (isValid===false) {
        return;
    }

newUser = {
    username: usernameInput.value.trim(),
    email: emailInput.value.trim(), // trim toglie gli spazi all'inizio e alla fine 
    birthDate: birthInput.value 
};

console.log("Nuovo utente registrato:", newUser);
closeRegister();
//openWelcome();

});