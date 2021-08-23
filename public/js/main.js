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
  friendlist = null,
  friendsUID="null";

// selector
const userProfilePic = document.querySelector(".header__img");
const userName = document.querySelector(".header__title--username");

//update profile and name
function updateUserDetails() {
  userProfilePic.src = user.photoURL;
  userName.innerText = user.displayName;
}

//Update names and uid list
async function updateList() {
  let total_data = (await readDB(database, "users")).val();
  for(let uid in total_data){
    console.log(uid);
    uidList.push(uid);
    namesList.push(total_data[uid]);
  }
  console.log(namesList, uidList);
  // if (total_data) {
  //   namesList = total_data.names;
  //   uidList = total_data.uid;
  // }
}

function appendList(data){
  uidList.push(data.key);
  namesList.push(data.val());
  console.log(namesList, uidList);
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
    // updateList();
    updateUserDetails();
    // addFriendList();
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

//remove after add btn triggered
function removeSerachFriendResult(e){
  let remove_elem = document.querySelector(`.main__result-card[data-id=${e.target.parentElement.dataset.id}]`);
  console.log(remove_elem);
  searchCnt.removeChild(remove_elem);
}

// Update search Result
let boolReceived, boolSent, boolFriends;
function updateSearchResult(uid) {
  boolReceived = boolSent = false;
  if (friendlist.received !== "null") {
    friendlist.received.forEach((list) => {
      if (list === uid) boolReceived = true;
    });
  }
  if (friendlist.sent !== "null") {
    friendlist.sent.forEach((list) => {
      if (list === uid) boolSent = true;
    });
  }
  if (friendsUID !== "null") {
    friendsUID.forEach((list) => {
      if (list === uid) boolSent = true;
    });
  }
  if (uid === user.uid || boolReceived || boolSent) return;
  let search_user = namesList[uidList.findIndex(tot_uid => tot_uid === uid)];
  return `<div class="main__result-card" data-id=${uid}>
                            <img
                              src=${search_user.photo}
                              alt="Friend"
                              class="main__img"
                            />
                            <p class="main__friend-name">${search_user.name}</p>
                            <button class="main__add-friend">Add</button>
                          </div>`;
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
async function addFriend(e) {
  await updateFriendList();
  let fid = e.target.parentElement.dataset.id;
  let hashtext = CryptoJS.SHA256(fid + user.uid).toString();
  friendlist.friends === "null"
    ? (friendlist.friends = [hashtext])
    : friendlist.friends.push(hashtext);
  let frnd_data_val = await readDB(database, `friends/${fid}`);
  let frnd_data = frnd_data_val.val();
  frnd_data.friends === "null"
    ? (frnd_data.friends = [hashtext])
    : frnd_data.friends.push(hashtext);
  friendlist.received.length === 1
    ? (friendlist.received = "null")
    : friendlist.received.splice(
        friendlist.received.findIndex((frnd) => frnd === fid),
        1
      );
  frnd_data.sent.length === 1
    ? (frnd_data.sent = "null")
    : frnd_data.sent.splice(
        frnd_data.sent.findIndex((frnd) => frnd === user.uid),
        1
      );
  writeDB(database, `friends/${user.uid}/friends`, friendlist.friends);
  writeDB(database, `friends/${user.uid}/received`, friendlist.received);
  writeDB(database, `friends/${fid}/friends`, frnd_data.friends);
  writeDB(database, `friends/${fid}/sent`, frnd_data.sent);
  let value = {
    user1: user.uid,
    user2: fid,
  };
  writeDB(database, `chat/${hashtext}`, value);
}

function removeFriend(e) {
  console.log("remove", e.target.parentElement);
}

//listener
searchInp.addEventListener("input", (e) => {
  if(e.target.value === "") searchCnt.innerHTML = "";
  let value = e.target.value;
  // searchCnt.innerHTML = "";
  let html = "";
  if (value === "") return;
  let regex = new RegExp(value, "gi");
  namesList.forEach((obj, idx) => {
    if (obj.name.match(regex)) {
      html += updateSearchResult(uidList[idx], idx);
    }
  });
  searchCnt.innerHTML = html;
  addBtnListener();
});

function addBtnListener() {
  addBtn = document.querySelectorAll(".main__add-friend");
  addBtn.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      sendRequest(e.target.parentElement.dataset.id);
      removeSerachFriendResult(e);
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

async function addFriendList() {
  await updateFriendList();
  let cnt = document.querySelector(".main__friend-cnt");
  // cnt.innerHTML = "";
  if(friendlist.friends === "null") {
    friendsUID = "null";
    return
  }
  friendsUID = [];
  let html = ""
  console.log(friendlist.friends);
  friendlist.friends.map(async (elem, idx) => {
    let chatUsers = (await readDB(database, `chat/${elem}`)).val();
    let frndUID = chatUsers.user1===user.uid ? chatUsers.user2 : chatUsers.user1;
    let chatUid = namesList[uidList.findIndex(UID => UID === frndUID)];
    console.log(chatUid)
    friendsUID.push(chatUid);
    html += `<div class="main__friend-card" data-id=${frndUID}>
    <img
      src="${chatUid.photo}"
      alt="Friend"
      class="main__img"
    />
    <p class="main__friend-name">${chatUid.name}</p>
    <button class="main__remove-friend">Remove</button>
  </div>`
    if(idx === friendlist.friends.length-1){
      cnt.innerHTML = html;
      console.log(friendsUID);
    }
  });
  // friendlist.friends.forEach(async function (elem) {
  //   let chatUsers = (await readDB(database, `chat/${elem}`)).val();
  //   let frndUID = chatUsers.user1===user.uid ? chatUsers.user2 : chatUsers.user1;
  //   let chatUid = (await readDB(database, `users/${frndUID}`)).val();
  //   cnt.innerHTML += `<div class="main__friend-card" data-id=${frndUID}>
  //   <img
  //     src="${chatUid.photo}"
  //     alt="Friend"
  //     class="main__img"
  //   />
  //   <p class="main__friend-name">${chatUid.name}</p>
  //   <button class="main__remove-friend">Remove</button>
  // </div>`
  // });
}

async function updateRequestReceived() {
  await updateFriendList();
  // cnt[0].innerHTML = "";
  console.log(friendlist);
  if (friendlist === {} || friendlist.received === "null") {
    cnt[0].innerHTML = "";
    return
  };
  // let tot_length = (cnt[0].querySelectorAll(".main__friend-card") || []).length;
  // let start = friendlist.received.length - tot_length
  // let html = "";
  cnt[0].innerHTML = friendlist.received.map(list => {
    let list_user = namesList[uidList.findIndex(UID => UID === list)];
    return `<div class="main__friend-card default" data-id=${list}>
    <img
      src="${list_user.photo}"
      alt="Friend"
      class="main__img"
    />
    <p class="main__friend-name">${list_user.name}</p>
    <img class="main__add-friend-ic" src="./assets/icons/home/accept.svg" alt="accept">
    <img class="main__remove-friend-ic" src="./assets/icons/home/reject.svg" alt="reject">
  </div>`
  }).join("");
  document.querySelectorAll(`.main__add-friend-ic`).forEach((accept) => {
    accept.addEventListener("click", addFriend);
  });
  document.querySelectorAll(`.main__remove-friend-ic`).forEach((reject) => {
    reject.addEventListener("click", removeFriend);
  });
  // friendlist.received.forEach(async (list, idx) => {
  //   // if (tot_length > idx) return;
  //   let list_user = await readDB(database, `users/${list}`);
  //   cnt[0].innerHTML += `<div class="main__friend-card default" data-id=${list}>
  //   <img
  //     src="${list_user.val().photo}"
  //     alt="Friend"
  //     class="main__img"
  //   />
  //   <p class="main__friend-name">${list_user.val().name}</p>
  //   <img class="main__add-friend-ic" src="./assets/icons/home/accept.svg" alt="accept">
  //   <img class="main__remove-friend-ic" src="./assets/icons/home/reject.svg" alt="reject">
  // </div>`;
  // });
}

async function updateRequestSent() {
  await updateFriendList();
  console.log(friendlist);
  if (friendlist === {} || friendlist.sent === "null") {
    cnt[1].innerHTML = "";
    return
  };
  // let html = "";
  // let tot_length = (cnt[1].querySelectorAll(".main__friend-card") || []).length;
  // let start = (friendlist.sent.length - tot_length)-1
  // console.log(tot_length, start);
  cnt[1].innerHTML = friendlist.sent.map(list => {
    let list_user = namesList[uidList.findIndex(UID => UID === list)];
    return `<div class="main__friend-card default" data-id=${list}>
    <img
      src="${list_user.photo}"
      alt="Friend"
      class="main__img"
    />
    <p class="main__friend-name">${list_user.name}</p>
    <img class="main__pending-friend-ic default" src="./assets/icons/home/pending.svg" alt="pending">
  </div>`;
  }).join("");
  // friendlist.sent.forEach(async (list, idx) => {
  //   // if (tot_length > idx) return;
  //   let list_user = await readDB(database, `users/${list}`);
  //   html += `<div class="main__friend-card default" data-id=${list}>
  //   <img
  //     src="${list_user.val().photo}"
  //     alt="Friend"
  //     class="main__img"
  //   />
  //   <p class="main__friend-name">${list_user.val().name}</p>
  //   <img class="main__pending-friend-ic default" src="./assets/icons/home/pending.svg" alt="pending">
  // </div>`;
  // });
}

function update() {
  updateRequestReceived();
  updateRequestSent();
}

// ------------------------- db listener --------------------------
function addDbListener() {
  setDBListener(`users`, "child_added", appendList);
  setDBListener(`friends/${user.uid}`, "value", updateFriendList);
  setDBListener(`friends/${user.uid}/friends`, "value", addFriendList);
  setDBListener(`friends/${user.uid}/sent`, "value", updateRequestSent);
  setDBListener(`friends/${user.uid}/received`, "value", updateRequestReceived);
}

function setDBListener(reference, type, callBack) {
  database.ref(reference).on(type, callBack);
}
