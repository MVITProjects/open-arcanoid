# Arkanoid

A classic Arkanoid / Breakout arcade game built with plain **HTML, CSS, and JavaScript** — zero dependencies, no npm, no bundler, and no framework. Open it in a browser and play.

> **Status:** Specs 01–04 implemented — 5 levels with a win screen, angled paddle bounce with impact animation, score, sound with a mute toggle, and pause.

## Features

- **Classic arcade gameplay** on an 800×600 HTML5 `<canvas>` rendered from a single spritesheet.
- **5 levels** defined as character grids in `src/levels.js`, played in sequence with a "Level N" banner and HUD, followed by a **"You Win!"** screen.
- **Angled paddle bounce:** the exit angle depends on where the ball hits the paddle (up to 60° from vertical, constant speed); side hits reflect horizontally.
- **Impact animation:** paddle squash & stretch, white flash and ball squash on every paddle bounce.
- **Color-matched 4-frame explosions** when a block breaks.
- **Score** (10 points per block) and **3 lives** shown in the HUD; broken blocks persist when you lose a life.
- **Pause** with `P` or `Esc`, and automatically when the window loses focus or the tab is hidden. Animations freeze and resume exactly where they stopped.
- **Dual controls:** seamless switching between keyboard and mouse.
- **Sound effects** for bounces and block breaks (overlapping), with a mute button. The game starts muted.
- **Zero dependencies:** vanilla classic scripts — no build step, no bundler, no `node_modules`.

## Controls

| Action | Keyboard | Mouse |
| --- | --- | --- |
| Move paddle left / right | `←` / `→` or `A` / `D` | Move cursor horizontally over canvas |
| Launch ball | `Space` | Left click |
| Pause / resume | `P` or `Esc` | — |
| Restart after Game Over or Win | `Space` | Left click |
| Toggle sound | — | Click the "Sound" button below the canvas |

While paused, only `P` or `Esc` resume the game.

## Getting Started

Because the spritesheet and audio paths are relative to the project root, open or serve the game from the root directory.

**Option 1 — Static server (recommended):**

```sh
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

**Option 2 — Open directly:**

Open `index.html` directly in your browser (note: some browsers restrict audio or canvas asset loading over `file://`).

## Project Structure

```text
.
├── index.html                      # Entry point (800×600 canvas + ordered <script> tags)
├── style.css                       # Dark viewport styling and canvas centering
├── assets/
│   ├── spritesheet-breakout.png    # Spritesheet for paddle, ball, blocks, and explosions
│   ├── spritesheet.js              # Sprite rects + loadSpritesheet / drawSprite / drawFrame
│   └── sounds/
│       ├── ball-bounce.mp3         # Wall, ceiling, and paddle bounce SFX
│       └── break-sound.mp3         # Block break SFX
├── src/
│   ├── config.js                   # Tunable game constants (dimensions, speeds, lives, bounce tuning)
│   ├── levels.js                   # Color legend and the 5 level layouts
│   ├── input.js                    # Keyboard + mouse input handling (incl. pause keys)
│   ├── audio.js                    # Sound playback with node cloning for overlapping SFX
│   ├── game.js                     # Game state, phases, physics, collisions, pause, and rendering
│   └── main.js                     # Canvas setup, auto-pause listeners, and animation loop
├── specs/
│   ├── 01-arkanoid-mvp.md          # Playable MVP
│   ├── 02-paddle-bounce-feel.md    # Angle physics + impact animation
│   ├── 03-levels.md                # Multiple levels + win screen
│   ├── 04-pause.md                 # Pause and auto-pause
│   └── .spec-config.yml            # /spec-impl workflow flags
├── used-prompts/
│   └── prompts.md                  # Log of prompts used during development
├── .agents/skills/                 # Spec-driven workflow skills
└── CLAUDE.md                       # Repository guidance for Claude Code
```

## Architecture & Configuration

- **Classic `<script>` loading:** Files share the global scope with no ES modules, so script order in `index.html` matters:
  `assets/spritesheet.js` → `src/config.js` → `src/levels.js` → `src/input.js` → `src/audio.js` → `src/game.js` → `src/main.js`.
- **Frame-based loop:** Physics run inside `requestAnimationFrame` with speeds defined in pixels per frame; explosion and paddle-impact animations are timed with `performance.now()` (and shifted on resume after a pause).
- **Game phases:** `ready` → `playing` ⇄ `paused`, ending in `gameover` or `win`.
- **Easy tuning:** Adjust canvas size, starting lives, paddle/ball speeds, grid dimensions, or paddle bounce tuning in `src/config.js`; edit level layouts in `src/levels.js`.

## Development Workflow

Features are developed spec-first using the local workflow skills in `.agents/skills/`:

1. `/spec <description>` — drafts a new specification in `specs/NN-slug.md` (status: `Draft`).
2. Review and approve the spec by updating its status from `Draft` to `Approved`.
3. `/spec-impl <NN-slug>` — implements the approved spec step by step on a `spec-NN-slug` branch. When done, the spec's status becomes `Implemented`.

## Roadmap

Ideas not yet covered by a spec:

- `localStorage` high scores
- Multi-hit armored (gray) blocks
- Power-ups (wider paddle, multi-ball, laser, slow ball)
- Difficulty progression (ball speed per level)
- Start screen, touch / mobile controls, responsive canvas
