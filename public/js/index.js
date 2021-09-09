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
import { displayTime } from "./modules/util.js";

firebase.initializeApp(firebaseConfig);
firebase.analytics();

displayTime(document.querySelector(".time"));
setDBListener(database, "users", "value", updateNewUser);

const auth = firebase.auth();
const database = firebase.database();
const googleSignIn = document.querySelector(".google__signin");
const newNameContainer = document.querySelector(".google-signin-user-name");
const newNameInput = document.querySelector(".google-signin-user-name__input");
const newNameError = document.querySelector(".google-signin-user-name__error");
const nextButton = document.querySelector(".google-signin-user-name__next");
const verificationMessageContainer = document.querySelector(".verification");
const resendVerificationButton = document.querySelector(
  ".verification__resend"
);
const loginHeader = document.querySelector(".login__header");
const loginTab = document.querySelector(".login__tab");
const signupTab = document.querySelector(".signup__tab");
const loginForm = document.querySelector(".login__form");
const login = document.querySelector(".login");
const title = document.querySelector(".title");
const subTitle = document.querySelector(".sub-title");
const features = document.querySelector(".features");
const signinToggle = document.querySelector(".sign-in");
let context = "login";
let namesList = [];
let checkInputCondition = {
  username: false,
  password: false,
  "re-password": false,
};

async function updateNewUser(userData) {
  namesList = [];
  let data = userData.val();
  if (data) {
    for (let id in data) {
      namesList.push(data[id].name);
    }
  }
}

function showNewNameGoogleInput() {
  document
    .querySelectorAll(".main>*:not(.google-signin-user-name)")
    .forEach((elem) => {
      elem.style.filter = "blur(2rem)";
    });
  newNameContainer.classList.remove("none");
  newNameInput.focus();
}

let prev = null;
function disableresendVerificationButton() {
  if (prev !== null) {
    clearTimeout(prev);
  }
  prev = setTimeout((e) => {
    resendVerificationButton.disabled = false;
  }, 5000);
}

function enableVerification() {
  login.classList.add("none");
  title.classList.add("none");
  features.classList.add("none");
  subTitle.classList.add("none");
  verificationMessageContainer.classList.remove("none");
  disableresendVerificationButton();
}

function goToHomePage() {
  setTimeout(() => {
    window.location = "../home.html";
  }, 200);
}

function updateUserState(val) {
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
        goToHomePage();
      } else {
        userEmailVerification(user, actionCodeVerify);
        resendVerificationButton.disabled = true;
      }
    })
    .catch((error) => {
      console.log(error);
    });
}

function setValidGoogleUserNameState() {
  newNameInput.style.borderBottom = "1px solid black";
  newNameError.innerText = "";
  nextButton.classList.remove("none");
}
function setGoogleUserNameAlreadyExistsState() {
  newNameError.innerText = "User Name Already Taken";
  newNameInput.style.borderBottom = "1px solid red";
  nextButton.classList.add("none");
}

function setValidUserNameState(userNameInput) {
  let nameError = document.querySelector(".name-error");
  userNameInput.style.borderBottom = "1px solid #fbae3c";
  checkInputCondition["username"] = true;
  nameError.classList.add("none");
}

function setNameAlreadyExistsState(userNameInput) {
  let nameError = document.querySelector(".name-error");
  userNameInput.style.borderBottom = "1px solid red";
  nameError.classList.remove("none");
  checkInputCondition["username"] = false;
}

function validateUserName() {
  userName = this.value;
  if (userName === "") return;
  userLower = userName.toLowerCase();

  setValidUserNameState(this);
  checkIfExists = namesList.find((name) => name.toLowerCase() === userLower);
  if (checkIfExists) {
    setNameAlreadyExistsState(this);
  }
}

function isFormEmpty() {
  return getFormInputs().every((input) => input.value === "");
}

function isSignUpConditionsValid() {
  return (
    checkInputCondition["username"] &&
    checkInputCondition["password"] &&
    checkInputCondition["re-password"]
  );
}

