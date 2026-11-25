# SPEC 02 — Paddle Bounce Feel (angle physics + impact animation)

> **Status:** Implemented
> **Depends on:** SPEC 01
> **Date:** 2026-11-25
> **Objective:** Make the paddle bounce feel natural by deflecting the ball at an angle that depends on where it hits the paddle (constant speed, proper side collisions) and by animating the impact with a paddle squash & stretch, a paddle flash and a ball squash.

---

## Scope

**In:**

- Position-dependent paddle bounce: the exit angle depends on the hit position along the paddle. Center → straight up; edges → up to `CONFIG.PADDLE_BOUNCE.maxAngle` (60°) from the vertical, toward the side that was hit. Ball speed magnitude stays constant (`CONFIG.BALL.speed`).
- Side collision with the paddle: if the ball hits the paddle from the side (ball center is below the paddle's top edge), it reflects horizontally (`dx` flips, ball is pushed out of the paddle) instead of being snapped on top or passing through. No angle recalculation in that case.
- Paddle impact animation (~`CONFIG.PADDLE_BOUNCE.duration` ms) triggered on every top-surface paddle bounce:
  - **Squash & stretch of the paddle:** it briefly compresses vertically and widens, then returns to normal size (anchored to the paddle's bottom edge so it does not drift).
  - **Flash:** a white overlay on the paddle that fades out over the same duration.
- **Ball squash** on paddle bounce: the ball is drawn flattened along the vertical axis and widened for a moment, then returns to its normal size (draw-only; the collision box does not change).
- Animation state is time-based (`performance.now()`), same as explosions; gameplay physics stays frame-based.
- New tuning constants in `src/config.js`.

**Out of scope (for future specs):**

- Animations on wall, ceiling or block bounces.
- Paddle-movement "spin" (horizontal velocity of the paddle altering the ball).
- Ball speed increasing over time or per hit.
- Minimum-vertical-angle correction after wall/block bounces.
- New sound effects or new sprite assets.
- Particles, screen shake, trails.
- Delta-time physics, tests, linter or build step.

## Data model

New constants (`src/config.js`):

```js
const CONFIG = {
  // ...existing keys unchanged...
  PADDLE_BOUNCE: {
    maxAngle: 60,        // degrees from vertical at the paddle edges
    duration: 120,       // ms, shared by paddle squash, flash and ball squash
    squashY: 0.6,        // paddle height factor at peak impact
    stretchX: 1.12,      // paddle width factor at peak impact
    ballSquashY: 0.7,    // ball height factor at peak impact
    ballStretchX: 1.25,  // ball width factor at peak impact
    flashAlpha: 0.7,     // peak opacity of the white flash
  },
};
```

New state (`src/game.js`):

```js
const state = {
  // ...existing keys unchanged...
  paddleHit: null,   // null | { startTime }   timestamp of the last top-surface paddle bounce
};
```

Conventions:

- Impact progress `t = (now - startTime) / CONFIG.PADDLE_BOUNCE.duration`, clamped to `[0, 1]`; `paddleHit` is set back to `null` when `t >= 1`.
- Animation curve: ease out from peak (`t = 0`) to normal (`t = 1`) — e.g. `k = 1 - t` applied to `lerp(1, factor, k)`.
- Hit position `h = (ballCenterX - paddleCenterX) / (paddle.w / 2)`, clamped to `[-1, 1]`. Exit angle `θ = h * maxAngle` (converted to radians); `dx = speed * sin(θ)`, `dy = -speed * cos(θ)`.
- The paddle's collision box (`state.paddle.w/h`) is never modified by the animation; only drawing scales.
- `paddleHit` is reset to `null` in `resetGame` and `resetBallToPaddle`.

## Implementation plan

1. `src/config.js`: add `PADDLE_BOUNCE`. Manual test: page loads, console clean, game plays exactly as before.
2. `src/game.js`: replace the paddle top-bounce with position-dependent angle (helper `bounceOffPaddle(hit)` computing `dx/dy` from hit position, constant speed). Manual test: hitting the paddle center sends the ball straight up; hitting the left/right edge sends it ~60° to the left/right; speed feels unchanged.
3. `src/game.js`: side-collision handling — when the ball center is below the paddle top (`ball.y + size/2 > paddle.y`) and it overlaps the paddle, reflect `dx` away from the paddle, push the ball out horizontally and do not touch `dy` or snap it on top. Manual test: sweeping the paddle into the ball from the side bounces it sideways; the ball never teleports on top of the paddle.
4. `src/game.js`: add `state.paddleHit`; set `{ startTime: performance.now() }` on every top-surface bounce (not on side hits); clear it when finished and in `resetGame` / `resetBallToPaddle`. Manual test: (temporary `console.log`, removed afterwards) the field is set on top hits only.
5. `src/game.js` (`drawGame`): paddle squash & stretch (scaled width/height anchored to bottom edge, centered horizontally) driven by `paddleHit`. Manual test: the paddle visibly compresses and recovers on each bounce, collision behavior is unchanged.
6. `src/game.js` (`drawGame`): white flash overlay on the paddle with fading alpha, and ball squash (scaled draw around the ball center) driven by `paddleHit`. Manual test: flash and ball squash are visible on paddle hits and absent on wall/block bounces.
7. Final pass: tune `PADDLE_BOUNCE` values by playing; make sure the animation looks right with rapid consecutive hits and after losing a life / restarting. Manual test: no stuck animation after reset, no console errors.

## Acceptance criteria

- [x] Hitting the paddle at its exact center sends the ball straight up (vertical, `dx ≈ 0`).
- [x] Hitting the left edge sends the ball up and to the left at ≈60° from the vertical; the right edge mirrors it to the right.
- [x] The angle changes continuously with the hit position (no discrete zones).
- [x] Ball speed magnitude is the same before and after a paddle bounce (`CONFIG.BALL.speed`).
- [x] The ball never leaves the paddle horizontal or going downward after a top bounce (`dy < 0` and angle ≤ `maxAngle`).
- [x] Hitting the paddle from the side reflects the ball horizontally and does not snap it on top of the paddle or let it pass through.
- [x] Each top-surface paddle bounce shows the paddle squash & stretch, the white flash and the ball squash for about 120 ms, then everything returns to normal size.
- [x] Wall, ceiling, block and side-paddle bounces do not trigger the animation.
- [x] Collision boxes are unchanged by the animation (paddle/ball hitboxes use the original sizes).
- [x] After losing a life, game over restart or grid regeneration, no animation is left in progress.
- [x] `bounce` sound still plays on paddle bounces.
- [x] The project still has no dependencies, build step or new assets.

## Decisions

- **Yes:** exit angle by hit position, capped at 60° from the vertical. Classic Arkanoid feel; reverts the "pure reflection" choice from SPEC 01.
- **Yes:** constant ball speed. Keeps difficulty as in SPEC 01; only direction changes.
- **Yes:** side-collision handling for the paddle. Without it, the new angle logic would snap the ball on top of the paddle on side hits and look unnatural.
- **Yes:** paddle squash & stretch + flash + ball squash, all draw-only. Cheap, no new assets, no hitbox side effects.
- **Yes:** time-based animation (`performance.now()`), like explosions; physics stays in px/frame.
- **Yes:** flash as a white overlay with alpha, not a new sprite.
- **No:** paddle-movement spin. More complex, deferred.
- **No:** speed increase over time. Changes difficulty, would need its own balancing.
- **No:** minimum-vertical-angle correction on other bounces. Wasn't requested; the 60° cap already limits near-horizontal paths after paddle hits.
- **No:** animation on wall/block bounces. Possible follow-up spec.

## Risks

| Risk                                                                                       | Mitigation                                                                                      |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Edge hits at 60° produce flat trajectories that take long to reach the blocks.             | `maxAngle` is tunable in `CONFIG`; can be lowered after play-testing.                           |
| Distinguishing top hit vs. side hit can misclassify corner hits at 6 px/frame.             | Use ball center vs. paddle top for the check; tune by play-testing the corners.                 |
| White overlay rectangle may overshoot the paddle sprite's rounded/shaded edges.            | Use a low alpha and the same rect as the (scaled) sprite; fall back to `lighter` compositing.   |
| Visual squash could hide the real hitbox and make hits feel unfair.                        | Scaling is subtle (≤40% vertical) and brief (120 ms); hitbox is never altered.                  |
