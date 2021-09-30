export function checkUserPresent(friendlist, friendsUID, uid) {
  if (friendlist) {
    if ("received" in friendlist) {
      for (let id in friendlist.received) {
        if (id === uid) return true;
      }
    }
    if ("sent" in friendlist) {
      for (let id in friendlist.sent) {
        if (id === uid) return true;
      }
    }
  }
  let bool = false;
  friendsUID.forEach((list) => {
    if (list === uid) {
      bool = true;
    }
  });
  return bool;
}

export function pushFront(friendContainer) {
  const parent = friendContainer.parentElement;
  const first = parent.firstChild;
  parent.insertBefore(friendContainer, first);
}

export function updateLocalStorage(key, value) {
  window.localStorage.setItem(key, value);
}

export function getLocalStorage(key) {
  return window.localStorage.getItem(key);
}

export function displayTime(element) {
  let date = new Date();
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();
  let currentTime =
    (hours < 10 ? "0" + hours : hours) +
    ":" +
    (minutes < 10 ? "0" + minutes : minutes) +
    ":" +
    (seconds < 10 ? "0" + seconds : seconds);
  element.innerHTML = currentTime;
  setTimeout(() => {
    displayTime(element);
  }, 1000);
}

export function setGreeting(element) {
  let dateObject = new Date();
  let time = dateObject.getHours();
  if (time < 12) {
    element.textContent = "Good morning! ";
  }
  if (time > 12 && time <= 16) {
    element.textContent = "Good afternoon! ";
  }
  if (time > 16 && time <= 20) {
    element.textContent = "Good Evening! ";
  }
  if (time > 20) {
    element.textContent = "Good Night! ";
  }
  if (time == 12) {
    element.textContent = "Go Eat Lunch! ";
  }
}

export function pushState(pathName){
  window.history.pushState(pathName, null, `/${pathName}`);
}

export function checkAndChangeAngularBrackets(value){
  value = value.replace(/</g, "&lt;");
  value = value.replace(/>/g, "&gt;");
  return value;
}

export function getParameterByName(urlParams, name) {
  return urlParams.get(name);
}