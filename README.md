# Arkanoid Game

A classic Arkanoid / Breakout clone built with plain **HTML, CSS and JavaScript** — zero dependencies, no npm, no bundler, no framework. Open it in a browser and play.

> **Status:** work in progress. The game itself is not implemented yet; only the assets and the spec-driven tooling exist so far.

## Gameplay (planned)

- Move the paddle to bounce the ball and keep it in play.
- Break every block to clear the level.
- Blocks come in several colors and play an explosion animation when destroyed.
- Sound effects for ball bounces and block breaks.

## Tech

- Rendering on an HTML `<canvas>` with a single spritesheet.
- Vanilla JavaScript loaded via plain `<script>` tags (no modules, no build step).
- No tests or linter yet.

## Project structure

```
.
├── assets/
│   ├── spritesheet-breakout.png   # paddle, ball, blocks and explosion frames
│   ├── spritesheet.js             # sprite rects + loadSpritesheet / drawSprite / drawFrame helpers
│   └── sounds/
│       ├── ball-bounce.mp3
│       └── break-sound.mp3
├── specs/                         # feature specs (created with /spec)
├── .agents/skills/                # spec-driven workflow skills
├── CLAUDE.md                      # guidance for Claude Code
└── prompts.md                     # log of prompts used in the project
```

## Running

Once `index.html` exists, open it directly in a browser, or serve the project root with any static server (the spritesheet path is relative to the project root), for example:

```sh
python3 -m http.server
```

## Development workflow

Features are developed spec-first using Claude Code skills:

1. `/spec <description>` — writes a draft spec to `specs/NN-slug.md`.
2. Review and approve the spec (change its status from `Draft`).
3. `/spec-impl <NN-slug>` — implements the approved spec step by step on a `spec-NN-slug` branch.
