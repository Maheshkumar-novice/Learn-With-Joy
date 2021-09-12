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
  storageDelete,
  storageList,
  updateDB,
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
const searchInput = document.querySelector(".chat__input");
const searchWrap = document.querySelector(".chat__search-cnt");
const searchResultContainer = document.querySelector(".chat__search-result-cnt");
const searchCloseIcon = document.querySelector(".chat__search-close-icon");
const chatArea = document.querySelector(".chat__chat");
let addBtn;

function removeFriendFromSearchResult(e) {
  let id = e.target.parentElement.dataset.id;
  let elementToRemove = document.querySelector(
    `.chat__result-card[data-id="${id}"]`
  );
  searchResultContainer.removeChild(elementToRemove);
  if (searchResultContainer.childElementCount === 0) {
    searchResultContainer.innerHTML = `<p class="chat__serach-msg">Type to show the results</p>`;
  }
}

function getUserSearchData(uid) {
  if (user.uid === uid || checkUserPresent(friendsList, friendsUID, uid))
    return "";
  let searchedUser =
    userDataList[uidList.findIndex((tot_uid) => tot_uid === uid)];
  return `<div class="chat__result-card" data-id=${uid}>
            <img  src=${searchedUser.photo}  alt="Friend"  class="chat__img"/>
            <p class="chat__friend-name">${searchedUser.name}</p>
            <img class="chat__send-friend-ic" src="./assets/icons/home/accept.svg" alt="Add friend">
          </div>`;
}

function addFriendRequestIconListeners() {
  addBtn = document.querySelectorAll(".chat__send-friend-ic");
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
    searchResultContainer.innerHTML = `<p class="chat__serach-msg">Type to show the results</p>`;
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
      ? `<p class="chat__serach-msg">Sorry! no results found</p>`
      : html;
  addFriendRequestIconListeners();
});

searchInput.addEventListener("click", (e) => {
  searchWrap.classList.remove("none");
  chatArea.classList.add("none");
  if (e.target.value === "") {
    searchResultContainer.innerHTML = `<p class="chat__serach-msg">Type to show the results</p>`;
  }
});

searchCloseIcon.addEventListener("click", function (e) {
  searchWrap.classList.add("none");
  chatArea.classList.remove("none");
});

// ----------------------- FRIENDS -------------------------------------
// friendRequests[0] => friend requests received, friendRequests[1] => friend requests sent
const friendRequests = document.querySelectorAll(".chat__req-cards");

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
  notificationFriendRequestAccept(fid, e.target.parentElement.querySelector(".chat__friend-name").innerText);
}

async function notificationFriendRequestAccept(fid, name){
  let ref = `notifications/${user.uid}/friends`;
  let timeStamp = Date.now();
  let data = {
    name,
    timeStamp
  }
  addChlidDB(database, ref, fid, data);
}

async function removeFriend(e) {
  await updateFriendsList();
  let hash = e.target.parentElement.dataset.hash;
  let fid = e.target.parentElement.dataset.id;
  removeDB(database, `friends/${user.uid}/friends/${fid}`);
  removeDB(database, `friends/${fid}/friends/${user.uid}`);
  removeDB(database, `chat/${hash}`);
  
  // delete media from firebase storage
  const allFiles = await storageList(firebase.storage(), `chat/${hash}`);
  allFiles.items.map(file => storageDelete(file));
}

function resetChatContainer(hash){
  const friendContainer = document.querySelector(`.chat__chat-container[data-hash="${hash}"]`);
  friendContainer ? chatWrapper.removeChild(friendContainer) : "";
  chatWindowHeader.classList.add("none");
  chatWindowMessageSender.classList.add("none");
  noChatSelectedInfo.classList.remove("none");
}

async function updateFriendsList() {
  let friendsData = await readDB(database, `friends/${user.uid}`);
  friendsList = friendsData.val();
}

