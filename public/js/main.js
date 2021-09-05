import { firebaseConfig, userSignOut, readDB } from "./modules/firebase.js";

// firebase initialization
firebase.initializeApp(firebaseConfig);
firebase.analytics();

const auth = firebase.auth();
const database = firebase.database();
const userProfilePic = document.querySelector(".header__img");
const userName = document.querySelector(".header__title--username");

function updateUserDetails(user) {
  userProfilePic.src = user.photoURL;
  userName.innerText = user.displayName;
}

auth.onAuthStateChanged(async (currentUser) => {
  if (currentUser) {
    let check_presence = await readDB(database, `users/${currentUser.uid}`);
    if (!currentUser.emailVerified || !check_presence.val()) {
      window.location = "./index.html";
    }
    updateUserDetails(currentUser);
    document.querySelector(".loader").classList.add("none");
    document.querySelector("main").classList.remove("none");
  } else {
    window.location = "./index.html";
  }
});

userProfilePic.addEventListener("click", () => {
  userSignOut(auth);
});

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
  document.querySelector(".footer__time").innerHTML = currentTime;
  setTimeout(displayTime, 1000);
}

displayTime();

let dateObject = new Date();
let time = dateObject.getHours();
let greetHolder = document.querySelector(".header__title--greet");
if (time < 12) {
  greetHolder.textContent = "Good morning! ";
}
if (time > 12 && time <= 16) {
  greetHolder.textContent = "Good afternoon! ";
}
if (time > 16 && time <= 20) {
  greetHolder.textContent = "Good Evening! ";
}
if (time > 20) {
  greetHolder.textContent = "Good Night! ";
}
if (time == 12) {
  greetHolder.textContent = "Go Eat Lunch! ";
}
