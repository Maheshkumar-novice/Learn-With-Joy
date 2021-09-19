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

export function pushFront(friendContainer){
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
