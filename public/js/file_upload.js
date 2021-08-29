import { pushKey, storageDelete, storageDownloadURL, storageList, storageRef, storageUpload } from "./modules/firebase.js";

const toggleUploadBtn = document.querySelector(".main__img--file");
const uploadCnt = document.querySelector(".upload");
const chat = document.querySelector(".main__chat-container");
const fileUpload = document.querySelectorAll(".upload__input");
const filePreview = document.querySelector(".upload__preview");
const fileDragnDrop = document.querySelector(".upload__dragndrop");
const fileUploadClick = document.querySelectorAll(".upload__click--each");
const sendBtn = document.querySelector(".main__img--send");
const inputChat = document.querySelector(".main__input--chat");
const chatContainer = document.querySelector(".main__chat-container");


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
      if (size > 5) {
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

toggleUploadBtn.addEventListener("click", toggleUploadWindow);

function toggleUploadWindow(){
  chat.classList.toggle("none");
  uploadCnt.classList.toggle("none");
  inputChat.value = "";
  inputChat.disabled = !inputChat.disabled;
}

function createImagePreview(key, src, size){
  chatContainer.innerHTML += `
  <div class="main__message-container main__message-container--right local-cnt" data-id="${key}">
    <div class="main__message--image-cnt local-data-cnt" data-id="${key}">
      <div class="main__message--data local-remove">
        <img src="./assets/icons/home/pause.svg" class="main__message--controls"  alt="">  
        <div class="main__message--progress local-progress"></div>
        <span class="main__message--downloaded local-size">${size}MB</span>
      </div>
      <a href="" class="main__message--link" download><img src="${src}" alt="preview" class="main__message--image"></a>
    </div>
    <span class="main__time-stamp main__time-stamp--left">23/20/23, 9:30pm</span>
  </div>
  `;
}

function createFilePrevieew(key, name, size){
  chatContainer.innerHTML += `
                <div class="main__message-container main__message-container--right local-cnt" data-id=${key}>
                  <div class="main__message--file-cnt local-">
                    <div class="main__message--file-data local-remove">
                      <img src="./assets/icons/home/play.svg" class="main__message-file--controls"  alt="">  
                      <div class="main__message-file--meta-status">
                        <div class="main__message--name">Name.tst</div>
                        <div class="main__message--progress"></div>
                        <span class="main__message--downloaded">3 / 10 MB</span>
                      </div>
                    </div>
                    <div class="main__message--file-download none">
                      <a href="" download="name.txt"><img src="./assets/icons/home/download.svg" alt=""></a>
                    </div>
                    <div class="main__message--file-detail none">
                      <h3 class="main__message--file-name">Name.txt</h3>
                      <span class="main__message--file-size">5.5MB</span>
                    </div>
                  </div>
                  <span class="main__time-stamp main__time-stamp--left">23/20/23, 9:30pm</span>
                </div>`
}

const storage = firebase.storage();
const database = firebase.database();
sendBtn.addEventListener("click", async (e) => {
  if(uploadCnt.classList.contains("none")) return;
  toggleUploadWindow();
  fileToUpload.forEach(file => {
    const size = (file.size/(1024*1024)).toFixed(2);
    const ref = storageRef(storage, `chat/chat1`, `${file.name}`);
    const key = pushKey(database, `chat/chat1`,`${inputChat.dataset.chatHash}`);
    console.log(key);
    
    createImagePreview(key, URL.createObjectURL(file), size);

    const metadata = {
      name: file.name,
      size 
    };
    let val = storageUpload(ref, file, metadata);
    console.log(ref);
    task(val, key);
  });
});

function task(uploadTask, key){
  uploadTask.on('state_changed', 
  (snapshot) => {
    var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    let byteTransfer = (snapshot.bytesTransferred/(1024 * 1024)).toFixed(2);
    let byteTotal = (snapshot.totalBytes/(1024 * 1024)).toFixed(2);
    document.querySelector(`.local-cnt[data-id="${key}"] .local-progress`).style.width = `${progress}%`; 
    document.querySelector(`.local-cnt[data-id="${key}"] .local-size`).innerText = `${byteTransfer} / ${byteTotal}MB`; 
    console.log('Upload is ' + progress + '% done');
    switch (snapshot.state) {
      case firebase.storage.TaskState.PAUSED: // or 'paused'
        console.log('Upload is paused');
        break;
      case firebase.storage.TaskState.RUNNING: // or 'running'
        console.log('Upload is running');
        break;
    }
  }, 
  (error) => {
    // Handle unsuccessful uploads
  }, 
  async () => {
    const downloadURL = await storageDownloadURL(uploadTask.snapshot.ref);
    const img = document.querySelector(`.local-cnt[data-id="${key}"] .main__message--image`);
    const imgLink = document.querySelector(`.local-cnt[data-id="${key}"] .main__message--link`);
    img.src = downloadURL;
    imgLink.href = downloadURL;
    const cnt = document.querySelector(`.local-data-cnt[data-id="${key}"]`);
    const toRemove = document.querySelector(`.local-data-cnt[data-id="${key}"] .local-remove`);
    console.log(cnt, toRemove);
    cnt.removeChild(toRemove); 
  }
);
}