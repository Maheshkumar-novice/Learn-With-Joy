import { removeDB, setDBListener } from "./modules/firebase.js";

let database = firebase.database();
let auth = firebase.auth();
let user;
let pageLoadedTimeStamp;

const volumeIC = document.querySelectorAll(".volume");
const notificationDisplay = document.querySelector(
  ".header__notification-display"
);
const notificationIC = document.querySelector(".header__notification-ic");
const notificationSound = document.querySelector(".notification__sound");

// mute volume
function toggleMute(index){
  let otherIndex;
  index === "1" ? 
  (otherIndex = 0, notificationSound.volume = 1) : (otherIndex = 1, notificationSound.volume = 0);
  volumeIC[index].classList.add("none");
  volumeIC[otherIndex].classList.remove("none");
  window.localStorage.setItem("volumeIndex", otherIndex);
}

volumeIC.forEach( volume => {
  volume.addEventListener("click", function (e){
    toggleMute(this.dataset.index);
  });
});
 

// each group
const notificationAllCnt = document.querySelectorAll(".notification__common");

function playSound() {
  notificationSound.currentTime = 0;
  notificationSound.play().catch((error) => {
    console.log(error);
  });
}

function changeNotificationSrc() {
  notificationIC.src = "./assets/icons/home/notification_dot.svg";
}

function checkNoticationSrcChange(){
  const noNotification = [...document.querySelectorAll(".no__message")];
  if(noNotification.every(elem => !elem.classList.contains("none"))){
    notificationIC.src = "./assets/icons/home/notification.svg";
  }
}

function returnDateTime(timestamp) {
  const dateTime = new Date(timestamp);
  const date = dateTime.toDateString().split(" ");
  const time = dateTime.toTimeString().split(" ");
  return `${time[0]} - ${date[0]} ${date[2]} ${date[3]}`;
}

function removeNotificationFromDatabase(e){
  const id = e.target.dataset.id;
  removeDB(database, `notifications/${user.uid}/friends/${id}`);
}

function removeNotificationFromList(data){
  const toRemove = document.querySelector(`.header__notification-eachmsg[data-id="${data.key}"]`);
  const removeFrom = toRemove.parentElement;
  removeFrom.removeChild(toRemove);
  removeFrom.childElementCount  === 1 ? (removeFrom.querySelector(".no__message").classList.remove("none"), checkNoticationSrcChange()) : "";
}

function updateFriendsNotification(data) {
  changeNotificationSrc();
  notificationAllCnt[0].querySelector(".no__message").classList.add("none");
  console.log(data.val(), data.key, notificationAllCnt[0]);
  const name = data.val().name;
  const timeStamp = data.val().timeStamp;
  timeStamp > pageLoadedTimeStamp ? playSound() : "";
  const elemIsPresent = document.querySelector(`.header__notification-eachmsg[data-id="${data.key}"]`);
  if(elemIsPresent){
    elemIsPresent.querySelector(".header__notification-time").innerText = returnDateTime(timeStamp);
    return;
  }
  notificationAllCnt[0].innerHTML += `<div class="header__notification-eachmsg" data-id="${data.key}">
                                        <p class="header__notification-msg">
                                          <span class="header__notification-highlight">${name}</span> has accepted your friend request
                                        </p>
                                        <img
                                          src="./assets/icons/home/msg-clear.svg"
                                          class="header__notification-clrmsg"
                                          data-id="${data.key}"
                                          alt="clear message"
                                        />
                                        <div class="header__notification-time">${returnDateTime(timeStamp)}</div>
                                      </div>`;
  document.querySelectorAll(`.header__notification-clrmsg`).forEach(elem => {
    elem.addEventListener("click", removeNotificationFromDatabase);
  });
}

auth.onAuthStateChanged(async (current_user) => {
  if (current_user) {
    user = current_user;

    pageLoadedTimeStamp = Date.now();
    setDBListener(
      database,
      `notifications/${user.uid}/friends`,
      "child_added",
      updateFriendsNotification
    );
    setDBListener(
      database,
      `notifications/${user.uid}/friends`,
      "child_changed",
      updateFriendsNotification
    );
    setDBListener(
      database,
      `notifications/${user.uid}/friends`,
      "child_removed",
      removeNotificationFromList
    );

    // database.ref(`friends/${user.uid}/notification`).on("child_removed", removeNotification);
  }
});

notificationIC.addEventListener("click", (e) => {
  notificationDisplay.classList.toggle("none");
});

window.addEventListener("load", (e) => {
  let volIndex = window.localStorage.getItem("volumeIndex");
  if(volIndex){
    toggleMute(volIndex);
  }
})
