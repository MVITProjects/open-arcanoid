# SPEC 01 — Playable Arkanoid MVP

> **Status:** Finished
> **Depends on:** None
> **Date:** 2026-11-24
> **Objective:** Build a playable single-level Arkanoid in plain HTML/CSS/JS where a paddle bounces a ball to break colored blocks, with 3 lives, score, sound (with a mute toggle, muted by default), explosion animation and a game-over screen.

---

## Scope

**In:**

- A single fixed-size `<canvas>` (800×600 logical pixels), centered on the page with CSS.
- Paddle controlled by keyboard (Arrow keys / A-D) and by mouse (horizontal movement over the canvas).
- Ball that starts stuck to the paddle and is launched with Space or mouse click.
- Pure-reflection ball physics against walls, ceiling, paddle and blocks (constant speed).
- Grid of 6 rows × 10 columns of 1-hit blocks, one color per row, drawn from the existing spritesheet.
- Explosion animation (4 frames, `EXPLOSION_DURATION`) when a block is destroyed.
- Sound effects: `ball-bounce.mp3` on wall/ceiling/paddle bounce, `break-sound.mp3` on block break.
- 3 lives: each time the ball falls below the paddle the player loses one life, the ball resets onto the paddle (`phase: "ready"`) and already-broken blocks stay broken.
- Remaining lives shown at the top-left as the text `Lives:` followed by one ball sprite per remaining life.
- Score counter shown as canvas text `Score: N` at the top-right: `CONFIG.BLOCK_POINTS` (10) per broken block, reset to 0 on game-over restart and kept when the grid regenerates.
- Mute button (HTML `<button id="mute">`) below the canvas, right-aligned, toggling all sound effects. The game starts muted (`🔇 Sound: Off`); the setting is not persisted. The button blurs after each click so Space keeps launching the ball.
- Game over when the last life is lost, with a "Game Over — press Space/click to restart" screen.
- When all blocks are cleared, the grid is regenerated and the ball resets onto the paddle.
- Project layout: `index.html`, `style.css`, and classic-script files in `src/` loaded via `<script>` tags in order (no ES modules, so it also works from `file://` except where the browser blocks audio/image loading).

**Out of scope (for future specs):**

- Persisted high scores (localStorage).
- Win screen and multiple levels / level layouts.
- Multi-hit (gray/armored) blocks.
- Power-ups (wider paddle, multi-ball, laser, slow ball).
- Bounce angle depending on the hit position on the paddle.
- Pause, start menu, touch/mobile controls, responsive canvas.
- Any test setup, linter or build step.

## Data model

```js
// Constants (src/config.js)
const CONFIG = {
  LIVES: 3,
  BLOCK_POINTS: 10,
  WIDTH: 800,
  HEIGHT: 600,
  PADDLE: { w: 120, h: 14, y: 560, speed: 8 },   // speed in px/frame (keyboard)
  BALL: { size: 16, speed: 6 },                  // speed in px/frame
  BLOCKS: { rows: 6, cols: 10, w: 70, h: 24, gap: 4, offsetX: 32, offsetY: 60 },
  ROW_COLORS: ["red", "yellow", "cyan", "magenta", "hotpink", "green"],
};

// Game state (src/game.js)
const state = {
  phase: "ready",        // "ready" | "playing" | "gameover"
  lives: 3,              // initialized from CONFIG.LIVES
  score: 0,              // +CONFIG.BLOCK_POINTS per broken block
  paddle: { x, y, w, h },
  ball: { x, y, dx, dy, size },
  blocks: [/* { x, y, w, h, color, alive } */],
  explosions: [/* { x, y, w, h, color, startTime } */],
};
```

Conventions:

- Coordinates: origin top-left, units are logical canvas pixels.
- Velocities in pixels/frame; the ball's speed magnitude stays constant.
- `phase: "ready"` = ball stuck to the paddle waiting for launch.
- Audio state lives in `src/audio.js` (`muted`, default `true`, toggled by `toggleMute()`).
- Sprites come only from `assets/spritesheet.js` (`drawSprite`, `drawFrame`, `EXPLOSION_FRAMES`); no new image assets.

## Implementation plan

