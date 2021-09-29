import {
  addChlidDB,
  getOrderBy,
  pushKey,
  readDB,
  removeDB,
  setDBListener,
  storageRef,
  updateDB,
  writeDB,
} from "../modules/firebase.js";
import {
  addParticipantCardTemplate,
  groupCardTemplate,
} from "../modules/template.js";
import {
  checkAndChangeAngularBrackets,
  getParameterByName,
} from "../modules/util.js";

let user;
let userCreatedGroup = [];
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

let totalFriends = 0;
let searchFriendsList = [];

auth.onAuthStateChanged(async (currentUser) => {
  if (currentUser) {
    user = currentUser;
    totalFriends = (
      await readDB(database, `friends/${user.uid}/friends`)
    ).numChildren();
    checkAddFriendsList();
    createDBListener();
    handleGroupJoinURL();
  }
});

// ------------------------------------- Add participants from friends ----------------------
let participantAddFriendsCard;
const participantAddFriendsCnt = document.querySelector(
  ".group__add-friends-cnt[data-type='friends-cnt']"
);
const participantSearchListFriendsCnt = document.querySelector(
  ".group__add-friends-cnt[data-type='search-cnt']"
);
const addParticipantIC = document.querySelector(".group__participants-add");
const participantFriendCnt = document.querySelector(
  ".group__participants-add-list"
);
const searchFriendsInput = document.querySelector(".search__friends-input");
const searchFriendsInputClose = document.querySelector(
  ".add-friends-search-close"
);

//Toggle Add participant friends container
addParticipantIC.addEventListener("click", function (e) {
  if (this.src.includes("accept.svg")) {
    this.src = "./assets/icons/home/msg-clear.svg";
    optionsCnt.classList.add("none");
  } else {
    this.src = "./assets/icons/home/accept.svg";
    participantSearchListFriendsCnt.innerText = "";
    searchFriendsInput.value = "";
    participantAddFriendsCnt.classList.remove("none");
    participantSearchListFriendsCnt.classList.add("none");
  }
  participantFriendCnt.classList.toggle("none");
  groupParticpantCnt.classList.toggle("none");
});

//Search friends from friends list
searchFriendsInput.addEventListener("input", function (e) {
  let value = this.value;
  if (value == "") {
    participantAddFriendsCnt.classList.remove("none");
    participantSearchListFriendsCnt.classList.add("none");
    return;
  }
  participantAddFriendsCnt.classList.add("none");
  participantSearchListFriendsCnt.classList.remove("none");
  const regex = new RegExp(`^${value}`, "gi");
  participantSearchListFriendsCnt.innerText = "";
  searchFriendsList.forEach((name, idx) => {
    if (name.match(regex)) {
      const clone = participantAddFriendsCard[idx].cloneNode(true);
      participantSearchListFriendsCnt.appendChild(clone);
    }
  });
  const addIC = participantSearchListFriendsCnt.querySelectorAll(
    ".group__add-friend-ic"
  );
  addIC.forEach((ic) => {
    ic.addEventListener("click", addFriendsToGroup);
  });
});

searchFriendsInputClose.addEventListener("click", function (e) {
  searchFriendsInput.innerText = "";
  participantAddFriendsCnt.classList.remove("none");
  participantSearchListFriendsCnt.classList.add("none");
});

//Update the friendds list and add listener for adding to groups
async function checkAddFriendsList() {
  const participantAddFriendsCount = participantAddFriendsCnt.childElementCount;
  if (participantAddFriendsCount === totalFriends) {
    updateFriendsForAddParticipantsUtil();
    return;
  }
  setTimeout(checkAddFriendsList, 1000);
}

function updateFriendsForAddParticipantsUtil() {
  participantAddFriendsCard = participantAddFriendsCnt.querySelectorAll(
    ".group__add-friend-card"
  );
  participantAddFriendsCard.forEach((card) => {
    updateFriendsForAddParticipants(card);
  });
}

function updateFriendsForAddParticipants(card) {
  const participantAddFriendsIc = card.querySelector(".group__add-friend-ic");
  searchFriendsList.push(
    card.querySelector(".group__add-friend-name").innerText
  );
  participantAddFriendsIc.addEventListener("click", addFriendsToGroup);
}

// -------------------------------------- create group -----------------------------------

