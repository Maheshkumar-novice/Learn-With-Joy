import { addChlidDB, getOrderBy, pushKey, readDB, removeDB, setDBListener, storageRef, updateDB, writeDB } from "../modules/firebase.js";
import { addParticipantCardTemplate, groupCardTemplate } from "../modules/template.js";
import { checkAndChangeAngularBrackets, getParameterByName } from "../modules/util.js";

let user;
let userCreatedGroup=[];
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

let totalFriends=0;
let searchFriendsList = [];

auth.onAuthStateChanged( async (currentUser) => {
  if (currentUser) {
    user = currentUser;
    totalFriends = (await readDB(database, `friends/${user.uid}/friends`)).numChildren();
    checkAddFriendsList(); 
    createDBListener();
    handleGroupJoinURL();
  }
});

// ------------------------------------- Add participants from friends ----------------------
let participantAddFriendsCard;
const participantAddFriendsCnt = document.querySelector(".group__add-friends-cnt[data-type='friends-cnt']");
const participantSearchListFriendsCnt = document.querySelector(".group__add-friends-cnt[data-type='search-cnt']");
const addParticipantIC = document.querySelector(".group__participants-add");
const participantFriendCnt = document.querySelector(".group__participants-add-list");
const searchFriendsInput = document.querySelector(".search__friends-input");
const searchFriendsInputClose = document.querySelector(".add-friends-search-close");

//Toggle Add participant friends container
addParticipantIC.addEventListener("click", function(e){
    if(this.src.includes("accept.svg")){
        this.src = "./assets/icons/home/msg-clear.svg";
        optionsCnt.classList.add("none");
    }
    else{
        this.src = "./assets/icons/home/accept.svg";
        participantSearchListFriendsCnt.innerText = '';
        searchFriendsInput.value = '';
        participantAddFriendsCnt.classList.remove("none");
        participantSearchListFriendsCnt.classList.add("none");
    }
    participantFriendCnt.classList.toggle("none");
    groupParticpantCnt.classList.toggle("none");
});

//Search friends from friends list
searchFriendsInput.addEventListener("input", function(e){
    let value = this.value;
    if(value == ''){
        participantAddFriendsCnt.classList.remove("none");
        participantSearchListFriendsCnt.classList.add("none");
        return;
    }
    participantAddFriendsCnt.classList.add("none");
    participantSearchListFriendsCnt.classList.remove("none");
    const regex = new RegExp(`^${value}`, "gi");
    participantSearchListFriendsCnt.innerText = '';
    searchFriendsList.forEach((name, idx) => {
        if(name.match(regex)){
            const clone = participantAddFriendsCard[idx].cloneNode(true);
            participantSearchListFriendsCnt.appendChild(clone);
        }
    });
    const addIC = participantSearchListFriendsCnt.querySelectorAll(".group__add-friend-ic");
    addIC.forEach(ic => {
        ic.addEventListener("click", addFriendsToGroup);
    })
});

searchFriendsInputClose.addEventListener("click", function(e){
    searchFriendsInput.innerText = '';
    participantAddFriendsCnt.classList.remove("none");
    participantSearchListFriendsCnt.classList.add("none");
});

//Update the friendds list and add listener for adding to groups
async function checkAddFriendsList(){
    const participantAddFriendsCount = participantAddFriendsCnt.childElementCount
    console.log(typeof totalFriends ,typeof participantAddFriendsCount)
    if(participantAddFriendsCount === totalFriends){
        updateFriendsForAddParticipantsUtil();
        return;
    }
    setTimeout(checkAddFriendsList, 1000);
}

function updateFriendsForAddParticipantsUtil(){
    participantAddFriendsCard = participantAddFriendsCnt.querySelectorAll(".group__add-friend-card");
    participantAddFriendsCard.forEach(card => {
        updateFriendsForAddParticipants(card);
    });
}

function updateFriendsForAddParticipants(card){
    const participantAddFriendsIc = card.querySelector(".group__add-friend-ic");
    searchFriendsList.push(card.querySelector(".group__add-friend-name").innerText);
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
    console.log(e, e.target.files);
    if(!e.target.files[0] || (e.target.files[0].size/(1024*1024)) > 1){
        e.target.value = ''
        return;
    }
    groupLogoIC.src = URL.createObjectURL(e.target.files[0]);
});