1. Create `index.html` (canvas + scripts in order: `assets/spritesheet.js`, `src/config.js`, `src/input.js`, `src/audio.js`, `src/game.js`, `src/main.js`) and `style.css` (center canvas, dark background). Create the empty `src/` files. Manual test: opening the page shows an empty bordered canvas, no console errors.
2. `src/config.js` + `src/main.js`: call `loadSpritesheet`, start a `requestAnimationFrame` loop that clears the canvas each frame. Manual test: loop runs, console clean.
3. `src/game.js`: create state, draw the paddle and the block grid (6 rows, colored). Manual test: paddle and 60 blocks render with the right colors.
4. `src/input.js`: keyboard (Arrow keys / A-D) and mouse movement control the paddle, clamped to the canvas. Manual test: paddle moves with both inputs and never leaves the canvas.
5. Ball in `ready` phase stuck to the paddle; Space/click launches it at a random upward angle (never near-horizontal) and sets `phase: "playing"`. Manual test: ball follows the paddle, then launches.
6. Ball movement with pure reflection against left/right walls, ceiling and paddle. Manual test: ball bounces off all four surfaces except the bottom.
7. `src/audio.js`: load both sounds, play `ball-bounce` on wall/ceiling/paddle bounces (cloning/rewinding so rapid bounces don't get cut). Manual test: sound on every bounce.
8. Ball–block collision: mark block as dead, reflect on the correct axis, play `break-sound`. Manual test: blocks disappear on hit and ball deflects.
9. Explosion animation: on block break push an entry to `state.explosions`, draw the 4 `EXPLOSION_FRAMES[color]` over `EXPLOSION_DURATION`, then remove it. Manual test: each broken block plays a short animation.
10. Lives: add `state.lives` (from `CONFIG.LIVES`), draw `Lives: N` top-left; when the ball falls below the canvas, decrement lives and reset the ball onto the paddle (`phase: "ready"`) keeping broken blocks broken. Manual test: lose the ball, counter drops 3→2, ball back on paddle, blocks unchanged.
11. Game over: when lives reach 0, set `phase: "gameover"` and draw the overlay text; Space/click rebuilds state (blocks regenerated, lives back to 3, ball on paddle). Manual test: lose all 3 lives, see the overlay, restart.
12. Level clear: when no block is `alive` and no explosion is pending, regenerate the grid and reset the ball onto the paddle (`phase: "ready"`). Manual test: break all blocks, grid reappears.
13. HUD follow-ups: draw lives as one ball sprite per life next to `Lives:`, add `state.score` with `Score: N` at the top-right (`CONFIG.BLOCK_POINTS` per block, reset in `resetGame`). Manual test: lives show as balls, score rises by 10 per block and resets on restart.
14. Mute toggle: add the `#mute` button in `index.html` (with `#wrapper` and styles in `style.css`), a `muted` flag in `src/audio.js` defaulting to `true`, and a click handler that toggles it and updates the label. Manual test: no sound on load; click the button and bounces/breaks are audible; Space still launches the ball afterwards.

## Acceptance criteria

- [x] Opening `index.html` (or serving the project root statically) shows the game with no errors in the browser console.
- [x] The canvas is 800×600 logical pixels and is horizontally centered.
- [x] 60 blocks (6 rows × 10 columns) render at start, one color per row in the order red, yellow, cyan, magenta, hotpink, green.
- [x] The paddle moves with Arrow keys, A/D and the mouse, and never leaves the canvas.
- [x] The ball starts on the paddle and follows it until Space or click is pressed.
- [x] After launch, the ball bounces off the left wall, right wall, ceiling and paddle with a mirror reflection and constant speed.
- [x] The ball never launches horizontally or straight down.
- [x] Hitting a block removes it, deflects the ball, and plays `break-sound.mp3`.
- [x] Wall, ceiling and paddle bounces play `ball-bounce.mp3`.
- [x] A destroyed block shows a 4-frame explosion in its own color for about 150 ms, then disappears.
- [x] The game starts with 3 lives, shown as the text `Lives:` followed by 3 ball sprites at the top-left of the canvas; the sprites decrease as lives are lost.
- [x] When the ball goes below the canvas with lives remaining, the counter decreases by 1, the ball returns to the paddle, and already-broken blocks stay broken.
- [x] Losing the third life shows "Game Over" and the ball stops.
- [x] Pressing Space or clicking on the game-over screen restarts with all 60 blocks, 3 lives, score 0 and the ball on the paddle.
- [x] Breaking all 60 blocks regenerates the grid and puts the ball back on the paddle, keeping the current number of lives.
- [x] `Score: N` is visible at the top-right, increases by 10 per broken block, resets to 0 on game-over restart and is kept when the grid regenerates.
- [x] A mute button is shown below the canvas; the game starts muted (`🔇 Sound: Off`) and clicking it toggles sound on/off and updates the label.
- [x] Clicking the mute button does not make Space activate it (focus is released).
- [x] The project has no dependencies, no `node_modules` and no build step.

## Decisions

- **Yes:** keyboard + mouse controls. Both are cheap and cover desktop users.
- **Yes:** 3 lives in the MVP (revised after the first draft, which had a single life). Classic default.
- **Yes:** lives shown as the `Lives:` label plus one ball sprite per life (revised from plain `Lives: N` text); uses the existing ball sprite, no new assets. Paddle-icon HUD discarded.
- **Yes:** losing a life keeps broken blocks and resets only the ball. Regenerating blocks per life was discarded as too punishing.
- **Yes:** simple score counter (10 points per block, top-right), added after the first implementation. High scores in `localStorage` remain deferred.
- **Yes:** mute button as an HTML element under the canvas, muted by default, not persisted. Browsers restrict autoplay audio anyway, and a muted start avoids surprising the player.
- **Yes:** regenerate the grid when all blocks are cleared. It keeps the game playable without needing a win screen or level system.
- **Yes:** fixed 800×600 logical canvas, CSS-centered. Deterministic physics and no resize logic.
- **Yes:** pure reflection (mirror bounce) off the paddle. Simplest model; chosen over position-dependent angles for the MVP.
- **No:** position-dependent paddle bounce. Better feel, but deferred to a later spec.
- **Yes:** all blocks 1-hit, colored rows. The gray (armored) sprite is unused for now.
- **Yes:** classic `<script>` files in `src/`, same style as `assets/spritesheet.js` and compatible with `file://`.
- **No:** ES modules (need a static server and `spritesheet.js` is not a module) and a single monolithic `game.js` (harder to extend).
- **Yes:** speeds in px/frame tied to `requestAnimationFrame`. Simple; acceptable for the MVP even though it varies on high-refresh monitors.
- **No:** delta-time physics. Deferred unless refresh-rate differences become a real problem.

## Risks

| Risk                                                                                      | Mitigation                                                                                           |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Pure reflection can lead to near-horizontal, endlessly repeating ball paths.              | Launch angle is constrained to a minimum vertical component; no extra randomization on bounce in MVP. |
| Ball tunneling through blocks/paddle at speed 6 px/frame.                                 | Block height (24) and paddle height (14) are larger than the ball speed; collisions check per frame. |
| `loadSpritesheet` uses a relative path, so it fails if the page is not served from root.  | `index.html` lives at the project root; document in the README to open or serve from there.          |
| Browsers block audio until a user gesture.                                                | Sounds only play after launch (Space/click), which is already a user gesture.                        |
| px/frame speed differs on 120/144 Hz displays.                                            | Accepted for the MVP; noted as a possible follow-up (delta-time).                                    |

## Future work (known, not implemented here)

Candidates for later specs, each to be written separately:

- High scores persisted in `localStorage` (and possibly per-row/color point values).
- Win screen and multiple levels with different layouts.
- Multi-hit gray blocks.
- Position-dependent paddle bounce angle.
- Power-ups.
- Pause and start menu.
- Persisting the mute setting.

## What is **not** in this spec

- High scores.
- Win screen and multiple levels.
- Armored/multi-hit blocks and power-ups.
- Position-dependent paddle bounce.
- Pause, menus, mobile/touch support, responsive canvas.
- Tests, linter, bundler or any dependency.

Each one of those, if it lands, goes in its own spec.
