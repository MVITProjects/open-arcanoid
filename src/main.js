const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = CONFIG.WIDTH;
canvas.height = CONFIG.HEIGHT;

initInput(canvas, handleAction, togglePause);

window.addEventListener("blur", pauseGame);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pauseGame();
});

function loop() {
  ctx.clearRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
  updateGame();
  drawGame(ctx);
  requestAnimationFrame(loop);
}

loadSpritesheet(() => {
  requestAnimationFrame(loop);
});