const groupNameInput = document.querySelector(".groupt__input-name");
const groupLogoIC = document.querySelector(".group-logo-upload");
const groupLogoUpload = document.querySelector(".grouup__logo-input");
const createButton = document.querySelector(".group-create-button");
const createButtonLoader = document.querySelector(".create-loader");
const groupCreateError = document.querySelector(".create-group-error");
const groupParticpantCnt = document.querySelector(".group__participant");
const optionsCnt = document.querySelector(".participants__options");
const participantOption = document.querySelectorAll(".participants__option");
const groupLink = document.querySelector(".group-share-link");

groupLogoIC.addEventListener("click", (e) => {
  groupLogoUpload.click();
});

groupLogoUpload.addEventListener("change", (e) => {
  if (!e.target.files[0] || e.target.files[0].size / (1024 * 1024) > 1) {
    e.target.value = "";
    return;
  }
  groupLogoIC.src = URL.createObjectURL(e.target.files[0]);
});

// loading while group creation
function toggleCreateGroupButton(bool) {
  if (bool) {
    createButton.disabled = true;
    createButtonLoader.classList.add("add-loading-animation");
    createButtonLoader.classList.remove("none");
  } else {
    createButton.disabled = false;
    createButtonLoader.classList.remove("add-loading-animation");
    createButtonLoader.classList.add("none");
  }
}

createButton.addEventListener("click", async (e) => {
  const groupName = checkAndChangeAngularBrackets(groupNameInput.value);
  if (!groupName) {
    groupCreateError.innerText = "Empty Name";
    setTimeout(() => {
      groupCreateError.innerText = "";
    }, 1000);
    return;
  }
  if (userCreatedGroup.find((userGroupName) => userGroupName === groupName)) {
    groupCreateError.innerText = "Created Already";
    setTimeout(() => {
      groupCreateError.innerText = "";
    }, 1000);
    return;
  }
  toggleCreateGroupButton(1);
  let groupHash = pushKey(database, `groups/`, groupName);
  let profileURL = !groupLogoUpload.value
    ? "./assets/icons/groups/group-default.svg"
    : await uploadGroupProfilePic(groupHash, groupLogoUpload.files[0]);
  createGroup(groupHash, groupName, profileURL);
});

async function uploadGroupProfilePic(groupHash, file) {
  const ref = storageRef(
    storage,
    `groups/${groupHash}/profilePic`,
    `${file.name}`
  );
  await ref.put(file);
  let profileURL = await storage
    .ref(`groups/${groupHash}/profilePic`)
    .child(file.name)
    .getDownloadURL();
  return profileURL;
}

async function createGroup(groupHash, name, profileURL) {
  const details = {
    name,
    profileURL,
    createdBy: user.uid,
  };
  writeDB(database, `groups/${groupHash}/details`, details);
  addChlidDB(database, `groups/${groupHash}/participants`, user.uid, true);
  userCreatedGroup.push(name);
  updateDB(database, `friends/${user.uid}`, {
    groupsCreated: userCreatedGroup,
  });
  addChlidDB(database, `friends/${user.uid}/groups/`, groupHash, user.uid);

  toggleCreateGroupButton(0);
}

// Add friends to group list
function addFriendsToGroup() {
  const fid = this.parentElement.dataset.id;
  const groupHash = document.querySelector(".group__group-card-active").dataset
    .id;
  const isAddedAlready = document.querySelector(
    `.group__participant-each[data-id="${groupHash}"] .group__participant-card[data-id=${fid}]`
  );
  if (!isAddedAlready) {
    addChlidDB(database, `groups/${groupHash}/participants`, fid, false);
    addChlidDB(database, `friends/${fid}/groups/`, groupHash, fid);
  }
  const allCardIC = document.querySelectorAll(
    `.group__add-friend-card[data-id="${fid}"] .group__add-friend-ic`
  );
  allCardIC.forEach((ic) => {
    ic.classList.add("none");
  });
}

// Update friends list after adding to the group
function updateAddParticipantsFriendsList(elem) {
  let friendsCard = participantAddFriendsCnt.querySelectorAll(
    ".group__add-friend-card"
  );
  friendsCard.forEach((card) => {
    const isPresent = elem.querySelector(
      `.group__participant-card[data-id=${card.dataset.id}]`
    );
    if (isPresent) {
      card.querySelector(".group__add-friend-ic").classList.add("none");
    } else {
      card.querySelector(".group__add-friend-ic").classList.remove("none");
    }
  });
}

