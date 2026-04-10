# AGENTS.md

This file provides guidance to Codex and other coding agents when working in this repository.

## Commands

```bash
npm start              # Expo dev server
npm run web            # Start on web browser
npm run ios            # Start on iOS simulator
npm run android        # Start on Android emulator
npx tsc --noEmit       # Type-check (primary validation; no formal test suite)
eas build --platform ios|android --profile development|preview|production
```

No linter is configured. TypeScript strict mode is the main correctness check.

## Project Overview

MaxMonk ("Clarity") is a cross-platform Eisenhower Matrix task manager for iOS, Android, and Web. The app uses React Native + Expo 54, TypeScript strict mode, Zustand for app state, and AsyncStorage for persistence.

## Core Architecture

### Navigation model

There is no `@react-navigation`.

Navigation is handled inside [src/clearday/ClarityApp.tsx](/workspaces/MaxMonk/src/clearday/ClarityApp.tsx):

- `screen` controls the full-screen view: `'matrix' | 'active' | 'hold' | 'vault' | 'settings' | 'completed'`
- `panel` controls overlays: `'add' | 'edit' | 'more' | 'mitSelector' | 'bubbleAction' | null`
- `NavCtx` exposes `goTo`, `openPanel`, `closePanel`, `back`, `showToast`, and panel-target helpers
- Mobile uses a floating pill; wide screens (`>= 768px`) render a left sidebar instead

Historical note: [src/clearday/navigation.ts](/workspaces/MaxMonk/src/clearday/navigation.ts) still contains older panel names that do not match the live app shell. Treat `ClarityApp.tsx` as the current navigation source of truth.

### State and persistence

Business logic lives primarily in [src/clearday/store.ts](/workspaces/MaxMonk/src/clearday/store.ts), which is the main Zustand store used directly by screens and components.

Persistence is implemented in [src/clearday/storage.ts](/workspaces/MaxMonk/src/clearday/storage.ts), backed by AsyncStorage. `bootstrap()` loads persisted data, applies hold/vault policies, and normalizes config values such as tags.

A legacy migration path exists in [src/clearday/migration.ts](/workspaces/MaxMonk/src/clearday/migration.ts).

### Matrix coordinate system

Tasks use normalized coordinates `cx` and `cy` in the `0..1` range. Quadrants are derived dynamically via `qFromPos()` in [src/clearday/helpers.ts](/workspaces/MaxMonk/src/clearday/helpers.ts); quadrant should not be treated as an independent persisted source of truth.

- `cx > 0.5 && cy < 0.5` -> `Q1`
- `cx <= 0.5 && cy < 0.5` -> `Q2`
- `cx > 0.5 && cy >= 0.5` -> `Q3`
- `cx <= 0.5 && cy >= 0.5` -> `Q4`

The add/edit sheet maps sliders to positions with `posFromSliders()`. Visual bubble placement is calculated from canvas dimensions in the UI layer.

### Theme and fonts

Theme tokens are resolved with `resolveTheme()` in [src/clearday/theme.ts](/workspaces/MaxMonk/src/clearday/theme.ts). Prefer passing resolved `tokens` through props rather than importing color values directly into screens.

Fonts are selected through [src/clearday/fonts.ts](/workspaces/MaxMonk/src/clearday/fonts.ts), and font scaling goes through [src/clearday/scale.ts](/workspaces/MaxMonk/src/clearday/scale.ts).

## Current Product Notes

- `DEFAULT_TAGS` is `['Pro', 'Per']`
- `TAG_MAX_LENGTH` is `3`
- `vaultRetentionDays` defaults to `0`, meaning "Never auto-delete"
- The current app includes `CompletedScreen`
- `Sparks`, `Reflection`, and `aiStub.ts` are not part of the active product surface anymore

There are still a few stale references to removed concepts in support files:

- [src/clearday/navigation.ts](/workspaces/MaxMonk/src/clearday/navigation.ts)
- [src/clearday/helpers.ts](/workspaces/MaxMonk/src/clearday/helpers.ts)
- [src/docs/release-hardening-checklist.md](/workspaces/MaxMonk/src/docs/release-hardening-checklist.md)

Avoid reintroducing removed features unless the user explicitly asks for that work.

## Working Guidance

- Prefer updating existing patterns rather than introducing new state layers
- Treat [src/clearday/ClarityApp.tsx](/workspaces/MaxMonk/src/clearday/ClarityApp.tsx) and [src/clearday/store.ts](/workspaces/MaxMonk/src/clearday/store.ts) as the key integration points before making structural changes
- Validate changes with `npx tsc --noEmit`
- If a spec or design doc is mentioned in older notes, verify that it still exists before relying on it; the previously referenced `MaxMonk_b1_McK_MB.md` was not present in the repository during this update