// loading while group creation
function toggleCreateGroupButton(bool){
    if(bool){
        createButton.disabled = true; 
        createButtonLoader.classList.add("add-loading-animation");
        createButtonLoader.classList.remove("none");
    }
    else{
        createButton.disabled = false; 
        createButtonLoader.classList.remove("add-loading-animation");
        createButtonLoader.classList.add("none");
    }
}

createButton.addEventListener("click", async (e) => {
    const groupName = checkAndChangeAngularBrackets(groupNameInput.value);
    if(!groupName) {
        groupCreateError.innerText = "Empty Name";
        setTimeout(() => {groupCreateError.innerText = ''}, 1000);
        return
    };
    if(userCreatedGroup.find(userGroupName => userGroupName === groupName)){
        groupCreateError.innerText = "Created Already";
        setTimeout(() => {groupCreateError.innerText = ''}, 1000);
        return
    }
    toggleCreateGroupButton(1);
    let groupHash = pushKey(database, `groups/`, groupName)
    let profileURL = !groupLogoUpload.value 
    ? "./assets/icons/groups/group-default.svg"
    : await uploadGroupProfilePic(groupHash, groupLogoUpload.files[0]);
    createGroup(groupHash, groupName, profileURL);
});

async function uploadGroupProfilePic(groupHash, file){
    const ref = storageRef(
        storage,
        `groups/${groupHash}/profilePic`,
        `${file.name}`
    );
    await ref.put(file);
    let profileURL = await storage.ref(`groups/${groupHash}/profilePic`).child(file.name).getDownloadURL();
    return profileURL;
}

async function createGroup(groupHash, name, profileURL){
    const details ={
        name,
        profileURL,
        createdBy: user.uid
    }
    writeDB(database, `groups/${groupHash}/details`, details);
    addChlidDB(database, `groups/${groupHash}/participants`, user.uid, true);
    userCreatedGroup.push(name);
    updateDB(database, `friends/${user.uid}`, {groupsCreated:userCreatedGroup});
    addChlidDB(database, `friends/${user.uid}/groups/`, groupHash, user.uid);
    console.log(`${window.location.href}?share=${user.uid}&gid=${groupHash}&gname=${name}`)
    toggleCreateGroupButton(0);
}

// Add friends to group list
function addFriendsToGroup(){
    const fid = this.parentElement.dataset.id;
    const groupHash = document.querySelector(".group__group-card-active").dataset.id;
    const isAddedAlready = document.querySelector(`.group__participant-each[data-id="${groupHash}"] .group__participant-card[data-id=${fid}]`);
    if(!isAddedAlready){
        addChlidDB(database, `groups/${groupHash}/participants`, fid, false);
        addChlidDB(database, `friends/${fid}/groups/`, groupHash, fid);
    }
    const allCardIC = document.querySelectorAll(`.group__add-friend-card[data-id="${fid}"] .group__add-friend-ic`);
    console.log(allCardIC)
    allCardIC.forEach(ic => {
        ic.classList.add("none");
    });
}

// Update friends list after adding to the group
function updateAddParticipantsFriendsList(elem){
    let friendsCard = participantAddFriendsCnt.querySelectorAll(".group__add-friend-card");
    friendsCard.forEach(card => {
        const isPresent = elem.querySelector(`.group__participant-card[data-id=${card.dataset.id}]`);
        if(isPresent){
            card.querySelector(".group__add-friend-ic").classList.add("none");
        }
        else{
            card.querySelector(".group__add-friend-ic").classList.remove("none");
        }
    });
}

// toggle group utils
function clearAllActiveOptions(){
    optionsCnt.classList.add("none");
    optionsCnt.dataset.participant = "null";
    if(!addParticipantIC.src.includes("accept.svg")) addParticipantIC.click();
}

function makeCardActive(card){
    const prevSelected = document.querySelector(".group__group-card-active");
    const participantCnt = prevSelected ? document.querySelector(`.group__participant-each[data-id="${prevSelected.dataset.id}"]`) : "";
    prevSelected 
    ? (prevSelected.classList.remove("group__group-card-active"), participantCnt.classList.add("none")) : "";
    card.classList.add("group__group-card-active");
}

