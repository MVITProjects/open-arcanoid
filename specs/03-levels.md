# SPEC 03 — Multiple Levels

> **Status:** Implemented
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-11-25
> **Objective:** Replace the single regenerating grid with 5 data-driven block layouts played in sequence, a "Level N" banner before each one and a win screen after the last.

---

## Scope

**In:**

- A new file `src/levels.js` with a `LEVELS` array of 5 layouts. Each layout is an array of strings (one string per block row, one character per column, 10 columns).
- Character legend: `.` = empty cell; `r` red, `y` yellow, `c` cyan, `m` magenta, `h` hotpink, `g` green. All blocks stay 1-hit.
- `createBlocks()` builds the grid from a level layout instead of from `CONFIG.ROW_COLORS`.
- `state.level` (1-based) tracks the current level. Level 1 is the current 6-row layout, so the first level looks exactly like today's game.
- When all blocks of a level are cleared (and no explosion is pending): if there is a next level, load it and reset the ball onto the paddle (`phase: "ready"`); lives and score are kept.
- If the cleared level was the last one: `phase: "win"`, ball stopped, overlay "You Win!" with the final score and "Press Space or click to restart". Space/click calls `resetGame()` (level 1, 3 lives, score 0).
- "Level N" banner drawn in the center of the canvas (below the block area) while `phase === "ready"`, together with the launch hint. It also shows after losing a life.
- "Level N" HUD text at the top-center of the canvas, always visible.
- `resetGame()` also resets `state.level` to 1.
- Update `index.html` (load `src/levels.js`) and `CLAUDE.md` (architecture notes).

**Out of scope (for future specs):**

- Difficulty changes beyond layout (ball speed per level, fewer lives, wider/narrower paddle).
- Armored / multi-hit gray blocks and any new block types.
- Power-ups.
- A dedicated "level complete" phase or transition animation.
- Level select, level skip cheats, level editor.
- Persisting progress or high scores (`localStorage`).
- Looping back to level 1 after winning (the win screen restarts instead).
- New sounds or new sprite assets.
- Tests, linter or build step.

## Data model

New file `src/levels.js` (classic script, global scope):

```js
// One string per row, 10 chars per string (CONFIG.BLOCKS.cols).
// . = empty, r/y/c/m/h/g = red/yellow/cyan/magenta/hotpink/green
const LEVEL_COLORS = {
  r: "red", y: "yellow", c: "cyan", m: "magenta", h: "hotpink", g: "green",
};

const LEVELS = [
  // 1 — Classic: the original 6 full rows
  ["rrrrrrrrrr", "yyyyyyyyyy", "cccccccccc", "mmmmmmmmmm", "hhhhhhhhhh", "gggggggggg"],
  // 2 — Pyramid
  ["....rr....", "...yyyy...", "..cccccc..", ".mmmmmmmm.", "hhhhhhhhhh", "gggggggggg"],
  // 3 — Checkerboard
  ["r.r.r.r.r.", ".y.y.y.y.y", "c.c.c.c.c.", ".m.m.m.m.m", "h.h.h.h.h.", ".g.g.g.g.g"],
  // 4 — Frame
  ["rrrrrrrrrr", "y........y", "c.hhhhhh.c", "m.hhhhhh.m", "g........g", "gggggggggg"],
  // 5 — Dense weave (8 rows)
  ["rrrrrrrrrr", "yyyyyyyyyy", "cccccccccc", "m.m.m.m.m.",
   ".h.h.h.h.h", "m.m.m.m.m.", ".h.h.h.h.h", "gggggggggg"],
];
```

The layouts above are the initial content; they can be retuned while playing without changing the format.

Changes to existing structures:

```js
// src/config.js — BLOCKS.rows and ROW_COLORS are removed (the layout defines them);
// BLOCKS.cols, w, h, gap, offsetX, offsetY stay.

// src/game.js
const state = {
  // ...existing keys unchanged...
  phase: "ready",   // "ready" | "playing" | "gameover" | "win"   ("win" is new)
  level: 1,         // 1-based index into LEVELS
};
// createBlocks(levelNumber) -> same block objects as before: { x, y, w, h, color, alive }
```

Conventions:

- Block position: `x = offsetX + col * (w + gap)`, `y = offsetY + row * (h + gap)`, same as SPEC 01. A layout may have between 1 and 8 rows (8 rows end at y = 284, well above the paddle).
- Every layout must contain at least one block; every row string must be exactly `CONFIG.BLOCKS.cols` characters long.
- The level is cleared when no block is `alive` and `state.explosions` is empty (same rule as SPEC 01).
- Score and lives persist across levels; only `resetGame()` resets them.
- `src/levels.js` loads after `src/config.js` and before `src/game.js`.

## Implementation plan

