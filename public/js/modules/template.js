// --------------------------------  loader.html  --------------------------------------------------
export const loader = `<div class="loader-index">
<div class="lds-dual-ring"></div>
</div>`;

// --------------------------------  index.html  ----------------------------------------------------
const showPassIC = `<svg
aria-hidden="true"
focusable="false"
data-prefix="far"
data-id="0"
data-icon="eye"
class="toggle-pass show-pass"
role="img"
xmlns="http://www.w3.org/2000/svg"
viewBox="0 0 576 512"
>
<path
  fill="currentColor"
  d="M288 144a110.94 110.94 0 0 0-31.24 5 55.4 55.4 0 0 1 7.24 27 56 56 0 0 1-56 56 55.4 55.4 0 0 1-27-7.24A111.71 111.71 0 1 0 288 144zm284.52 97.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400c-98.65 0-189.09-55-237.93-144C98.91 167 189.34 112 288 112s189.09 55 237.93 144C477.1 345 386.66 400 288 400z"
></path>
</svg>`;

const hidePassIC = `<svg
aria-hidden="true"
focusable="false"
data-prefix="far"
data-id="1"
data-icon="eye-slash"
class="toggle-pass hide-pass none"
role="img"
xmlns="http://www.w3.org/2000/svg"
viewBox="0 0 640 512"
>
<path
  fill="currentColor"
  d="M634 471L36 3.51A16 16 0 0 0 13.51 6l-10 12.49A16 16 0 0 0 6 41l598 467.49a16 16 0 0 0 22.49-2.49l10-12.49A16 16 0 0 0 634 471zM296.79 146.47l134.79 105.38C429.36 191.91 380.48 144 320 144a112.26 112.26 0 0 0-23.21 2.47zm46.42 219.07L208.42 260.16C210.65 320.09 259.53 368 320 368a113 113 0 0 0 23.21-2.46zM320 112c98.65 0 189.09 55 237.93 144a285.53 285.53 0 0 1-44 60.2l37.74 29.5a333.7 333.7 0 0 0 52.9-75.11 32.35 32.35 0 0 0 0-29.19C550.29 135.59 442.93 64 320 64c-36.7 0-71.71 7-104.63 18.81l46.41 36.29c18.94-4.3 38.34-7.1 58.22-7.1zm0 288c-98.65 0-189.08-55-237.93-144a285.47 285.47 0 0 1 44.05-60.19l-37.74-29.5a333.6 333.6 0 0 0-52.89 75.1 32.35 32.35 0 0 0 0 29.19C89.72 376.41 197.08 448 320 448c36.7 0 71.71-7.05 104.63-18.81l-46.41-36.28C359.28 397.2 339.89 400 320 400z"
></path>
</svg>`;

export const loginTemplate = `<div class="input__field">
  <label for="email"> Email </label>
  <input type="email" id="email" class="form__input form__input-main" required/>
  <p class="email-error error none">Invalid e-mail given.</p>
</div>
<div class="input__field">
  <label for="password"> Password </label>
  <input type="password" id="password" class="form__input form__input-main" required/>
  ${showPassIC}
  ${hidePassIC}
  <p class="password-error error none">Minimum 8 character length.</p>
</div>
<a href="./reset_password.html?enable=false" class="reset-password">Forgot Password?</a>
<button type="submit" class="form__button">Login</button>`;

export const signupTemplate = `<div class="input__field">
  <label for="name"> User Name </label>
  <input type="name" id="name" class="form__input form__input-username" required autocomplete="off"/>
  <p class="name-error error none">Username already Taken.</p>
</div>
<div class="input__field">
  <label for="email"> Email </label>
  <input type="email" id="email" class="form__input form__input-main" required/>
  <p class="email-error error none">Invalid e-mail given.</p>
</div>
<div class="input__field">
  <label for="password"> Password </label>
  <input type="password" id="password" class="form__input form__input-main" required/>
  ${showPassIC}
  ${hidePassIC}
  <p class="password-error error none">Minimum 8 character Length.</p>
</div>
<div class="input__field">
  <label for="re-enter-password"> Re-Enter Password </label>
  <input type="password" id="re-enter-password" class="form__input" required/>
  <p class="re-password-error error none">Password does not match.</p>
</div>
<button type="submit" class="form__button">Signup</button>`;

// --------------------------------------------------- Friends.js --------------------------------------------
export function friendCardTemplate(fid, hash, chatUid){
  const wrapper = document.createElement("div");
  wrapper.classList.add("chat__friend-card");
  wrapper.dataset.id = fid;
  wrapper.dataset.hash = hash;
  wrapper.innerHTML = `<img  src="${chatUid.photo}"  alt="Friend"  class="chat__img"/>
                       <p class="chat__friend-name">${chatUid.name}</p>
                       <p class="chat__message-count none"></p>
                       <img class="chat__remove-friend-ic" src="./assets/icons/home/reject.svg" alt="remove friend">`;
  return wrapper;
}

// -------------------------------------------------------- groups.js---------------------------------------------

export function groupCardTemplate(groupHash, groupData) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("group__group-card");
  wrapper.dataset.id = groupHash;
  wrapper.innerHTML = `<img
                       src="${groupData.profileURL}"
                       alt="group name"
                       class="group__img"/>
                       <p class="group__group-name">${groupData.name}</p>
                       <p class="group__message-count none"></p>`
  return wrapper;
}

export function addParticipantsFriendsCardTemplate(fid, photoURL, name){
  const wrapper = document.createElement("div");
  wrapper.classList.add("group__add-friend-card");
  wrapper.dataset.id = fid;
  wrapper.innerHTML = `<img src="${photoURL}" alt="Friend" class="chat__img">
                       <p class="group__add-friend-name">${name}</p>
                       <img class="group__add-friend-ic" src="./assets/icons/home/accept.svg" alt="Add to group">`;
  return wrapper;
  // return `
  // <div class="group__add-friend-card" data-id=${fid}>
  //   <img src="${photoURL}" alt="Friend" class="chat__img">
  //   <p class="group__add-friend-name">${name}</p>
  //   <img class="group__add-friend-ic" src="./assets/icons/home/accept.svg" alt="Add to group">
  // </div>`
}

function checkAdminStatus(admin, isUserAdmin){
  if(admin){
    return `<img
              class="group__participant-option-ic"
              data-admin="true"
              src="./assets/icons/groups/admin.svg"
              alt="admin"
            />`
  }
  else if(isUserAdmin){
    return `<img
              class="group__participant-option-ic"
              data-admin="false"
              src="./assets/icons/home/chat-menu.svg"
              alt="option"
            />`
  }
  return "";
}
export function addParticipantCardTemplate(fid, photoURL, name, admin, isUserAdmin){
  const wrapper = document.createElement("div");
  wrapper.classList.add("group__participant-card");
  wrapper.dataset.id = fid;
  wrapper.dataset.admin = admin;
  wrapper.innerHTML =`<img
                        src="${photoURL}"
                        alt="Friend"
                        class="group__participant-img"
                      />
                      <p class="group__participant-name">${name}</p>
                      ${checkAdminStatus(admin, isUserAdmin)}`
  return wrapper;
}

// -------------------------------------------------- notes.js----------------------------------------------------

export function noteCardTemplate(noteID, title){
  const wrapper = document.createElement("div");
  wrapper.classList.add("note_card");
  wrapper.dataset.id = noteID;
  wrapper.innerHTML = `<div class="note_select"></div>
                       <h4 class="note_title">${title}</h4>
                       <img class="remove_note" src="./assets/icons/home/msg-clear.svg" alt="remove-note">`
  return wrapper;
}