import {
  readDB,
  writeDB,
  removeDB,
  addChlidDB,
  pushKey,
  setDBListener,
  firebaseConfig,
  userSignIn,
  fileMetaData,
} from "./modules/firebase.js";
import { checkUserPresent } from "./modules/util.js";

const auth = firebase.auth();
const database = firebase.database();
let user,
  namesList = [],
  uidList = [],
  friendlist = null,
  friendsUID = [];

//Update names and uid list
function appendList(data) {
  uidList.push(data.key);
  namesList.push(data.val());
}

// sign In status change
auth.onAuthStateChanged(async (check_user) => {
  if (check_user) {
    // update on sign in
    user = check_user;
    await updateFriendList();
    addDbListener();
    console.log(user);
    //releasing disabled
    searchInp.disabled = false;
  } else {
    window.location = "./sign_in.html";
  }
});

// ------------------------------------------------------ friends js------------------------------------------------------

//selector
const searchInp = document.querySelector(".main__input");
const searchWrap = document.querySelector(".main__search-cnt");
const searchCnt = document.querySelector(".main__search-resultcnt");
const searchCloseIc = document.querySelector(".main__search-close-ic");
const chatCnt = document.querySelector(".main__chat");
let addBtn;

//remove from search result after add btn triggered
function removeSerachFriendResult(e) {
  let id = e.target.parentElement.dataset.id;
  console.log(e, e.target, id);
  let remove_elem = document.querySelector(
    `.main__result-card[data-id="${id}"]`
  );
  console.log(remove_elem);
  searchCnt.removeChild(remove_elem);
  if (searchCnt.childElementCount === 0) {
    searchCnt.innerHTML = `<p class="main__serach-msg">Type to show the results</p>`;
  }
}

// Update search Result
function updateSearchResult(uid) {
  // check for not resending the request
  if (user.uid === uid || checkUserPresent(friendlist, friendsUID, uid))
    return "";
  let search_user = namesList[uidList.findIndex((tot_uid) => tot_uid === uid)];
  return `<div class="main__result-card" data-id=${uid}>
                              <img
                                src=${search_user.photo}
                                alt="Friend"
                                class="main__img"
                              />
                              <p class="main__friend-name">${search_user.name}</p>
                              <img class="main__send-friend-ic" src="./assets/icons/home/accept.svg" alt="Add friend">
                            </div>`;
}

// update Friends list
async function sendRequest(uid) {
  // check for not resending the request
  await updateFriendList();
  if (checkUserPresent(friendlist, friendsUID, uid)) return;
  // let userUpdate = {},
  //   friendUpdate = {};
  // userUpdate[uid] = "pending";
  // friendUpdate[user.uid] = user.displayName;
  addChlidDB(database, `friends/${user.uid}/sent`, uid, "pending");
  addChlidDB(database, `friends/${uid}/received`, user.uid, "pending");
}

// add and remove friend
async function addFriend(e) {
  await updateFriendList();
  let fid = e.target.parentElement.dataset.id;
  let hashtext = pushKey(database, `friends/${fid}`, "friends");
  addChlidDB(database, `friends/${user.uid}/friends`, fid, hashtext);
  addChlidDB(database, `friends/${fid}/friends`, user.uid, hashtext);
  removeDB(database, `friends/${user.uid}/received/${fid}`);
  removeDB(database, `friends/${fid}/sent/${user.uid}`);
  let value = {
    user: {
      user1: user.uid,
      user2: fid,
    },
  };
  writeDB(database, `chat/${hashtext}`, value);
}

async function rejectFriend(e) {
  let fid = e.target.parentElement.dataset.id;
  let key = pushKey(database, `friends/${fid}`, "notifications");
  // console.log(key);
  // let notification = {
  //   0: namesList[uidList.findIndex((uid) => uid === fid)].name,
  // };
  // addChlidDB(database, `friends/${fid}/notifications`, key, notification);

  removeDB(database, `friends/${user.uid}/received/${fid}`);
  removeDB(database, `friends/${fid}/sent/${user.uid}`);
}

async function removeFriend(e) {
  await updateFriendList();
  let hash = e.target.parentElement.dataset.hash;
  let fid = e.target.parentElement.dataset.id;
  removeDB(database, `friends/${user.uid}/friends/${fid}`);
  removeDB(database, `friends/${fid}/friends/${user.uid}`);
  removeDB(database, `chat/${hash}`);
}

