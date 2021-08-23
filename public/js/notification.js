const notification = {
  0: "rejected",
};

let database = firebase.database();
let auth = firebase.auth();

const notificationDisplay = document.querySelector(
  ".header__notification-display"
);
const notificationIC = document.querySelector(".header__notification-ic");

function addNotification(data) {
  if (!data.val()) {
    notificationDisplay.innerHTML = `<p>No New notification</p>`;
  }
  notificationIC.src = "./assets/icons/home/notification_dot.svg";
  let key = data.key;
  let msg = data.val();
  let temp = `<div class="header__notification-eachmsg" data-id=${key}>
                  <p class="header__notification-msg">
                  <span class="header__notification-name">${msg[0]}</span> has <span class="header__notifcation-status">Rejected</span> your friend request.
                  </p>
                  <img src="./assets/icons/home/msg-clear.svg" class="header__notification-clrmsg" alt="clear message">
              </div> `;
  notificationDisplay.innerHTML += temp;
//   document.querySelectorAll(".notifcation")
}

auth.onAuthStateChanged(async (user) => {
  if (user) {
      console.log(user);
    database
      .ref(`friends/${user.uid}/notifications`)
      .on("child_added", addNotification);
    
    // database.ref(`friends/${user.uid}/notification`).on("child_removed", removeNotification);
  }
});

notificationIC.addEventListener("click", (e) => {
  notificationDisplay.classList.toggle("none");
});
