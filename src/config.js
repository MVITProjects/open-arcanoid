const CONFIG = {
  LIVES: 3,
  BLOCK_POINTS: 10,
  WIDTH: 800,
  HEIGHT: 600,
  PADDLE: { w: 120, h: 14, y: 560, speed: 8 },
  BALL: { size: 16, speed: 6 },
  BLOCKS: { cols: 10, w: 70, h: 24, gap: 4, offsetX: 32, offsetY: 60 },
  PADDLE_BOUNCE: {
    maxAngle: 60,
    duration: 120,
    squashY: 0.6,
    stretchX: 1.12,
    ballSquashY: 0.7,
    ballStretchX: 1.25,
    flashAlpha: 0.7,
  },
};
