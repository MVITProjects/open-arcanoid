const SOUNDS = {
  bounce: new Audio("assets/sounds/ball-bounce.mp3"),
  break: new Audio("assets/sounds/break-sound.mp3"),
};

function playSound(name) {
  const base = SOUNDS[name];
  if (!base) return;
  const instance = base.cloneNode();
  instance.play().catch(() => {});
}
