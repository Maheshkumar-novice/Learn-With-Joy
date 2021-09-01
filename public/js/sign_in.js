import {
  readDB,
  firebaseConfig,
  userGSignIn,
  writeDB,
  userLogIn,
  userSignIn,
  userSignOut,
} from "./modules/firebase.js";

let auth;
let database;
let namesList = [];

// selectors
const gsignIn = document.querySelector(".header__login-img");
const signinHead = document.querySelector(".header__login-head");
const signinCnt = document.querySelector(".header__login-cnt");
const inup = document.querySelectorAll(".header__login-inup");
const inupBtn =document.querySelector(".header__login-btn");
const emailInp = document.querySelector(".header__login-email");
const passInp = document.querySelector(".header__login-password");

const newNameCnt = document.querySelector(".main__name");
const newNameInput = document.querySelector(".main__name--input");
const newNameErr = document.querySelector(".main__name--err");
const next = document.querySelector(".main__name--next");

function showInput() {
  document.querySelectorAll(".main>*:not(.main__name)").forEach((elem) => {
    elem.style.filter = "blur(2rem)";
  });
  newNameCnt.classList.remove("none");
  newNameInput.focus();
}

async function updateNewUser() {
  let data = (await readDB(database, "users")).val();
  console.log(data);
  if(data){
    for(let id in data){
      namesList.push(data[id].name);
    }
  }
  console.log(namesList)
  showInput();
}

function verificationCheck(){
  if(!auth.currentUser.emailVerified){
    console.log(auth.currentUser.emailVerified);
  }
  console.log(auth.currentUser.emailVerified);
}

// sign In status change
function stateChangeTrigger(){
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      // let check_user = await readDB(database, `users/${user.uid}`);
      // if (!check_user.val()) {
      //   updateNewUser();
      // } else {
      //   window.location = "../index.html";
      var actionCodeSettings = {
        url: 'http://localhost:5000/',
      };
      // }
      console.log('hello')
      let url = await firebase.auth().currentUser.sendEmailVerification(actionCodeSettings);
      console.log(url)
      // setInterval(verificationCheck, 1000);
    }
  });
}


//event listener

signinHead.addEventListener("click", (e) => {
  signinCnt.classList.toggle("none");
});

inupBtn.addEventListener("click", function(e){
  if(emailInp.value === "" || passInp.value === "")return;
  console.log(this.innerText)
  this.innerText === "Login" ? userLogIn(auth, emailInp.value, passInp.value) : userSignIn(auth, emailInp.value, passInp.value);
});

inup.forEach(btn => {
  btn.addEventListener("click", function(e){
    let id = +this.dataset.id;
    let oppid = id === 1 ? 0 : 1;
    inup[oppid].style.backgroundColor = "white"; 
    inup[oppid].style.color = "black"; 
    inup[id].style.backgroundColor = "black"; 
    inup[id].style.color = "white"; 
    inupBtn.innerText = this.innerText;
  });
});


gsignIn.addEventListener("click", (e) => {
  const provider = new firebase.auth.GoogleAuthProvider();
  userGSignIn(auth, provider);
});

let check_name, userName, userLower;
newNameInput.addEventListener("input", function (e) {
  userName = this.value;
  userLower = this.value.toLowerCase();
  if (newNameInput.value === "") return;
  check_name = namesList.find((name) => name.toLowerCase() === userLower);
  newNameInput.style.borderBottom = "1px solid black";
  newNameErr.innerText = "";
  next.classList.remove("none");
  if (check_name) {
    newNameErr.innerText = "User Name Already Taken";
    newNameInput.style.borderBottom = "1px solid red";
    next.classList.add("none");
  }
});

next.addEventListener("click", function (e) {
  if (newNameInput.value === "") return;
  let user = auth.currentUser;
  user
    .updateProfile({
      displayName: `${userName}`,
      photoURL: user.photoURL,
    })
    .then(() => {
      let value = {
        name: userName,
        photo: user.photoURL,
      };
      writeDB(database, `users/${user.uid}`, value);
      setTimeout(() => {
        window.location = "../index.html";
      }, 200);
    })
    .catch((error) => {
      console.log(error);
    });
});

function getParameterByName(urlParams, name){
  return urlParams.get(name);
}

document.addEventListener('DOMContentLoaded', () => {
  // TODO: Implement getParameterByName()

  const urlParams = new URLSearchParams(window.location.search);

  // Get the action to complete.
  var mode = getParameterByName(urlParams, 'mode');
  // Get the one-time code from the query parameter.
  var actionCode = getParameterByName(urlParams, 'oobCode');

  // Configure the Firebase SDK.
  // This is the minimum configuration required for the API to be used.
  var config = {
    'apiKey': "YOU_API_KEY" // Copy this key from the web initialization
                            // snippet found in the Firebase console.
  };
  // firebase initialization
  let app = firebase.initializeApp(firebaseConfig);
  let appAuth = app.auth();
  auth = firebase.auth();
  database = firebase.database();

  firebase.analytics();
  stateChangeTrigger();

  // Handle the user management action.
  switch (mode) {
    case 'verifyEmail':
      // Display email verification handler and UI.
      handleVerifyEmail(appAuth, actionCode);
      break;
    default:
      // Error: invalid mode.
  }
}, false);

function handleVerifyEmail(auth, actionCode) {
  // Localize the UI to the selected language as determined by the lang
  // parameter.
  // Try to apply the email verification code.
  auth.applyActionCode(actionCode).then((resp) => {
    // Email address has been verified.
    console.log("verified");
    // TODO: Display a confirmation message to the user.
    // You could also provide the user with a link back to the app.

    // TODO: If a continue URL is available, display a button which on
    // click redirects the user back to the app via continueUrl with
    // additional state determined from that URL's parameters.
  }).catch((error) => {
    // Code is invalid or expired. Ask the user to verify their email address
    // again.
  });
}