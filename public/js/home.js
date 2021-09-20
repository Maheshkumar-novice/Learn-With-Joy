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
const navTabs = document.querySelectorAll(".navbar__tab");
const sectionTabs = document.querySelectorAll(".section-tab");

function updateUserDetails(user) {
  userProfilePic.src = user.photoURL;
  userName.innerText = user.displayName;
}

function removeAllActiveTabs() {
  navTabs.forEach((tab) => {
    tab.classList.remove("navbar__tab--active");
  });
}

function hideAllSections() {
  sectionTabs.forEach((tab) => {
    tab.classList.add("none");
  });
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

navTabs.forEach((tab) => {
  tab.addEventListener("click", (e) => {
    removeAllActiveTabs();
    e.target.classList.add("navbar__tab--active");
    hideAllSections();
    sectionTabs[[...navTabs].indexOf(tab)].classList.remove("none");
  });
});
