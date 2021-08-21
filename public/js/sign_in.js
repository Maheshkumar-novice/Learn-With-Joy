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
let names = [];

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
}

async function updateNewUser() {
  let data = await readDB(database, "users/names");
  names = data.val();
  console.log(names);
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
  } else {
    console.log("out");
  }
});

//event listener
gsignIn.addEventListener("click", (e) => {
  const provider = new firebase.auth.GoogleAuthProvider();
  userSignIn(auth, provider);
});

let check_name;
newNameInput.addEventListener("input", function (e) {
  if (!names || newNameInput.value === "") return;
  check_name = names.filter((name) => name === this.value).join("");
  newNameInput.style.borderBottom = "1px solid black";
  newNameErr.innerText = "";
  if(check_name === newNameInput.value){
      newNameErr.innerText = "User Name Already Taken"
      newNameInput.style.borderBottom = "1px solid red";
  }
});

next.addEventListener("click", function (e) {
  let user = auth.currentUser;
  user
    .updateProfile({
      displayName: `${newNameInput.value}`,
      photoURL: user.photoURL,
    })
    .then(() => {
      let value = {
        name: newNameInput.value,
        photo: user.photoURL,
      };
      names ? names.push(newNameInput.value) : (names = [newNameInput.value]);
      writeDB(database, "users/names", names);
      writeDB(database, `users/${user.uid}`, value);
      window.location = "../index.html";
    })
    .catch((error) => {
      console.log(error);
    });
});