// copy group share link
const copyLinkIC = document.querySelector(".copy-link");
copyLinkIC.addEventListener("click", copyLink);
function copyLink(){
    navigator.clipboard.writeText(groupLink.innerText);
}

function updateGroupLink(groupHash){
    const groupName = document.querySelector(".group__group-card-active").innerText;
    const link = `https://learn-with-joy.web.app/groups?share=${user.uid}&gid=${groupHash}&gname=${groupName}`;
    // const link = `http://localhost:5000/groups?share=${user.uid}&gid=${groupHash}&gname=${groupName}`;
    groupLink.innerText = link;
    groupLink.title = link;
}

// to check wheather Groups had already been loaded or not
async function checkGroupPresent(hash){
    const isAdmin = (await readDB(database, `groups/${hash}/participants/${user.uid}`)).val();
    isAdmin ? (addParticipantIC.classList.remove("none"), updateGroupLink(hash)) : addParticipantIC.classList.add("none");
    const participantCnt = document.querySelector(`.group__participant-each[data-id="${hash}"]`);
    if(participantCnt){ 
        // if already clicked toggle the container
        participantCnt.classList.remove("none");
        updateAddParticipantsFriendsList(participantCnt);
        return;
    }
    // else create the container
    showParticipantsList(hash, isAdmin);
}

// creating participant list based on the access
async function showParticipantsList(hash, userAdminStatus){
    const participantCnt = document.createElement("div");
    participantCnt.classList.add("group__participant-each");
    participantCnt.dataset.id = hash;
    const adminDB = await getOrderBy(database, hash, true, 1);
    const adminData = await adminDB.val();
    const nonAdminDB = await getOrderBy(database, hash, false, 1);
    const nonAdminData = await nonAdminDB.val();
    for(let id in adminData){
        const checkFriend = document.querySelector(`.group__add-friend-card[data-id=${id}]`);
        if(checkFriend){
            const photoURL = checkFriend.querySelector(".chat__img").src;
            const name = checkFriend.querySelector(".group__add-friend-name").innerText;
            participantCnt.appendChild(addParticipantCardTemplate(id, photoURL, name, true, userAdminStatus));
        }
        else{
            const data = (await readDB(database, `users/${id}`)).val();
            const photoURL = data.photo;
            const name = data.name;
            participantCnt.appendChild(addParticipantCardTemplate(id, photoURL, name, true, userAdminStatus));
        }
    }
    for(let id in nonAdminData){
        const checkFriend = document.querySelector(`.group__add-friend-card[data-id=${id}]`);
        if(checkFriend){
            const photoURL = checkFriend.querySelector(".chat__img").src;
            const name = checkFriend.querySelector(".group__add-friend-name").innerText;
            participantCnt.appendChild(addParticipantCardTemplate(id, photoURL, name, false, userAdminStatus));
        }
        else{
            const data = (await readDB(database, `users/${id}`)).val();
            const photoURL = data.photo;
            const name = data.name;
            participantCnt.appendChild(addParticipantCardTemplate(id, photoURL, name, false, userAdminStatus));
        }
    }
    groupParticpantCnt.appendChild(participantCnt);
    updateAddParticipantsFriendsList(document.querySelector(`.group__participant-each[data-id="${hash}"]`));
    const participantOptionsIC = participantCnt.querySelectorAll(".group__participant-option-ic[data-admin='false']");
    console.log(participantOptionsIC);
    participantOptionsIC.forEach(options => {
        options.addEventListener("click", showOptionsCnt);
    });
}

// participant option container toggler
function showOptionsCnt(e){
    console.log("hello");
    const card = this.parentElement;
    if(optionsCnt.dataset.participant === card.dataset.id){
        optionsCnt.classList.add("none");
        optionsCnt.dataset.participant = "null";
        return;
    }
    optionsCnt.classList.remove("none");
    optionsCnt.dataset.participant = card.dataset.id;
    optionsCnt.style.top = `${card.offsetTop+card.offsetHeight+20}px`;
}

