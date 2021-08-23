const notificationDisplay = document.querySelector(".header__notification-display");
const notificationIC = document.querySelector(".header__notification-ic");

notificationIC.addEventListener("click", (e) => {
    notificationDisplay.classList.toggle("none");
})

let database = firebase.database();