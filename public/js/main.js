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
  uidList = [],
  friendlist = null;

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
    // updateFriendList();
    user = check_user;
    addDbListener();
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
let bool;
async function updateSearchResult(uid) {
  bool = false;
  if (friendlist.received !== "null") {
    friendlist.received.forEach((list) => {
      if (list === uid) bool = true;
    });
  }
  if (uid === user.uid || bool) return;
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

  if (me.sent !== "null") {
    let val = me.sent.filter((data) => data === uid).join("");
    console.log(val);
    if (val !== "") return;
  }
  console.log("written");
  me.sent === "null" ? (me.sent = [uid]) : me.sent.push(uid);
  friend.received === "null"
    ? (friend.received = [user.uid])
    : friend.received.push(user.uid);

  writeDB(database, `friends/${user.uid}`, me);
  writeDB(database, `friends/${uid}`, friend);
}

// add and reject friend
function addFriend(e) {
  let fid = e.target.parentElement;
}

function removeFriend(e) {
  console.log("remove", e.target.parentElement);
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

// ----------------------- update user page -------------------------------------
const cnt = document.querySelectorAll(".main__req-cards");

async function updateFriendList() {
  let friends_data = await readDB(database, `friends/${user.uid}`);
  if (!friends_data.val()) {
    let value = {
      count: 0,
      friends: "null",
      sent: "null",
      received: "null",
      rejected: "null",
    };
    friendlist = value;
    writeDB(database, `friends/${user.uid}`, value);
  } else {
    friendlist = friends_data.val();
  }
}

async function updateRequestReceived() {
  await updateFriendList();
  console.log(friendlist);
  if (friendlist === {} || friendlist.received === "null") return;
  let tot_length = (cnt[0].querySelectorAll(".main__friend-card") || []).length;
  // let start = friendlist.received.length - tot_length
  friendlist.received.forEach(async (list, idx) => {
    if (tot_length > idx) return;
    let list_user = await readDB(database, `users/${list}`);
    cnt[0].innerHTML += `<div class="main__friend-card default" data-id=${list}>
    <img
      src="${list_user.val().photo}"
      alt="Friend"
      class="main__img"
    />
    <p class="main__friend-name">${list_user.val().name}</p>
    <img class="main__add-friend-ic" src="./assets/icons/home/accept.svg" alt="accept">
    <img class="main__remove-friend-ic" src="./assets/icons/home/reject.svg" alt="reject">
  </div>`;
    document.querySelectorAll(`.main__add-friend-ic`).forEach((accept) => {
      console.log(accept);
      accept.addEventListener("click", addFriend);
    });
    document.querySelectorAll(`.main__remove-friend-ic`).forEach((reject) => {
      reject.addEventListener("click", removeFriend);
    });
  });
}

async function updateRequestSent() {
  await updateFriendList();
  console.log(friendlist);
  if (friendlist === {} || friendlist.sent === "null") return;
  let tot_length = (cnt[1].querySelectorAll(".main__friend-card") || []).length;
  // let start = (friendlist.sent.length - tot_length)-1
  // console.log(tot_length, start);
  friendlist.sent.forEach(async (list, idx) => {
    if (tot_length > idx) return;
    let list_user = await readDB(database, `users/${list}`);
    cnt[1].innerHTML += `<div class="main__friend-card default" data-id=${list}>
    <img
      src="${list_user.val().photo}"
      alt="Friend"
      class="main__img"
    />
    <p class="main__friend-name">${list_user.val().name}</p>
    <img class="main__pending-friend-ic default" src="./assets/icons/home/pending.svg" alt="pending">
  </div>`;
  });
}

function update() {
  updateRequestReceived();
  updateRequestSent();
}

// ------------------------- db listener --------------------------
function addDbListener() {
  setDBListener(`friends/${user.uid}/sent`, updateRequestSent);
  setDBListener(`friends/${user.uid}/received`, updateRequestReceived);
}

function setDBListener(reference, callBack) {
  database.ref(reference).on("value", callBack);
}
