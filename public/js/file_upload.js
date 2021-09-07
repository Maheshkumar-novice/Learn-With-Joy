import {
  pushKey,
  addChlidDB,
  storageDelete,
  storageDownloadURL,
  storageList,
  storageRef,
  storageUpload,
} from "./modules/firebase.js";

const toggleUploadBtn = document.querySelector(".chat__img--file");
const uploadCnt = document.querySelector(".upload");
const chatWrapper = document.querySelector(".chat__chat-wrapper");
const fileUpload = document.querySelectorAll(".upload__input");
const filePreview = document.querySelector(".upload__preview");
const fileDragnDrop = document.querySelector(".upload__dragndrop");
const fileUploadClick = document.querySelectorAll(".upload__click--each");
const sendBtn = document.querySelector(".chat__img--send");
const inputChat = document.querySelector(".chat__input--chat");
// const chatContainer = document.querySelector(".chat__chat-container");
let chatContainer;

let fileToUpload = [];

function returnFormat(txt) {
  return txt.match(/\.(.*)/i);
}

function imagePreview(files) {
  let html = "";
  for (const file of files) {
    fileToUpload.push(file);
    html += `<div class="upload__preview--imginfo">
                        <img src=${URL.createObjectURL(
                          file
                        )} alt="preview" class="upload__preview-img">
                        <span class="upload__preview--name">${file.name}</span>
                    </div>`;
  }
  filePreview.innerHTML = html;
}

function docsPreview(files) {
  let html = "";
  let src = "";
  for (const file of files) {
    fileToUpload.push(file);
    let icon = returnFormat(file.name)[1];
    if (icon === "ppt" || icon === "pptx") {
      src = "./assets/icons/home/file-powerpoint.svg";
    } else if (icon === "doc" || icon === "docx") {
      src = "./assets/icons/home/file-word.svg";
    } else if (icon === "xl" || icon === "xlsx") {
      src = "./assets/icons/home/file-excel.svg";
    } else if (icon === "pdf") {
      src = "./assets/icons/home/file-pdf.svg";
    } else {
      src = "./assets/icons/home/file-text.svg";
    }
    html += `<div class="upload__preview--docsinfo">
                        <img src=${src} alt="preview" class="upload__preview-img">
                        <span class="upload__preview--name">${file.name}</span>
                    </div>`;
  }
  filePreview.innerHTML = html;
}

fileUpload.forEach((fileUpload) => {
  fileUpload.addEventListener("change", function (e) {
    filePreview.innerHTML = "";
    fileToUpload = [];
    console.log(e.target.dataset.type);
    let files = e.target.files;

    if (files.length > 5) {
      document.querySelector(".upload__info--no").style.color = "red";
      setTimeout(() => {
        document.querySelector(".upload__info--no").style.color = "unset";
      }, 1000);
      return;
    }
    for (const file of files) {
      let size = file.size / (1024 * 1024).toFixed(2);
      if (size > 10) {
        document.querySelector(".upload__info--size").style.color = "red";
        setTimeout(() => {
          document.querySelector(".upload__info--size").style.color = "unset";
        }, 1000);
        return;
      }
    }
    fileDragnDrop.classList.add("none");
    filePreview.classList.remove("none");
    this.dataset.type === "image" ? imagePreview(files) : docsPreview(files);
  });
});

fileUploadClick.forEach((upload) => {
  upload.addEventListener("click", function (e) {
    fileUpload[+this.dataset.value].click();
  });
});

toggleUploadBtn.addEventListener("click", ()=>{
  chatContainer = document.querySelector(`.chat__chat-container[data-hash="${inputChat.dataset.chatHash}"]`)
  clearUploadWindow();
  toggleUploadWindow();
});

function clearUploadWindow(){
  filePreview.innerHTML = "";
  fileToUpload = [];
}

function toggleUploadWindow() {
  chatWrapper.classList.toggle("none");
  uploadCnt.classList.toggle("none");
  inputChat.value = "";
  inputChat.disabled = !inputChat.disabled;
  fileDragnDrop.classList.remove("none");
  filePreview.classList.add("none");
}

function autoScroll() {
  chatWrapper.scrollTop = chatWrapper.scrollHeight;
}


