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
                <div class="main__message-container main__message-container--right" data-type="image" data-id="${key}">
                  <div class="main__message--image-cnt">
                    <div class="main__message--data">
                      <img src="./assets/icons/home/play.svg" class="main__message--controls"  alt="">  
                      <div class="main__message--progress">
                        <svg>
                          <circle cx="60" cy="60" r="60"></circle>
                        </svg>
                      </div>
                    </div>
                    <a href="" download="test.jpeg"><img src="${src}" alt="" class="main__message--image"></a>
                    <span class="main__message--downloaded">0/${size} MB</span>
                  </div>
                  <span class="main__time-stamp main__time-stamp--left">23/20/23, 9:30pm</span>
                </div>`;
}

function createFilePrevieew(key, name, size){
  chatContainer.innerHTML += `
                <div class="main__message-container main__message-container--right" data-type="file" data-id="${key}">
                  <div class="main__message--file-cnt">
                    <div class="main__message--file-download">
                      <img class="main__message--file-controls" src="./assets/icons/home/play.svg" class="main__message--controls"  alt="">  
                      <div class="main__message--progress">
                        <svg>
                          <circle cx="40" cy="40" r="40"></circle>
                        </svg>
                      </div>
                      <a href="" download="name.txt" none><img class="none" src="./assets/icons/home/download.svg" alt=""></a>
                    </div>
                    <div class="main__message--file-detail">
                      <h3 class="main__message--file-name">${name}</h3>
                      <span class="main__message--downloaded">0/${size} MB</span>
                    </div>
                  </div>
                  <span class="main__time-stamp main__time-stamp--left">23/20/23, 9:30pm</span>
              </div>`;
}

// function removeImageControls

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
    
    (file.type.match(/image\//i)) ? createImagePreview(key, URL.createObjectURL(file), size) : createFilePrevieew(key, file.name, size);

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
    
    //update meta-data
    const cnt = document.querySelector(`.main__message-container[data-id="${key}"]`);
    const progressBar = cnt.querySelector(`.main__message--progress svg circle`);
    const size = cnt.querySelector(".main__message--downloaded");
    console.log(cnt, progressBar, size);
    progressBar.style.strokeDashoffset = cnt.dataset.type === "file" ? (380 - (380 * progress) / 100) : (260 - (260 * progress) / 100) ;
    size.innerText = `${byteTransfer} / ${byteTotal}MB`; 
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
    const cnt = document.querySelector(`.main__message-container[data-id="${key}"]`);

    // const img = document.querySelector(`.local-cnt[data-id="${key}"] .main__message--image`);
    // const imgLink = document.querySelector(`.local-cnt[data-id="${key}"] .main__message--link`);
    // img.src = downloadURL;
    // imgLink.href = downloadURL;
    // const cnt = document.querySelector(`.local-data-cnt[data-id="${key}"]`);
    // const toRemove = document.querySelector(`.local-data-cnt[data-id="${key}"] .local-remove`);
    // console.log(cnt, toRemove);
    // cnt.removeChild(toRemove); 
  }
);
}