// toggle group utils
function clearAllActiveOptions() {
  optionsCnt.classList.add("none");
  optionsCnt.dataset.participant = "null";
  if (!addParticipantIC.src.includes("accept.svg")) addParticipantIC.click();
}

function makeCardActive(card) {
  const prevSelected = document.querySelector(".group__group-card-active");
  const participantCnt = prevSelected
    ? document.querySelector(
        `.group__participant-each[data-id="${prevSelected.dataset.id}"]`
      )
    : "";
  prevSelected
    ? (prevSelected.classList.remove("group__group-card-active"),
      participantCnt.classList.add("none"))
    : "";
  card.classList.add("group__group-card-active");
}

// copy group share link
const copyLinkIC = document.querySelector(".copy-link");
copyLinkIC.addEventListener("click", copyLink);
function copyLink() {
  navigator.clipboard.writeText(groupLink.innerText);
}

function updateGroupLink(groupHash) {
  const groupName = document.querySelector(
    ".group__group-card-active"
  ).innerText;
  const link = `https://learn-with-joy.web.app/groups?share=${user.uid}&gid=${groupHash}&gname=${groupName}`;
  // const link = `http://localhost:5000/groups?share=${user.uid}&gid=${groupHash}&gname=${groupName}`;
  groupLink.innerText = link;
  groupLink.title = link;
}

// to check wheather Groups had already been loaded or not
async function checkGroupPresent(hash) {
  const isAdmin = (
    await readDB(database, `groups/${hash}/participants/${user.uid}`)
  ).val();
  isAdmin
    ? (addParticipantIC.classList.remove("none"), updateGroupLink(hash))
    : addParticipantIC.classList.add("none");
  const participantCnt = document.querySelector(
    `.group__participant-each[data-id="${hash}"]`
  );
  if (participantCnt) {
    // if already clicked toggle the container
    participantCnt.classList.remove("none");
    updateAddParticipantsFriendsList(participantCnt);
    return;
  }
  // else create the container
  showParticipantsList(hash, isAdmin);
}

// creating participant list based on the access
async function showParticipantsList(hash, userAdminStatus) {
  const participantCnt = document.createElement("div");
  participantCnt.classList.add("group__participant-each");
  participantCnt.dataset.id = hash;
  const adminDB = await getOrderBy(database, hash, true, 1);
  const adminData = await adminDB.val();
  const nonAdminDB = await getOrderBy(database, hash, false, 1);
  const nonAdminData = await nonAdminDB.val();
  for (let id in adminData) {
    const checkFriend = document.querySelector(
      `.group__add-friend-card[data-id=${id}]`
    );
    if (checkFriend) {
      const photoURL = checkFriend.querySelector(".chat__img").src;
      const name = checkFriend.querySelector(
        ".group__add-friend-name"
      ).innerText;
      participantCnt.appendChild(
        addParticipantCardTemplate(id, photoURL, name, true, userAdminStatus)
      );
    } else {
      const data = (await readDB(database, `users/${id}`)).val();
      const photoURL = data.photo;
      const name = data.name;
      participantCnt.appendChild(
        addParticipantCardTemplate(id, photoURL, name, true, userAdminStatus)
      );
    }
  }
  for (let id in nonAdminData) {
    const checkFriend = document.querySelector(
      `.group__add-friend-card[data-id=${id}]`
    );
    if (checkFriend) {
      const photoURL = checkFriend.querySelector(".chat__img").src;
      const name = checkFriend.querySelector(
        ".group__add-friend-name"
      ).innerText;
      participantCnt.appendChild(
        addParticipantCardTemplate(id, photoURL, name, false, userAdminStatus)
      );
    } else {
      const data = (await readDB(database, `users/${id}`)).val();
      const photoURL = data.photo;
      const name = data.name;
      participantCnt.appendChild(
        addParticipantCardTemplate(id, photoURL, name, false, userAdminStatus)
      );
    }
  }
  groupParticpantCnt.appendChild(participantCnt);
  updateAddParticipantsFriendsList(
    document.querySelector(`.group__participant-each[data-id="${hash}"]`)
  );
  const participantOptionsIC = participantCnt.querySelectorAll(
    ".group__participant-option-ic[data-admin='false']"
  );
  participantOptionsIC.forEach((options) => {
    options.addEventListener("click", showOptionsCnt);
  });
}

