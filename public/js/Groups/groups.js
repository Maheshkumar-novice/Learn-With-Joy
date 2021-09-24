import { addChlidDB, getOrderBy, pushKey, readDB, setDBListener, storageRef, updateDB, writeDB } from "../modules/firebase.js";
import { addParticipantCardTemplate, groupCardTemplate } from "../modules/template.js";
import { checkAndChangeAngularBrackets } from "../modules/util.js";

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

addParticipantIC.addEventListener("click", function(e){
    if(this.src.includes("accept.svg")){
        this.src = "./assets/icons/home/msg-clear.svg";
        optionsCnt.classList.add("none");
    }
    else{
        this.src = "./assets/icons/home/accept.svg";
        searchFriendsInput.value = '';
        participantAddFriendsCnt.classList.remove("none");
        participantSearchListFriendsCnt.classList.add("none");
    }
    participantFriendCnt.classList.toggle("none");
    groupParticpantCnt.classList.toggle("none");
});

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
    toggleCreateGroupButton(0);
}

function addFriendsToGroup(){
    const fid = this.parentElement.dataset.id;
    const groupHash = document.querySelector(".group__group-card-active").dataset.id;
    addChlidDB(database, `groups/${groupHash}/participants`, fid, false);
    addChlidDB(database, `friends/${fid}/groups/`, groupHash, fid);
    const allCardIC = document.querySelectorAll(`.group__add-friend-card[data-id="${fid}"] .group__add-friend-ic`);
    console.log(allCardIC)
    allCardIC.forEach(ic => {
        ic.classList.add("none");
    })
}

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

function clearAllActiveOptions(){
    optionsCnt.classList.add("none");
    optionsCnt.dataset.participant = "null";
    if(!addParticipantIC.src.includes("accept.svg")) addParticipantIC.click();
}

async function makeCardActive(card){
    const prevSelected = document.querySelector(".group__group-card-active");
    const participantCnt = prevSelected ? document.querySelector(`.group__participant-each[data-id="${prevSelected.dataset.id}"]`) : "";
    prevSelected 
    ? (prevSelected.classList.remove("group__group-card-active"), participantCnt.classList.add("none")) : "";
    card.classList.add("group__group-card-active");
}

async function checkGroupPresent(hash){
    const isAdmin = (await readDB(database, `groups/${hash}/participants/${user.uid}`)).val();
    isAdmin ? addParticipantIC.classList.remove("none") : addParticipantIC.classList.add("none");
    const participantCnt = document.querySelector(`.group__participant-each[data-id="${hash}"]`);
    if(participantCnt){
        participantCnt.classList.remove("none");
        updateAddParticipantsFriendsList(participantCnt);
        return;
    }
    showParticipantsList(hash, isAdmin);

}
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
        options.addEventListener("click", function(e){
            console.log("hello")
            const card = this.parentElement;
            if(optionsCnt.dataset.participant === card.dataset.id){
                optionsCnt.classList.add("none");
                return;
            }
            optionsCnt.classList.remove("none");
            optionsCnt.dataset.participant = card.dataset.id;
            optionsCnt.style.top = `${card.offsetTop+card.offsetHeight+20}px`;
        });
    });
}

async function updateParticipantList(data){
    const groupHash = data.ref.parent.parent.key;
    const participantCnt = document.querySelector(`.group__participant-each[data-id="${groupHash}"]`);
    if(!participantCnt) return;
    const checkFriend = document.querySelector(`.group__add-friend-card[data-id=${data.key}]`);
    if(checkFriend){
        const photoURL = checkFriend.querySelector(".chat__img").src;
        const name = checkFriend.querySelector(".group__add-friend-name").innerText;
        participantCnt.appendChild(addParticipantCardTemplate(data.key, photoURL, name, false));
    }
    else{
        const data = (await readDB(database, `users/${id}`)).val();
        const photoURL = data.photo;
        const name = data.name;
        participantCnt.appendChild(addParticipantCardTemplate(data.key, photoURL, name, false));
    }
}

function updateGroupClick(e){
    clearAllActiveOptions();
    makeCardActive(this);
    checkGroupPresent(this.dataset.id);
}

// ------------------------------------------------- UI Creation --------------------------------------------
const groupContainer = document.querySelector(".group__group-cnt");
let groupCard;
async function addGroupToGroupsList(data){
    const groupHash = data.key;
    const groupData = (await readDB(database, `groups/${groupHash}/details`)).val();
    groupContainer.appendChild(groupCardTemplate(groupHash, groupData));
    groupCard = document.querySelector(`.group__group-card[data-id="${groupHash}"]`);
    groupCard.addEventListener("click", updateGroupClick);
    setDBListener(database, `groups/${groupHash}/participants`, "child_added", updateParticipantList);
}

function createDBListener(){
    setDBListener(database, `friends/${user.uid}/groupsCreated`, "value", updateUserCreatedGroups)
    setDBListener(database, `friends/${user.uid}/groups`, "child_added", addGroupToGroupsList);
}

// ---------------------------------- util needed------------------------------------
async function updateUserCreatedGroups(data){
    if(!data.val()) return
    userCreatedGroup = [...data.val()];
}