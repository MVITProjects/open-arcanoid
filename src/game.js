function createBlocks(level) {
  const { w, h, gap, offsetX, offsetY } = CONFIG.BLOCKS;
  const layout = LEVELS[level - 1];
  const blocks = [];

  for (let row = 0; row < layout.length; row++) {
    const rowStr = layout[row];
    for (let col = 0; col < rowStr.length; col++) {
      const color = LEVEL_COLORS[rowStr[col]];
      if (!color) continue;
      blocks.push({
        x: offsetX + col * (w + gap),
        y: offsetY + row * (h + gap),
        w,
        h,
        color,
        alive: true,
      });
    }
  }

  return blocks;
}

const paddleStartX = (CONFIG.WIDTH - CONFIG.PADDLE.w) / 2;

const state = {
  phase: "ready",
  level: 1,
  lives: CONFIG.LIVES,
  score: 0,
  paddle: {
    x: paddleStartX,
    y: CONFIG.PADDLE.y,
    w: CONFIG.PADDLE.w,
    h: CONFIG.PADDLE.h,
  },
  ball: {
    x: paddleStartX + (CONFIG.PADDLE.w - CONFIG.BALL.size) / 2,
    y: CONFIG.PADDLE.y - CONFIG.BALL.size,
    dx: 0,
    dy: 0,
    size: CONFIG.BALL.size,
  },
  blocks: createBlocks(1),
  explosions: [],
  paddleHit: null,
};

function attachBallToPaddle() {
  state.ball.x = state.paddle.x + (state.paddle.w - state.ball.size) / 2;
  state.ball.y = state.paddle.y - state.ball.size;
}

function resetBallToPaddle() {
  state.ball.dx = 0;
  state.ball.dy = 0;
  state.paddleHit = null;
  attachBallToPaddle();
  state.phase = "ready";
}

function launchBall() {
  // Angle offset from straight up within [-45°, +45°], avoiding near-horizontal paths
  const offset = (Math.random() * 2 - 1) * (Math.PI / 4);
  state.ball.dx = CONFIG.BALL.speed * Math.sin(offset);
  state.ball.dy = -CONFIG.BALL.speed * Math.cos(offset);
  state.phase = "playing";
}

function resetGame() {
  state.level = 1;
  state.lives = CONFIG.LIVES;
  state.score = 0;
  state.paddle.x = (CONFIG.WIDTH - CONFIG.PADDLE.w) / 2;
  state.blocks = createBlocks(1);
  state.explosions = [];
  state.paddleHit = null;
  resetBallToPaddle();
}

function handleAction() {
  if (state.phase === "ready") {
    launchBall();
  } else if (state.phase === "gameover" || state.phase === "win") {
    resetGame();
  }
}

function updatePaddle() {
  const { paddle } = state;

  if (input.mouseX !== null) {
    paddle.x = input.mouseX - paddle.w / 2;
  } else {
    if (input.left) paddle.x -= CONFIG.PADDLE.speed;
    if (input.right) paddle.x += CONFIG.PADDLE.speed;
  }

  paddle.x = Math.max(0, Math.min(CONFIG.WIDTH - paddle.w, paddle.x));
}

function bounceOffPaddle(hit) {
  const clamped = Math.max(-1, Math.min(1, hit));
  const maxRad = (CONFIG.PADDLE_BOUNCE.maxAngle * Math.PI) / 180;
  const angle = clamped * maxRad;
  state.ball.dx = CONFIG.BALL.speed * Math.sin(angle);
  state.ball.dy = -CONFIG.BALL.speed * Math.cos(angle);
}

