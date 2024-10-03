let audioContext;
const AudioContext = (typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : {}).AudioContext ||
    (typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : {}).AudioContext;

if (!AudioContext) {
    console.error('AudioContext is not supported in this environment');
}

// Initialize AudioContext and AudioWorklet
async function initAudio(retries = 3) {
    audioContext = new AudioContext();
    for (let i = 0; i < retries; i++) {
        try {
            await audioContext.audioWorklet.addModule('audio-handler.js');
            return;
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
        }
    }
}

// Initialize audio when the script loads
initAudio();

function playSound(filename) {
    if (!audioContext) {
        initAudio().then(() => playSound(filename));
        return;
    }

    fetch(filename)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start();
        })
        .catch(error => console.error('Error playing sound:', error));
}


// Listen for messages from the service worker
if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'playSound') {
            playSound(message.filename);
        }
    });
}

// set up a listener for messages from the service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'playSound') {
        playSound(message.filename);
    }
});