let timer = {
    isRunning: false,
    isWork: true,
    timeLeft: 25 * 60,
    workDuration: 25 * 60,
    breakDuration: 5 * 60
  };
  
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "pomodoroTimer") {
      if (timer.timeLeft > 0) {
        timer.timeLeft--;
        updateBadge();
      } else {
        stopTimer();
        showNotification();
        chrome.runtime.sendMessage({ action: 'showAlert' });
      }
      saveTimerState();
    }
  });
  
  function startTimer() {
    if (!timer.isRunning) {
      timer.isRunning = true;
      chrome.alarms.create("pomodoroTimer", { periodInMinutes: 1 / 60 });
      updateBadge();
      saveTimerState();
    }
  }
  
  function pauseTimer() {
    if (timer.isRunning) {
      timer.isRunning = false;
      chrome.alarms.clear("pomodoroTimer");
      updateBadge();
      saveTimerState();
    }
  }
  
  function stopTimer() {
    pauseTimer();
    timer.isWork = !timer.isWork;
    timer.timeLeft = timer.isWork ? timer.workDuration : timer.breakDuration;
    updateBadge();
    saveTimerState();
  }
  
  function resetTimer() {
    pauseTimer();
    timer.timeLeft = timer.isWork ? timer.workDuration : timer.breakDuration;
    updateBadge();
    saveTimerState();
  }
  
  function updateBadge() {
    const minutes = Math.floor(timer.timeLeft / 60);
    const seconds = timer.timeLeft % 60;
    const badgeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: timer.isWork ? '#FFFFFF' : '#FFFFFF' });
  }
  
  function showNotification() {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon128.jpg',
      title: 'Pomodoro Timer',
      message: timer.isWork ? 'Work session completed! Take a break.' : 'Break time over! Back to work.',
    });
  }
  
  function saveTimerState() {
    chrome.storage.local.set({ timer: timer });
  }
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
      case 'getState':
        sendResponse(timer);
        break;
      case 'start':
        startTimer();
        sendResponse(timer);
        break;
      case 'pause':
        pauseTimer();
        sendResponse(timer);
        break;
      case 'reset':
        resetTimer();
        sendResponse(timer);
        break;
      case 'switchMode':
        timer.isWork = !timer.isWork;
        resetTimer();
        sendResponse(timer);
        break;
      case 'updateDurations':
        timer.workDuration = request.workDuration * 60;
        timer.breakDuration = request.breakDuration * 60;
        resetTimer();
        chrome.storage.local.set({ workDuration: request.workDuration, breakDuration: request.breakDuration });
        sendResponse(timer);
        break;
    }
    return true;
  });
  
  chrome.storage.local.get(['timer', 'workDuration', 'breakDuration'], (result) => {
    if (result.timer) {
      timer = result.timer;
    }
    if (result.workDuration) {
      timer.workDuration = result.workDuration * 60;
    }
    if (result.breakDuration) {
      timer.breakDuration = result.breakDuration * 60;
    }
    if (timer.isRunning) {
      startTimer();
    } else {
      updateBadge();
    }
  });