// participant option container toggler
function showOptionsCnt(e) {
  const card = this.parentElement;
  if (optionsCnt.dataset.participant === card.dataset.id) {
    optionsCnt.classList.add("none");
    optionsCnt.dataset.participant = "null";
    return;
  }
  optionsCnt.classList.remove("none");
  optionsCnt.dataset.participant = card.dataset.id;
  optionsCnt.style.top = `${card.offsetTop + card.offsetHeight + 20}px`;
}

// Admin and remove participant event listener
participantOption.forEach((option) => {
  option.addEventListener("click", async function (e) {
    const groupHash = document.querySelector(".group__group-card-active")
      .dataset.id;
    const fid = this.parentElement.dataset.participant;
    if (this.innerText === "Make Admin") {
      const obj = {};
      obj[fid] = true;
      updateDB(database, `groups/${groupHash}/participants`, obj);
    } else {
      removeDB(database, `groups/${groupHash}/participants/${fid}`);
      removeDB(database, `friends/${fid}/groups/${groupHash}`);
    }
    optionsCnt.classList.add("none");
    optionsCnt.dataset.participant = "null";
  });
});

// ---------------------------------- Dynamic db Listener ---------------------------------------
// Update the newly added participants to the participant container
async function updateParticipantList(data) {
  const groupHash = data.ref.parent.parent.key;
  const participantCnt = document.querySelector(
    `.group__participant-each[data-id="${groupHash}"]`
  );
  if (!participantCnt) return;
  const checkFriend = document.querySelector(
    `.group__add-friend-card[data-id=${data.key}]`
  );
  const checkAdmin =
    document.querySelector(`.group__participant-card[data-id=${user.uid}]`)
      .dataset.admin === "true"
      ? true
      : false;
  if (checkFriend) {
    const photoURL = checkFriend.querySelector(".chat__img").src;
    const name = checkFriend.querySelector(".group__add-friend-name").innerText;
    participantCnt.appendChild(
      addParticipantCardTemplate(data.key, photoURL, name, false, checkAdmin)
    );
  } else {
    const userData = (await readDB(database, `users/${data.key}`)).val();
    const photoURL = userData.photo;
    const name = userData.name;
    participantCnt.appendChild(
      addParticipantCardTemplate(data.key, photoURL, name, false, checkAdmin)
    );
  }
  const newcard = participantCnt.querySelector(
    `.group__participant-card[data-id=${data.key}] .group__participant-option-ic`
  );
  newcard ? newcard.addEventListener("click", showOptionsCnt) : "";
}

// Update the newly made admin
function makeParticipantAdmin(data) {
  if (!data.val()) {
    return;
  }
  const groupHash = data.ref.parent.parent.key;
  const participantCnt = document.querySelector(
    `.group__participant-each[data-id="${groupHash}"]`
  );
  if (!participantCnt) return;
  if (!participantCnt.classList.contains("none")) {
    if (!optionsCnt.classList.contains("none")) {
      optionsCnt.classList.add("none");
      optionsCnt.dataset.participant = "null";
    }
  }
  const participantCard = participantCnt.querySelector(
    `.group__participant-card[data-id="${data.key}"]`
  );
  participantCard.dataset.admin = "true";
  let optionIC = participantCard.querySelector(".group__participant-option-ic");
  if (optionIC) {
    optionIC.src = "./assets/icons/groups/admin.svg";
    optionIC.alt = "admin";
    optionIC.dataset.admin = "true";
    optionIC.removeEventListener("click", showOptionsCnt);
  } else {
    participantCard.innerHTML += `<img
                                            class="group__participant-option-ic"
                                            data-admin="true"
                                            src="./assets/icons/groups/admin.svg"
                                            alt="admin"
                                        />`;
    if (data.key === user.uid) {
      if (!participantCnt.classList.contains("none"))
        addParticipantIC.classList.remove("none");
      const allNonAdminCards = participantCnt.querySelectorAll(
        `.group__participant-card[data-admin="false"]`
      );
      allNonAdminCards.forEach((card) => {
        card.innerHTML += `<img
                                        class="group__participant-option-ic"
                                        data-admin="false"
                                        src="./assets/icons/home/chat-menu.svg"
                                        alt="option"
                                    />`;
      });
      allNonAdminCards.forEach((card) => {
        const option = card.querySelector(".group__participant-option-ic");
        option.addEventListener("click", showOptionsCnt);
      });
    }
  }
  const nonAdminFirstCard = participantCnt.querySelectorAll(
    ".group__participant-card[data-admin='false']"
  );
  if (!nonAdminFirstCard) return;
  participantCnt.insertBefore(participantCard, nonAdminFirstCard[0]);
}

