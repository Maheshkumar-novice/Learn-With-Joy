import {
  readDB,
  firebaseConfig,
  userSignIn,
  writeDB,
  userEmailSignUp,
  userEmailLogIn,
  userEmailVerification,
  setDBListener,
  actionCodeVerify,
} from "./modules/firebase.js";
import { loader, loginTemplate, signupTemplate } from "./modules/template.js";

// firebase initialization
firebase.initializeApp(firebaseConfig);
firebase.analytics();

const auth = firebase.auth();
const database = firebase.database();
let namesList = [];

// Check regex - input condition
let checkInputCondition = {
  username: false,
  password: false,
  "re-password": false,
};

// selectors
const googleSignIn = document.querySelector(".google__signin");
const newNameContainer = document.querySelector(".google-signin-user-name");
const newNameInput = document.querySelector(".google-signin-user-name__input");
const newNameError = document.querySelector(".google-signin-user-name__error");
const nextButton = document.querySelector(".google-signin-user-name__next");
const verificationMessageContainer = document.querySelector(".verification");
const resendVerificationButton = document.querySelector(
  ".verification__resend"
);

function showInput() {
  document
    .querySelectorAll(".main>*:not(.google-signin-user-name)")
    .forEach((elem) => {
      elem.style.filter = "blur(2rem)";
    });
  newNameContainer.classList.remove("none");
  newNameInput.focus();
}

async function updateNewUser(user_data) {
  namesList = [];
  let data = user_data.val();
  console.log(data);
  if (data) {
    for (let id in data) {
      namesList.push(data[id].name);
    }
  }
  console.log(namesList);
}

setDBListener(database, "users", "value", updateNewUser);

let prev = null;
function disableresendVerificationButton() {
  if (prev !== null) {
    clearTimeout(prev);
  }
  console.log("hello");
  prev = setTimeout((e) => {
    resendVerificationButton.disabled = false;
  }, 5000);
}

function enableVerification() {
  console.log("hello");

  login.classList.add("none");
  title.classList.add("none");
  features.classList.add("none");
  subTitle.classList.add("none");
  verificationMessageContainer.classList.remove("none");
  disableresendVerificationButton();
}

// sign In status change
auth.onAuthStateChanged(async (user) => {
  if (user) {
    console.log(user);
    if (!user.emailVerified) {
      console.log("hello");
      enableVerification();
      updateUserName(0);
      return;
    }
    let check_user = await readDB(database, `users/${user.uid}`);
    if (!check_user.val()) {
      showInput();
    } else {
      console.log("helo");
      window.location = "../home.html";
    }
  }
});

//event listener
resendVerificationButton.addEventListener("click", async function (e) {
  console.log("hello", this.disabled);
  let user = auth.currentUser;
  if (user.emailVerified) {
    this.classList.add("none");
    return;
  }
  await userEmailVerification(user, actionCodeVerify);
  resendVerificationButton.disabled = true;
  disableresendVerificationButton();
});

googleSignIn.addEventListener("click", (e) => {
  console.log("hi");
  const provider = new firebase.auth.GoogleAuthProvider();
  userSignIn(auth, provider);
});

let check_name, userName, userLower;
newNameInput.addEventListener("input", function (e) {
  userName = this.value;
  userLower = this.value.toLowerCase();
  if (newNameInput.value === "") return;
  check_name = namesList.find((name) => name.toLowerCase() === userLower);
  newNameInput.style.borderBottom = "1px solid black";
  newNameError.innerText = "";
  nextButton.classList.remove("none");
  if (check_name) {
    newNameError.innerText = "User Name Already Taken";
    newNameInput.style.borderBottom = "1px solid red";
    nextButton.classList.add("none");
  }
});

nextButton.addEventListener("click", function (e) {
  if (newNameInput.value === "") return;
  updateUserName(1);
});

function changeLocation() {
  setTimeout(() => {
    window.location = "../home.html";
  }, 200);
}

