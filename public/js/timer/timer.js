let countdown;
const timerDisplay = document.querySelector(".display_time-left");
const endTime = document.querySelector(".display_end-time");
const buttons = document.querySelectorAll("[data-time]");
let timeArea = document.querySelector(".display");

function timer(seconds) {
  clearInterval(countdown);

  const now = Date.now();
  const then = now + seconds * 1000;
  displayTimeLeft(seconds);
  displayEndTime(then);

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
  if (minutes == 0 && seconds == 0) {
    timerDisplay.textContent = "Time UP!";
    endTime.textContent = "Get Back to Something!";
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
    timerDisplay.textContent = "00:00";
    endTime.textContent = "Start The Timer!";
    clearInterval(countdown);
    return;
  }
  const seconds = parseInt(time);
  timer(seconds);
}

buttons.forEach((button) => button.addEventListener("click", startTimer));

window.addEventListener("keyup", function (e) {
  if (e.key === "Enter") {
    const mins = document.querySelector("input[name='minutes']").value;
    if (parseInt(mins)) {
      timer(parseInt(mins) * 60);
    } else {
      clearInterval(countdown);
      timerDisplay.textContent = "******!";
      endTime.textContent = "Enter a Valid Minute Value! (> 0)";
    }
    document.querySelector("input[name='minutes']").value = "";
  }
});
