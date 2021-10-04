import {
  pushKey,
  addChlidDB,
  storageDownloadURL,
  storageRef,
  storageUpload,
  updateDB,
} from "../modules/firebase.js";

const toggleUploadBtn = document.querySelector(".group__img--file");
const uploadCnt = document.querySelector(".group .upload");
const chatWrapper = document.querySelector(".group__chat-wrapper");
const fileUpload = document.querySelectorAll(".group .upload__input");
const filePreview = document.querySelector(".group .upload__preview");
const fileDragnDrop = document.querySelector(".group .upload__dragndrop");
const fileUploadClick = document.querySelectorAll(
  ".group .upload__click--each"
);
const sendBtn = document.querySelector(".group__img--send");
const inputChat = document.querySelector(".group__input--chat");
let chatWindowHeader = document.querySelector(".group__chat-header");
let chatContainer;

let fileToUpload = [];

// provide initial preview
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

function triggerPreviewOnUpload(e) {
  filePreview.innerHTML = "";
  fileToUpload = [];
  let files = e.target.files;

  if (files.length > 5) {
    document.querySelector(".group .upload__info--no").style.color = "red";
    setTimeout(() => {
      document.querySelector(".group .upload__info--no").style.color = "unset";
    }, 1000);
    return;
  }
  for (const file of files) {
    let size = file.size / (1024 * 1024).toFixed(2);
    if (size > 10) {
      document.querySelector(".group .upload__info--size").style.color = "red";
      setTimeout(() => {
        document.querySelector(".group .upload__info--size").style.color =
          "unset";
      }, 1000);
      return;
    }
  }
  fileDragnDrop.classList.add("none");
  filePreview.classList.remove("none");
  this.dataset.type === "image" ? imagePreview(files) : docsPreview(files);
}

fileUpload.forEach((fileUpload) => {
  fileUpload.addEventListener("change", triggerPreviewOnUpload);
});

fileUploadClick.forEach((upload) => {
  upload.addEventListener("click", function (e) {
    fileUpload[+this.dataset.value].click();
  });
});

toggleUploadBtn.addEventListener("click", function (e) {
  if (this.dataset.mode === "disabled") return;
  chatContainer = document.querySelector(
    `.group__chat-container[data-group-id="${chatWindowHeader.dataset.groupId}"]`
  );
  clearUploadWindow();
  toggleUploadWindow();
});

