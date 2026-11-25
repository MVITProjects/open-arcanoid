# SPEC 04 — Pause

> **Status:** Approved
> **Depends on:** SPEC 01, SPEC 02, SPEC 03
> **Date:** 2026-11-25
> **Objective:** Let the player pause and resume a game in progress with P or Esc (and automatically when the window loses focus), freezing the ball, paddle and animations behind a "Paused" overlay.

---

## Scope

**In:**

- A new `phase: "paused"` in `state.phase`. It is entered only from `"playing"`.
- P and Esc toggle between `"playing"` and `"paused"`. Key auto-repeat is ignored (`e.repeat`). In any other phase (`ready`, `gameover`, `win`) both keys do nothing.
- Auto-pause: when the window loses focus (`window` `blur`) or the tab becomes hidden (`document` `visibilitychange` with `document.hidden`), a game in `"playing"` goes to `"paused"`. Resuming is always manual (P or Esc).
- While paused:
  - Ball, paddle and blocks do not update; mouse and movement keys do not move the paddle.
  - Space and click do nothing (they do not resume).
  - Explosions and the paddle-hit animation (SPEC 02) are frozen, not expired.
- On resume, the animation start times are shifted by the pause duration so animations continue exactly where they stopped.
- `drawGame` keeps drawing the frozen scene and adds a dark overlay (`rgba(0, 0, 0, 0.65)`, same as game over / win) with "Paused" and the hint "Press P or Esc to resume".
- While paused, `drawGame` evaluates animations at the pause timestamp instead of the live `performance.now()`, so nothing keeps animating under the overlay.
- Update `CLAUDE.md` (architecture notes: new phase, new keys, pause handling).

**Out of scope (for future specs):**

- Pause menu with buttons (resume / restart / quit) or any clickable UI.
- Pausing from `ready` (ball on paddle), `gameover` or `win`.
- Resuming with Space or click.
- A resume countdown ("3, 2, 1") after unpausing.
- Muting or pausing sounds that are already playing when the pause starts (they finish on their own).
- Re-attaching the paddle to the mouse position smoothly on resume (it follows the mouse again on the next frame).
- Persisting anything (`localStorage`) or remembering pause state across reloads.
- New sounds, new sprite assets, tests, linter or build step.

## Data model

New state (`src/game.js`):

```js
const state = {
  // ...existing keys unchanged...
  phase: "ready",   // "ready" | "playing" | "paused" | "gameover" | "win"   ("paused" is new)
  pausedAt: null,   // null | number   performance.now() timestamp when the pause started
};
```

New functions (`src/game.js`, global scope):

```js
pauseGame()        // playing -> paused; sets state.pausedAt = performance.now(); no-op in other phases
resumeGame()       // paused -> playing; shifts explosion and paddleHit startTime by (now - pausedAt); clears pausedAt; no-op in other phases
togglePause()      // paused ? resumeGame() : pauseGame()
```

Changes to existing code:

```js
// src/input.js — initInput(canvas, onAction, onTogglePause)
// keydown "p" / "P" / "Escape" (ignoring e.repeat) calls onTogglePause().

// src/main.js — wires initInput(canvas, handleAction, togglePause) and registers
// window "blur" and document "visibilitychange" (document.hidden) -> pauseGame().
```

Conventions:

- `resumeGame()` computes `delta = performance.now() - state.pausedAt` and adds it to `startTime` of every entry in `state.explosions` and to `state.paddleHit.startTime` (if not `null`).
- `drawGame` uses `const now = state.phase === "paused" ? state.pausedAt : performance.now()`.
- `updateGame()` does not call `updatePaddle`, `updateBall`, `updateExplosions` or `updatePaddleHit` while `phase === "paused"`, and the level-clear check only runs in `"playing"` (already the case).
- `handleAction()` has no branch for `"paused"`, so Space and click are ignored.
- `resetGame()` sets `state.pausedAt = null` (defensive; a reset cannot normally happen while paused).
- Held movement keys: `keyup` keeps updating `input.left` / `input.right` while paused, so the paddle does not get stuck moving after resume.
- No new constants in `CONFIG`; the overlay reuses the game-over style.

## Implementation plan

