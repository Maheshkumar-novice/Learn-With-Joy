import {
  readDB,
  firebaseConfig,
  userSignIn,
  writeDB,
} from "./modules/firebase.js";

// firebase initialization
firebase.initializeApp(firebaseConfig);
firebase.analytics();

const auth = firebase.auth();
const database = firebase.database();
let namesList = [];

// selectors
const gsignIn = document.querySelector(".header__login-img");
const signinHead = document.querySelector(".header__login-head");
const signinCnt = document.querySelector(".header__login-cnt");
const inup = document.querySelectorAll(".header__login-inup");
const inupBtn =document.querySelector(".header__login-btn");

const newNameCnt = document.querySelector(".main__name");
const newNameInput = document.querySelector(".main__name--input");
const newNameErr = document.querySelector(".main__name--err");
const next = document.querySelector(".main__name--next");

function showInput() {
  document.querySelectorAll(".main>*:not(.main__name)").forEach((elem) => {
    elem.style.filter = "blur(2rem)";
  });
  newNameCnt.classList.remove("none");
  newNameInput.focus();
}

async function updateNewUser() {
  let data = (await readDB(database, "users")).val();
  console.log(data);
  if(data){
    for(let id in data){
      namesList.push(data[id].name);
    }
  }
  console.log(namesList)
  showInput();
}

// sign In status change
auth.onAuthStateChanged(async (user) => {
  if (user) {
    let check_user = await readDB(database, `users/${user.uid}`);
    if (!check_user.val()) {
      updateNewUser();
    } else {
      window.location = "../index.html";
    }
  }
});

//event listener

signinHead.addEventListener("click", (e) => {
  signinCnt.classList.toggle("none");
});

inup.forEach(btn => {
  btn.addEventListener("click", function(e){
    let id = +this.dataset.id;
    let oppid = id === 1 ? 0 : 1;
    inup[oppid].style.backgroundColor = "white"; 
    inup[oppid].style.color = "black"; 
    inup[id].style.backgroundColor = "black"; 
    inup[id].style.color = "white"; 
    inupBtn.innerText = this.innerText;
  });
});


gsignIn.addEventListener("click", (e) => {
  const provider = new firebase.auth.GoogleAuthProvider();
  userSignIn(auth, provider);
});

let check_name, userName, userLower;
newNameInput.addEventListener("input", function (e) {
  userName = this.value;
  userLower = this.value.toLowerCase();
  if (newNameInput.value === "") return;
  check_name = namesList.find((name) => name.toLowerCase() === userLower);
  newNameInput.style.borderBottom = "1px solid black";
  newNameErr.innerText = "";
  next.classList.remove("none");
  if (check_name) {
    newNameErr.innerText = "User Name Already Taken";
    newNameInput.style.borderBottom = "1px solid red";
    next.classList.add("none");
  }
});

next.addEventListener("click", function (e) {
  if (newNameInput.value === "") return;
  let user = auth.currentUser;
  user
    .updateProfile({
      displayName: `${userName}`,
      photoURL: user.photoURL,
    })
    .then(() => {
      let value = {
        name: userName,
        photo: user.photoURL,
      };
      writeDB(database, `users/${user.uid}`, value);
      setTimeout(() => {
        window.location = "../index.html";
      }, 200);
    })
    .catch((error) => {
      console.log(error);
    });
});
