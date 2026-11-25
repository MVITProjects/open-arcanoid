# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

An Arkanoid game in plain HTML, CSS and JavaScript with **zero dependencies** (no npm, bundler or framework). Specs 01–04 in `specs/` are all implemented: playable MVP, angled paddle bounce with impact animation, 5 levels with a win screen, and pause (see the spec index below). There is no build step, no tests and no linter — don't invent such commands.

Run it by opening `index.html` in a browser, or serve the project root (the spritesheet and sound paths are relative to it): `python3 -m http.server`. There is no automated way to verify behavior; check changes by playing in a browser.

Git: `main` is the main branch; spec work happens on `spec-NN-slug` branches.

## Architecture

Classic `<script>` tags, **no ES modules** — everything shares the global scope, so load order in `index.html` matters: `assets/spritesheet.js` → `src/config.js` → `src/levels.js` → `src/input.js` → `src/audio.js` → `src/game.js` → `src/main.js`. A new file must be added to `index.html` in the right position.

- `src/config.js` — `CONFIG` constants (canvas size, paddle/ball/block geometry and speed, lives, paddle bounce tuning).
- `src/levels.js` — `LEVEL_COLORS` legend and `LEVELS` array of 5 char-grid layouts (10 chars per row, `.` = empty cell).
- `src/input.js` — global `input` object (`left`, `right`, `mouseX`) and `initInput(canvas, onAction, onTogglePause)`. Keyboard input clears `mouseX` so mouse and keys don't fight; Space/click both call `onAction`; P and Esc (ignoring `e.repeat`) call `onTogglePause`. Mouse X is rescaled from CSS pixels to logical canvas coordinates.
- `src/audio.js` — `playSound("bounce" | "break")`, clones the `Audio` node per call so sounds can overlap.
- `src/game.js` — single mutable `state` object (`phase`: `ready` | `playing` | `paused` | `gameover` | `win`, `pausedAt`, `level`, lives, score, paddle, ball, blocks, explosions, `paddleHit`), `pauseGame()` / `resumeGame()` / `togglePause()` (freezing and time-shifting animations across pauses), `updateGame()` (per-frame logic, AABB collisions, life loss, level progression; skipped while `paused`) and `drawGame(ctx)` (blocks, paddle/ball, HUD, ready banner, paused/gameover/win overlays; evaluates animations at `pausedAt` while `paused`). `handleAction()` is the Space/click handler and does different things per phase (launch ball / restart; ignored while `paused`).
- `src/main.js` — gets the canvas, wires `initInput(canvas, handleAction, togglePause)`, registers `window` `blur` and `document` `visibilitychange` (`document.hidden`) to call `pauseGame()`, and runs the `requestAnimationFrame` loop (`clearRect` → `updateGame` → `drawGame`) only after `loadSpritesheet` calls back.

Gameplay is frame-based, not time-based: ball and paddle speeds in `CONFIG` are pixels **per frame**. Only the explosion and paddle-hit animations use `performance.now()`. Block hits destroy the block, spawn an entry in `state.explosions`, and reflect the ball on the axis of least overlap; only one block is processed per frame. A top-surface paddle bounce exits at an angle set by the hit position (up to `CONFIG.PADDLE_BOUNCE.maxAngle` from vertical, constant speed) and triggers the `paddleHit` squash/flash animation; a side hit just flips `dx`.

## Assets (`assets/`)

- `spritesheet-breakout.png` — single spritesheet for paddle, ball, blocks and explosion frames.
- `spritesheet.js` — a plain global-scope script (no modules). It must be loaded via `<script>` before game code. It defines:
  - `SPRITES` (paddle, ball, `blocks.<color>`) and `EXPLOSION_FRAMES.<color>` (4 frames each) as `{sx, sy, sw, sh}` source rects, plus `EXPLOSION_DURATION` (150 ms).
  - `loadSpritesheet(cb)` — async loads the PNG (path is hardcoded relative: `assets/spritesheet-breakout.png`, so the page must be served from the project root) and calls `cb` once ready; safe to call multiple times.
  - `drawSprite(ctx, name, x, y, w, h)` — `name` is `paddle`, `ball`, or `block_<color>`; `drawFrame(ctx, frame, x, y, w, h)` for explosion frames. Both silently no-op until the sheet has loaded.
  - Colors: gray, red, yellow, cyan, magenta, hotpink, green. Note `EXPLOSION_FRAMES.gray` reuses the red frames.
- `sounds/ball-bounce.mp3`, `sounds/break-sound.mp3` — SFX for ball bounce and block break.

## Spec-driven workflow

Every feature goes through a spec in `specs/NN-slug.md` before any code. Use the local skills in `.agents/skills/` (locked in `skills-lock.json`, sourced from `Klerith/fernando-skills`):

- `/spec <description>` — asks clarifying questions, then writes `specs/NN-slug.md` (status `Draft`) from `.agents/skills/spec/template.md`. It never writes code, and also seeds `specs/.spec-config.yml`.
- `/spec-impl <NN-slug>` — only runs if the spec's status means "Approved" (the human flips it from Draft). Creates branch `spec-NN-slug`, implements one plan step at a time pausing for review, and only commits per step if `AutoCommitSteps: true` in `specs/.spec-config.yml` (currently `false`, `AutoCreateBranch: true`; commits are then the user's call). Implement exactly what the spec says; spec changes go in the spec.

Both skills are `disable-model-invocation` — only the user starts them. Reply in the language of the user's prompt (the author writes in both Spanish and English).

### Spec lifecycle

`Draft` → `In review` → `Approved` (set by the human) → `Implemented` → optionally `Obsolete`. After the last plan step, verify the acceptance criteria and mark them `[x]`, then set the status to `Implemented`. Spec 01 uses `Finished`, a legacy label for the same thing; use `Implemented` for new specs.

### Spec structure

Header blockquote (`Status`, `Depends on`, `Date`, `Objective` in one sentence), then in order: `Scope` (**In** / **Out of scope**, both mandatory), `Data model` (real code snippets), `Implementation plan` (numbered steps, each runnable on its own, ≤ ~30–50 lines, with a manual test; the last step is a final pass that also updates `CLAUDE.md`), `Acceptance criteria` (yes/no checkboxes), `Decisions` (**Yes:**/**No:** with a reason), optional `Risks` table, and a closing `What is **not** in this spec`. Specs use concrete names (file paths, exact strings), no TODOs and no long code.

### Spec index

- `01-arkanoid-mvp.md` — playable single level, lives, score, sound with mute toggle, explosions, game over.
- `02-paddle-bounce-feel.md` — position-dependent bounce angle, side collisions, paddle squash/flash, ball squash. Depends on 01.
- `03-levels.md` — `src/levels.js`, 5 layouts, `state.level`, level banner/HUD, win screen. Depends on 01, 02.
- `04-pause.md` — `paused` phase, P/Esc, auto-pause on blur/hidden tab, frozen animations. Depends on 01–03.

### Conventions

- Branch per spec: `spec-NN-slug`; commit messages in conventional style (`feat:`, `chore:`), one per plan step, e.g. `feat: add pause state and update logic`; spec-status flips are `chore:` commits.
- When a spec changes behavior or files, its final plan step updates the Architecture section of this file.

`.claude/skills/cat-mode` is an unrelated local skill (respond like a cat). `prompts.md` and `used-prompts/prompts.md` log prompts used in the project.