//listener
searchInp.addEventListener("input", (e) => {
  if (e.target.value === "")
    searchCnt.innerHTML = `<p class="main__serach-msg">Type to show the results</p>`;
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
  searchCnt.innerHTML =
    html === ""
      ? `<p class="main__serach-msg">Sorry! no results found</p>`
      : html;
  addBtnListener();
});

searchInp.addEventListener("click", (e) => {
  searchWrap.classList.remove("none");
  chatCnt.classList.add("none");
  if (e.target.value === "") {
    searchCnt.innerHTML = `<p class="main__serach-msg">Type to show the results</p>`;
  }
});

function addBtnListener() {
  addBtn = document.querySelectorAll(".main__send-friend-ic");
  addBtn.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      sendRequest(e.target.parentElement.dataset.id);
      removeSerachFriendResult(e);
    });
  });
}

searchCloseIc.addEventListener("click", function (e) {
  searchWrap.classList.toggle("none");
  chatCnt.classList.toggle("none");
});

// ----------------------- update user page -------------------------------------
const cnt = document.querySelectorAll(".main__req-cards");

async function updateFriendList() {
  let friends_data = await readDB(database, `friends/${user.uid}`);
  friendlist = friends_data.val();
}

// Add friends to the friends list
async function addFriendList(data) {
  if (!data.val()) return;
  console.log(data.val());
  let fid = data.key;
  let hash = data.val();
  friendsUID.push(fid);
  let cnt = document.querySelector(".main__friend-cnt");
  // let chatUid = namesList[uidList.findIndex((UID) => UID === fid)];
  let chatUid = (await readDB(database, `users/${fid}`)).val();
  cnt.innerHTML += `<div class="main__friend-card" data-id=${fid} data-hash=${hash}>
      <img
        src="${chatUid.photo}"
        alt="Friend"
        class="main__img"
      />
      <p class="main__friend-name">${chatUid.name}</p>
      <img class="main__remove-friend-ic" src="./assets/icons/home/reject.svg" alt="remove friend">
    </div>\n`;
  document
    .querySelectorAll(`.main__friend-card>.main__remove-friend-ic`)
    .forEach((reject) => {
      reject.addEventListener("click", removeFriend);
    });
  // Chat Listeners
  addEventListenerToFriendCards();
  setDBListener(
    database,
    `chat/${hash}/messages`,
    "child_added",
    addMessageToChatBody
  );
}

// Remove friends from the friends list
async function removeFriendList(data) {
  await updateFriendList();
  let cnt = document.querySelector(".main__friend-cnt");
  if (!data.val()) {
    cnt.innerHTML = "";
    friendsUID = [];
    return;
  }
  console.log(data.val());
  let remove_friend_elem = document.querySelector(
    `.main__friend-card[data-hash="${data.val()}"]`
  );
  friendsUID.splice(remove_friend_elem.dataset.id, 1);
  console.log(friendsUID);
  cnt.removeChild(remove_friend_elem);
  // console.log(friendlist);
}

// Update friend request received
async function updateRequestReceived(data) {
  await updateFriendList();
  console.log(friendlist, data.val(), data.key);
  if (!data.val()) {
    cnt[0].innerHTML = "";
    return;
  }
  let receivedKey = data.key;
  // let list_user = namesList[uidList.findIndex((UID) => UID === receivedKey)];
  let list_user = (await readDB(database, `users/${receivedKey}`)).val();
  console.log(list_user);
  cnt[0].innerHTML += `<div class="main__received-card default" data-id=${receivedKey}>
    <img
      src="${list_user.photo}"
      alt="Friend"
      class="main__img"
    />
    <p class="main__friend-name">${list_user.name}</p>
    <img class="main__add-friend-ic" src="./assets/icons/home/accept.svg" alt="accept">
    <img class="main__remove-friend-ic" src="./assets/icons/home/reject.svg" alt="reject">
  </div>`;
  document.querySelectorAll(`.main__add-friend-ic`).forEach((accept) => {
    accept.addEventListener("click", addFriend);
  });
  document.querySelectorAll(`.main__remove-friend-ic`).forEach((reject) => {
    reject.addEventListener("click", rejectFriend);
  });
}

// Remove friend request received
async function removeRequestReceived(data) {
  console.log(data.val(), data.key);
  if (!data.val()) {
    cnt[0].innerHTML = "";
  }
  let sent_frnd_elem = document.querySelector(
    `.main__received-card[data-id="${data.key}"]`
  );
  cnt[0].removeChild(sent_frnd_elem);
  await updateFriendList();
}

