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
  friendsUID.forEach((list) => {
    if (list === uid) return  true;
  });
  return false;
}