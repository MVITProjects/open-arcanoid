# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

An Arkanoid game in plain HTML, CSS and JavaScript with **zero dependencies** (no npm, bundler or framework). Spec 01 (`specs/01-arkanoid-mvp.md`, status Finished) is implemented: a single playable level. There is no build step, no tests and no linter — don't invent such commands.

Run it by opening `index.html` in a browser, or serve the project root (the spritesheet and sound paths are relative to it): `python3 -m http.server`. There is no automated way to verify behavior; check changes by playing in a browser.

Git: `main` is the main branch; spec work happens on `spec-NN-slug` branches.

## Architecture

Classic `<script>` tags, **no ES modules** — everything shares the global scope, so load order in `index.html` matters: `assets/spritesheet.js` → `src/config.js` → `src/levels.js` → `src/input.js` → `src/audio.js` → `src/game.js` → `src/main.js`. A new file must be added to `index.html` in the right position.

- `src/config.js` — `CONFIG` constants (canvas size, paddle/ball/block geometry and speed, lives, paddle bounce tuning).
- `src/levels.js` — `LEVEL_COLORS` legend and `LEVELS` array of 5 char-grid layouts (10 chars per row, `.` = empty cell).
- `src/input.js` — global `input` object (`left`, `right`, `mouseX`) and `initInput(canvas, onAction)`. Keyboard input clears `mouseX` so mouse and keys don't fight; Space/click both call `onAction`. Mouse X is rescaled from CSS pixels to logical canvas coordinates.
- `src/audio.js` — `playSound("bounce" | "break")`, clones the `Audio` node per call so sounds can overlap.
- `src/game.js` — single mutable `state` object (`phase`: `ready` | `playing` | `gameover` | `win`, `level`, lives, score, paddle, ball, blocks, explosions, `paddleHit`), `updateGame()` (per-frame logic, AABB collisions, life loss, level progression) and `drawGame(ctx)` (blocks, paddle/ball, HUD, ready banner, gameover/win overlays). `handleAction()` is the Space/click handler and does different things per phase (launch ball / restart).
- `src/main.js` — gets the canvas, wires `initInput(canvas, handleAction)`, and runs the `requestAnimationFrame` loop (`clearRect` → `updateGame` → `drawGame`) only after `loadSpritesheet` calls back.

Gameplay is frame-based, not time-based: ball and paddle speeds in `CONFIG` are pixels **per frame**. Only explosion animations use `performance.now()`. Block hits destroy the block, spawn an entry in `state.explosions`, and reflect the ball on the axis of least overlap; only one block is processed per frame. Paddle bounce is pure reflection (no angle by hit position), per the spec's out-of-scope list.

## Assets (`assets/`)

- `spritesheet-breakout.png` — single spritesheet for paddle, ball, blocks and explosion frames.
- `spritesheet.js` — a plain global-scope script (no modules). It must be loaded via `<script>` before game code. It defines:
  - `SPRITES` (paddle, ball, `blocks.<color>`) and `EXPLOSION_FRAMES.<color>` (4 frames each) as `{sx, sy, sw, sh}` source rects, plus `EXPLOSION_DURATION` (150 ms).
  - `loadSpritesheet(cb)` — async loads the PNG (path is hardcoded relative: `assets/spritesheet-breakout.png`, so the page must be served from the project root) and calls `cb` once ready; safe to call multiple times.
  - `drawSprite(ctx, name, x, y, w, h)` — `name` is `paddle`, `ball`, or `block_<color>`; `drawFrame(ctx, frame, x, y, w, h)` for explosion frames. Both silently no-op until the sheet has loaded.
  - Colors: gray, red, yellow, cyan, magenta, hotpink, green. Note `EXPLOSION_FRAMES.gray` reuses the red frames.
- `sounds/ball-bounce.mp3`, `sounds/break-sound.mp3` — SFX for ball bounce and block break.

## Spec-driven workflow

Feature work is meant to go through the local skills in `.agents/skills/` (locked in `skills-lock.json`, sourced from `Klerith/fernando-skills`):

- `/spec <description>` — asks clarifying questions, then writes `specs/NN-slug.md` (status `Draft`) from `.agents/skills/spec/template.md`. It never writes code, and also seeds `specs/.spec-config.yml`.
- `/spec-impl <NN-slug>` — only runs if the spec's status means "Approved" (the human flips it from Draft). Creates branch `spec-NN-slug`, implements one plan step at a time pausing for review, and only commits per step if `AutoCommitSteps: true` in `specs/.spec-config.yml`. Implement exactly what the spec says; spec changes go in the spec.

Both skills are `disable-model-invocation` — only the user starts them. Reply in the language of the user's prompt (the author writes in both Spanish and English).

`.claude/skills/cat-mode` is an unrelated local skill (respond like a cat). `prompts.md` and `used-prompts/prompts.md` log prompts used in the project.
