import { chatSearchResult } from "../modules/search_index.js";

const chatWrapper = document.querySelector(".chat__chat-wrapper");
const startSearch = document.querySelector(".search_result-ic");
const search_input = document.querySelector(".search_message--input");
const search_ic =document.querySelectorAll(".search_result-move-ic");
const chatWindowMessageInput = document.querySelector(".chat__input--chat");
const currentCount = document.querySelector(".current_count");
const totalCount = document.querySelector(".total_count");

// data to store
let resultData = {};
let resultMessage = [];
let count, max;

search_input.addEventListener("click", (e) => {
    if(search_input.dataset.toclear === "true"){
        search_input.value = '';
    }
});

startSearch.addEventListener("click", async function (e){
    clearHighlightedChat();
    if(search_input.value === ''){
        return;
    }
    toggleLoadingAnimation(1);
    let chatHash = chatWindowMessageInput.dataset.chatHash;
    resultData = await chatSearchResult(search_input.value, chatHash);
    count = 0;
    highlightChat();
});

search_ic.forEach(ic => {
    ic.addEventListener("click", function(e){
        console.log(this.dataset.value, count, max);
        if(this.dataset.value === "prev" && count !== 0){
            selectChat(count, --count);
            console.log(resultMessage[count]);
        }
        else if(this.dataset.value === "next" && count !== max-1){
            selectChat(count, ++count);
            console.log(resultMessage[count])
        }
        chatWrapper.scrollTop = (resultMessage[count].offsetTop - 150);
    });
});

function toggleLoadingAnimation(bool){
    if(bool){
        startSearch.src = "./assets/icons/home/pending.svg";
        startSearch.classList.add("add-loading-animation-normal");
    }
    else{
        startSearch.src = "./assets/icons/home/search.svg";
        startSearch.classList.remove("add-loading-animation-normal");
    }
}

function updateResultCount(){
    currentCount.innerText = "1";
    totalCount.innerHTML = `&nbsp;/&nbsp;${max}`;
}

function highlightChat(){
    resultData.hits.forEach(hit => {
        console.log(hit.document['chat_hash']);
        const message = document.querySelector(`.chat__message-container[data-message-id="${hit.document['message_id']}"`);
        if(!message) return;
        const matchedText = hit.highlights[0].snippet;
        const messageText = message.querySelector(".chat__message");
        messageText.innerHTML = matchedText;
        resultMessage.push(message);
        console.log(message);
    });
    if(resultMessage.length === 0){
        search_input.value = "Sorry no Result!";
        search_input.dataset.toclear = "true";
        toggleLoadingAnimation(0);
        return;
    }
    max = resultMessage.length;
    updateResultCount();
    resultMessage[0].firstChild.querySelector("span").classList.add("green");
    chatWrapper.scrollTop = (resultMessage[0].offsetTop - 150);
    toggleLoadingAnimation(0);
}

function selectChat(prev, curr){
    resultMessage[prev].firstChild.querySelector("span").classList.remove("green");
    resultMessage[curr].firstChild.querySelector("span").classList.add("green");
    console.log(resultMessage[curr].offsetTop);
    currentCount.innerText = `${curr+1}`;
}

function clearHighlightedChat(){
    if(resultMessage.length === 0) return;
    console.log("ehl")
    resultMessage[count].firstChild.querySelector("span").classList.remove("green");
    resultMessage.forEach(message => {
        const textElement = message.firstChild;
        textElement.innerText = textElement.innerText.replace(`<span class="yellow">`, "");
        textElement.innerText = textElement.innerText.replace(`</span>`, "");
    });
    resultData = {};
    resultMessage = [];
}