function updateBall() {
  const { ball, paddle } = state;

  ball.x += ball.dx;
  ball.y += ball.dy;

  if (ball.x <= 0) {
    ball.x = 0;
    ball.dx = Math.abs(ball.dx);
    playSound("bounce");
  } else if (ball.x + ball.size >= CONFIG.WIDTH) {
    ball.x = CONFIG.WIDTH - ball.size;
    ball.dx = -Math.abs(ball.dx);
    playSound("bounce");
  }

  if (ball.y <= 0) {
    ball.y = 0;
    ball.dy = Math.abs(ball.dy);
    playSound("bounce");
  }

  if (
    ball.x + ball.size >= paddle.x &&
    ball.x <= paddle.x + paddle.w &&
    ball.y + ball.size >= paddle.y &&
    ball.y <= paddle.y + paddle.h
  ) {
    const ballCenterX = ball.x + ball.size / 2;
    const ballCenterY = ball.y + ball.size / 2;
    const paddleCenterX = paddle.x + paddle.w / 2;

    if (ballCenterY > paddle.y) {
      if (ballCenterX < paddleCenterX) {
        ball.x = paddle.x - ball.size;
        ball.dx = -Math.abs(ball.dx);
      } else {
        ball.x = paddle.x + paddle.w;
        ball.dx = Math.abs(ball.dx);
      }
      playSound("bounce");
    } else if (ball.dy > 0) {
      const hit = (ballCenterX - paddleCenterX) / (paddle.w / 2);
      ball.y = paddle.y - ball.size;
      bounceOffPaddle(hit);
      state.paddleHit = { startTime: performance.now() };
      playSound("bounce");
    }
  }

  for (const block of state.blocks) {
    if (!block.alive) continue;

    if (
      ball.x + ball.size > block.x &&
      ball.x < block.x + block.w &&
      ball.y + ball.size > block.y &&
      ball.y < block.y + block.h
    ) {
      block.alive = false;
      state.score += CONFIG.BLOCK_POINTS;
      state.explosions.push({
        x: block.x,
        y: block.y,
        w: block.w,
        h: block.h,
        color: block.color,
        startTime: performance.now(),
      });

      const overlapLeft = ball.x + ball.size - block.x;
      const overlapRight = block.x + block.w - ball.x;
      const overlapTop = ball.y + ball.size - block.y;
      const overlapBottom = block.y + block.h - ball.y;
      const minOverlapX = Math.min(overlapLeft, overlapRight);
      const minOverlapY = Math.min(overlapTop, overlapBottom);

      if (minOverlapX < minOverlapY) {
        ball.dx = -ball.dx;
      } else {
        ball.dy = -ball.dy;
      }

      playSound("break");
      break;
    }
  }

  if (ball.y > CONFIG.HEIGHT) {
    state.lives -= 1;
    if (state.lives <= 0) {
      state.ball.dx = 0;
      state.ball.dy = 0;
      state.paddleHit = null;
      state.phase = "gameover";
    } else {
      resetBallToPaddle();
    }
  }
}

function updateExplosions(now) {
  state.explosions = state.explosions.filter(
    (exp) => now - exp.startTime < EXPLOSION_DURATION
  );
}

function updatePaddleHit(now) {
  if (
    state.paddleHit &&
    now - state.paddleHit.startTime >= CONFIG.PADDLE_BOUNCE.duration
  ) {
    state.paddleHit = null;
  }
}

function updateGame() {
  if (state.phase !== "gameover" && state.phase !== "win") {
    updatePaddle();
  }

  if (state.phase === "ready") {
    attachBallToPaddle();
  } else if (state.phase === "playing") {
    updateBall();
  }

  const now = performance.now();
  updateExplosions(now);
  updatePaddleHit(now);

  if (
    state.phase === "playing" &&
    state.explosions.length === 0 &&
    state.blocks.every((block) => !block.alive)
  ) {
    if (state.level < LEVELS.length) {
      state.level += 1;
      state.blocks = createBlocks(state.level);
      resetBallToPaddle();
    } else {
      state.ball.dx = 0;
      state.ball.dy = 0;
      state.paddleHit = null;
      state.phase = "win";
    }
  }
}

