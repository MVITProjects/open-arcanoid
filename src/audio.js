const SOUNDS = {
  bounce: new Audio("assets/sounds/ball-bounce.mp3"),
  break: new Audio("assets/sounds/break-sound.mp3"),
};

let muted = true;

function toggleMute() {
  muted = !muted;
  return muted;
}

function playSound(name) {
  if (muted) return;
  const base = SOUNDS[name];
  if (!base) return;
  const instance = base.cloneNode();
  instance.play().catch(() => {});
}

const muteButton = document.getElementById("mute");
muteButton.addEventListener("click", () => {
  muteButton.textContent = toggleMute() ? "🔇 Sound: Off" : "🔊 Sound: On";
  muteButton.blur(); // keep Space reserved for the game, not the button
});
