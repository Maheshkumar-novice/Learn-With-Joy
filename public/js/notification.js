import { setDBListener } from "./modules/firebase.js";

let database = firebase.database();
let auth = firebase.auth();

const notificationDisplay = document.querySelector(
  ".header__notification-display"
);
const notificationIC = document.querySelector(".header__notification-ic");
const notificationSound = document.querySelector(".notificaiton__sound");

// each group
const notificationAllCnt = document.querySelectorAll(".notification__common");

function playSound() {
  notificationSound.currentTime = 0;
  notificationSound.play();
}

notificationIC.addEventListener("click", (e) => {
  console.log("Hel");
  notificationDisplay.classList.toggle("none");
});

function updateFriendsNotification(data) {
  console.log(data.val(), data.key, notificationAllCnt[0]);
  const name = data.val().name;
  notificationAllCnt[0].innerHTML += `<div class="header__notification-eachmsg" data-id=${data.key}>
  <p class="header__notification-msg">
    <span class="header__notification-highlight">${name}</span> has accepted your friend request
  </p>
  <img
    src="./assets/icons/home/msg-clear.svg"
    class="header__notification-clrmsg"
    alt="clear message"
  />
  <div class="header__notification-time">19:20:25 - 20/12/2021</div>
</div>`;
}

auth.onAuthStateChanged(async (user) => {
  if (user) {
    console.log(user);
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

    // database.ref(`friends/${user.uid}/notification`).on("child_removed", removeNotification);
  }
});

/*
let time = timeStamp.toTimeString().split(" ")[0];
  let date = `${timeStamp.getDate()}/${timeStamp.getMonth()+1}/${timeStamp.getFullYear()}}`
  let dateTime = `${time} - ${date}`;
  */

/* 
<div class="header__notification-eachmsg">
                <p class="header__notification-msg">
                  <span class="header__notification-highlight">Lorem</span> has accepted your friend request
                </p>
                <img
                  src="./assets/icons/home/msg-clear.svg"
                  class="header__notification-clrmsg"
                  alt="clear message"
                />
                <div class="header__notification-time">19:20:25 - 20/12/2021</div>
              </div>
*/