async function addFriendToFriendsList(data) {
  if (!data.val()) return;

  let fid = data.key;
  let hash = data.val();
  let friendsContainer = document.querySelector(".chat__friend-cnt");
  let chatUid = (await readDB(database, `users/${fid}`)).val();

  friendsUID.push(fid);
  friendsContainer.innerHTML += `<div class="chat__friend-card" data-id=${fid} data-hash=${hash}>
      <img  src="${chatUid.photo}"  alt="Friend"  class="chat__img"/>
      <p class="chat__friend-name">${chatUid.name}</p>
      <img class="chat__remove-friend-ic" src="./assets/icons/home/reject.svg" alt="remove friend">
     </div>\n`;

  document
    .querySelectorAll(`.chat__friend-card>.chat__remove-friend-ic`)
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
  let friendsContainer = document.querySelector(".chat__friend-cnt");
  if (!data.val()) {
    friendsContainer.innerHTML = "";
    friendsUID = [];
    return;
  }

  const hash = data.val();
  let removedFriend = document.querySelector(
    `.chat__friend-card[data-hash="${hash}"]`
  );
  friendsUID.splice(friendsUID.findIndex(uid => uid === removedFriend.dataset.id), 1);
  friendsContainer.removeChild(removedFriend);
  resetChatContainer(hash);
}

async function addFriendRequestReceived(data) {
  await updateFriendsList();
  if (!data.val()) {
    friendRequests[0].innerHTML = "";
    return;
  }

  let receivedKey = data.key;
  let receivedFrom = (await readDB(database, `users/${receivedKey}`)).val();
  friendRequests[0].innerHTML += `<div class="chat__received-card default" data-id=${receivedKey}>
      <img  src="${receivedFrom.photo}"  alt="Friend"  class="chat__img"/>
      <p class="chat__friend-name">${receivedFrom.name}</p>
      <img class="chat__add-friend-ic" src="./assets/icons/home/accept.svg" alt="accept">
      <img class="chat__remove-friend-ic" src="./assets/icons/home/reject.svg" alt="reject">
     </div>`;

  document.querySelectorAll(`.chat__add-friend-ic`).forEach((acceptIcon) => {
    acceptIcon.addEventListener("click", addFriend);
  });
  document.querySelectorAll(`.chat__remove-friend-ic`).forEach((rejectIcon) => {
    rejectIcon.addEventListener("click", rejectFriendRequest);
  });
}

