# Arkanoid

A classic Arkanoid / Breakout arcade game built with plain **HTML, CSS, and JavaScript** — zero dependencies, no npm, no bundler, and no framework. Open it in a browser and play.

> **Status:** Playable MVP ([Spec 01](specs/01-arkanoid-mvp.md)) — single regenerating level, 3 lives, sound effects, and block explosion animations.

## Features

- **Classic arcade gameplay** on an 800×600 HTML5 `<canvas>` rendered from a single spritesheet.
- **60 colored blocks** (6 rows × 10 columns) with 4-frame, color-matched explosion animations on impact.
- **Dual controls:** seamless switching between keyboard and mouse.
- **Overlapping sound effects** for wall/paddle bounces and block breaks.
- **3 lives & endless loop:** broken blocks persist when you lose a life, clearing all 60 blocks regenerates the grid, and losing all lives triggers a Game Over screen with instant restart.
- **Zero dependencies:** vanilla classic scripts — no build step, no bundler, no `node_modules`.

## Controls

| Action | Keyboard | Mouse |
| --- | --- | --- |
| Move paddle left / right | `←` / `→` or `A` / `D` | Move cursor horizontally over canvas |
| Launch ball | `Space` | Left click |
| Restart after Game Over | `Space` | Left click |

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
│   ├── config.js                   # Tunable game constants (dimensions, speeds, lives, colors)
│   ├── input.js                    # Keyboard + mouse input handling
│   ├── audio.js                    # Sound playback with node cloning for overlapping SFX
│   ├── game.js                     # Game state, physics, collisions, and canvas rendering
│   └── main.js                     # Canvas setup, spritesheet bootstrap, and animation loop
├── specs/
│   └── 01-arkanoid-mvp.md          # Feature specifications
├── used-prompts/
│   └── prompts.md                  # Log of prompts used during development
├── .agents/skills/                 # Spec-driven workflow skills
└── CLAUDE.md                       # Repository guidance for Claude Code
```

## Architecture & Configuration

- **Classic `<script>` loading:** Files share the global scope with no ES modules, so script order in `index.html` matters:
  `assets/spritesheet.js` → `src/config.js` → `src/input.js` → `src/audio.js` → `src/game.js` → `src/main.js`.
- **Frame-based loop:** Physics run inside `requestAnimationFrame` with speeds defined in pixels per frame; explosion animations are timed with `performance.now()`.
- **Easy tuning:** Adjust canvas size, starting lives, paddle/ball speeds, grid dimensions, or row colors in `src/config.js`.

## Development Workflow

Features are developed spec-first using the local workflow skills in `.agents/skills/`:

1. `/spec <description>` — drafts a new specification in `specs/NN-slug.md` (status: `Draft`).
2. Review and approve the spec by updating its status from `Draft` to `Approved`.
3. `/spec-impl <NN-slug>` — implements the approved spec step by step on a `spec-NN-slug` branch.

## Roadmap

Planned ideas for future specs (see [Spec 01](specs/01-arkanoid-mvp.md#future-work-known-not-implemented-here)):

- Score counter and `localStorage` high scores
- Multiple levels, custom layouts, and win screen
- Multi-hit armored (gray) blocks
- Position-dependent paddle bounce angles
- Power-ups (wider paddle, multi-ball, laser, slow ball)
- Pause menu, start screen, and mute toggle
