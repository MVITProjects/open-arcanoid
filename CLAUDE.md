# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Goal: an Arkanoid game in plain HTML, CSS and JavaScript with **zero dependencies** (no npm, bundler or framework). The game itself is **not implemented yet** — there is no `index.html`, no build step, no tests and no linter. Only assets and the spec-driven tooling exist so far. Don't invent build/test commands; open `index.html` directly in a browser (or any static server) once it exists.

The repo is not a git repository yet (`git init` is needed before the `/spec-impl` branch workflow can work).

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
