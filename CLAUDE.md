# CLAUDE.md

Single source of truth for Claude/Codex takeover in this repository.

## Project Snapshot

MaxMonk (Clarity) is a cross-platform Eisenhower Matrix task manager built with React Native + Expo 54, TypeScript strict mode, Zustand, AsyncStorage, and `react-native-svg`.

Core command checks:

```bash
npm start
npm run web
npx tsc --noEmit
```

No lint pipeline is configured; TypeScript check is the primary correctness gate.

## Architecture Source of Truth

- App shell and navigation: `src/clearday/ClarityApp.tsx`
- Business logic and persistence orchestration: `src/clearday/store.ts`
- Persistence adapters/defaults: `src/clearday/storage.ts`
- Shared data types/constants: `src/clearday/types.ts`

Navigation is custom (`NavCtx`), not `@react-navigation`:

- `Screen`: `matrix | active | hold | vault | settings | completed`
- `Panel`: `add | edit | more | mitSelector | bubbleAction | null`

Use `ClarityApp.tsx` as the canonical navigation truth. `src/clearday/navigation.ts` still contains stale legacy names and should not drive current feature work.

## Working Conventions

- Prefer updating existing patterns over introducing new state layers.
- Keep theme usage token-driven via props (`tokens`) instead of hardcoding colors.
- Keep typography aligned with `getFontSet(...)` and `fontScale(...)`.
- Respect safe areas in all screens and sheets.
- Validate significant changes with `npx tsc --noEmit`.

## Data and Behavior Notes

- Default tags: `['Pro', 'Per']`
- `TAG_MAX_LENGTH`: `3`
- `vaultRetentionDays` default: `0` (Never auto-delete)
- Matrix coordinates (`cx`, `cy`) are normalized in `0..1`.
- Quadrant should be derived from position (`qFromPos`) rather than treated as independent truth.
- Add/edit positioning uses `posFromSliders(...)` and inverse `slidersFromPos(...)`.

## Current Product Surface

Active screens/features currently in scope:

- Matrix
- Active
- Hold
- Vault/Archive
- Settings
- Completed

Removed/legacy concepts to avoid reintroducing unless explicitly requested:

- Sparks
- Reflection
- `aiStub.ts`

## Recent Consolidated Work (Current Branch Context)

The consolidated interaction and visual pass has been implemented in this branch:

- Quadrant naming presets selectable from Settings via compact one-line bottom-sheet rows.
- Urgency/importance now use custom controlled slider visuals (0..100) in add/edit.
- Matrix double-tap add preset maps to 0..100 urgency/importance.
- On-hold items are kept out of matrix active visualization flow.
- Completion copy standardized to `Marked Completed`.
- Completed rows no longer show a redundant edit icon; row tap opens edit.
- Toast is style-aware, moved higher, and shortened in dwell.
- Active/Hold list reordering moved to long-press row drag pattern.
- Active cross-section reorder updates quadrant and anchors `cx/cy` to destination quadrant defaults.
- Matrix bubbles support outline-grab resize with snapping across effort levels.
- Bubble position sync after edit updates is fixed through prop-driven animated resync.

Important note:

- Static/type verification passes (`npx tsc --noEmit`), but gesture-heavy behavior still benefits from runtime QA on iOS/Android/Web.

## Manual QA Checklist (Recommended Before Release)

1. Settings > Quadrants
   - Select each preset, verify one-line row rendering and persisted labels after relaunch.
2. Matrix double-tap add
   - Validate urgency/importance presets near quadrant boundaries.
3. Add/Edit sliders
   - Confirm thumb/fill/values stay synced in add/edit/reopen flows.
4. Active/Hold reordering
   - Verify long-press reorder reliability, scroll coexistence, and persistence.
5. Active cross-quadrant reorder
   - Confirm `quadrant`, `cx`, `cy` update and persist.
6. Bubble resize
   - Outline-grab only, live preview visible, snap on release.
7. Style checks
   - Keyboard seam blending and toast appearance across tinted/editorial/paper.
8. Regression checks
   - Hold/archive/complete/restore flows from list and action sheet.

## Known Stale References

The following files may still contain old references and should be treated cautiously:

- `src/clearday/navigation.ts`
- `src/clearday/helpers.ts` (legacy storage key references)
- `src/docs/release-hardening-checklist.md`

## Archived Context Files

Earlier planning and handoff docs have been archived under:

- `docs/archive-md/AGENTS.md`
- `docs/archive-md/HANDOFF.md`
- `docs/archive-md/plan.md`

## Archive Policy

- Keep only `CLAUDE.md` as the active top-level context file in repo root.
- Do not create new root-level planning/handoff markdown files (for example `plan.md`, `handoff.md`, `notes.md`).
- Place temporary planning notes under `docs/archive-md/` or a feature-specific subfolder under `docs/`.
- If a new markdown handoff is needed for a short session, merge key takeaways back into `CLAUDE.md` and then archive that file under `docs/archive-md/`.
- When context conflicts, treat `CLAUDE.md` as the authoritative source and archived files as historical reference only.

Use this file (`CLAUDE.md`) as the only active top-level handoff and operating context.