1. `src/game.js`: add `state.pausedAt = null` and `pauseGame()`, `resumeGame()`, `togglePause()` (with animation time-shift in `resumeGame`); `updateGame()` skips all updates while `phase === "paused"`. Manual test: from the console, `pauseGame()` freezes the ball and paddle, `resumeGame()` continues with the same trajectory.
2. `src/input.js` + `src/main.js`: P and Esc call `togglePause` (ignoring key repeat); pass `togglePause` as third argument of `initInput`. Manual test: P and Esc pause and resume during play; they do nothing in `ready`, `gameover` and `win`; Space and click do not resume.
3. `src/game.js` (`drawGame`): evaluate animations with the pause timestamp while paused and draw the dark overlay with "Paused" and "Press P or Esc to resume". Manual test: overlay shows on pause and disappears on resume; an explosion or paddle hit in progress stays frozen under the overlay and finishes after resume.
4. `src/main.js`: register `window` `blur` and `document` `visibilitychange` to call `pauseGame()`. Manual test: switching tab or window while playing pauses the game; coming back keeps it paused until P or Esc.
5. Final pass: check `resetGame()` clears `pausedAt`, play through losing a life, clearing a level and game over with pauses in between, and update `CLAUDE.md` (new `paused` phase, `pauseGame` / `resumeGame` / `togglePause`, new key bindings, `initInput` signature). Manual test: no console errors, no stuck paddle or animation after any pause/resume sequence.

## Acceptance criteria

- [ ] Pressing P during `playing` shows the "Paused" overlay and stops the ball, the paddle and all animations.
- [ ] Pressing Esc during `playing` does the same.
- [ ] Pressing P or Esc during `paused` resumes the game and the ball continues with the same direction and speed.
- [ ] Holding P or Esc (key auto-repeat) toggles pause only once.
- [ ] P and Esc do nothing in `ready`, `gameover` and `win`.
- [ ] While paused, moving the mouse or pressing movement keys does not move the paddle.
- [ ] While paused, Space and click do not resume the game.
- [ ] An explosion or paddle-hit animation in progress when pausing is neither skipped nor finished during the pause; after resuming it plays the remaining time.
- [ ] The paused overlay uses the same dim (`rgba(0, 0, 0, 0.65)`) as game over / win and shows the texts "Paused" and "Press P or Esc to resume".
- [ ] The level is not completed and no life is lost while paused.
- [ ] Switching to another tab or window during `playing` pauses the game, and coming back does not resume it.
- [ ] Losing focus during `ready`, `gameover` or `win` does not change the phase.
- [ ] A movement key released while paused is not seen as held after resuming.
- [ ] Restarting after game over or win starts a game that is not paused (`pausedAt === null`).
- [ ] The project still has no dependencies, build step or new assets.

## Decisions

- **Yes:** P and Esc as pause keys. P is the common convention in arcade games; Esc is what most players try first. Space and click stay reserved for launch / restart.
- **Yes:** pause only from `playing`. Pausing in `ready` has nothing to freeze, and `gameover` / `win` already stop the game.
- **Yes:** new `phase: "paused"` instead of a separate boolean. Reuses the existing phase checks, so `updateGame()` and `handleAction()` change minimally.
- **Yes:** resume only with P or Esc. Space and click are used while playing, so a stray click could resume the game by accident.
- **Yes:** dark overlay with "Paused" and a hint, reusing the game-over / win style. No new visual language.
- **Yes:** freeze animations by shifting `startTime` on resume and drawing at `pausedAt` while paused. Otherwise explosions would expire under the overlay and a level could complete while paused.
- **No:** letting animations keep running during the pause. Looks inconsistent (a half-played explosion vanishing) and can trigger level completion.
- **Yes:** auto-pause on window blur and on hidden tab. Avoids losing a life when the user switches window; resume stays manual so the game never restarts unexpectedly.
- **Yes:** the paddle ignores mouse and keys while paused. A moving paddle with a frozen ball is confusing; on resume it follows the mouse again.
- **Yes:** `blur` / `visibilitychange` listeners live in `src/main.js`, keyboard handling in `src/input.js`. Keeps `input.js` free of game concepts, as today.
- **No:** pause menu, resume countdown, pausing sounds. Not requested; each can be its own spec.

## Risks

| Risk                                                                                          | Mitigation                                                                                          |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Esc exits fullscreen in some browsers, so the key may do both things at once.                  | P is always available as the alternative; accepted for Esc.                                         |
| Forgetting to shift `startTime` of one animation type causes it to expire or jump on resume.   | Step 3 and the final pass test both explosions and paddle hit across a pause.                       |
| `blur` also fires when the user clicks into browser UI (e.g. the address bar) and pauses.       | Accepted: pausing is the safe outcome.                                                              |
| Mouse position jumps the paddle on resume if the mouse moved during the pause.                 | Accepted; mouse events keep updating `input.mouseX`, so the paddle snaps to it on the first frame.  |
| Both `blur` and `visibilitychange` fire when switching tabs, calling `pauseGame()` twice.      | `pauseGame()` is a no-op outside `playing`, so the second call does nothing.                        |

## What is **not** in this spec

- Pause menu, buttons or any clickable UI.
- Pausing from `ready`, `gameover` or `win`.
- Resume with Space or click, or a resume countdown.
- Muting or stopping sounds on pause.
- Persisting any state.
- Tests, linter, bundler or any dependency.

Each one of those, if it lands, goes in its own spec.
