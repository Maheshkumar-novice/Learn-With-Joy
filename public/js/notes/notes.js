import { addChlidDB, pushKey, readDB, setDBListener, updateDB, writeDB } from "../modules/firebase.js";
import { noteCardTemplate } from "../modules/template.js";
import { getParameterByName, pushState } from "../modules/util.js";
// firebase
const database = firebase.database();
const auth = firebase.auth();
let user, currentNoteID;

const createNew = document.querySelector(".notes__creat-cnt");
const noEditor = document.querySelector(".no-editor");
const richEditor = document.querySelector(".rich-editor");
const linkUpdater = document.querySelector(".note-link");
const copyNoteLink = document.querySelector(".note-share-link");
const editorTitle = document.querySelector(".editor-title");
// const editorCnt = document.querySelector(".editor-cnt");

createNew.addEventListener("click", (e) => {
    const uid = auth.currentUser.uid;
    const noteID = pushKey(database, `notes/`, auth.currentUser.uid);
    console.log(noteID);
    addChlidDB(database, `friends/${uid}/notes`, noteID, true);
    initializeNotesUtil(noteID);
});

copyNoteLink.addEventListener("click", (e) => {
  navigator.clipboard.writeText(linkUpdater.innerText);
});

editorTitle.addEventListener("change", (e) => {
  console.log(e.target.value);
  updateDB(database, `notes/currentNoteID`, {name: e.target.value});
});

function initializeNotesUtil(noteID){
    currentNoteID = noteID;
    richEditor.dataset.noteId = noteID;
    noEditor.classList.add("none");
    richEditor.classList.remove("none");
    const newURL = `?nid=${noteID}`;
    console.log(newURL);
    window.history.pushState("noteEditor", null, newURL);
    linkUpdater.innerText = window.location.href;
    initializeNotes(noteID);
}

async function initializeNotes(noteID) {
  //// Get Firebase Database reference.
  var firepadRef = await loadNoteData(noteID);

  //// Create CodeMirror (with lineWrapping on).
  var codeMirror = CodeMirror(document.getElementById("firepad-container"), {
    lineWrapping: true,
  });

  //// Create Firepad (with rich text toolbar and shortcuts enabled).
  var userId = Math.floor(Math.random() * 9999999999).toString();

//// Create Firepad (with rich text features and our desired userId).
var firepad = Firepad.fromCodeMirror(firepadRef, codeMirror,
    { richTextToolbar: true, richTextShortcuts: true, userId: userId});

//// Create FirepadUserList (with our desired userId).
// var firepadUserList = FirepadUserList.fromDiv(firepadRef.child('users'),
//     document.getElementById('userlist'), userId);

  //// Initialize contents.
  firepad.on("ready", function () {
    if (firepad.isHistoryEmpty()) {
      firepad.setHtml(
        '<span style="font-size: 24px; color: red">Welcome!</span>'
      );
    }
  });

  // An example of a complex custom entity.
  firepad.registerEntity("checkbox", {
    render: function (info, entityHandler) {
      var inputElement = document.createElement("input");
      inputElement.setAttribute("type", "checkbox");
      if (info.checked) {
        inputElement.checked = "checked";
      }
      inputElement.addEventListener("click", function () {
        entityHandler.replace({ checked: this.checked });
      });
      return inputElement;
    }.bind(this),
    fromElement: function (element) {
      var info = {};
      if (element.hasAttribute("checked")) {
        info.checked = true;
      }
      return info;
    },
    update: function (info, element) {
      if (info.checked) {
        element.checked = "checked";
      } else {
        element.checked = null;
      }
    },
    export: function (info) {
      var inputElement = document.createElement("checkbox");
      if (info.checked) {
        inputElement.setAttribute("checked", true);
      }
      return inputElement;
    },
  });
}

async function loadNoteData(noteID) {
    let ref = firebase.database().ref(`notes/${noteID}`);
    const data = (await ref.get()).val();
    if(!data){
        console.log("creat");
        addChlidDB(database, `notes/${noteID}`, "name", "Untitled");
    }
    else{
        console.log("load");
    }
    if (typeof console !== 'undefined') {
      console.log('Firebase data: ', ref.toString());
    }
    return ref;
}

// -------------------- UI UPDATE -----------------------------
const noteCreatorCnt = document.querySelector(".normal_notes[data-creator='true']");
const noteSharedCnt = document.querySelector(".normal_notes[data-creator='false']");

function loadClickedNote(){
  const activeCard = document.querySelector("active-note");
  activeCard ? activeCard.classList.remove("active-note") : "";
  this.classList.add("active-note");
  initializeNotesUtil(this.dataset.id);
  console.log(this.dataset.id);
}

async function addNoteToContainer(data){
  console.log(data.key, data.val());
  const value = data.val();
  const title = (await readDB(database, `notes/${data.key}/name`)).val();
  if(value === true){
    noteCreatorCnt.appendChild(noteCardTemplate(data.key, title));
  }
  else{
    noteSharedCnt.appendChild(noteCardTemplate(data.key, title));
  }
  const noteCard = document.querySelector(`.note_card[data-id="${data.key}"]`);
  noteCard.addEventListener("click", loadClickedNote);
}

// -------------------- db listener ---------------------------

function DBListener(){
    setDBListener(database, `friends/${user.uid}/notes`, "child_added", addNoteToContainer);
}

// ---------------------- handle url ---------------------------------
auth.onAuthStateChanged(async (currentUser) => {
  if (currentUser) {
      user = currentUser;
      DBListener();
      const urlParams = new URLSearchParams(window.location.search);
      const noteID = getParameterByName(urlParams, "nid");
      if(!noteID) return;
      addChlidDB(database, `friends/${uid}/notes`, noteID, true);
      initializeNotesUtil(noteID);
  }
});