// Update friend request sent
async function updateRequestSent(data) {
  await updateFriendList();
  let sentData = data.val();
  if (!sentData) {
    cnt[1].innerHTML = "";
    return;
  }
  let sent = data.key;
  console.log(sent);
  // let list_user = namesList[uidList.findIndex((UID) => UID === sent)];
  let list_user = (await readDB(database, `users/${sent}`)).val();
  cnt[1].innerHTML += `<div class="main__sent-card default" data-id=${sent}>
      <img
        src="${list_user.photo}"
        alt="Friend"
        class="main__img"
      />
      <p class="main__friend-name">${list_user.name}</p>
      <img class="main__pending-friend-ic default" src="./assets/icons/home/pending.svg" alt="pending">
    </div>`;
}

// Remove friend request sent
async function removeRequestSent(data) {
  if (!data.val()) {
    cnt[1].innerHTML = "";
  }
  let sent_frnd_elem = document.querySelector(
    `.main__sent-card[data-id="${data.key}"]`
  );
  console.log(sent_frnd_elem, data.val(), data.key);
  cnt[1].removeChild(sent_frnd_elem);
  await updateFriendList();
}

// ------------------------- db listener --------------------------
function addDbListener() {
  setDBListener(database, `users`, "child_added", appendList); //Listener for updating total users

  // Listener for updating friends list
  setDBListener(
    database,
    `friends/${user.uid}/friends`,
    "child_added",
    addFriendList
  );
  setDBListener(
    database,
    `friends/${user.uid}/friends`,
    "child_removed",
    removeFriendList
  );

  // Listener for updating friends requests sent
  setDBListener(
    database,
    `friends/${user.uid}/sent`,
    "child_added",
    updateRequestSent
  );
  setDBListener(
    database,
    `friends/${user.uid}/sent`,
    "child_removed",
    removeRequestSent
  );

  // Listener for updating friends requests received
  setDBListener(
    database,
    `friends/${user.uid}/received`,
    "child_added",
    updateRequestReceived
  );
  setDBListener(
    database,
    `friends/${user.uid}/received`,
    "child_removed",
    removeRequestReceived
  );
}

// function setDBListener(reference, type, callBack) {
//   database.ref(reference).on(type, callBack);
// }

// ------------------------------------------- Chat js ----------------------------------------
const chatWindowMessageInput = document.querySelector(".main__input--chat");
let chatWindowUsername = document.querySelector(".main__chat-username");
let chatWindowProfilePic = document.querySelector(".main__img--chat");
let noChatSelectedInfo = document.querySelector(".main__chat-info");
let chatWindowHeader = document.querySelector(".main__chat-header");
let chatWindowMessageSender = document.querySelector(
  ".main__chat-message-sender"
);
let chatContainer = document.querySelector(".main__chat-container");

function cleanUpChatWindow() {
  chatContainer.innerHTML = "";
  chatWindowHeader.classList.remove("none");
  chatContainer.classList.remove("none");
  chatWindowMessageSender.classList.remove("none");
  noChatSelectedInfo.classList.add("none");
}

function updateChatDataSet(friendCard) {
  chatWindowMessageInput.dataset.chatHash = friendCard.dataset.hash;
  chatWindowHeader.dataset.chatId = friendCard.dataset.id; //friend ID needs to be changed
}

function updateFriendDataAtChatWindow(friendCard) {
  chatWindowUsername.textContent =
    friendCard.querySelector(".main__friend-name").textContent;
  chatWindowProfilePic.src = friendCard.querySelector(".main__img").src;
}

function setUpChatWindow(friendCard) {
  cleanUpChatWindow();
  updateFriendDataAtChatWindow(friendCard);
  updateChatDataSet(friendCard);
}

async function updateChatWindow(friendCard) {
  setUpChatWindow(friendCard);
  let data = await readDB(database, `chat/${friendCard.dataset.hash}/messages`);
  fillMessagesToChatBody(data.val());
}

function addMessageToContainer(message, time, position) {
  let datePart = new Date(time).toDateString();
  let timePart = new Date(time).toTimeString().split(" ")[0];
  let timeStamp = datePart + " " + timePart;
  chatContainer.innerHTML += `<div class="main__message-container main__message-container--${position}">
  <p class="main__message">${message}</p>  
  <span class="main__time-stamp main__time-stamp--right">${timeStamp}</span>
</div>`;
}

