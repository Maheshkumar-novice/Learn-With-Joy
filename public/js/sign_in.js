import { firebaseConfig, userSignIn, writeDB } from "./modules/firebase.js";

// firebase initialization
firebase.initializeApp(firebaseConfig);
firebase.analytics();

const auth = firebase.auth();
const database = firebase.database();

// selectors
let gsignIn = document.querySelector(".header__img");

// sign In status change
auth.onAuthStateChanged((user) => {
  if (user) {
    let value = {
      name: user.displayName,
      photo: user.photoURL,
    };
    writeDB(database, `users/${user.uid}`, value);
    window.location = "../index.html";
  } else {
    console.log("out");
  }
});

//event listener
gsignIn.addEventListener("click", (e) => {
  const provider = new firebase.auth.GoogleAuthProvider();
  userSignIn(auth, provider);
});
