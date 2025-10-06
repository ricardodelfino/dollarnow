// This script is designed to run in an offscreen document.
// Its sole purpose is to play audio, which service workers cannot do.

const soundFiles = [
    '3-stars.mp3', 'coin.mp3', 'coins-falling.mp3', 'cristal-chime.mp3',
    'door-bell.mp3', 'double-cow-bell.mp3', 'marimba-bubble.mp3', 'uncap-bottle.mp3'
];

const audioCache = new Map(); // Caches Audio objects

/**
 * Plays an audio file from the cache. If not cached, it loads it first.
 * @param {string} path - The path to the audio file.
 */
async function playAudio(path) {
    let audio = audioCache.get(path);

    // If the audio is not in the cache, create and load it.
    if (!audio) {
        audio = new Audio(path);
        audio.preload = 'auto';
        audioCache.set(path, audio);
    }

    // Ensure the audio is ready to play.
    // 'canplaythrough' event ensures the entire file is loaded.
    await new Promise((resolve, reject) => {
        if (audio.readyState >= 4) { // HAVE_ENOUGH_DATA
            return resolve();
        }
        audio.addEventListener('canplaythrough', resolve, { once: true });
        audio.addEventListener('error', reject, { once: true });
    });

    audio.currentTime = 0; // Rewind to the start
    audio.play().catch(error => console.error(`Error playing sound ${path}:`, error));
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.target === 'offscreen' && msg.type === 'play-audio') {
    const path = msg.data.path;
    if (!path) return;
    playAudio(path);
  }
});
