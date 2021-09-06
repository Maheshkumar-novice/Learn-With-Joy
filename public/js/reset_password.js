import {
  actionCodePasswordReset,
  firebaseConfig,
  userPasswordReset,
} from "./modules/firebase.js";

const forms = document.querySelectorAll("form");
const notification = document.querySelector(".notification");

const emailErr = document.querySelector(".email-error")
const emailInp = document.getElementById("email");
const sendBtn = document.querySelector(".form__send");

const passwordInp = document.getElementById("password");
const resetBtn = document.querySelector(".form__reset");

// firebase initialization
firebase.initializeApp(firebaseConfig);
firebase.analytics();

const auth = firebase.auth();

emailInp.addEventListener("change", (e) => {
    sendBtn.innerText = "send"
});

sendBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  
  const email = emailInp.value;
  sendBtn.innerText = "resend";

  try {
    console.log(email);
    emailErr.classList.add("none");
    await userPasswordReset(auth, email, actionCodePasswordReset);
    notification.classList.remove("none");   
    setTimeout(() => {
        notification.classList.add("none");
    }, 2000); 
  } catch (error) {
    sendBtn.innerText = "Send";
    const code = error.code.split("auth/")[1];
    emailErr.innerText = code;
    emailErr.classList.remove("none");
  }
});

resetBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const pass = passwordInp.value;
    resetPasswordUtil(pass);
});

function resetPassword(actionCode, newPassword){
    auth.confirmPasswordReset(actionCode, newPassword).then((resp) => {
        // Password reset has been confirmed and new password updated.
        console.log("success");
        // window
        // TODO: Display a link back to the app, or sign-in the user directly
        // if the page belongs to the same domain as the app:
        // auth.signInWithEmailAndPassword(accountEmail, newPassword);
  
        // TODO: If a continue URL is available, display a button which on
        // click redirects the user back to the app via continueUrl with
        // additional state determined from that URL's parameters.
      }).catch((error) => {
          console.log('error');
        // Error occurred during confirmation. The code might have expired or the
        // password is too weak.
      });
}

function resetPasswordUtil(password) {
  const urlParams = new URLSearchParams(window.location.search);

  // Get the one-time code from the query parameter.
  const actionCode = getParameterByName(urlParams, "oobCode");

  // Get the email.
  const email = getParameterByName(urlParams, "email");

  resetPassword(actionCode, password);
}

function getParameterByName(urlParams, name) {
    return urlParams.get(name);
}

window.onload = () => {
  const urlParams = new URLSearchParams(window.location.search);
  if(getParameterByName(urlParams, "enable") === "false"){
      forms[0].classList.remove("none");
  }
  else if(getParameterByName(urlParams, "enable") === "true"){
      forms[1].classList.remove("none");
  }
};
