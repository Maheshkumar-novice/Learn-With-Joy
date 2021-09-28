const notificationPopUp = document.querySelector(".extension-installer-popup");
const closeTemp = notificationPopUp.querySelector(".close");
const closePermanent = notificationPopUp.querySelector(".permanent-close");

const closePopUpFunction = () => {notificationPopUp.classList.add("none");}

closeTemp.addEventListener("click", (e) => {
    closePopUpFunction();
});

closePermanent.addEventListener("click", (e) => {
    closePopUpFunction()
    window.localStorage.setItem("gsearchPopup", "true");
});

window.addEventListener("load", (e)=> {
    const popUpCloseStatus = window.localStorage.getItem("gsearchPopup");
    if(popUpCloseStatus === "true"){
        notificationPopUp.classList.add("none");
        closePopUpFunction();
    }
    else{
        notificationPopUp.classList.remove("none")
    }
});