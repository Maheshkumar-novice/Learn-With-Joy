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
let names = [], uid = [];

// selectors
let gsignIn = document.querySelector(".header__img");
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
  let data = await readDB(database, "users/totalUsers");
  if(data.val()){
    names = data.val().names;
    uid = data.val().uid;
  }
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
gsignIn.addEventListener("click", (e) => {
  const provider = new firebase.auth.GoogleAuthProvider();
  userSignIn(auth, provider);
});

let check_name, userName, userLower;
newNameInput.addEventListener("input", function (e) {
  userName = this.value;
  userLower = this.value.toLowerCase();
  if (!names || newNameInput.value === "") return;
  check_name = names.filter((name) => name === userLower).join("");
  newNameInput.style.borderBottom = "1px solid black";
  newNameErr.innerText = "";
  next.classList.remove("none");
  if (check_name === userLower) {
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
      // names ? (names.push(userLower), uid.push(user.uid)) : (names = [userLower], uid = [user.uid]);
      // let userVal = {
      //   names,
      //   uid
      // }
      // writeDB(database, "users/totalUsers", userVal);
      writeDB(database, `users/${user.uid}`, value);
      setTimeout(() => {
        window.location = "../index.html";
      }, 200);
    })
    .catch((error) => {
      console.log(error);
    });
});