1. Create `src/levels.js` with `LEVEL_COLORS` and `LEVELS`, and add its `<script>` to `index.html` between `src/config.js` and `src/game.js`. Manual test: page loads, console clean, game plays exactly as before.
2. `src/game.js` + `src/config.js`: change `createBlocks()` to take a level number and build blocks from `LEVELS[level - 1]`; add `state.level = 1`; remove `BLOCKS.rows` and `ROW_COLORS` from `CONFIG`; `resetGame()` sets `state.level = 1`. Manual test: level 1 renders the same 60 blocks and colors as before; restart after game over still works.
3. `src/game.js` (`updateGame`): on level clear, advance `state.level` and load the next layout with the ball back on the paddle; keep lives and score. Manual test: temporarily clear level 1 (e.g. by lowering block count in the layout) and see level 2's pyramid appear with lives/score intact.
4. `src/game.js`: add `phase: "win"` when the last level is cleared (ball stopped, `paddleHit` cleared); `handleAction()` calls `resetGame()` in that phase; draw the "You Win!" overlay with final score and restart hint. Manual test: clear level 5, see the overlay, press Space/click and be back on level 1 with 3 lives and score 0.
5. `src/game.js` (`drawGame`): draw the "Level N" HUD text at the top-center and the "Level N" banner with launch hint while `phase === "ready"`. Manual test: banner shows at start, after losing a life and after each level change; it disappears on launch; HUD shows the correct level number.
6. Final pass: play all 5 levels, check each layout renders inside the canvas and is clearable, retune layouts if needed, and update `CLAUDE.md` (new `src/levels.js`, new script order, `win` phase, removed `ROW_COLORS`). Manual test: full playthrough 1→5→win→restart with no console errors.

## Acceptance criteria

- [x] Opening `index.html` (or serving the project root) shows level 1 with the same 60 blocks and colors as SPEC 01, and no console errors.
- [x] `LEVELS` contains exactly 5 layouts, each row string is 10 characters long, and each layout has at least one block.
- [x] Breaking all blocks of level N (N < 5) loads level N+1's layout, resets the ball onto the paddle (`phase: "ready"`) and keeps lives and score.
- [x] Broken blocks of a previous level never appear in the next one.
- [x] A "Level N" banner with the launch hint is visible while the ball is on the paddle and disappears when the ball is launched.
- [x] A "Level N" text is visible at the top-center of the canvas at all times (except under the game-over/win overlay dimming).
- [x] Breaking all blocks of level 5 shows the "You Win!" overlay with the final score, and the ball stops.
- [x] Pressing Space or clicking on the win screen restarts at level 1 with 3 lives, score 0 and the ball on the paddle.
- [x] Losing all lives on any level shows "Game Over", and restarting returns to level 1 with the level 1 layout.
- [x] Losing a life keeps the current level and its already-broken blocks.
- [x] Paddle bounce animation (SPEC 02) is not left in progress after a level change or the win screen.
- [x] Every layout fits inside the canvas (no block below y = 300 or outside x ∈ [0, 800]).
- [x] The project still has no dependencies, build step or new assets.

## Decisions

- **Yes:** char-grid layouts in `src/levels.js`. Readable and editable by eye, supports non-rectangular shapes, no code per level.
- **No:** procedural generation. Less control over how each level looks and harder to tune.
- **Yes:** 5 levels in this spec. Enough to show variety (full, pyramid, checkerboard, frame, dense) without a long design phase.
- **Yes:** level 1 is the original 6-row grid, so SPEC 01's feel is the baseline.
- **Yes:** difficulty comes only from layout. Ball speed scaling and armored blocks are separate balancing decisions and deserve their own specs.
- **Yes:** win screen after level 5, restarting via Space/click as in game over. Gives the game an ending; reuses the existing restart flow.
- **No:** looping back to level 1 (with or without more speed). Endless mode can come later as its own spec.
- **Yes:** "Level N" banner shown in the existing `ready` phase. No new phase for transitions, so the loop and `handleAction()` change minimally. Side effect: it also shows after losing a life, which is acceptable.
- **No:** a dedicated "level complete" phase or overlay. More states for little gain at this stage.
- **Yes:** score and lives carry over between levels. Matches the previous grid-regeneration behavior.
- **Yes:** remove `CONFIG.BLOCKS.rows` and `CONFIG.ROW_COLORS`. The layout is the single source of truth; keeping them would leave dead, misleading constants.
- **Yes:** new `win` phase value. The only place that needs it is `handleAction()`, `updateGame()` and `drawGame()`.

## Risks

| Risk                                                                                 | Mitigation                                                                                   |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| A layout with unreachable blocks (enclosed by others) makes a level impossible.      | Every block must be reachable by breaking blocks from the outside; verify during step 6.    |
| Sparse layouts (checkerboard) let the ball slip behind blocks and bounce for a while. | Accepted; layouts are data and can be tuned. Ceiling and walls keep the ball in play.        |
| A malformed row string (wrong length or unknown char) silently misaligns blocks.      | `createBlocks()` ignores unknown chars as empty cells; length is checked manually in step 6. |
| Removing `BLOCKS.rows` / `ROW_COLORS` breaks leftover references.                     | Grep for both names in step 2 before finishing.                                              |

## What is **not** in this spec

- Ball speed, lives or paddle changes per level.
- Armored/multi-hit blocks, power-ups or any new block type.
- Level select, level editor or persisted progress.
- High scores.
- Endless/looping mode after the last level.
- Tests, linter, bundler or any dependency.

Each one of those, if it lands, goes in its own spec.
