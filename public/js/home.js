import { firebaseConfig, userSignOut, readDB } from "./modules/firebase.js";
import { displayTime, pushState, setGreeting } from "./modules/util.js";

// firebase initialization
firebase.initializeApp(firebaseConfig);
firebase.analytics();

displayTime(document.querySelector(".footer__time"));
setGreeting(document.querySelector(".header__title--greet"));

const auth = firebase.auth();
const database = firebase.database();
const userProfilePic = document.querySelector(".header__profile-img");
const userName = document.querySelector(".header__title--username");
const navTabs = document.querySelectorAll(".navbar__tab");
const sectionTabs = document.querySelectorAll(".section-tab");
const userOptions = document.querySelector(".user-options");
const signOutOption = document.querySelector(".sign-out-option");

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
  userOptions.classList.toggle("none");
});

signOutOption.addEventListener("click", () => {
  userSignOut(auth);
});

function changeTabs(tab, bool) {
  removeAllActiveTabs();
  tab.classList.add("navbar__tab--active");
  hideAllSections();
  sectionTabs[[...navTabs].indexOf(tab)].classList.remove("none");
  bool ? pushState(tab.innerText.toLowerCase()) : "";
}

navTabs.forEach((tab) => {
  tab.addEventListener("click", (e) => {
    changeTabs(e.target, 1);
  });
});

const tabMap = {
  home: navTabs[0],
  friends: navTabs[0],
  groups: navTabs[1],
  notes: navTabs[2],
  calendar: navTabs[3],
  entertainment: navTabs[4],
  timer: navTabs[5],
};

// window.addEventListener("load", () => {
//   hideAllSections();
//   sectionTabs[0].classList.remove("none");
// });

window.addEventListener("DOMContentLoaded", () => {
  let tabPath = window.location.pathname.replace(/\//gi, "");
  changeTabs(tabMap[tabPath], 1);
});

window.addEventListener("popstate", (e) => {
  changeTabs(tabMap[e.state], 0);
});
