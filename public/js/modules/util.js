export function checkUserPresent(friendlist, friendsUID, uid){
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
    if (list === uid){
      bool = true;
    }
  });
  return bool;
}