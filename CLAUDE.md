# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commands

```bash
npm start              # Expo dev server (choose platform interactively)
npm run web            # Start on web browser
npm run ios            # Start on iOS simulator
npm run android        # Start on Android emulator
npx tsc --noEmit       # Type-check (no test suite exists)
eas build --platform ios|android --profile development|preview|production
```

No linter is configured. TypeScript strict mode is the primary correctness tool.

---

## Architecture

MaxMonk ("Clarity") is a cross-platform Eisenhower Matrix task manager (iOS / Android / Web) using React Native + Expo 54, TypeScript strict, Zustand, and AsyncStorage.

### Navigation model

**No `@react-navigation` — all removed.** Navigation is a custom context in [`src/clearday/ClarityApp.tsx`](src/clearday/ClarityApp.tsx):

- `screen` state (`'matrix' | 'active' | 'hold' | 'vault' | 'settings' | 'completed'`) controls which full-screen view is rendered.
- `panel` state (`'add' | 'edit' | 'sparks' | 'more' | 'mitSelector' | 'bubbleAction' | null`) controls which sheet/modal overlays the screen.
- `NavCtx` (React context) exposes `goTo`, `openPanel`, `closePanel`, `back`, `showToast`, plus setters for `editAgendaId`, `bubbleActionId`, `addSheetPreset`.
- Mobile: floating pill (3 icons) appears on touch, auto-hides after 2.5 s. Wide screens (≥768 px): left sidebar instead.
- The `reflect` / Reflection screen is **intentionally hidden** from all navigation — the file exists but must not be linked anywhere (see `MaxMonk_b1_McK_MB.md` §B.8).

### State and storage

All business logic lives in [`src/clearday/store.ts`](src/clearday/store.ts) (single Zustand store). Screens/components subscribe and call store actions directly — there is no intermediate service layer.

Persistence is via [`src/clearday/storage.ts`](src/clearday/storage.ts) which wraps AsyncStorage. `bootstrap()` runs once on mount, loads all data, applies hold/vault expiry policies, and normalises tags.

A one-time migration from legacy SQLite v0 data runs in [`src/clearday/migration.ts`](src/clearday/migration.ts).

### Coordinate system (critical)

Tasks have `cx` and `cy` in the range **0–1**, representing normalized position on the matrix canvas. Quadrant is derived dynamically via `qFromPos(cx, cy)` in [`src/clearday/helpers.ts`](src/clearday/helpers.ts) — it is **not stored**.

- `cx > 0.5 && cy < 0.5` → Q1 (Do Now, urgent+important)
- `cx ≤ 0.5 && cy < 0.5` → Q2 (Schedule)
- `cx > 0.5 && cy ≥ 0.5` → Q3 (Delegate)
- `cx ≤ 0.5 && cy ≥ 0.5` → Q4 (Eliminate)

The add/edit sheet converts urgency/importance sliders (5–95) to cx/cy via `posFromSliders()`. Bubble pixel positions are computed as `cx * canvasWidth` inside the component after `onLayout`.

### Theme and fonts

Theme tokens (colors, washes, axis lines) are resolved at render time via `resolveTheme(config.themeMode, systemScheme)` in [`src/clearday/theme.ts`](src/clearday/theme.ts). Light mode is the design baseline; tokens are passed as `tokens` props to every screen and component — **never import tokens directly inside screens**.

Font families are selected per `config.fontChoice` via `getFontSet()` in [`src/clearday/fonts.ts`](src/clearday/fonts.ts). All font sizes go through `fontScale(base, fontSizeMultiplier)` from [`src/clearday/scale.ts`](src/clearday/scale.ts).

### AI

[`src/clearday/aiStub.ts`](src/clearday/aiStub.ts) provides `suggestFromSpark`, `reflectDay`, and `pulse` — all are deterministic stubs with no network calls. Do not replace with real API calls (Segment B / Phase 2).

### Spec documents

- [`MaxMonk_b1_McK_MB.md`](MaxMonk_b1_McK_MB.md) — authoritative Phase 1 implementation spec. **Segment A** = implement; **Segment B** = do not touch.
- [`src/docs/release-hardening-checklist.md`](src/docs/release-hardening-checklist.md) — pre-release QA gates.