function isLogInConditionsValid() {
  return checkInputCondition["password"];
}

function getFormInputs() {
  return Array.from(loginForm.querySelectorAll("input"));
}

function getFormData() {
  const data = document.querySelectorAll(".form__input-main");
  return [data[0].value, data[1].value];
}

function showEmptySignal() {
  getFormInputs().forEach((input) => {
    input.style.borderColor = "var(--error-color)";
    loginHeader.style.pointerEvents = "none";
  });
}

function hideEmptySignal() {
  getFormInputs().forEach((input) => {
    input.style.borderColor = "var(--primary-color)";
    loginHeader.style.pointerEvents = "unset";
  });
}

function handleEmptyInputs() {
  showEmptySignal();
  setTimeout(() => {
    hideEmptySignal();
  }, 500);
}

async function signUp(email, password) {
  try {
    await userEmailSignUp(auth, email, password);
  } catch (error) {
    console.log(error);
  }
}

async function logIn(email, password) {
  try {
    await userEmailLogIn(auth, email, password);
  } catch (error) {
    console.log(error);
  }
}

async function validateForm(e) {
  e.preventDefault();
  if (isFormEmpty()) return handleEmptyInputs();

  let [email, password] = getFormData();
  if (context === "signup" && isSignUpConditionsValid()) {
    signUp(email, password);
  } else if (context === "login" && isLogInConditionsValid()) {
    logIn(email, password);
  }
}

function hidePassword(showPasswordIcon, hidePasswordIcon) {
  showPasswordIcon.classList.add("none");
  hidePasswordIcon.classList.remove("none");
  updatePasswordInputType("text");
}

function showPassword(showPasswordIcon, hidePasswordIcon) {
  showPasswordIcon.classList.remove("none");
  hidePasswordIcon.classList.add("none");
  updatePasswordInputType("password");
}

function updatePasswordInputType(type) {
  const passwordInputs = document.querySelectorAll(
    "#password, #re-enter-password"
  );
  passwordInputs.forEach((input) => {
    input.type = type;
  });
}

function updateReEnterPasswordValidation(orignial, reEnteredPassword) {
  if (!reEnteredPassword) return;
  const reEnterPasswordError = document.querySelector(".re-password-error");

  if (reEnteredPassword.value.length === 0) {
    reEnterPasswordError.classList.add("none");
    checkInputCondition["re-password"] = false;
    return;
  } else if (orignial.value !== reEnteredPassword.value) {
    reEnterPasswordError.classList.remove("none");
    checkInputCondition["re-password"] = false;
    return;
  } else {
    reEnterPasswordError.classList.add("none");
    checkInputCondition["re-password"] = true;
  }
}

function addSignInButtonListener() {
  document
    .querySelector(".form__button")
    .addEventListener("click", validateForm);
}

function addPasswordVisibilityListeners() {
  const passwordVisibilityIcons = document.querySelectorAll(".toggle-pass");
  const showPasswordIcon = document.querySelector(".show-pass");
  const hidePasswordIcon = document.querySelector(".hide-pass");

  passwordVisibilityIcons.forEach((icon) => {
    icon.addEventListener("click", function (e) {
      if (this.classList.contains("show-pass")) {
        hidePassword(showPasswordIcon, hidePasswordIcon);
      } else {
        showPassword(showPasswordIcon, hidePasswordIcon);
      }
    });
  });
}

function addOriginalPasswordListener(passwordInput, reEnterPasswordInput) {
  passwordInput.addEventListener("input", function (e) {
    const passwordError = document.querySelector(".password-error");

    if (this.value.length === 0) {
      passwordError.classList.add("none");
      checkInputCondition["password"] = false;
      updateReEnterPasswordValidation(passwordInput, reEnterPasswordInput);
      return;
    } else if (this.value.length < 8) {
      passwordError.classList.remove("none");
      checkInputCondition["password"] = false;
      updateReEnterPasswordValidation(passwordInput, reEnterPasswordInput);
      return;
    } else {
      passwordError.classList.add("none");
      checkInputCondition["password"] = true;
      updateReEnterPasswordValidation(passwordInput, reEnterPasswordInput);
    }
  });
}