function updateUserName(val) {
  console.log(userName);
  if (userName === undefined) return;
  loginForm.innerHTML = loader;
  let user = auth.currentUser;
  user
    .updateProfile({
      displayName: `${userName}`,
      photoURL: user.photoURL || "./assets/icons/home/user.svg",
    })
    .then(async () => {
      let value = {
        name: userName,
        photo: user.photoURL,
      };
      writeDB(database, `users/${user.uid}`, value);
      if (val) {
        changeLocation();
      } else {
        userEmailVerification(user, actionCodeVerify);
        resendVerificationButton.disabled = true;
      }
    })
    .catch((error) => {
      console.log(error);
    });
}

// login-signup-form
const loginTab = document.querySelector(".login__tab");
const signupTab = document.querySelector(".signup__tab");
const loginForm = document.querySelector(".login__form");

loginTab.addEventListener("click", function () {
  loginForm.innerHTML = loginTemplate;
  loginTab.classList.add("active");
  signupTab.classList.remove("active");
  togglePassword();
  addSignListener();
});

signupTab.addEventListener("click", async function () {
  loginForm.innerHTML = signupTemplate;
  loginTab.classList.remove("active");
  signupTab.classList.add("active");
  addSignListener();
  togglePassword();
  document
    .querySelector(".form__input-username")
    .addEventListener("input", checkUniqueUser);
});

const login = document.querySelector(".login");
const title = document.querySelector(".title");
const subTitle = document.querySelector(".sub-title");
const features = document.querySelector(".features");
const signinToggle = document.querySelector(".sign-in");
signinToggle.addEventListener("click", function () {
  console.log("hi");
  verificationMessageContainer.classList.add("none");
  login.classList.toggle("none");
  title.classList.toggle("none");
  features.classList.toggle("none");
  subTitle.classList.toggle("none");
});

function checkUniqueUser() {
  console.log(this.value);
  userName = this.value;
  userLower = this.value.toLowerCase();
  if (this.value === "") return;
  check_name = namesList.find((name) => name.toLowerCase() === userLower);
  this.style.borderBottom = "1px solid #fbae3c";
  checkInputCondition["username"] = true;
  document.querySelector(".name-error").classList.add("none");
  if (check_name) {
    this.style.borderBottom = "1px solid red";
    document.querySelector(".name-error").classList.remove("none");
    checkInputCondition["username"] = false;
  }
}

let errorElem;
function addSignListener() {
  const signBtn = document.querySelector(".form__button");
  console.log(signBtn);
  signBtn.addEventListener("click", async function (e) {
    e.preventDefault();
    errorElem ? errorElem.classList.add("none") : "";
    const email = document.querySelectorAll(".form__input-main");

    try {
      if (
        this.textContent === "Signup" &&
        checkInputCondition["username"] &&
        checkInputCondition["password"] &&
        checkInputCondition["re-password"]
      ) {
        await userEmailSignUp(auth, email[0].value, email[1].value);
      } else if (
        this.textContent === "Login" &&
        checkInputCondition["password"]
      ) {
        await userEmailLogIn(auth, email[0].value, email[1].value);
      }
    } catch (error) {
      let errorMessage = error.code.split("auth/")[1];
      let errorShowElem = errorElem = error.code.includes("wrong-password") ? document.querySelector(".password-error") : document.querySelector(".email-error");
      errorShowElem.classList.remove("none");
      errorShowElem.textContent = errorMessage;
      console.log(error);
    }
  });
}

addSignListener();

