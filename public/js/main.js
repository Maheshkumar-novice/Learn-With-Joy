import {
  firebaseConfig,
  userSignOut,
  readDB,
  writeDB,
} from "./modules/firebase.js";

// firebase initialization
firebase.initializeApp(firebaseConfig);
firebase.analytics();

const auth = firebase.auth();
const database = firebase.database();
let user,
  namesList = [],
  uidList = [];

// selector
const userProfilePic = document.querySelector(".header__img");
const userName = document.querySelector(".header__title--username");

//update profile and name
function updateUserDetails() {
  userProfilePic.src = user.photoURL;
  userName.innerText = user.displayName;
}

//Updat names and uid list
async function updateList() {
  let total_data = await readDB(database, "users/totalUsers");
  if (total_data.val()) {
    namesList = total_data.val().names;
    uidList = total_data.val().uid;
  }
}

// sign In status change
auth.onAuthStateChanged(async (check_user) => {
  if (check_user) {
    let check_presence = await readDB(database, `users/${check_user.uid}`);
    if (!check_presence.val()) {
      window.location = "./sign_in.html";
    }
    let friends_data = await readDB(database, `friends/${check_user.uid}`);
    if (!friends_data.val()) {
      let value = {
        count: 0,
        friends: "null",
        sent: "null",
        received: "null",
      };
      writeDB(database, `friends/${check_user.uid}`, value);
    }
    user = check_user;
    console.log(user);
    updateList();
    updateUserDetails();
  } else {
    window.location = "./sign_in.html";
  }
});

// listener
userProfilePic.addEventListener("click", () => {
  userSignOut(auth);
});

// ------------------------------------------------------ friends js start ------------------------------------------------------

//selector
let searchInp = document.querySelector(".main__input");
let searchCnt = document.querySelector(".main__chat");
let addBtn;

// Update search Result
async function updateSearchResult(uid, idx) {
  if (uid === user.uid) return;
  let data = await readDB(database, `users/${uid}`);
  let search_user = data.val();
  searchCnt.innerHTML += `<div class="main__result-card" data-id=${uid}>
                            <img
                              src=${search_user.photo}
                              alt="Friend"
                              class="main__img"
                            />
                            <p class="main__friend-name">${search_user.name}</p>
                            <button class="main__add-friend">Add</button>
                          </div>`;
  addBtnListener();

  // console.log(search_user);
}

// update Friends list
async function sendRequest(uid) {
  let my_data = await readDB(database, `friends/${user.uid}`);
  let friend_data = await readDB(database, `friends/${uid}`);
  let me = my_data.val();
  let friend = friend_data.val();

  if(me.sent !== "null"){
    let val = me.sent.filter(data => data===uid).join("");
    console.log(val);
    if(val !== "") return;
  }
  console.log("written")
  me.sent === "null" ? (me.sent = [uid]) : me.sent.push(uid);
  friend.received === "null"
    ? (friend.received = [uid])
    : friend.received.push(uid);

  writeDB(database, `friends/${user.uid}`, me);
  writeDB(database, `friends/${uid}`, friend);
}

//listener
searchInp.addEventListener("input", (e) => {
  let value = e.target.value;
  searchCnt.innerHTML = "";
  if (value === "") return;
  let regex = new RegExp(value, "gi");
  namesList.forEach(async (name, idx) => {
    if (name.match(regex)) {
      await updateSearchResult(uidList[idx], idx);
    }
  });
});

function addBtnListener() {
  addBtn = document.querySelectorAll(".main__add-friend");
  addBtn.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      sendRequest(e.target.parentElement.dataset.id);
    });
  });
}
