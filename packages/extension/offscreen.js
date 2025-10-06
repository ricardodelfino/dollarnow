chrome.runtime.onMessage.addListener((msg) => {
  if (msg.target === 'offscreen' && msg.type === 'play-audio') {
    const audio = new Audio(msg.data.path);
    audio.play();
  }
});