async function addFileToContainer(src, time, position, type){
  let datePart = new Date(time).toDateString();
  let timePart = new Date(time).toTimeString().split(" ")[0];
  let timeStamp = datePart + " " + timePart;
  var reference = firebase.storage().refFromURL(src);
  let metaData = await fileMetaData(reference);
  let size = (metaData.size / (1024 * 1024)).toFixed(2);
  let name = metaData.name;
  console.log(size)
  chatContainer.innerHTML += type === "image" ? 
  `<div class="main__message-container main__message-container--${position}">
    <div class="main__message--image-cnt">
      <a class="main__message--link" href="${src}" download target="_blank"><img src="${src}" alt="image" class="main__message--image"></a>
      <span class="main__message--downloaded">${size} MB</span>
    </div>
    <span class="main__time-stamp main__time-stamp--left">${timeStamp}</span>
  </div>` :
  `<div class="main__message-container main__message-container--${position}">
  <div class="main__message--file-cnt">
    <div class="main__message--file-download"> 
      <a class="main__message--link" href="${src}" download="${name}"><img class="main__message--download-ic" src="./assets/icons/home/download.svg" alt=""></a>
    </div>
    <div class="main__message--file-detail">
      <img src="./assets/icons/home/msg-clear.svg" alt="cancel" class="main__message--cancel">
      <h3 class="main__message--file-name">${name}</h3>
      <span class="main__message--downloaded">${size} MB</span>
    </div>
  </div>
  <span class="main__time-stamp main__time-stamp--left">${timeStamp}</span>
</div>`;
}

function autoScroll() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function fillMessagesToChatBody(data) {
  if (!data) return;

  Object.values(data).forEach((message) => {
    if (message.sender === user.uid) {
      "text" in message ?
      addMessageToContainer(message.text, message.time, "right"):
      ("image" in message ?
      addFileToContainer(message.image, message.time, "right", "image") : 
      addFileToContainer(message.file, message.time, "right", "file")
      );
    } else {
      "text" in message ?
      addMessageToContainer(message.text, message.time, "left"):
      ("image" in message ?
      addFileToContainer(message.image, message.time, "left", "image") : 
      addFileToContainer(message.file, message.time, "left", "file")
      );
    }
  });
  autoScroll();
}

async function addMessageToChatBody(chat) {
  let usersRawData = await readDB(
    database,
    `chat/${chatWindowMessageInput.dataset.chatHash}/user`
  );
  let userData = usersRawData.val();
  if (!userData) return;

  let chatData = chat.val();
  if (!chatData) return;

  if("image" in chatData){
    if(document.querySelector(`.main__message-container[data-id="${chat.key}"]`)) return;
    addFileToContainer(chatData.image, chatData.time, "left", "image");
    return ;
  }
  if("file" in chatData){
    if(document.querySelector(`.main__message-container[data-id="${chat.key}"]`)) return;
    addFileToContainer(chatData.file, chatData.time, "left", "file");
  }

  let userIds = Object.values(userData);
  if (!userIds.includes(chatData.sender)) return;

  if (chatData.sender === user.uid) {
    addMessageToContainer(chatData.text, chatData.time, "right");
  } else {
    addMessageToContainer(chatData.text, chatData.time, "left");
  }
  autoScroll();
}

function sendMessage() {
  if (!chatWindowMessageInput.value) return;
  let chatHash = chatWindowMessageInput.dataset.chatHash;
  let messageKey = pushKey(database, `chat/${chatHash}/messages`, user.uid);
  let text = chatWindowMessageInput.value;
  let sender = user.uid;
  let time = new Date().toISOString();
  let message = {
    text,
    sender,
    time,
  };
  addChlidDB(database, `chat/${chatHash}/messages`, messageKey, message);
  chatWindowMessageInput.value = "";
}

function addEventListenerToFriendCards() {
  let friends = document.querySelectorAll(".main__friend-card");
  friends.forEach((friend) =>
    friend.addEventListener("click", function (e) {
      updateChatWindow(this);
    })
  );
}

window.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
  if (e.key === "Escape") {
    document.querySelector(".main__search-close-ic").click();
  }
});

document
  .querySelector(".main__img--send")
  .addEventListener("click", sendMessage);
