# MaxMonk / Clarity — Handoff Context

## Project
Cross-platform Eisenhower Matrix task manager (iOS/Android/Web). React Native + Expo 54, TypeScript strict, Zustand store, AsyncStorage. No react-navigation — custom NavCtx in `src/clearday/ClarityApp.tsx`.

## Key architecture
- `src/clearday/ClarityApp.tsx` — root, NavCtx, pill, Screen/Panel state
- `src/clearday/store.ts` — all business logic (single Zustand store)
- `src/clearday/types.ts` — all types, AppConfig, DEFAULT_TAGS
- `src/clearday/theme.ts` — light/dark tokens (passed as props, never imported in screens)
- `src/screens/MatrixScreen.tsx` — main canvas, bubbles, filter chips
- `src/components/AddEditSheet.tsx` — add/edit bottom sheet
- `src/screens/ActiveScreen.tsx`, `HoldScreen.tsx`, `VaultScreen.tsx`, `SettingsScreen.tsx`

## What was done in this session (in order)

### Batch 5
1. **Vault retention** — options changed to `[15d, 60d, Never]`, default = Never (0). Label "Auto-clears after" → "Delete after".
2. **Pill per-style appearance** — `getPillAppearance()` returns different bg/border per matrixStyle (tinted/editorial/paper). Icon strokeWidth 1.5 → 1.75.
3. **Agenda Tags** — `TAG_MAX_LENGTH` 12→3, `DEFAULT_TAGS` → `['Pro','Per']`. `normalizeTagList` now truncates+capitalizes (migrates old "Professional"/"Personal" on bootstrap). Settings has "Agenda Tags" section: tap-to-edit inline TextInput (3-char, auto-cap), delete (if >1 tag), "+ Add tag" (max 4). Guidance: "Short codes only — e.g. Per personal, Lrn learning, Wk work, Hlt health."

### Full-screen graph layout
4. **Filter chip gap** 4→2px.
5. **Canvas full-width** — removed all padding from canvas style. SVG offsets fixed (`top:0,left:0`), `svgW=W`, `svgH=H`, `innerW/H` no longer subtract 16.
6. **Stronger bubbles** — border `'B8'`→`'BF'` (72%→75%). Wash opacities increased ~+0.02–0.03 in both light and dark tokens.

### Quadrant label fixes
7. **Paper style** — replaced edge axis labels with center watermarks at same x/y as tinted (`svgW/2±4`, `svgH/2-6/+14`), using `tokens.textGhost` opacity 0.45. Kept "urgency →" horizontal. Added "importance" label **vertical** on upper y-axis via `rotation="-90"`.
8. **Editorial opacity** 0.15→0.17 (+15%).

### Misc fixes & features
9. **QuadPreview bubble** scales with effort slider: `previewR = max(3, round(fullRadius × 80/360))`.
10. **Slider visual bug on preset** — `sliderKey` state bumped in preset `useEffect`; urgency + importance sliders keyed to it so they remount on canvas-tap preset.
11. **Pill + button** — 4th `PillButton` with `PlusIcon` SVG calls `openPanel('add')`.
12. **Hold screen + Add** — `addBar` identical to Active screen. `AddSheetPreset.addToHold?: boolean` flag; when set, `toggleHold` called immediately after `addAgenda`. New agendas go straight to hold status.
13. **Hold screen resume button** — `‹` → `+` (accent colour). Calls `toggleHold` (resumes to active).
14. **Vault screen** — `⊕` removed from left. Right buttons now: `+` (restore to active) · `↑` (restore to hold) · `✕` (delete).

## Current state of key constants
```ts
// types.ts
DEFAULT_TAGS = ['Pro', 'Per']
TAG_MAX_LENGTH = 3
// AppConfig.vaultRetentionDays default = 0 (Never)
```

## TypeScript
`npx tsc --noEmit` passes clean after all changes.

## Removed features (do NOT re-add)
- Sparks / SparksSheet — deleted
- ReflectionScreen — deleted  
- aiStub.ts — deleted
- `Panel` has no `'sparks'`; `Screen` has no `'reflect'`
