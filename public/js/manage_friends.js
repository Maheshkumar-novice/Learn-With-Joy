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
  userDataList = [],
  uidList = [],
  friendsList = null,
  friendsUID = [];

function addDataToTotalUsers(data) {
  uidList.push(data.key);
  userDataList.push(data.val());
}

auth.onAuthStateChanged(async (currentUser) => {
  if (currentUser) {
    user = currentUser;
    await updateFriendsList();
    addDBListeners();
    searchInput.disabled = false;
  } else {
    window.location = "./index.html";
  }
});

// ----------------------- SEARCH -------------------------------------
const searchInput = document.querySelector(".main__input");
const searchWrap = document.querySelector(".main__search-cnt");
const searchResultContainer = document.querySelector(".main__search-resultcnt");
const searchCloseIcon = document.querySelector(".main__search-close-ic");
const chatArea = document.querySelector(".main__chat");
let addBtn;

function removeFriendFromSearchResult(e) {
  let id = e.target.parentElement.dataset.id;
  let elementToRemove = document.querySelector(
    `.main__result-card[data-id="${id}"]`
  );
  searchResultContainer.removeChild(elementToRemove);
  if (searchResultContainer.childElementCount === 0) {
    searchResultContainer.innerHTML = `<p class="main__serach-msg">Type to show the results</p>`;
  }
}

function getUserSearchData(uid) {
  if (user.uid === uid || checkUserPresent(friendsList, friendsUID, uid))
    return "";
  let searchedUser =
    userDataList[uidList.findIndex((tot_uid) => tot_uid === uid)];
  return `<div class="main__result-card" data-id=${uid}>
            <img  src=${searchedUser.photo}  alt="Friend"  class="main__img"/>
            <p class="main__friend-name">${searchedUser.name}</p>
            <img class="main__send-friend-ic" src="./assets/icons/home/accept.svg" alt="Add friend">
          </div>`;
}

function addFriendRequestIconListeners() {
  addBtn = document.querySelectorAll(".main__send-friend-ic");
  addBtn.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      sendFriendRequest(e.target.parentElement.dataset.id);
      removeFriendFromSearchResult(e);
    });
  });
}

searchInput.addEventListener("input", (e) => {
  let value = e.target.value;
  let html = "";
  if (value === "") {
    searchResultContainer.innerHTML = `<p class="main__serach-msg">Type to show the results</p>`;
    return;
  }
  let regex = new RegExp(value, "gi");
  userDataList.forEach((obj, idx) => {
    if (obj.name.match(regex)) {
      html += getUserSearchData(uidList[idx]);
    }
  });
  searchResultContainer.innerHTML =
    html === ""
      ? `<p class="main__serach-msg">Sorry! no results found</p>`
      : html;
  addFriendRequestIconListeners();
});

searchInput.addEventListener("click", (e) => {
  searchWrap.classList.remove("none");
  chatArea.classList.add("none");
  if (e.target.value === "") {
    searchResultContainer.innerHTML = `<p class="main__serach-msg">Type to show the results</p>`;
  }
});

searchCloseIcon.addEventListener("click", function (e) {
  searchWrap.classList.toggle("none");
  chatArea.classList.toggle("none");
});

// ----------------------- FRIENDS -------------------------------------
// friendRequests[0] => friend requests received, friendRequests[1] => friend requests sent
const friendRequests = document.querySelectorAll(".main__req-cards");

async function sendFriendRequest(uid) {
  await updateFriendsList();
  if (checkUserPresent(friendsList, friendsUID, uid)) return;
  addChlidDB(database, `friends/${user.uid}/sent`, uid, "pending");
  addChlidDB(database, `friends/${uid}/received`, user.uid, "pending");
}

async function rejectFriendRequest(e) {
  let fid = e.target.parentElement.dataset.id;
  let key = pushKey(database, `friends/${fid}`, "notifications");
  removeDB(database, `friends/${user.uid}/received/${fid}`);
  removeDB(database, `friends/${fid}/sent/${user.uid}`);
}

