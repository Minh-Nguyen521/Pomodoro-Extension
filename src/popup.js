const timeDisplay = document.getElementById('time');
const modeDisplay = document.getElementById('mode');
const startPauseButton = document.getElementById('startPause');
const resetButton = document.getElementById('reset');
const switchModeButton = document.getElementById('switchMode');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const progressCircle = document.getElementById('progress-circle');
const toggleSettingsButton = document.getElementById('toggleSettings');
const settingsPanel = document.getElementById('settingsPanel');
const settingsForm = document.getElementById('settingsForm');
const workDurationInput = document.getElementById('workDuration');
const breakDurationInput = document.getElementById('breakDuration');

let timer = {
  isRunning: false,
  isWork: true,
  timeLeft: 25 * 60,
  workDuration: 25 * 60,
  breakDuration: 5 * 60
};

function updateDisplay() {
  const minutes = Math.floor(timer.timeLeft / 60);
  const seconds = timer.timeLeft % 60;
  timeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  modeDisplay.textContent = timer.isWork ? 'Work' : 'Break';
  switchModeButton.textContent = `Switch to ${timer.isWork ? 'Break' : 'Work'}`;
  
  if (timer.isRunning) {
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');
  } else {
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
  }

  const totalTime = timer.isWork ? timer.workDuration : timer.breakDuration;
  const progress = (timer.timeLeft / totalTime) * 100;
  const dashOffset = 301.59 - (301.59 * progress) / 100;
  progressCircle.style.strokeDashoffset = dashOffset;
}

function sendMessage(action, data = {}) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action, ...data }, (response) => {
      timer = response;
      updateDisplay();
      resolve(response);
    });
  });
}

startPauseButton.addEventListener('click', () => {
  sendMessage(timer.isRunning ? 'pause' : 'start');
});

resetButton.addEventListener('click', () => {
  sendMessage('reset');
});

switchModeButton.addEventListener('click', () => {
  sendMessage('switchMode');
});

toggleSettingsButton.addEventListener('click', () => {
  settingsPanel.classList.toggle('hidden');
});

settingsForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const workDuration = parseInt(workDurationInput.value);
  const breakDuration = parseInt(breakDurationInput.value);

  await sendMessage('updateDurations', { workDuration, breakDuration });
  settingsPanel.classList.add('hidden');
});

// Load saved settings and initialize popup state
chrome.storage.local.get(['workDuration', 'breakDuration'], async (result) => {
  workDurationInput.value = result.workDuration || 25;
  breakDurationInput.value = result.breakDuration || 5;
  
  timer = await sendMessage('getState');
});

// Update popup every second
setInterval(() => {
  sendMessage('getState');
}, 1000);

// Listen for the showAlert message from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showAlert') {
    alert(timer.isWork ? 'Work session completed! Take a break.' : 'Break time over! Back to work.');
  }
});