// Admin and remove participant event listener
participantOption.forEach(option => {
    option.addEventListener("click", async function(e){
        const groupHash = document.querySelector(".group__group-card-active").dataset.id;
        const fid = this.parentElement.dataset.participant;
        console.log(groupHash, fid); 
        if(this.innerText === "Make Admin"){
            const obj = {};
            obj[fid] = true;
            updateDB(database, `groups/${groupHash}/participants`, obj);
        }
        else{
            removeDB(database, `groups/${groupHash}/participants/${fid}`);
            removeDB(database, `friends/${fid}/groups/${groupHash}`);
        }
        optionsCnt.classList.add("none");
        optionsCnt.dataset.participant = "null";
    });
});

// ---------------------------------- Dynamic db Listener ---------------------------------------
// Update the newly added participants to the participant container 
async function updateParticipantList(data){
    const groupHash = data.ref.parent.parent.key;
    const participantCnt = document.querySelector(`.group__participant-each[data-id="${groupHash}"]`);
    if(!participantCnt) return;
    const checkFriend = document.querySelector(`.group__add-friend-card[data-id=${data.key}]`);
    const checkAdmin = document.querySelector(`.group__participant-card[data-id=${user.uid}]`).dataset.admin === "true" ? true : false;
    console.log(checkAdmin)
    if(checkFriend){
        const photoURL = checkFriend.querySelector(".chat__img").src;
        const name = checkFriend.querySelector(".group__add-friend-name").innerText;
        participantCnt.appendChild(addParticipantCardTemplate(data.key, photoURL, name, false, checkAdmin));
    }
    else{
        const userData = (await readDB(database, `users/${data.key}`)).val();
        const photoURL = userData.photo;
        const name = userData.name;
        participantCnt.appendChild(addParticipantCardTemplate(data.key, photoURL, name, false, checkAdmin));
    }
    console.log(participantCnt.querySelector(".group__participant-option-ic"));
    const newcard = participantCnt.querySelector(`.group__participant-card[data-id=${data.key}] .group__participant-option-ic`);
    newcard ? newcard.addEventListener("click", showOptionsCnt) : "";
}

// Update the newly made admin
function makeParticipantAdmin(data){
    console.log(data.key, data.val());
    if(!data.val()){
        return;
    }
    const groupHash = data.ref.parent.parent.key;
    const participantCnt = document.querySelector(`.group__participant-each[data-id="${groupHash}"]`);
    if(!participantCnt) return;
    if(!participantCnt.classList.contains("none")){
        if(!optionsCnt.classList.contains("none")){
            optionsCnt.classList.add("none");
            optionsCnt.dataset.participant = "null";
        }
    }
    const participantCard = participantCnt.querySelector(`.group__participant-card[data-id="${data.key}"]`);
    console.log(participantCard);
    participantCard.dataset.admin = "true";
    let optionIC = participantCard.querySelector(".group__participant-option-ic");
    if(optionIC){
        optionIC.src = "./assets/icons/groups/admin.svg";
        optionIC.alt = "admin";
        optionIC.dataset.admin = "true"; 
        optionIC.removeEventListener("click", showOptionsCnt);
    }
    else{
        participantCard.innerHTML += `<img
                                            class="group__participant-option-ic"
                                            data-admin="true"
                                            src="./assets/icons/groups/admin.svg"
                                            alt="admin"
                                        />`;
        if(data.key === user.uid){
            if(!participantCnt.classList.contains("none")) addParticipantIC.classList.remove("none");
            const allNonAdminCards = participantCnt.querySelectorAll(`.group__participant-card[data-admin="false"]`);
            console.log(allNonAdminCards);
            allNonAdminCards.forEach(card => {
                card.innerHTML += `<img
                                        class="group__participant-option-ic"
                                        data-admin="false"
                                        src="./assets/icons/home/chat-menu.svg"
                                        alt="option"
                                    />`
            });
            allNonAdminCards.forEach(card => {
                const option = card.querySelector(".group__participant-option-ic");
                option.addEventListener("click", showOptionsCnt);
            });
        }
    }
    const nonAdminFirstCard = participantCnt.querySelectorAll(".group__participant-card[data-admin='false']");
    console.log(nonAdminFirstCard, participantCard);
    if(!nonAdminFirstCard) return;
    participantCnt.insertBefore(participantCard, nonAdminFirstCard[0]);
}