function addReEnterPasswordListener(passwordInput, reEnterPasswordInput) {
  if (!reEnterPasswordInput) return;
  reEnterPasswordInput.addEventListener("input", function (e) {
    updateReEnterPasswordValidation(passwordInput, reEnterPasswordInput);
  });
}

function addPasswordInputListeners() {
  const passwordInput = document.querySelector("#password");
  const reEnterPasswordInput = document.querySelector("#re-enter-password");
  addOriginalPasswordListener(passwordInput, reEnterPasswordInput);
  addReEnterPasswordListener(passwordInput, reEnterPasswordInput);
}

addSignInButtonListener();
addPasswordVisibilityListeners();
addPasswordInputListeners();

loginTab.addEventListener("click", function () {
  loginForm.innerHTML = loginTemplate;
  loginTab.classList.add("active");
  signupTab.classList.remove("active");
  context = "login";
  addPasswordVisibilityListeners();
  addPasswordInputListeners();
  addSignInButtonListener();
});

signupTab.addEventListener("click", async function () {
  loginForm.innerHTML = signupTemplate;
  loginTab.classList.remove("active");
  signupTab.classList.add("active");
  context = "signup";
  addPasswordVisibilityListeners();
  addPasswordInputListeners();
  addSignInButtonListener();
  document
    .querySelector(".form__input-username")
    .addEventListener("input", validateUserName);
});

signinToggle.addEventListener("click", function () {
  verificationMessageContainer.classList.add("none");
  login.classList.toggle("none");
  title.classList.toggle("none");
  features.classList.toggle("none");
  subTitle.classList.toggle("none");
});

auth.onAuthStateChanged(async (user) => {
  if (user) {
    if (!user.emailVerified) {
      enableVerification();
      updateUserState(0);
      return;
    }
    let currentUser = await readDB(database, `users/${user.uid}`);
    if (!currentUser.val()) {
      showNewNameGoogleInput();
    } else {
      window.location = "../home.html";
    }
  }
});

resendVerificationButton.addEventListener("click", async function (e) {
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
  const provider = new firebase.auth.GoogleAuthProvider();
  userSignIn(auth, provider);
});

let checkIfExists, userName, userLower;
newNameInput.addEventListener("input", function (e) {
  userName = this.value;
  if (userName === "") return;
  userLower = userName.toLowerCase();

  setValidGoogleUserNameState();
  checkIfExists = namesList.find((name) => name.toLowerCase() === userLower);
  if (checkIfExists) {
    setGoogleUserNameAlreadyExistsState();
  }
});

nextButton.addEventListener("click", function (e) {
  if (newNameInput.value === "") return;
  updateUserState(1);
});

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
  auth
    .verifyPasswordResetCode(actionCode)
    .then((email) => {
      window.location.href = `${continueUrl}?enable=true&oobCode=${actionCode}&email=${email}`;
      var accountEmail = email;

      // TODO: Show the reset screen with the user's email and ask the user for
      // the new password.
      var newPassword = "...";

      // Save the new password.
      auth
        .confirmPasswordReset(actionCode, newPassword)
        .then((resp) => {
          // Password reset has been confirmed and new password updated.
          // TODO: Display a link back to the app, or sign-in the user directly
          // if the page belongs to the same domain as the app:
          // auth.signInWithEmailAndPassword(accountEmail, newPassword);
          // TODO: If a continue URL is available, display a button which on
          // click redirects the user back to the app via continueUrl with
          // additional state determined from that URL's parameters.
        })
        .catch((error) => {
          // Error occurred during confirmation. The code might have expired or the
          // password is too weak.
        });
    })
    .catch((error) => {
      // Invalid or expired action code. Ask user to try to reset the password
      // again.
    });
}

window.addEventListener("DOMContentLoaded", (e) => {
  handleURL();
});
