import { firebaseConfig, userSignOut, readDB } from "./modules/firebase.js";
import { displayTime, setGreeting } from "./modules/util.js";

// firebase initialization
firebase.initializeApp(firebaseConfig);
firebase.analytics();

displayTime(document.querySelector(".footer__time"));
setGreeting(document.querySelector(".header__title--greet"));

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
    console.log(currentUser);
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
