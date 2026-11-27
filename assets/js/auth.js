// indirizzo del server acceso sul pc
const SERVER_URL = "http://localhost:3001";

//stampa nuovo utente
class NewUser {
    constructor(_email, _password, _userName) {
        this.email = _email;
        this.password = _password;
        this.userName = _userName;
    }
}

// elementi della pagina
const btnUser = document.querySelector("#btn-user");
const loginModal = document.querySelector("#login-modal");
const loginForm = document.querySelector("#login-form");
const loginEmail = document.querySelector("#login-email");
const loginPassword = document.querySelector("#login-password");
const loginError = document.querySelector("#login-error");
const loginClose = document.querySelector("#login-close");
const loginCancel = document.querySelector("#login-cancel");

//Registrazione, export perchè la usa new-user.js
export async function signUp(userName, email, password) {
    // nuovo utente che va al server e salvato in db.json
    const response = await fetch(`${SERVER_URL}/register`, {
        method: "POST", // POST = invio dati
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(new NewUser(email, password, userName)),
    });
    // se il server rifiuta gli mando un errore
    if (!response.ok) throw new Error("Email già presente");
    // faccio subito il login con quei dati
    await logIn(email, password);
    showUser(); // il bottone diventa esci 
}

// Login, il server controlla email e password
async function logIn(email, password) {
    const response = await fetch(`${SERVER_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error("Email o password non corrette");
    //salvo i dati in modo da restare collegato quando ricarico
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("loggedUser", JSON.stringify(data.user));
}

// cambia la scritta del bottone in alto a destra
function showUser() {
    if (localStorage.getItem("accessToken")) {
        const user = JSON.parse(localStorage.getItem("loggedUser"));
        btnUser.textContent = `Esci (${user.userName})`;
    } else {
        btnUser.textContent = "Log in";
    }
}

btnUser.addEventListener("click", () => {
    if (localStorage.getItem("accessToken")) {
        // quando sono collegato e esco
        localStorage.removeItem("accessToken");
        localStorage.removeItem("loggedUser");
        showUser();
    } else if (loginModal === null) {
        // vado in home se modale non c'è
        location.href = "index.html";
    } else {
        //apro la modale vuota
        loginForm.reset();
        loginError.textContent = "";
        loginModal.classList.add("is-open");
    }
});

if (loginModal !== null) {
    const closeLogin = () => loginModal.classList.remove("is-open");
    loginClose.addEventListener("click", closeLogin);
    loginCancel.addEventListener("click", closeLogin);

    // listener per uscire dalla modale con esc
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeLogin();
        }
    });

    // quando premo "Accedi"
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // non ricaricare la pagina
        loginError.textContent = ""; // tolgo l'errore di prima
        try {
            // mando email e password al server e aspetto
            await logIn(loginEmail.value.trim(), loginPassword.value);
            closeLogin(); // chiudo la modale
            showUser(); // il bottone diventa Esci
        } catch (error) {
            // se qualcosa va storto scrivo l'errore nella modale
            loginError.textContent = error.message;
        }
    });
}

showUser();