// Update the removed participant
function deleteParticipant(data){
    console.log(data.key, data.val());
    if(data.key === user.uid) return;
    const groupHash = data.ref.parent.parent.key;
    const participantCnt = document.querySelector(`.group__participant-each[data-id="${groupHash}"]`);
    if(!participantCnt) return;
    if(!participantCnt.classList.contains("none")){
        if(!optionsCnt.classList.contains("none")){
            optionsCnt.classList.add("none");
            optionsCnt.dataset.participant = "null";
        }
    }
    const participantCard = participantCnt.querySelector(`.group__participant-card[data-id=${data.key}]`);
    console.log(participantCard, participantCnt);
    participantCnt.removeChild(participantCard);
    const searchCardIC = document.querySelector(`.group__add-friend-card[data-id="${data.key}"] .group__add-friend-ic`);
    searchCardIC ? searchCardIC.classList.remove("none") : "";
}

function updateGroupClick(e){
    clearAllActiveOptions();
    makeCardActive(this);
    checkGroupPresent(this.dataset.id);
}

// ------------------------------------------------- UI Creation --------------------------------------------
const groupContainer = document.querySelector(".group__group-cnt");
let groupCard;
// creating groups and displaying it
async function addGroupToGroupsList(data){
    const groupHash = data.key;
    const groupData = (await readDB(database, `groups/${groupHash}/details`)).val();
    groupContainer.appendChild(groupCardTemplate(groupHash, groupData));
    groupCard = document.querySelector(`.group__group-card[data-id="${groupHash}"]`);
    groupCard.addEventListener("click", updateGroupClick);
    createDBListenerForGroupParticipants(groupHash);
}

function removeGroupFromGroupsList(data){
    console.log(data.key, data.val());
    const groupHash = data.key;
    const groupCard = document.querySelector(`.group__group-card[data-id="${groupHash}"]`);
    groupContainer.removeChild(groupCard);
    const participantCnt = document.querySelector(`.group__participant-each[data-id="${groupHash}"]`);
    participantCnt ? groupParticpantCnt.removeChild(participantCnt) : "";
}

// Db listener for the group after creating it
function createDBListenerForGroupParticipants(groupHash){
    setDBListener(database, `groups/${groupHash}/participants`, "child_added", updateParticipantList);
    setDBListener(database, `groups/${groupHash}/participants`, "child_changed", makeParticipantAdmin);
    setDBListener(database, `groups/${groupHash}/participants`, "child_removed", deleteParticipant);
}

// Db listener for loading the groups
function createDBListener(){
    setDBListener(database, `friends/${user.uid}/groupsCreated`, "value", updateUserCreatedGroups)
    setDBListener(database, `friends/${user.uid}/groups`, "child_added", addGroupToGroupsList);
    setDBListener(database, `friends/${user.uid}/groups`, "child_removed", removeGroupFromGroupsList);
}

// ---------------------------------- util needed------------------------------------
// To check wheather user had created the same group already
async function updateUserCreatedGroups(data){
    if(!data.val()) return
    userCreatedGroup = [...data.val()];
}

// function to handle group share link
async function addFriendsToGroupUsingLink(groupHash, groupName){
    console.log("hello");
    const DBgroupName = (await readDB(database, `groups/${groupHash}/details/name`)).val();
    if(DBgroupName !== groupName) return;
    const isAddedAlready = (await readDB(database, `groups/${groupHash}/participants/${user.uid}`)).val();
    console.log(isAddedAlready);
    if(isAddedAlready === null){
        console.log("Inside");
        addChlidDB(database, `groups/${groupHash}/participants`, user.uid, false);
        addChlidDB(database, `friends/${user.uid}/groups/`, groupHash, user.uid);
    }
    history.replaceState(null, null, "/groups")
    console.log("hello");
}

function handleGroupJoinURL(){
    const urlParams = new URLSearchParams(window.location.search);
    const share = getParameterByName(urlParams, "share");
    console.log(share);
    if(!share || share === user.uid) return;
    const groupHash = getParameterByName(urlParams, "gid");
    const groupName = getParameterByName(urlParams, "gname");
    addFriendsToGroupUsingLink(groupHash, groupName);
}