function drawGame(ctx) {
  for (const block of state.blocks) {
    if (!block.alive) continue;
    drawSprite(ctx, `block_${block.color}`, block.x, block.y, block.w, block.h);
  }

  const now = performance.now();
  for (const exp of state.explosions) {
    const frames = EXPLOSION_FRAMES[exp.color];
    if (!frames) continue;
    const elapsed = now - exp.startTime;
    const frameIndex = Math.min(
      frames.length - 1,
      Math.floor((elapsed / EXPLOSION_DURATION) * frames.length)
    );
    if (frameIndex >= 0) {
      drawFrame(ctx, frames[frameIndex], exp.x, exp.y, exp.w, exp.h);
    }
  }

  let impact = 0;
  if (state.paddleHit) {
    const t = Math.max(
      0,
      Math.min(
        1,
        (now - state.paddleHit.startTime) / CONFIG.PADDLE_BOUNCE.duration
      )
    );
    impact = 1 - t;
  }

  const paddleScaleX = 1 + (CONFIG.PADDLE_BOUNCE.stretchX - 1) * impact;
  const paddleScaleY = 1 + (CONFIG.PADDLE_BOUNCE.squashY - 1) * impact;
  const paddleDrawW = state.paddle.w * paddleScaleX;
  const paddleDrawH = state.paddle.h * paddleScaleY;
  const paddleDrawX = state.paddle.x - (paddleDrawW - state.paddle.w) / 2;
  const paddleDrawY = state.paddle.y + (state.paddle.h - paddleDrawH);

  drawSprite(ctx, "paddle", paddleDrawX, paddleDrawY, paddleDrawW, paddleDrawH);

  if (impact > 0) {
    ctx.save();
    ctx.globalAlpha = CONFIG.PADDLE_BOUNCE.flashAlpha * impact;
    ctx.fillStyle = "#fff";
    ctx.fillRect(paddleDrawX, paddleDrawY, paddleDrawW, paddleDrawH);
    ctx.restore();
  }

  const ballScaleX = 1 + (CONFIG.PADDLE_BOUNCE.ballStretchX - 1) * impact;
  const ballScaleY = 1 + (CONFIG.PADDLE_BOUNCE.ballSquashY - 1) * impact;
  const ballDrawW = state.ball.size * ballScaleX;
  const ballDrawH = state.ball.size * ballScaleY;
  const ballDrawX = state.ball.x - (ballDrawW - state.ball.size) / 2;
  const ballDrawY = state.ball.y - (ballDrawH - state.ball.size) / 2;

  drawSprite(ctx, "ball", ballDrawX, ballDrawY, ballDrawW, ballDrawH);

  ctx.fillStyle = "#fff";
  ctx.font = "20px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("Lives:", 16, 16);
  ctx.textAlign = "right";
  ctx.fillText(`Score: ${state.score}`, CONFIG.WIDTH - 16, 16);
  ctx.textAlign = "left";
  const lifeSize = CONFIG.BALL.size;
  const lifeX = 16 + ctx.measureText("Lives:").width + 10;
  for (let i = 0; i < state.lives; i++) {
    drawSprite(ctx, "ball", lifeX + i * (lifeSize + 6), 18, lifeSize, lifeSize);
  }

  if (state.phase === "gameover") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "48px monospace";
    ctx.fillText("Game Over", CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 24);
    ctx.font = "20px monospace";
    ctx.fillText(
      "Press Space or click to restart",
      CONFIG.WIDTH / 2,
      CONFIG.HEIGHT / 2 + 24
    );
  } else if (state.phase === "win") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "48px monospace";
    ctx.fillText("You Win!", CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 40);
    ctx.font = "24px monospace";
    ctx.fillText(`Score: ${state.score}`, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 8);
    ctx.font = "20px monospace";
    ctx.fillText(
      "Press Space or click to restart",
      CONFIG.WIDTH / 2,
      CONFIG.HEIGHT / 2 + 48
    );
  }
}
