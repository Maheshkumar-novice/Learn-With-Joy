import { firebaseConfig, userSignOut, readDB, updateDB } from "./modules/firebase.js";
import { displayTime, getParameterByName, pushState, setGreeting } from "./modules/util.js";

// firebase initialization
firebase.initializeApp(firebaseConfig);
firebase.analytics();

displayTime(document.querySelector(".footer__time"));
setGreeting(document.querySelector(".header__title--greet"));

const auth = firebase.auth();
const database = firebase.database();
const userProfilePic = document.querySelector(".header__profile-img");
const userOptionsTrigger = document.querySelector(".options-drop-down-img");
const userName = document.querySelector(".header__title--username");
const navTabs = document.querySelectorAll(".navbar__tab");
const otherAvailableTabsTrigger = document.querySelector(".navbar__img");
const otherAvailableTabs = document.querySelector(".available-tabs");
const sectionTabs = document.querySelectorAll(".section-tab");
const userOptions = document.querySelector(".user-options");
const signOutOption = document.querySelector(".sign-out-option");
const timerStatus = document.querySelector(".timer-status");

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

function toggleUserOptions() {
  userOptions.classList.toggle("none");
  userOptionsTrigger.classList.toggle("rotate-180");
}

function enableUserOffline(uid){
  const ref = database.ref(`users/${uid}`);
  ref.onDisconnect().update({status: false});
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
    updateDB(database, `users/${currentUser.uid}`, {status: true});
    enableUserOffline(currentUser.uid);
  } else {
    window.location = "./index.html";
  }
});

userProfilePic.addEventListener("click", () => {
  toggleUserOptions();
});

userOptionsTrigger.addEventListener("click", () => {
  toggleUserOptions();
});

signOutOption.addEventListener("click", () => {
  userSignOut(auth);
});

otherAvailableTabsTrigger.addEventListener("click", function () {
  this.classList.toggle("rotate-180");
  otherAvailableTabs.classList.toggle("none");
});

function changeTabs(tab, bool) {
  removeAllActiveTabs();
  console.log(tab);
  tab.classList.add("navbar__tab--active");
  hideAllSections();
  sectionTabs[[...navTabs].indexOf(tab)].classList.remove("none");
  bool ? pushState(tab.dataset.tab) : "";
}

const richEditor = document.querySelector(".rich-editor");
navTabs.forEach((tab) => {
  tab.addEventListener("click", (e) => {
    if(e.target.innerText === "Notes" && richEditor.dataset.noteId !== "null"){
      const newURL = `/notes?editor=true&nid=${richEditor.dataset.noteId}`;
      window.history.pushState("noteEditor", null, newURL);
      changeTabs(e.target, 0);
      return;
    }
    changeTabs(e.target, 1);
  });
});

const tabMap = {
  home: navTabs[0],
  friends: navTabs[0],
  groups: navTabs[1],
  notes: navTabs[2],
  gsearch: navTabs[3],
  entertainment: navTabs[4],
  timer: navTabs[5],
  calendar: navTabs[6]
};

// window.addEventListener("load", () => {
//   hideAllSections();
//   sectionTabs[0].classList.remove("none");
// });

window.addEventListener("DOMContentLoaded", () => {
  let tabPath = window.location.pathname.replace(/\//gi, "");
  const urlParams = new URLSearchParams(window.location.search);
  const share = getParameterByName(urlParams, "share");
  const editor = getParameterByName(urlParams, "editor");
  if(share){
    changeTabs(tabMap[tabPath], 0);
    return;
  }
  if(editor){
    changeTabs(tabMap[tabPath], 0);
    return;
  }
  console.log(tabMap[tabPath]);
  changeTabs(tabMap[tabPath], 1);
});

window.addEventListener("popstate", (e) => {
  console.log("in");
  console.log(e.state);
  if(!e.state.pathName) return;
  console.log("in") 
  changeTabs(tabMap[e.state.pathName], 0);
});

timerStatus.addEventListener("click", () => {
  changeTabs(tabMap["timer"], 1);
});
