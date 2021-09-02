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
const gsignIn = document.querySelector(".google__signup");
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
  if (data) {
    for (let id in data) {
      namesList.push(data[id].name);
    }
  }
  console.log(namesList);
}

// sign In status change
auth.onAuthStateChanged(async (user) => {
  if (user) {
    console.log(user);
    if(!user.emailVerified){
      updateUserName();
      console.log(user);
      return;
    }
    let check_user = await readDB(database, `users/${user.uid}`);
    if (!check_user.val()) {
      await updateNewUser();
      showInput();
    } else {
      window.location = "../index.html";
    }
  }
});

//event listener
gsignIn.addEventListener("click", (e) => {
  console.log("hi");
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
  updateUserName(1);
});

function changeLocation(){
  setTimeout(() => {
    window.location = "../index.html";
  }, 200);
}

function updateUserName(val){
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
      val ? changeLocation() : "";
    })
    .catch((error) => {
      console.log(error);
    });
}

// timer
function displayTime() {
  let date = new Date();
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();
  let currentTime =
    (hours < 10 ? "0" + hours : hours) +
    ":" +
    (minutes < 10 ? "0" + minutes : minutes) +
    ":" +
    (seconds < 10 ? "0" + seconds : seconds);
  document.querySelector(".time").innerHTML = currentTime;
  setTimeout(displayTime, 1000);
}

displayTime();

//
const loginTab = document.querySelector(".login__tab");
const signupTab = document.querySelector(".signup__tab");
const loginForm = document.querySelector(".login__form");

loginTab.addEventListener("click", function () {
  loginForm.innerHTML = `
  <div class="input__field">
  <label for="email"> Email </label>
  <input type="email" id="email" class="form__input" required/>
</div>

<div class="input__field">
  <label for="password"> Password </label>
  <input type="password" id="password" class="form__input" required/>
</div>

<button type="submit" class="form__button">Login</button>
  `;
  loginTab.classList.add("active");
  signupTab.classList.remove("active");
  addSignListener();
});

signupTab.addEventListener("click", async function () {
  loginForm.innerHTML = `
  <div class="input__field">
  <label for="name"> User Name </label>
  <input type="name" id="name" class="form__input form__input-username" required autocomplete="off"/>
</div>
<div class="input__field">
  <label for="email"> Email </label>
  <input type="email" id="email" class="form__input" required/>
</div>

<div class="input__field">
  <label for="password"> Password </label>
  <input type="password" id="password" class="form__input" required/>
</div>

<div class="input__field">
  <label for="re-enter-password"> Re-Enter Password </label>
  <input type="password" id="re-enter-password" class="form__input" required/>
</div>

<button type="submit" class="form__button">Signup</button>`;
  loginTab.classList.remove("active");
  signupTab.classList.add("active");
  addSignListener();
  await updateNewUser();
  document.querySelector(".form__input-username").addEventListener("input", checkUniqueUser);
  
});

const login = document.querySelector(".login");
const title = document.querySelector(".title");
const subTitle = document.querySelector(".sub-title");
const features = document.querySelector(".features");
const signinToggle = document.querySelector(".sign-in");
signinToggle.addEventListener("click", function () {
  console.log("hi");
  login.classList.toggle("none");
  title.classList.toggle("none");
  features.classList.toggle("none");
  subTitle.classList.toggle("none");
});

function checkUniqueUser() {
  console.log(this.value);
  userName = this.value;
  userLower = this.value.toLowerCase();
  if (this.value === "") return;
  check_name = namesList.find((name) => name.toLowerCase() === userLower);
  this.style.borderBottom = "1px solid #fbae3c";
  if (check_name) {
    this.style.borderBottom = "1px solid red";
  }
}

function addSignListener() {
  const signBtn = document.querySelector(".form__button");
  console.log(signBtn);
  signBtn.addEventListener("click", function (e) {
    console.log(this.textContent);
  });
}

addSignListener();
