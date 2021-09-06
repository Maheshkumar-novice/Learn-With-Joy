import {
  actionCodePasswordReset,
  firebaseConfig,
  userPasswordReset,
  userSignOut,
} from "./modules/firebase.js";
import { getLocalStorage, updateLocalStorage } from "./modules/util.js";

const forms = document.querySelectorAll("form");
const notification = document.querySelector(".notification");
const loader = document.querySelector(".form__loader");

const emailErr = document.querySelector(".email-error");
const emailInp = document.getElementById("email");
const sendBtn = document.querySelector(".form__send");
const formText = document.querySelector(".form__text");

const passwordInp = document.getElementById("password");
const passErr = document.querySelector(".password-error");
const rePassInp = document.getElementById("re-password");
const rePassErr = document.querySelector(".re-password-error");
const passwordIC = document.querySelectorAll(".toggle-pass");
const resetBtn = document.querySelector(".form__reset");

let passMatch = {
  password: false,
  "re-pass": false,
};

// firebase initialization
firebase.initializeApp(firebaseConfig);
firebase.analytics();

const auth = firebase.auth();

emailInp.addEventListener("change", (e) => {
  formText.innerText = "send";
});

passwordInp.addEventListener("input", function (e) {
  if (this.value.length === 0) {
    passMatch.password = false;
    passErr.classList.add("none");
    return;
  }
  if (this.value.length < 8) {
    passErr.classList.remove("none");
    passMatch.password = false;
  } else {
    passErr.classList.add("none");
    passMatch.password = true;
  }
});

rePassInp.addEventListener("input", checkReEnterPassword);

passwordIC.forEach((IC) => {
  IC.addEventListener("click", function (e) {
    let change = passwordIC[this.dataset.id === "1" ? 0 : 1];
    this.classList.toggle("none");
    change.classList.toggle("none");
    passwordInp.type = rePassInp.type =
      passwordInp.type === "password" ? "text" : "password";
  });
});

function checkReEnterPassword() {
  if (rePassInp.value.length === 0) {
    rePassErr.classList.add("none");
    passMatch["re-pass"] = false;
    return;
  }
  if (passwordInp.value !== rePassInp.value) {
    rePassErr.classList.remove("none");
    passMatch["re-pass"] = false;
    return;
  }

  rePassErr.classList.add("none");
  passMatch["re-pass"] = true;
}

sendBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  const email = emailInp.value;
  formText.innerText = "resend";
  console.log(loader);
  loader.classList.remove("none");
  sendBtn.disabled = true;

  try {
    console.log(email);
    emailErr.classList.add("none");
    await userPasswordReset(auth, email, actionCodePasswordReset);
    notification.innerText = "Link has been sent to the mail";
    notification.classList.remove("none");
    setTimeout(() => {
      notification.classList.add("none");
    }, 2000);
    loader.classList.add("none");
    coolDown();
  } catch (error) {
    formText.innerText = "Send";
    const code = error.code.split("auth/")[1];
    emailErr.innerText = code;
    emailErr.classList.remove("none");
    loader.classList.add("none");
    sendBtn.disabled = false;
  }
});

resetBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (!(passMatch["password"] && passMatch["re-pass"])) return;
  const pass = passwordInp.value;
  resetPasswordUtil(pass);
});

let count = 60;
function coolDown() {
  if (count === 0) {
    updateLocalStorage("count", "disabled");
    count = 60;
    sendBtn.disabled = false;
    formText.innerText = "Resend";
    return;
  }
  updateLocalStorage("count", "enabled");
  formText.innerText = count;
  count--;
  setTimeout(coolDown, 1000);
}

function resetPassword(actionCode, newPassword) {
  auth
    .confirmPasswordReset(actionCode, newPassword)
    .then((resp) => {
      if (auth.currentUser) userSignOut(auth);
      window.location.href = "https://learn-with-joy.netlify.app";
    })
    .catch((error) => {
      console.log("error");
      notification.innerText = error.message;
      notification.classList.remove("none");

      setTimeout(() => {
        notification.classList.add("none");
      }, 2000);
    });
}

function resetPasswordUtil(password) {
  const urlParams = new URLSearchParams(window.location.search);

  // Get the one-time code from the query parameter.
  const actionCode = getParameterByName(urlParams, "oobCode");

  // Get the email.
  const email = getParameterByName(urlParams, "email");

  resetPassword(actionCode, password);
}

function getParameterByName(urlParams, name) {
  return urlParams.get(name);
}

window.onload = () => {
  if (getLocalStorage("count") === "enabled") {
    coolDown();
  }
  const urlParams = new URLSearchParams(window.location.search);
  if (getParameterByName(urlParams, "enable") === "false") {
    forms[0].classList.remove("none");
  } else if (getParameterByName(urlParams, "enable") === "true") {
    forms[1].classList.remove("none");
  }
};