// Update the removed participant
function deleteParticipant(data) {
  if (data.key === user.uid) return;
  const groupHash = data.ref.parent.parent.key;
  const participantCnt = document.querySelector(
    `.group__participant-each[data-id="${groupHash}"]`
  );
  if (!participantCnt) return;
  if (!participantCnt.classList.contains("none")) {
    if (!optionsCnt.classList.contains("none")) {
      optionsCnt.classList.add("none");
      optionsCnt.dataset.participant = "null";
    }
  }
  const participantCard = participantCnt.querySelector(
    `.group__participant-card[data-id=${data.key}]`
  );
  participantCnt.removeChild(participantCard);
  const searchCardIC = document.querySelector(
    `.group__add-friend-card[data-id="${data.key}"] .group__add-friend-ic`
  );
  searchCardIC ? searchCardIC.classList.remove("none") : "";
}

function updateGroupClick(e) {
  clearAllActiveOptions();
  makeCardActive(this);
  checkGroupPresent(this.dataset.id);
  updateChatWindow(this);
}

// ------------------------------------------------- UI Creation --------------------------------------------
const groupContainer = document.querySelector(".group__group-cnt");
let groupCard;
// creating groups and displaying it
async function addGroupToGroupsList(data) {
  const groupHash = data.key;
  const groupData = (
    await readDB(database, `groups/${groupHash}/details`)
  ).val();
  groupContainer.appendChild(groupCardTemplate(groupHash, groupData));
  groupCard = document.querySelector(
    `.group__group-card[data-id="${groupHash}"]`
  );
  groupCard.addEventListener("click", updateGroupClick);
  setDBListener(
    database,
    `groups/${groupCard.dataset.id}/messages`,
    "child_added",
    addMessageToChatBody
  );
  createDBListenerForGroupParticipants(groupHash);
}

function removeGroupFromGroupsList(data) {
  const groupHash = data.key;
  const groupCard = document.querySelector(
    `.group__group-card[data-id="${groupHash}"]`
  );
  groupContainer.removeChild(groupCard);
  const participantCnt = document.querySelector(
    `.group__participant-each[data-id="${groupHash}"]`
  );
  participantCnt ? groupParticpantCnt.removeChild(participantCnt) : "";
}

// Db listener for the group after creating it
function createDBListenerForGroupParticipants(groupHash) {
  setDBListener(
    database,
    `groups/${groupHash}/participants`,
    "child_added",
    updateParticipantList
  );
  setDBListener(
    database,
    `groups/${groupHash}/participants`,
    "child_changed",
    makeParticipantAdmin
  );
  setDBListener(
    database,
    `groups/${groupHash}/participants`,
    "child_removed",
    deleteParticipant
  );
}

// Db listener for loading the groups
function createDBListener() {
  setDBListener(
    database,
    `friends/${user.uid}/groupsCreated`,
    "value",
    updateUserCreatedGroups
  );
  setDBListener(
    database,
    `friends/${user.uid}/groups`,
    "child_added",
    addGroupToGroupsList
  );
  setDBListener(
    database,
    `friends/${user.uid}/groups`,
    "child_removed",
    removeGroupFromGroupsList
  );
}

// ---------------------------------- util needed------------------------------------
// To check wheather user had created the same group already
async function updateUserCreatedGroups(data) {
  if (!data.val()) return;
  userCreatedGroup = [...data.val()];
}

// function to handle group share link
async function addFriendsToGroupUsingLink(groupHash, groupName) {
  const DBgroupName = (
    await readDB(database, `groups/${groupHash}/details/name`)
  ).val();
  if (DBgroupName !== groupName) return;
  const isAddedAlready = (
    await readDB(database, `groups/${groupHash}/participants/${user.uid}`)
  ).val();
  if (isAddedAlready === null) {
    addChlidDB(database, `groups/${groupHash}/participants`, user.uid, false);
    addChlidDB(database, `friends/${user.uid}/groups/`, groupHash, user.uid);
  }
  history.replaceState(null, null, "/groups");
}

function handleGroupJoinURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const share = getParameterByName(urlParams, "share");
  if (!share || share === user.uid) return;
  const groupHash = getParameterByName(urlParams, "gid");
  const groupName = getParameterByName(urlParams, "gname");
  addFriendsToGroupUsingLink(groupHash, groupName);
}

// chat
const chatWindowMessageInput = document.querySelector(".group__input--chat");
let chatWindowUsername = document.querySelector(".group__chat-username");
let chatWindowProfilePic = document.querySelector(".group__img--chat");
let noChatSelectedInfo = document.querySelector(".group__chat-info");
let chatWindowHeader = document.querySelector(".group__chat-header");
let chatWindowMessageSender = document.querySelector(
  ".group__chat-message-sender"
);
let chatWrapper = document.querySelector(".group__chat-wrapper");

function cleanUpChatWindow() {
  chatWindowHeader.classList.remove("none");
  chatWindowMessageSender.classList.remove("none");
  noChatSelectedInfo.classList.add("none");
}

function updateChatDataSet(groupCard) {
  chatWindowHeader.dataset.groupId = groupCard.dataset.id;
}

function updateFriendDataAtChatWindow(groupCard) {
  chatWindowUsername.textContent =
    groupCard.querySelector(".group__group-name").textContent;
  chatWindowProfilePic.src = groupCard.querySelector(".group__img").src;
}

function createFriendContainer(groupId) {
  const groupContainer = document.createElement("div");
  groupContainer.classList.add("group__chat-container");
  groupContainer.dataset.groupId = groupId;
  chatWrapper.appendChild(groupContainer);
  return groupContainer;
}

function setUpChatWindow(groupCard) {
  cleanUpChatWindow();
  updateFriendDataAtChatWindow(groupCard);
  updateChatDataSet(groupCard);
}

let prevCard = null;
async function updateChatWindow(groupCard) {
  let upload = document.querySelector(".upload");
  if (!upload.classList.contains("none")) {
    upload.classList.add("none");
    chatWrapper.classList.remove("none");
  }

  setUpChatWindow(groupCard);

  let id = chatWindowHeader.dataset.groupId;
  let groupContainer = document.querySelector(
    `.group__chat-container[data-group-id="${id}"]`
  );
  if (prevCard && prevCard === groupContainer) return;
  if (prevCard) prevCard.classList.add("none");
  if (!groupContainer) {
    groupContainer = createFriendContainer(id);
  } else {
    prevCard = groupContainer;
    groupContainer.classList.remove("none");
    autoScroll();
    return;
  }
  prevCard = groupContainer;
  let data = (await readDB(database, `groups/${id}/`)).val();
  fillMessagesToChatBody(data.messages, id);
}

function sendMessage() {
  if (!chatWindowMessageInput.value) return;
  let messageKey = pushKey(
    database,
    `group/${chatWindowHeader.dataset.groupId}/messages`,
    user.uid
  );
  let message = {
    text: chatWindowMessageInput.value,
    sender: user.uid,
    time: new Date().toISOString(),
  };
  addChlidDB(
    database,
    `groups/${chatWindowHeader.dataset.groupId}/messages`,
    messageKey,
    message
  );
  chatWindowMessageInput.value = "";
}

function autoScroll() {
  chatWrapper.scrollTop = chatWrapper.scrollHeight;
}

function fillMessagesToChatBody(data, groupId) {
  if (!data) return;
  let chatContainer = document.querySelector(
    `.group__chat-container[data-group-id="${groupId}"]`
  );
  Object.values(data).forEach((message, idx) => {
    let sender = document.querySelector(
      `.group__participant-card[data-id=${message.sender}]`
    ).textContent;
    if (message.sender === user.uid) {
      "text" in message
        ? addMessageToContainer(
            chatContainer,
            message.text,
            message.time,
            sender,
            "right"
          )
        : "image" in message
        ? addFileToContainer(
            chatContainer,
            message.image,
            message.metadata,
            message.time,
            "right",
            "image"
          )
        : addFileToContainer(
            chatContainer,
            message.file,
            message.metadata,
            message.time,
            "right",
            "file"
          );
    } else {
      "text" in message
        ? addMessageToContainer(
            chatContainer,
            message.text,
            message.time,
            sender,
            "left"
          )
        : "image" in message
        ? addFileToContainer(
            chatContainer,
            message.image,
            message.metadata,
            message.time,
            "left",
            "image"
          )
        : addFileToContainer(
            chatContainer,
            message.file,
            message.metadata,
            message.time,
            "left",
            "file"
          );
    }
  });
  autoScroll();
}