function createImagePreview(key, src, size, upTask) {
  chatContainer.innerHTML += `
                <div class="chat__message-container chat__message-container--right" data-type="image" data-id="${key}">
                  <div class="chat__message--image-cnt">
                    <div class="chat__message--data">
                      <img src="./assets/icons/home/play.svg" class="chat__message--controls"  alt="">  
                      <div class="chat__message--progress">
                        <svg>
                          <circle cx="60" cy="60" r="60"></circle>
                        </svg>
                      </div>
                      <img src="./assets/icons/home/msg-clear.svg" alt="cancel" class="chat__message--cancel">
                    </div>
                    <a class="chat__message--link" href="" download target="_blank"><img src="${src}" alt="" class="chat__message--image"></a>
                    <span class="chat__message--downloaded">0/${size} MB</span>
                  </div>
                  <span class="chat__time-stamp chat__time-stamp--left"></span>
                </div>`;
  autoScroll();
  const pausePlay = document.querySelector(
    `.chat__message-container[data-id="${key}"] .chat__message--controls`
  );
  const cancel = document.querySelector(`.chat__message-container[data-id="${key}"] .chat__message--cancel`);
  pausePlay.addEventListener("click", (e) => {
    console.log(e.target);
    e.target.src.includes("play")
      ? ((e.target.src = "./assets/icons/home/pause.svg"), upTask.pause())
      : ((e.target.src = "./assets/icons/home/play.svg"), upTask.resume());
  });
  cancel.addEventListener("click", (e) => {
    upTask.cancel();
  });
}

function createFilePrevieew(key, name, size, upTask) {
  chatContainer.innerHTML += `
                <div class="chat__message-container chat__message-container--right" data-type="file" data-id="${key}">
                  <div class="chat__message--file-cnt">
                    <div class="chat__message--file-download">
                      <img class="chat__message--file-controls" src="./assets/icons/home/play.svg" alt="">  
                      <div class="chat__message--progress">
                        <svg>
                          <circle cx="40" cy="40" r="40"></circle>
                        </svg>
                      </div>
                      <a class="chat__message--link" href="" download="name.txt" none><img class="chat__message--download-ic none" src="./assets/icons/home/download.svg" alt=""></a>
                    </div>
                    <div class="chat__message--file-detail">
                      <img src="./assets/icons/home/msg-clear.svg" alt="cancel" class="chat__message--cancel">
                      <h3 class="chat__message--file-name">${name}</h3>
                      <span class="chat__message--downloaded">0/${size} MB</span>
                    </div>
                  </div>
                  <span class="chat__time-stamp chat__time-stamp--left"></span>
              </div>`;
  autoScroll();
  const pausePlay = document.querySelector(`.chat__message-container[data-id="${key}"] .chat__message--file-controls`);
  const cancel = document.querySelector(`.chat__message-container[data-id="${key}"] .chat__message--cancel`);
  pausePlay.addEventListener("click", (e) => {
    console.log(e.target);
    e.target.src.includes("play")
      ? ((e.target.src = "./assets/icons/home/pause.svg"), upTask.pause())
      : ((e.target.src = "./assets/icons/home/play.svg"), upTask.resume());
  });
  cancel.addEventListener("click", (e) => {
    upTask.cancel();
  });
}

function updateImagePreview(cnt, link, ts) {
  const imgLink = cnt.querySelector(".chat__message--image");
  const aLink = cnt.querySelector(".chat__message--link");
  const size = cnt.querySelector(".chat__message--downloaded");
  const timeHTML = cnt.querySelector(".chat__time-stamp");
  let datePart = new Date(ts).toDateString();
  let timePart = new Date(ts).toTimeString().split(" ")[0];
  let timeStamp = datePart + " " + timePart;

  timeHTML.innerText = timeStamp;
  size.innerText = size.innerText.split("/")[1].trim();

  imgLink.src = link;
  aLink.href = link;

  const fromRemove = cnt.querySelector(".chat__message--image-cnt");
  const toRemove = fromRemove.querySelector(".chat__message--data");
  fromRemove.removeChild(toRemove);
}