async function removeFriendRequestReceived(data) {
  if (!data.val()) {
    friendRequests[0].innerHTML = "";
  }

  let removedRequest = document.querySelector(
    `.chat__received-card[data-id="${data.key}"]`
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

  friendRequests[1].innerHTML += `<div class="chat__sent-card default" data-id=${sent}>
      <img  src="${sentTo.photo}"  alt="Friend"  class="chat__img"/>
      <p class="chat__friend-name">${sentTo.name}</p>
      <img class="chat__pending-friend-ic default" src="./assets/icons/home/pending.svg" alt="pending">
     </div>`;
}

async function removeFriendRequestSent(data) {
  if (!data.val()) {
    friendRequests[1].innerHTML = "";
  }

  let removedRequest = document.querySelector(
    `.chat__sent-card[data-id="${data.key}"]`
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
const chatWindowMessageInput = document.querySelector(".chat__input--chat");
let chatWindowUsername = document.querySelector(".chat__chat-username");
let chatWindowProfilePic = document.querySelector(".chat__img--chat");
let noChatSelectedInfo = document.querySelector(".chat__chat-info");
let chatWindowHeader = document.querySelector(".chat__chat-header");
let chatWindowMessageSender = document.querySelector(
  ".chat__chat-message-sender"
);
let chatWrapper = document.querySelector(".chat__chat-wrapper");
const chatMenuIc = document.querySelector(".chat__chat-menu-ic");
const chatMenuCnt = document.querySelector(".chat__chat-menu-cnt");
const chatMenuItem = document.querySelector(".menu__item");
let chatContainer; 
// = document.querySelector(".chat__chat-container");

// function to clear Up chat window
chatMenuIc.addEventListener("click", (e) => {
  chatMenuCnt.classList.toggle("none");
});

chatMenuItem.addEventListener("click", clearChat);

async function clearChat(e){
  let hash = chatWindowMessageInput.dataset.chatHash;
  console.log("helo", chatWindowMessageInput.dataset.chatHash);
  const lastMessageId = (await readDB(database, `chat/${hash}/lastMessageId`)).val();
  const obj = {};
  obj[user.uid] = lastMessageId
  updateDB(database, `chat/${hash}/lastClearedMessage`, obj);
  let friendContainer = document.querySelector(`.chat__chat-container[data-hash="${hash}"]`);
  friendContainer.innerHTML = '';
}

// --------setup and update chat window-----------
function cleanUpChatWindow() {
  chatWindowHeader.classList.remove("none");
  chatWindowMessageSender.classList.remove("none");
  noChatSelectedInfo.classList.add("none");
}

function updateChatDataSet(friendCard) {
  chatWindowMessageInput.dataset.chatHash = friendCard.dataset.hash;
  chatWindowHeader.dataset.chatId = friendCard.dataset.id; 
}

function updateFriendDataAtChatWindow(friendCard) {
  chatWindowUsername.textContent =
    friendCard.querySelector(".chat__friend-name").textContent;
  chatWindowProfilePic.src = friendCard.querySelector(".chat__img").src;
}

function setUpChatWindow(friendCard) {
  cleanUpChatWindow();
  updateFriendDataAtChatWindow(friendCard);
  updateChatDataSet(friendCard);
}

let prevCard = null;
async function updateChatWindow(friendCard) {
  let upload = document.querySelector(".upload");
  if (!upload.classList.contains("none")) {
    upload.classList.add("none");
    chatWrapper.classList.remove("none");
  }

  let hash = friendCard.dataset.hash;
  setUpChatWindow(friendCard);

  let friendContainer = document.querySelector(`.chat__chat-container[data-hash="${hash}"]`);
  if(prevCard && (prevCard === friendContainer)) return;
  if(prevCard) prevCard.classList.add("none");
  if(!friendContainer){
    friendContainer = document.createElement("div");
    friendContainer.classList.add("chat__chat-container");
    friendContainer.dataset.hash = hash;
    friendContainer.dataset.lastMessage = "null";
    chatWrapper.appendChild(friendContainer);
  }
  else{
    
    prevCard = friendContainer;
    friendContainer.classList.remove("none");
    autoScroll();
    return;
  }
  prevCard = friendContainer;

  let data = (await readDB(database, `chat/${hash}`)).val();
  let lastClearedMessageIndex = data.lastClearedMessage 
  ? Object.keys(data.messages).findIndex(key => key === data.lastClearedMessage[user.uid]) 
  : -1;
  fillMessagesToChatBody(data.messages, hash, lastClearedMessageIndex);
}

function createMessage(message, timeStamp, position) {
  let messageWrapper = document.createElement("div");
  let chatMessage = document.createElement("p");
  let chatTimeStamp = document.createElement("span");

  messageWrapper.className =`chat__message-container chat__message-container--${position}`;
  chatMessage.className = "chat__message";
  chatTimeStamp.className = "chat__time-stamp";

  chatMessage.textContent = message;
  chatTimeStamp.textContent = timeStamp;

  messageWrapper.appendChild(chatMessage);
  messageWrapper.appendChild(chatTimeStamp);
  return messageWrapper;
}

function addMessageToContainer(chatContainer, message, time, position) {
  let datePart = new Date(time).toDateString();
  let timePart = new Date(time).toTimeString().split(" ")[0];
  let timeStamp = datePart + " " + timePart;
  chatContainer.appendChild(createMessage(message, timeStamp, position));
}

// function addMessageToContainer(chatContainer, message, time, position) {
//   let datePart = new Date(time).toDateString();
//   let timePart = new Date(time).toTimeString().split(" ")[0];
//   let timeStamp = datePart + " " + timePart;
//   chatContainer.innerHTML += `<div class="chat__message-container chat__message-container--${position}">
//     <p class="chat__message">${message}</p>  
//     <span class="chat__time-stamp chat__time-stamp--right">${timeStamp}</span>
//    </div>`;
// }

 function addFileToContainer(chatContainer, src, metaData, time, position, type) {
  let datePart = new Date(time).toDateString();
  let timePart = new Date(time).toTimeString().split(" ")[0];
  let timeStamp = datePart + " " + timePart;
  let size = metaData.size;
  let name = metaData.name;
  chatContainer.innerHTML +=
    type === "image"
      ? `<div class="chat__message-container chat__message-container--${position}">
        <div class="chat__message--image-cnt">
          <a class="chat__message--link" href="${src}" download target="_blank"><img src="${src}" alt="image" class="chat__message--image" loading="lazy"></a>
          <span class="chat__message--downloaded">${size} MB</span>
        </div>
        <span class="chat__time-stamp chat__time-stamp--left">${timeStamp}</span>
      </div>`
      : `<div class="chat__message-container chat__message-container--${position}">
        <div class="chat__message--file-cnt">
          <div class="chat__message--file-download"> 
            <a class="chat__message--link" href="${src}" download="${name}" target="_blank"><img class="chat__message--download-ic" src="./assets/icons/home/download.svg" alt=""></a>
          </div>
          <div class="chat__message--file-detail">
            <h3 class="chat__message--file-name">${name}</h3>
            <span class="chat__message--downloaded">${size} MB</span>
          </div>
        </div>
        <span class="chat__time-stamp chat__time-stamp--left">${timeStamp}</span>
      </div>`;
  autoScroll();
}

function fillMessagesToChatBody(data, hash, lastClearedMessageIndex) {
  if (!data) return;
  console.log(data, hash);
  let chatContainer = document.querySelector(`.chat__chat-container[data-hash="${hash}"]`);
  console.log(lastClearedMessageIndex);
  Object.values(data).forEach((message, idx) => {
    if(idx <= lastClearedMessageIndex) return;
    if (message.sender === user.uid) {
      "text" in message
        ? addMessageToContainer(chatContainer, message.text, message.time, "right")
        : "image" in message
        ? addFileToContainer(chatContainer, message.image, message.metadata, message.time, "right", "image")
        : addFileToContainer(chatContainer, message.file, message.metadata, message.time, "right", "file");
    } else {
      "text" in message
        ? addMessageToContainer(chatContainer, message.text, message.time, "left")
        : "image" in message
        ? addFileToContainer(chatContainer, message.image, message.metadata, message.time, "left", "image")
        : addFileToContainer(chatContainer, message.file, message.metadata, message.time, "left", "file");
    }
  });
  autoScroll();
}

async function addMessageToChatBody(chat) {
  let hash = chat.ref.parent.parent.key;
  let chatContainer = document.querySelector(`.chat__chat-container[data-hash="${hash}"]`);
  console.log('done')
  if(!chatContainer) return;
  console.log('fun')

  let chatData = chat.val();
  if (!chatData) return;

  if ("image" in chatData) {
    if (
      chatContainer.querySelector(`.chat__message-container[data-id="${chat.key}"]`)
    )
      return;
    addFileToContainer(chatContainer, chatData.image, chatData.metadata, chatData.time, "left", "image");
    return;
  }
  if ("file" in chatData) {
    if (
      chatContainer.querySelector(`.chat__message-container[data-id="${chat.key}"]`)
    )
      return;
    addFileToContainer(chatContainer, chatData.file, chatData.metadata, chatData.time, "left", "file");
    return;
  }

  if (chatData.sender === user.uid) {
    addMessageToContainer(chatContainer, chatData.text, chatData.time, "right");
  } else {
    addMessageToContainer(chatContainer, chatData.text, chatData.time, "left");
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
  updateDB(database, `chat/${chatHash}`, {lastMessageId: messageKey});
  chatWindowMessageInput.value = "";
}

function addEventListenerToFriendCards() {
  let friends = document.querySelectorAll(".chat__friend-card");
  friends.forEach((friend) =>
    friend.addEventListener("click", function (e) {
      const prevSelected = document.querySelector(".chat__friend-card-active");
      prevSelected ? prevSelected.classList.remove("chat__friend-card-active") : "";
      this.classList.add("chat__friend-card-active");
      updateChatWindow(this);
    })
  );
}

function autoScroll() {
  chatWrapper.scrollTop = chatWrapper.scrollHeight;
}

window.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
  if (e.key === "Escape") {
    document.querySelector(".chat__search-close-icon").click();
  }
});

document
  .querySelector(".chat__img--send")
  .addEventListener("click", sendMessage);

