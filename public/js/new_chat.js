import { readDB } from "./modules/firebase.js";
import { pushFront } from "./modules/util.js";

const auth = firebase.auth()
const database = firebase.database();

let user, friendsList;
async function updateFriendsList() {
    let friendsData = await readDB(database, `friends/${user.uid}`);
    friendsList = friendsData.val().friends;
}

auth.onAuthStateChanged(async (currentUser) => {
  if (currentUser) {
    user = currentUser;
    await updateFriendsList();
    getEachChat();
  }
});

function returnMessageCount(mid, message){
    if(!message) return;
    let bool = false, count=0;
    Object.keys(message).forEach(msg => {
        // console.log(msg, mid)
        if(bool) count++;
        if(msg === mid) bool = true;
    });
    return count;
}

function updateMessageCount(hash, no){
    const friendContainer = document.querySelector(`.chat__friend-card[data-hash="${hash}"]`);
    pushFront(friendContainer);
    let msgCountCnt = friendContainer.querySelector(".chat__message-count");
    msgCountCnt.classList.remove("none");
    msgCountCnt.innerText = no;
}

async function getEachChat(){
    // console.log(friendsList);
    let notSeenNumber;
    for(let fid in friendsList){
        notSeenNumber = 0;
        let hash = friendsList[fid];
        let chat = await readDB(database, `chat/${hash}/lastSeenMessage/${user.uid}`);
        // console.log(chat.val());

        const ref = (await firebase.database().ref(`chat/${hash}/messages`).orderByChild('sender')).equalTo(fid);
        const messageIDS = (await ref.get()).val();
        notSeenNumber = returnMessageCount(chat.val(), messageIDS);
        // console.log(notSeenNumber);
        if(notSeenNumber){
            updateMessageCount(hash, notSeenNumber)
        }
    }
}