function togglePassword() {
  const passwordIC = document.querySelectorAll(".toggle-pass");
  const passwordInp = document.querySelectorAll("input[type='password']");
  passwordIC.forEach((IC) => {
    IC.addEventListener("click", function (e) {
      let change = passwordIC[this.dataset.id === "1" ? 0 : 1];
      this.classList.toggle("none");
      change.classList.toggle("none");
      passwordInp.forEach((inp) => {
        inp.type = inp.type === "password" ? "text" : "password";
      });
    });
  });
  passwordInp[0].addEventListener("input", function (e) {
    if (this.value.length === 0) {
      document.querySelector(".password-error").classList.add("none");
      checkInputCondition["password"] = false;
      passwordInp.length === 2
        ? checkReEnterPassword(passwordInp[0], passwordInp[1])
        : "";
      return;
    }
    if (this.value.length < 8) {
      document.querySelector(".password-error").classList.remove("none");
      checkInputCondition["password"] = false;
      return;
    }
    document.querySelector(".password-error").classList.add("none");
    checkInputCondition["password"] = true;
    passwordInp.length === 2
      ? checkReEnterPassword(passwordInp[0], passwordInp[1])
      : "";
  });
  if (passwordInp.length === 2) {
    passwordInp[1].addEventListener("input", function (e) {
      checkReEnterPassword(passwordInp[0], passwordInp[1]);
    });
  }
}
togglePassword();

function checkReEnterPassword(orignial, reEnter) {
  if (reEnter.value.length === 0) {
    document.querySelector(".re-password-error").classList.add("none");
    checkInputCondition["re-password"] = false;
    return;
  }
  if (orignial.value !== reEnter.value) {
    document.querySelector(".re-password-error").classList.remove("none");
    checkInputCondition["re-password"] = false;
    return;
  }
  document.querySelector(".re-password-error").classList.add("none");
  checkInputCondition["re-password"] = true;
}

function getParameterByName(urlParams, name) {
  return urlParams.get(name);
}

function handleURL() {
  const urlParams = new URLSearchParams(window.location.search);

  // get mode of the link
  const mode = getParameterByName(urlParams, "mode");
  // Get the one-time code from the query parameter.
  const actionCode = getParameterByName(urlParams, "oobCode");
  // (Optional) Get the continue URL from the query parameter if available.
  const continueUrl = getParameterByName(urlParams, "continueUrl");

  // Handle the user management action.
  switch (mode) {
    case "resetPassword":
      // Display reset password handler and UI.
      handleResetPassword(auth, actionCode, continueUrl);
      break;
    case "verifyEmail":
      // Display email verification handler and UI.
      handleVerifyEmail(auth, actionCode, continueUrl);
      break;
    default:
    // Error: invalid mode.
  }
}

// Hnadle verify email
function handleVerifyEmail(auth, actionCode, continueURL) {
  auth
    .applyActionCode(actionCode)
    .then((resp) => {
      window.location.href = continueURL;
    })
    .catch((error) => {
      console.log(error);
    });
}

function handleResetPassword(auth, actionCode, continueUrl) {
  // Localize the UI to the selected language as determined by the lang
  // parameter.

  // Verify the password reset code is valid.
  auth.verifyPasswordResetCode(actionCode).then((email) => {
    window.location.href = `${continueUrl}?enable=true&oobCode=${actionCode}&email=${email}`;
    var accountEmail = email;

    // TODO: Show the reset screen with the user's email and ask the user for
    // the new password.
    var newPassword = "...";

    // Save the new password.
    auth.confirmPasswordReset(actionCode, newPassword).then((resp) => {
      // Password reset has been confirmed and new password updated.

      // TODO: Display a link back to the app, or sign-in the user directly
      // if the page belongs to the same domain as the app:
      // auth.signInWithEmailAndPassword(accountEmail, newPassword);

      // TODO: If a continue URL is available, display a button which on
      // click redirects the user back to the app via continueUrl with
      // additional state determined from that URL's parameters.
    }).catch((error) => {
      // Error occurred during confirmation. The code might have expired or the
      // password is too weak.
    });
  }).catch((error) => {
    // Invalid or expired action code. Ask user to try to reset the password
    // again.
  });
}

window.addEventListener("DOMContentLoaded", (e) => {
  handleURL();
});

// timer
function displayTime() {
  let date = new Date();
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();
  let currentTime =
    (hours < 10 ? "0" + hours : hours) +
    ":" +
    (minutes < 10 ? "0" + minutes : minutes) +
    ":" +
    (seconds < 10 ? "0" + seconds : seconds);
  document.querySelector(".time").innerHTML = currentTime;
  setTimeout(displayTime, 1000);
}

displayTime();