function addMessageToContainer(chatContainer, message, time, sender, position) {
  let datePart = new Date(time).toDateString();
  let timePart = new Date(time).toTimeString().split(" ")[0];
  let timeStamp = datePart + " " + timePart;
  chatContainer.appendChild(
    createMessage(message, timeStamp, sender, position)
  );
}

function createMessage(message, timeStamp, sender, position) {
  let messageWrapper = document.createElement("div");
  let chatMessage = document.createElement("p");
  let chatTimeStamp = document.createElement("span");

  messageWrapper.className = `group__message-container group__message-container--${position}`;
  chatMessage.className = "group__message";
  chatTimeStamp.className = "group__time-stamp";

  chatMessage.textContent = message;
  chatTimeStamp.textContent = sender + " " + timeStamp;

  messageWrapper.appendChild(chatMessage);
  messageWrapper.appendChild(chatTimeStamp);
  return messageWrapper;
}

async function addMessageToChatBody(chat) {
  let groupId = chat.ref.parent.parent.key;

  let chatContainer = document.querySelector(
    `.group__chat-container[data-group-id="${groupId}"]`
  );
  if (!chatContainer) {
    return;
  }

  let chatData = chat.val();
  if (!chatData) return;

  if ("image" in chatData) {
    if (
      chatContainer.querySelector(
        `.group__message-container[data-id="${chat.key}"]`
      )
    )
      return;
    addFileToContainer(
      chatContainer,
      chatData.image,
      chatData.metadata,
      chatData.time,
      "left",
      "image"
    );
    return;
  }
  if ("file" in chatData) {
    if (
      chatContainer.querySelector(
        `.group__message-container[data-id="${chat.key}"]`
      )
    )
      return;
    addFileToContainer(
      chatContainer,
      chatData.file,
      chatData.metadata,
      chatData.time,
      "left",
      "file"
    );
    return;
  }
  let sender = document.querySelector(
    `.group__participant-card[data-id=${chatData.sender}]`
  ).textContent;
  if (chatData.sender === user.uid) {
    addMessageToContainer(
      chatContainer,
      chatData.text,
      chatData.time,
      sender,
      "right"
    );
  } else {
    addMessageToContainer(
      chatContainer,
      chatData.text,
      chatData.time,
      sender,
      "left"
    );
  }
  autoScroll();
}

function addFileToContainer(
  chatContainer,
  src,
  metaData,
  time,
  position,
  type
) {
  let datePart = new Date(time).toDateString();
  let timePart = new Date(time).toTimeString().split(" ")[0];
  let timeStamp = datePart + " " + timePart;
  let size = metaData.size;
  let name = metaData.name;
  chatContainer.innerHTML +=
    type === "image"
      ? `<div class="group__message-container group__message-container--${position}">
          <div class="group__message--image-cnt">
            <a class="group__message--link" href="${src}" download target="_blank"><img src="${src}" alt="image" class="group__message--image" loading="lazy"></a>
            <span class="group__message--downloaded">${size} MB</span>
          </div>
          <span class="group__time-stamp group__time-stamp--left">${timeStamp}</span>
        </div>`
      : `<div class="group__message-container group__message-container--${position}">
          <div class="group__message--file-cnt">
            <div class="group__message--file-download"> 
              <a class="group__message--link" href="${src}" download="${name}" target="_blank"><img class="group__message--download-ic" src="./assets/icons/home/download.svg" alt=""></a>
            </div>
            <div class="group__message--file-detail">
              <h3 class="group__message--file-name">${name}</h3>
              <span class="group__message--downloaded">${size} MB</span>
            </div>
          </div>
          <span class="group__time-stamp group__time-stamp--left">${timeStamp}</span>
        </div>`;
  autoScroll();
}

window.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

document
  .querySelector(".group__img--send")
  .addEventListener("click", sendMessage);