function clearUploadWindow() {
  filePreview.innerHTML = "";
  fileToUpload = [];
  fileUpload.forEach((toUpload) => {
    toUpload.value = "";
  });
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

// create sending preview
function createImagePreview(key, src, size) {
  chatContainer.innerHTML += `
                <div class="group__message-container group__message-container--right" data-type="image" data-id="${key}">
                  <div class="group__message--image-cnt">
                    <div class="group__message--data">
                      <img src="./assets/icons/home/play.svg" class="group__message--controls"  alt="">  
                      <div class="group__message--progress">
                        <svg>
                          <circle cx="60" cy="60" r="60"></circle>
                        </svg>
                      </div>
                      <img src="./assets/icons/home/msg-clear.svg" alt="cancel" class="group__message--cancel">
                    </div>
                    <a class="group__message--link" href="" download target="_blank"><img src="${src}" alt="" class="group__message--image"></a>
                    <span class="group__message--downloaded">0/${size} MB</span>
                  </div>
                  <span class="group__time-stamp group__time-stamp--left"></span>
                </div>`;
  autoScroll();
}

function createFilePreview(key, name, size) {
  chatContainer.innerHTML += `
                <div class="group__message-container group__message-container--right" data-type="file" data-id="${key}">
                  <div class="group__message--file-cnt">
                    <div class="group__message--file-download">
                      <img class="group__message--file-controls" src="./assets/icons/home/play.svg" alt="">  
                      <div class="group__message--progress">
                        <svg>
                          <circle cx="40" cy="40" r="40"></circle>
                        </svg>
                      </div>
                      <a class="group__message--link" href="" target="_blank" download=""><img class="group__message--download-ic none" src="./assets/icons/home/download.svg" alt=""></a>
                    </div>
                    <div class="group__message--file-detail">
                      <img src="./assets/icons/home/msg-clear.svg" alt="cancel" class="group__message--file-cancel">
                      <h3 class="group__message--file-name">${name}</h3>
                      <span class="group__message--downloaded">0/${size} MB</span>
                    </div>
                  </div>
                  <span class="group__time-stamp group__time-stamp--left"></span>
              </div>`;
  autoScroll();
}

// update upon the successful upload.
function updateImagePreview(cnt, link, ts) {
  let sender = document.querySelector(
    `.group__participant-card[data-id=${auth.currentUser.uid}]`
  ).textContent;
  const imgLink = cnt.querySelector(".group__message--image");
  const aLink = cnt.querySelector(".group__message--link");
  const size = cnt.querySelector(".group__message--downloaded");
  const timeHTML = cnt.querySelector(".group__time-stamp");
  let datePart = new Date(ts).toDateString();
  let timePart = new Date(ts).toTimeString().split(" ")[0];
  let timeStamp = sender + " " + datePart + " " + timePart;

  timeHTML.textContent = timeStamp;
  size.innerText = size.innerText.split("/")[1].trim();

  imgLink.src = link;
  aLink.href = link;

  const fromRemove = cnt.querySelector(".group__message--image-cnt");
  const toRemove = fromRemove.querySelector(".group__message--data");
  fromRemove.removeChild(toRemove);
}

function updateFilePreview(cnt, link, ts) {
  let sender = document.querySelector(
    `.group__participant-card[data-id=${auth.currentUser.uid}]`
  ).textContent;
  const imgLink = cnt.querySelector(".group__message--download-ic");
  const aLink = cnt.querySelector(".group__message--link");
  const name = cnt.querySelector(".group__message--file-name");
  const size = cnt.querySelector(".group__message--downloaded");
  const timeHTML = cnt.querySelector(".group__time-stamp");
  let datePart = new Date(ts).toDateString();
  let timePart = new Date(ts).toTimeString().split(" ")[0];
  let timeStamp = sender + " " + datePart + " " + timePart;

  timeHTML.textContent = timeStamp;
  size.innerText = size.innerText.split("/")[1].trim();
  imgLink.classList.remove("none");
  aLink.href = link;
  aLink.download = name.innerText;

  let fromRemove = cnt.querySelector(".group__message--file-download");
  let toRemove = cnt.querySelector(".group__message--file-controls");
  fromRemove.removeChild(toRemove);
  toRemove = cnt.querySelector(".group__message--progress");
  fromRemove.removeChild(toRemove);
  fromRemove = cnt.querySelector(".group__message--file-detail");
  toRemove = cnt.querySelector(".group__message--file-cancel");
  fromRemove.removeChild(toRemove);
}

// Start uploading send button functionality
let imageTaskArray, fileTaskArray, fileCount;
const storage = firebase.storage();
const database = firebase.database();
const auth = firebase.auth();
sendBtn.addEventListener("click", async (e) => {
  if (fileToUpload.length === 0 || uploadCnt.classList.contains("none")) return;
  toggleUploadBtn.dataset.mode = "disabled";
  fileCount = fileToUpload.length;
  imageTaskArray = [];
  fileTaskArray = [];
  toggleUploadWindow();

  // itereate over files
  fileToUpload.forEach((file) => {
    const size = (file.size / (1024 * 1024)).toFixed(2);
    const ref = storageRef(
      storage,
      `groups/${chatWindowHeader.dataset.groupId}`,
      `${file.name}`
    );
    const key = pushKey(
      database,
      `groups/${chatWindowHeader.dataset.groupId}`,
      `${auth.currentUser.uid}`
    );
    const metadata = {
      name: file.name,
      size,
    };
    let val = storageUpload(ref, file, metadata);
    file.type.match(/image\//i)
      ? (createImagePreview(key, URL.createObjectURL(file), size),
        imageTaskArray.push(val))
      : (createFilePreview(key, file.name, size), fileTaskArray.push(val));
    task(val, key, chatWindowHeader.dataset.groupId, metadata);
  });
  provideImageFuntionality(imageTaskArray);
  provideFileFunctionality(fileTaskArray);
  clearUploadWindow();
});

// fucntion for pause play cancel upload
function provideImageFuntionality(taskArray) {
  if (taskArray.length === 0) return;
  const pausePlayElem = document.querySelectorAll(
    `.group__message-container .group__message--controls`
  );

  pausePlayElem.forEach((pausePlay, idx) => {
    pausePlay.addEventListener("click", (e) => {
      e.target.src.includes("play")
        ? ((e.target.src = "./assets/icons/home/pause.svg"),
          taskArray[idx].pause())
        : ((e.target.src = "./assets/icons/home/play.svg"),
          taskArray[idx].resume());
    });
  });

  const cancelElem = document.querySelectorAll(
    `.group__message-container .group__message--cancel`
  );
  cancelElem.forEach((cancelIc, idx) => {
    cancelIc.addEventListener("click", (e) => {
      taskArray[idx].cancel();
    });
  });
}

function provideFileFunctionality(taskArray) {
  if (taskArray.length === 0) return;
  const pausePlayElem = document.querySelectorAll(
    `.group__message-container .group__message--file-controls`
  );
  pausePlayElem.forEach((pausePlay, idx) => {
    pausePlay.addEventListener("click", (e) => {
      e.target.src.includes("play")
        ? ((e.target.src = "./assets/icons/home/pause.svg"),
          taskArray[idx].pause())
        : ((e.target.src = "./assets/icons/home/play.svg"),
          taskArray[idx].resume());
    });
  });

  const cancelElem = document.querySelectorAll(
    `.group__message-container .group__message--file-cancel`
  );
  cancelElem.forEach((cancelIc, idx) => {
    cancelIc.addEventListener("click", (e) => {
      taskArray[idx].cancel();
    });
  });
}

// function to handle upload tasks
function task(uploadTask, key, groupId, metadata) {
  uploadTask.on(
    "state_changed",
    (snapshot) => {
      let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      let byteTransfer = (snapshot.bytesTransferred / (1024 * 1024)).toFixed(2);
      let byteTotal = (snapshot.totalBytes / (1024 * 1024)).toFixed(2);

      //update meta-data
      const cnt = document.querySelector(
        `.group__message-container[data-id="${key}"]`
      );
      const progressBar = cnt.querySelector(
        `.group__message--progress svg circle`
      );
      const size = cnt.querySelector(".group__message--downloaded");
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

      switch (snapshot.state) {
        case firebase.storage.TaskState.PAUSED: // or 'paused'
          break;
        case firebase.storage.TaskState.RUNNING: // or 'running'
          break;
      }
    },
    (error) => {
      // Handle unsuccessful uploads
      const toRemove = document.querySelector(
        `.group__message-container[data-id="${key}"]`
      );
      chatContainer.removeChild(toRemove);
      fileCount === 1
        ? (toggleUploadBtn.dataset.mode = "enabled")
        : fileCount--;
    },
    async () => {
      const downloadURL = await storageDownloadURL(uploadTask.snapshot.ref);
      const cnt = document.querySelector(
        `.group__message-container[data-id="${key}"]`
      );
      let user = auth.currentUser;

      let message = {};
      let messageKey = key;
      message["sender"] = user.uid;
      message[cnt.dataset.type] = downloadURL;
      message["metadata"] = metadata;
      message["time"] = new Date().toISOString();
      cnt.dataset.type === "image"
        ? updateImagePreview(cnt, downloadURL, message.time)
        : updateFilePreview(cnt, downloadURL, message.time);

      addChlidDB(database, `groups/${groupId}/messages`, messageKey, message);

      fileCount === 1
        ? (toggleUploadBtn.dataset.mode = "enabled")
        : fileCount--;
    }
  );
}
