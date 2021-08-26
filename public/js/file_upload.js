const toggleUploadBtn = document.querySelector(".main__img--file");
const uploadCnt = document.querySelector(".upload");
const info = document.querySelector(".main__chat-info");
const fileUpload = document.querySelectorAll(".upload__input");
const filePreview = document.querySelector(".upload__preview");
const fileDragnDrop = document.querySelector(".upload__dragndrop");
const fileUploadClick = document.querySelectorAll(".upload__click--each");

function returnFormat(txt) {
  return txt.match(/\.(.*)/i);
}

function imagePreview(files) {
  let html = "";
  for (const file of files) {
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
    console.log(e.target.dataset.type);
    let files = e.target.files;
    console.log("hello", e.target.files);
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
    console.log(this);
    fileUpload[+this.dataset.value].click();
  });
});

toggleUploadBtn.addEventListener("click", (e)=>{
    info.classList.toggle("none");
    uploadCnt.classList.toggle("none");
});