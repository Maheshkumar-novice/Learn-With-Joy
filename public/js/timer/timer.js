const timerDisplay = document.querySelector(".display_time-left");
const endTime = document.querySelector(".display_end-time");
const buttons = document.querySelectorAll("[data-time]");
const stopText = document.querySelector(".stop-sound");

let timeArea = document.querySelector(".display");
let sound = document.querySelector(".timer__sound");
let timerStatus = document.querySelector(".timer-status");
let countdown;

function timer(seconds) {
  clearInterval(countdown);

  const now = Date.now();
  const then = now + seconds * 1000;
  displayEndTime(then);

  displayTimeLeft(seconds);
  countdown = setInterval(() => {
    const secondsLeft = Math.round((then - Date.now()) / 1000);
    if (secondsLeft < 0) {
      clearInterval(countdown);
      return;
    }

    displayTimeLeft(secondsLeft);
  }, 1000);
}

function displayTimeLeft(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainderSeconds = seconds % 60;
  const display = `${minutes < 10 ? "0" : ""}${minutes}:${
    remainderSeconds < 10 ? "0" : ""
  }${remainderSeconds}`;

  timerDisplay.textContent = display;
  timerStatus.textContent = display;
  document.title = display;

  if (minutes == 0 && seconds == 0) {
    sound.play();
    stopText.classList.remove("none");

    endTime.textContent = "Get Back to Something!";
    timerDisplay.textContent = "Time UP!";
    timerStatus.textContent = "Time UP!";
    document.title = "Time UP!";
  }
}

function displayEndTime(timestamp) {
  const end = new Date(timestamp);
  const hours = end.getHours();
  const minutes = end.getMinutes();
  const seconds = end.getSeconds();
  endTime.textContent = `Be Back At ${hours}:${
    minutes < 10 ? "0" : ""
  }${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

function startTimer() {
  let time = this.dataset.time;
  if (time == "reset") {
    clearInterval(countdown);
    sound.pause();
    sound.currentTime = 0;
    stopText.classList.add("none");

    timerDisplay.textContent = "00:00";
    timerStatus.textContent = "00:00";
    document.title = "Home | Learn With Joy";
    endTime.textContent = "Start The Timer!";
    return;
  }
  const seconds = parseInt(time);
  timer(seconds);
}

buttons.forEach((button) => button.addEventListener("click", startTimer));

window.addEventListener("keyup", function (e) {
  if (e.key === "Enter") {
    const minutesInput = document.querySelector("input[name='minutes']");
    if (!minutesInput.value) return;
    if (parseInt(minutesInput.value)) {
      timer(parseInt(minutesInput.value) * 60);
    } else {
      clearInterval(countdown);
      timerDisplay.textContent = "******!";
      endTime.textContent = "Enter a Valid Minute Value! (> 0)";
    }
    minutesInput.value = "";
  }
});
