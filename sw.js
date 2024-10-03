async function createOffscreen() {
  if (await chrome.offscreen.hasDocument()) return;
  await chrome.offscreen.createDocument({
    url: './offscreen.html',
    reasons: ['AUDIO_PLAYBACK'],
    justification: 'Playing audio for extension events'
  });
}

// Call this when the service worker installs
createOffscreen();

function playSound(filename) {
  chrome.runtime.sendMessage({ action: 'playSound', filename });
}

function onNav({ frameId }) {
  if (frameId > 0) return;
  playSound("click.ogg");
}

chrome.webNavigation.onCreatedNavigationTarget.addListener(onNav);
chrome.webNavigation.onBeforeNavigate.addListener(onNav);
chrome.webNavigation.onReferenceFragmentUpdated.addListener(onNav);
chrome.webNavigation.onHistoryStateUpdated.addListener(onNav);

chrome.downloads.onChanged.addListener(delta => {
  if (delta.state && delta.state.current === "complete") {
    playSound("DownloadComplete.ogg");
  }
  if (delta.error && delta.error.current) {
    playSound("DownloadFailed.ogg");
  }
});

chrome.tabs.onUpdated.addListener((tabId, { mutedInfo }) => {
  if (mutedInfo && mutedInfo.reason === "user") {
    playSound("Unlock.ogg");
  }
});

// Add this at the end of your sw.js file

function reloadExtension() {
  chrome.runtime.reload();
}

// Set up the interval to reload every 45 seconds
setInterval(reloadExtension, 45000);
