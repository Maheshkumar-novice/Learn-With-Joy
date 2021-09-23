import { addChlidDB, pushKey, readDB, setDBListener, storageRef, updateDB, writeDB } from "../modules/firebase.js";
import { groupCardTemplate } from "../modules/template.js";
import { checkAndChangeAngularBrackets } from "../modules/util.js";

let user;
let userCreatedGroup=[];
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

auth.onAuthStateChanged((currentUser) => {
  if (currentUser) {
    user = currentUser;
    createDBListener();
  }
});

// -------------------------------------- create group -----------------------------------

const groupNameInput = document.querySelector(".groupt__input-name");
const groupLogoIC = document.querySelector(".group-logo-upload");
const groupLogoUpload = document.querySelector(".grouup__logo-input");
const createButton = document.querySelector(".group-create-button");
const createButtonLoader = document.querySelector(".create-loader");
const groupCreateError = document.querySelector(".create-group-error");

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
    userCreatedGroup.push(name);
    updateDB(database, `friends/${user.uid}`, {groupsCreated:userCreatedGroup});
    addChlidDB(database, `friends/${user.uid}/groups/`, groupHash, user.uid);
    toggleCreateGroupButton(0);
}

// ------------------------------------------------- UI Creation --------------------------------------------
const groupContainer = document.querySelector(".group__group-cnt");
async function addGroupToGroupsList(data){
    const groupHash = data.key;
    const groupData = (await readDB(database, `groups/${groupHash}/details`)).val();
    groupContainer.innerHTML += groupCardTemplate(groupHash, groupData);
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