async function addFriend(e) {
  await updateFriendsList();
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

async function removeFriend(e) {
  await updateFriendsList();
  let hash = e.target.parentElement.dataset.hash;
  let fid = e.target.parentElement.dataset.id;
  removeDB(database, `friends/${user.uid}/friends/${fid}`);
  removeDB(database, `friends/${fid}/friends/${user.uid}`);
  removeDB(database, `chat/${hash}`);
}

async function updateFriendsList() {
  let friendsData = await readDB(database, `friends/${user.uid}`);
  friendsList = friendsData.val();
}

async function addFriendToFriendsList(data) {
  if (!data.val()) return;

  let fid = data.key;
  let hash = data.val();
  let friendsContainer = document.querySelector(".main__friend-cnt");
  let chatUid = (await readDB(database, `users/${fid}`)).val();

  friendsUID.push(fid);
  friendsContainer.innerHTML += `<div class="main__friend-card" data-id=${fid} data-hash=${hash}>
      <img  src="${chatUid.photo}"  alt="Friend"  class="main__img"/>
      <p class="main__friend-name">${chatUid.name}</p>
      <img class="main__remove-friend-ic" src="./assets/icons/home/reject.svg" alt="remove friend">
     </div>\n`;

  document
    .querySelectorAll(`.main__friend-card>.main__remove-friend-ic`)
    .forEach((rejectIcon) => {
      rejectIcon.addEventListener("click", removeFriend);
    });
  addEventListenerToFriendCards();
  setDBListener(
    database,
    `chat/${hash}/messages`,
    "child_added",
    addMessageToChatBody
  );
}

async function removeFriendFromFriendsList(data) {
  await updateFriendsList();
  let friendsContainer = document.querySelector(".main__friend-cnt");
  if (!data.val()) {
    friendsContainer.innerHTML = "";
    friendsUID = [];
    return;
  }

  let removedFriend = document.querySelector(
    `.main__friend-card[data-hash="${data.val()}"]`
  );
  friendsUID.splice(removedFriend.dataset.id, 1);
  friendsContainer.removeChild(removedFriend);
}

async function addFriendRequestReceived(data) {
  await updateFriendsList();
  if (!data.val()) {
    friendRequests[0].innerHTML = "";
    return;
  }

  let receivedKey = data.key;
  let receivedFrom = (await readDB(database, `users/${receivedKey}`)).val();
  friendRequests[0].innerHTML += `<div class="main__received-card default" data-id=${receivedKey}>
      <img  src="${receivedFrom.photo}"  alt="Friend"  class="main__img"/>
      <p class="main__friend-name">${receivedFrom.name}</p>
      <img class="main__add-friend-ic" src="./assets/icons/home/accept.svg" alt="accept">
      <img class="main__remove-friend-ic" src="./assets/icons/home/reject.svg" alt="reject">
     </div>`;

  document.querySelectorAll(`.main__add-friend-ic`).forEach((acceptIcon) => {
    acceptIcon.addEventListener("click", addFriend);
  });
  document.querySelectorAll(`.main__remove-friend-ic`).forEach((rejectIcon) => {
    rejectIcon.addEventListener("click", rejectFriendRequest);
  });
}

async function removeFriendRequestReceived(data) {
  if (!data.val()) {
    friendRequests[0].innerHTML = "";
  }

  let removedRequest = document.querySelector(
    `.main__received-card[data-id="${data.key}"]`
  );
  friendRequests[0].removeChild(removedRequest);
  await updateFriendsList();
}

async function addFriendRequestSent(data) {
  await updateFriendsList();
  let sentData = data.val();
  if (!sentData) {
    friendRequests[1].innerHTML = "";
    return;
  }

  let sent = data.key;
  let sentTo = (await readDB(database, `users/${sent}`)).val();

  friendRequests[1].innerHTML += `<div class="main__sent-card default" data-id=${sent}>
      <img  src="${sentTo.photo}"  alt="Friend"  class="main__img"/>
      <p class="main__friend-name">${sentTo.name}</p>
      <img class="main__pending-friend-ic default" src="./assets/icons/home/pending.svg" alt="pending">
     </div>`;
}

async function removeFriendRequestSent(data) {
  if (!data.val()) {
    friendRequests[1].innerHTML = "";
  }

  let removedRequest = document.querySelector(
    `.main__sent-card[data-id="${data.key}"]`
  );
  friendRequests[1].removeChild(removedRequest);
  await updateFriendsList();
}

// ----------------------- DB -------------------------------------
function addDBListeners() {
  setDBListener(database, `users`, "child_added", addDataToTotalUsers);

  setDBListener(
    database,
    `friends/${user.uid}/friends`,
    "child_added",
    addFriendToFriendsList
  );
  setDBListener(
    database,
    `friends/${user.uid}/friends`,
    "child_removed",
    removeFriendFromFriendsList
  );

  setDBListener(
    database,
    `friends/${user.uid}/sent`,
    "child_added",
    addFriendRequestSent
  );
  setDBListener(
    database,
    `friends/${user.uid}/sent`,
    "child_removed",
    removeFriendRequestSent
  );

  setDBListener(
    database,
    `friends/${user.uid}/received`,
    "child_added",
    addFriendRequestReceived
  );
  setDBListener(
    database,
    `friends/${user.uid}/received`,
    "child_removed",
    removeFriendRequestReceived
  );
}

// ----------------------- CHAT -------------------------------------
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
  let upload = document.querySelector(".upload");
  if (!upload.classList.contains("none")) {
    upload.classList.add("none");
  }
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

async function addFileToContainer(src, time, position, type) {
  let datePart = new Date(time).toDateString();
  let timePart = new Date(time).toTimeString().split(" ")[0];
  let timeStamp = datePart + " " + timePart;
  var reference = firebase.storage().refFromURL(src);
  let metaData = await fileMetaData(reference);
  let size = (metaData.size / (1024 * 1024)).toFixed(2);
  let name = metaData.name;
  chatContainer.innerHTML +=
    type === "image"
      ? `<div class="main__message-container main__message-container--${position}">
        <div class="main__message--image-cnt">
          <a class="main__message--link" href="${src}" download target="_blank"><img src="${src}" alt="image" class="main__message--image"></a>
          <span class="main__message--downloaded">${size} MB</span>
        </div>
        <span class="main__time-stamp main__time-stamp--left">${timeStamp}</span>
      </div>`
      : `<div class="main__message-container main__message-container--${position}">
        <div class="main__message--file-cnt">
          <div class="main__message--file-download"> 
            <a class="main__message--link" href="${src}" download="${name}"><img class="main__message--download-ic" src="./assets/icons/home/download.svg" alt=""></a>
          </div>
          <div class="main__message--file-detail">
            <h3 class="main__message--file-name">${name}</h3>
            <span class="main__message--downloaded">${size} MB</span>
          </div>
        </div>
        <span class="main__time-stamp main__time-stamp--left">${timeStamp}</span>
      </div>`;
  autoScroll();
}

function fillMessagesToChatBody(data) {
  if (!data) return;

  Object.values(data).forEach((message) => {
    if (message.sender === user.uid) {
      "text" in message
        ? addMessageToContainer(message.text, message.time, "right")
        : "image" in message
        ? addFileToContainer(message.image, message.time, "right", "image")
        : addFileToContainer(message.file, message.time, "right", "file");
    } else {
      "text" in message
        ? addMessageToContainer(message.text, message.time, "left")
        : "image" in message
        ? addFileToContainer(message.image, message.time, "left", "image")
        : addFileToContainer(message.file, message.time, "left", "file");
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

  if ("image" in chatData) {
    if (
      document.querySelector(`.main__message-container[data-id="${chat.key}"]`)
    )
      return;
    addFileToContainer(chatData.image, chatData.time, "left", "image");
    return;
  }
  if ("file" in chatData) {
    if (
      document.querySelector(`.main__message-container[data-id="${chat.key}"]`)
    )
      return;
    addFileToContainer(chatData.file, chatData.time, "left", "file");
    return;
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

function autoScroll() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
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

// function setDBListener(reference, type, callBack) {
//   database.ref(reference).on(type, callBack);
// }
