const input = {
  left: false,
  right: false,
  mouseX: null,
};

function initInput(canvas, onAction, onTogglePause) {
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
      input.left = true;
      input.mouseX = null;
    } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
      input.right = true;
      input.mouseX = null;
    } else if (e.code === "Space" || e.key === " ") {
      e.preventDefault();
      if (onAction) onAction();
    } else if (e.key === "p" || e.key === "P" || e.key === "Escape") {
      if (!e.repeat && onTogglePause) onTogglePause();
    }
  });

  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
      input.left = false;
    } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
      input.right = false;
    }
  });

  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    input.mouseX = ((e.clientX - rect.left) / rect.width) * CONFIG.WIDTH;
  });

  canvas.addEventListener("click", () => {
    if (onAction) onAction();
  });
}