function updateFilePreview(cnt, link, ts) {
  const imgLink = cnt.querySelector(".chat__message--download-ic");
  const aLink = cnt.querySelector(".chat__message--link");
  const name = cnt.querySelector(".chat__message--file-name");
  const size = cnt.querySelector(".chat__message--downloaded");
  const timeHTML = cnt.querySelector(".chat__time-stamp");
  let datePart = new Date(ts).toDateString();
  let timePart = new Date(ts).toTimeString().split(" ")[0];
  let timeStamp = datePart + " " + timePart;

  timeHTML.innerText = timeStamp;
  size.innerText = size.innerText.split("/")[1].trim();
  imgLink.classList.remove("none");
  aLink.href = link;
  aLink.download = name.innerText;

  let fromRemove = cnt.querySelector(".chat__message--file-download");
  let toRemove = cnt.querySelector(".chat__message--file-controls");
  fromRemove.removeChild(toRemove);
  toRemove = cnt.querySelector(".chat__message--progress");
  fromRemove.removeChild(toRemove);
  fromRemove = cnt.querySelector(".chat__message--file-detail");
  toRemove = cnt.querySelector(".chat__message--cancel");
  fromRemove.removeChild(toRemove);
}

const storage = firebase.storage();
const database = firebase.database();
const auth = firebase.auth();
sendBtn.addEventListener("click", async (e) => {
  if (uploadCnt.classList.contains("none")) return;
  toggleUploadWindow();
  fileToUpload.forEach((file) => {
    const size = (file.size / (1024 * 1024)).toFixed(2);
    const ref = storageRef(storage, `chat/${inputChat.dataset.chatHash}`, `${file.name}`);
    const key = pushKey(
      database,
      `chat/${inputChat.dataset.chatHash}`,
      `${auth.currentUser.uid}`
    );
    console.log(key);

    const metadata = {
      name: file.name,
      size,
    };
    let val = storageUpload(ref, file, metadata);
    file.type.match(/image\//i)
      ? createImagePreview(key, URL.createObjectURL(file), size, val)
      : createFilePrevieew(key, file.name, size, val);
    console.log(ref);
    task(val, key, inputChat.dataset.chatHash, metadata);
  });
  clearUploadWindow();
});

function task(uploadTask, key, chatHash, metadata) {
  uploadTask.on(
    "state_changed",
    (snapshot) => {
      var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      let byteTransfer = (snapshot.bytesTransferred / (1024 * 1024)).toFixed(2);
      let byteTotal = (snapshot.totalBytes / (1024 * 1024)).toFixed(2);

      //update meta-data
      const cnt = document.querySelector(
        `.chat__message-container[data-id="${key}"]`
      );
      const progressBar = cnt.querySelector(
        `.chat__message--progress svg circle`
      );
      const size = cnt.querySelector(".chat__message--downloaded");
      if (cnt.dataset.type === "file") {
        progressBar.style.animation =
          progress === 0 || progress === 100
            ? "uploading-file 2s linear infinite"
            : "unset";
      } else {
        progressBar.style.animation =
          progress === 0 || progress === 100
            ? "uploading-image 2s linear infinite"
            : "unset";
      }
      progressBar.style.strokeDashoffset =
        cnt.dataset.type === "image"
          ? 380 - (380 * progress) / 100
          : 260 - (260 * progress) / 100;
      size.innerText = `${byteTransfer} / ${byteTotal}MB`;
      console.log("Upload is " + progress + "% done");
      switch (snapshot.state) {
        case firebase.storage.TaskState.PAUSED: // or 'paused'
          console.log("Upload is paused");
          break;
        case firebase.storage.TaskState.RUNNING: // or 'running'
          console.log("Upload is running");
          break;
      }
    },
    (error) => {
      // Handle unsuccessful uploads
      console.log(error);
      const toRemove = document.querySelector(
        `.chat__message-container[data-id="${key}"]`
      );
      chatContainer.removeChild(toRemove);
    },
    async () => {
      const downloadURL = await storageDownloadURL(uploadTask.snapshot.ref);
      const cnt = document.querySelector(
        `.chat__message-container[data-id="${key}"]`
      );
        let message = {};

        let user = auth.currentUser;
        let messageKey = key;
        console.log("key", chatHash)
        message["sender"] = user.uid;
        message[cnt.dataset.type] = downloadURL;
        message["metadata"] = metadata;
        message["time"] = new Date().toISOString();
        cnt.dataset.type === "image"
        ? updateImagePreview(cnt, downloadURL, message.time)
        : updateFilePreview(cnt, downloadURL, message.time);
        addChlidDB(database, `chat/${chatHash}/messages`, messageKey, message);
        console.log(message);
    }
  );
}
