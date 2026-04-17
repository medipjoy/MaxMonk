# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

**Tech Stack**: React Native + Expo 54, TypeScript (strict), Zustand, AsyncStorage, react-native-svg

**Build & Run**:
- `npm start` — Start Expo dev server (choose `a` for Android, `i` for iOS, `w` for Web)
- `npm run web` — Start on web
- TypeScript check: `npx tsc --noEmit`

**Type Validation**: Always run `npx tsc --noEmit` after significant changes.

---

## Architecture Overview

This is a cross-platform Eisenhower Matrix task manager (Clarity/MaxMonk) with a custom navigation system built on React Context, not react-navigation.

### Core Patterns

**Navigation**: `NavCtx` (React Context) in [src/clearday/ClarityApp.tsx](src/clearday/ClarityApp.tsx)
- Union types: `Screen = 'matrix' | 'active' | 'hold' | 'vault' | 'settings' | 'completed'`
- Union type: `Panel = 'add' | 'edit' | 'more' | 'mitSelector' | 'bubbleAction' | null`
- No react-navigation; ClarityApp owns screen/panel state and routing logic

**State Management**: Zustand store in [src/clearday/store.ts](src/clearday/store.ts)
- Single store: `useClearDayStore()`
- Persists to AsyncStorage via [src/clearday/storage.ts](src/clearday/storage.ts)
- Bootstrap flow loads config, agendas, vault, and MIT from storage on app init

**Theme System**: 
- Light/dark tokens defined in [src/clearday/theme.ts](src/clearday/theme.ts)
- Theme passed as props to all screens (no theme imports in screen files)
- User selects mode via SettingsScreen; system scheme auto-detected

**Font Scaling**: 
- All text uses `fontScale(basePx, fontSizeMultiplier)` helper from [src/clearday/scale.ts](src/clearday/scale.ts)
- `fontSizeMultiplier` (0.85–1.3) is in AppConfig, controlled by Settings
- Font family is chosen via `getFontSet(fontChoice)` from [src/clearday/fonts.ts](src/clearday/fonts.ts)

### Data Model

**Agenda** (active/hold/completed items on matrix):
- `id, text, quadrant (Q1–Q4), domain (tag), time (quick/short/medium/deep), status (active/onhold/done), cx, cy (position on canvas), createdAt, doneAt?, onHoldAt?`

**VaultEntry** (archived agendas):
- Extends Agenda with `archivedAt` timestamp

**AppConfig** (persisted settings):
- `name, migratedV1, themeMode, vaultExpiryDefault, holdExpiryDefault, tags, quadrantLabels, fontChoice, matrixStyle, mitResetHour, fontSizeMultiplier, vaultRetentionDays`
- Stored via AsyncStorage, bootstrapped with defaults in [src/clearday/storage.ts](src/clearday/storage.ts)

### Key Files by Role

| File | Role |
|------|------|
| [src/clearday/ClarityApp.tsx](src/clearday/ClarityApp.tsx) | App shell, navigation, pill/sidebar, modals, theme resolution |
| [src/clearday/store.ts](src/clearday/store.ts) | Zustand store, all business logic (add/edit/archive/hold/complete) |
| [src/clearday/types.ts](src/clearday/types.ts) | Type definitions, constants (DEFAULT_TAGS, TAG_MAX_LENGTH, QUADRANT_LABEL_MAX_LENGTH, TIME_LABELS) |
| [src/clearday/storage.ts](src/clearday/storage.ts) | AsyncStorage load/save, config defaults, migration hooks |
| [src/clearday/theme.ts](src/clearday/theme.ts) | Theme tokens (light/dark), wash opacities, quadrant colors |
| [src/clearday/helpers.ts](src/clearday/helpers.ts) | Utility functions (isCenterPoint, posFromSliders, qFromPos, expiryDaysPassed, uid) |
| [src/screens/MatrixScreen.tsx](src/screens/MatrixScreen.tsx) | Matrix canvas, bubbles, interaction (drag/tap), background styles (Tinted/Editorial/Paper) |
| [src/components/AddEditSheet.tsx](src/components/AddEditSheet.tsx) | Add/edit modal, effort slider, urgency/importance sliders, tag selector |
| [src/screens/ActiveScreen.tsx](src/screens/ActiveScreen.tsx) | List of active agendas, add button |
| [src/screens/HoldScreen.tsx](src/screens/HoldScreen.tsx) | List of on-hold agendas, reorder, add button |
| [src/screens/VaultScreen.tsx](src/screens/VaultScreen.tsx) | Archive list, restore/delete actions, separated by completion status |
| [src/screens/SettingsScreen.tsx](src/screens/SettingsScreen.tsx) | Theme, font, matrix style, MIT reset time, tag editing, vault retention |
| [src/screens/CompletedScreen.tsx](src/screens/CompletedScreen.tsx) | Completed agendas, restore, delete |

---

## Important Constants & Conventions

### Tags
- `DEFAULT_TAGS = ['Pro', 'Per']` (hardcoded in storage.ts, referenced in types.ts)
- `TAG_MAX_LENGTH = 3` — tags are truncated and auto-capitalized on first char
- Tag normalization in store: `capFirst(raw.slice(0, TAG_MAX_LENGTH))`
- Legacy compatibility: resolveTag truncates "Professional" → "Pro", "Personal" → "Per"

### Agenda Lifecycle
- Create → `status: 'active'` on matrix
- Hold → `status: 'onhold'` via `toggleHold()`
- Complete → `status: 'done'`, moved to vault
- Archive (from active/hold) → moved to vault with `archivedAt` timestamp
- Delete → removed from vault

### Vault Retention
- `vaultRetentionDays: 0` (default) = never auto-delete
- On bootstrap, `applyVaultRetentionPolicy()` filters expired entries
- Configurable via Settings, persists to AppConfig

### Quadrant Labels
- Customizable per quadrant (Q1–Q4)
- Default: 'Do Now', 'Schedule', 'Delegate', 'Eliminate'
- User can rename via SettingsScreen; changes persist

### Matrix Styles
- **Tinted**: Colorful background wash
- **Editorial**: Serif text, subtle axis labels (opacity 0.17)
- **Paper**: Paper texture, center watermark labels + importance axis label
- Style choice persists in AppConfig

### MIT (Most Important Thing)
- One per day, set via ActiveScreen MIT button
- Resets at configurable hour (mitResetHour, default 0 = midnight UTC)
- Carry-forward modal shows on app launch if yesterday's MIT wasn't cleared

---

## Component Patterns

### Screens
- Accept `{ tokens: ThemeTokens; fontChoice: string }` props
- Use `useClearDayStore()` and `useContext(NavCtx)` for state/nav
- Read `fontSizeMultiplier` from store for scalable text

### Sheets / Modals
- Bottom-sheet or overlay rendered by ClarityApp when panel state changes
- Close via `nav.closePanel()` or nav action callbacks
- Changes to state trigger Zustand updates and AsyncStorage saves

### Reusable Components
- [src/components/LongPressReorderRow.tsx](src/components/LongPressReorderRow.tsx) — drag-to-reorder with long-press gesture
- [src/components/MITStrip.tsx](src/components/MITStrip.tsx) — displays today's MIT with indicator
- [src/components/FloatingPill.tsx](src/components/FloatingPill.tsx) — action buttons (+ for add, ↑ for hold, etc.)
- [src/components/Toast.tsx](src/components/Toast.tsx) — transient feedback messages

### SVG Rendering
- [react-native-svg](src/screens/MatrixScreen.tsx) for bubble canvas, grid background, icons
- Matrix styles (Tinted/Editorial/Paper) use different background rendering
- Bubble fill/stroke opacity increased for visibility (light theme: 0.06–0.09 wash)

---

## State Flow & Side Effects

### Bootstrap
1. App mounts, `useEffect` calls `store.bootstrap()`
2. Bootstrap loads config, agendas, vault, MIT from AsyncStorage
3. Applies vault retention policy (expires old entries)
4. MIT carry-forward check shows modal if MIT wasn't reset
5. `store.ready = true`, pill animates in

### Add Agenda
1. User taps + on matrix or sidebar → `nav.setAddSheetPreset()` + `nav.openPanel('add')`
2. AddEditSheet renders with preset (urgency, importance, optional domain, addToHold flag)
3. User confirms → `store.addAgenda()` calls Zustand action
4. Action calculates quadrant from urgency/importance, creates ID, saves to state + AsyncStorage
5. If `addToHold`, calls `toggleHold()` immediately after

### Edit Agenda
1. User taps bubble or row → `nav.setBubbleActionId()` + `nav.openPanel('bubbleAction')`
2. BubbleActionSheet shows options (edit, MIT, archive, complete, hold toggle)
3. Edit → `nav.setEditAgendaId()` + `nav.openPanel('edit')`
4. AddEditSheet opens with existing agenda values
5. User confirms → `store.updateAgenda()` saves changes + AsyncStorage

### Complete Agenda
1. Swipe or tap complete button → `store.completeAgenda(id)`
2. Sets `doneAt = now`, `status = 'done'`
3. If on matrix, removed from active list
4. Added to vault with completion status for retrieval later

### Archive Agenda
1. From active/hold, user taps archive → `store.archiveAgenda(id)`
2. Sets `status = 'done'`, `archivedAt = now` (even if already done)
3. Moved to vault, no longer on matrix or active/hold lists

### Restore from Archive
1. In VaultScreen, user taps + to restore to active or ↑ to restore to hold
2. `store.restoreVaultToActive(id)` or `store.restoreVaultAgenda(id)`
3. Removes from vault, resets status, clears archivedAt
4. Returns to active list or on-hold list

---

## Styling Notes

**No margin/padding defaults**: Use `StyleSheet.create()` for all styles, define explicitly. No global reset.

**Safe area insets**: Always respect `useSafeAreaInsets()` for notch/home-bar avoidance.

**Color access**: Use theme tokens (tokens.bg, tokens.text, tokens.q1, tokens.border, etc.). Never hardcode colors.

**Font scaling**: All font sizes use `fontScale(basePx, fontSizeMultiplier)`.

**Opacity conventions**:
- Text: `tokens.text` (opaque)
- Muted text: `tokens.textMuted` or `{color: tokens.text, opacity: 0.6}`
- Ghost text: `tokens.textGhost` (very faded)
- Bubble wash: 0.06–0.09 in light, 0.04–0.06 in dark (per quadrant)
- Axis labels (Editorial): 0.17
- Watermarks (Paper): 0.45

---

## Known Quirks & Workarounds

### Slider Visual Position Bug
The `@react-native-community/slider` component caches thumb position internally. When passing a new `value` prop, the visual thumb may not update on first render even though the internal value is correct.

**Workaround**: Add `sliderKey` state to the component, increment it in useEffect when preset changes, and key the Slider: `<Slider key={`name-${sliderKey}`} />`. This forces React to remount the Slider, resetting internal state.

### Legacy Tag Migration
Old data may have "Professional" and "Personal" tags (12 chars). On load, normalizeTagList truncates them to 3 chars and capitalizes.

When resolving a domain to a tag (resolveTag), check both the new 3-char form and the legacy form for backward compat.

### Stale References in Codebase
- [src/clearday/navigation.ts](src/clearday/navigation.ts) mentions old panel names (`sparks`, `reflect`) — ignore, use ClarityApp as source of truth
- [src/clearday/helpers.ts](src/clearday/helpers.ts) may reference deleted storage keys — check actual usage in store.ts and storage.ts
- [src/docs/release-hardening-checklist.md](src/docs/release-hardening-checklist.md) may mention removed features — update if encountered

---

## Testing & Validation

**Before committing**:
1. `npx tsc --noEmit` — no TypeScript errors
2. Test on at least one platform (iOS/Android/web)
3. Verify AsyncStorage persistence (close app, reopen)
4. Check theme switching (system/light/dark)
5. Verify all new screens/panels route correctly via NavCtx

**Common issues**:
- **Type errors**: Check that all Zustand selectors return the correct type; props match interface definitions
- **Nav errors**: Ensure screen/panel names are in the Screen/Panel union types in ClarityApp.tsx
- **Storage errors**: Verify AsyncStorage keys are unique and don't conflict with old keys
- **Theme errors**: Pass tokens as props, don't import theme into screens

---

## Recent Major Changes (Session 2026-04-10)

The previous Claude session made 14 distinct changes across 4 feature batches and one full-screen layout redesign:

1. **Vault retention** changed to `[15d, 60d, Never]` defaults to `0` (Never)
2. **Floating pill** styling split by `matrixStyle` with higher opacity and stronger borders
3. **Agenda tags** truncated to 3 chars, auto-capitalized, max 4 tags, editable in Settings
4. **Matrix canvas** made full-width (removed all padding), SVG sizing fixed
5. **Bubbles** visually strengthened (stroke 0.75 opacity, wash +0.02–0.03)
6. **Paper style** quadrant labels moved to center watermarks + vertical importance label
7. **Editorial labels** opacity increased 0.15 → 0.17 for visibility
8. **Preview bubble** in add/edit scales with effort slider
9. **Slider visual fix** via sliderKey remounting on preset change
10. **Pill + button** added to open add sheet
11. **Hold screen** gained parallel add flow, new items go to hold status
12. **Hold resume** changed from ‹ to +
13. **Vault actions** simplified to right-side + (restore to active), ↑ (restore to hold), ✕ (delete)

See [HANDOFF.md](HANDOFF.md) for full feature context and implications.

---

## Future Work Considerations

- **Performance**: Matrix canvas redraws on every agenda change. Consider memoizing background/grid rendering if heavy animations are added.
- **Offline sync**: AsyncStorage syncs locally; adding a backend would require conflict resolution (last-write-wins or 3-way merge).
- **Accessibility**: Current text contrast and touch targets meet iOS/Android guidelines but could be audited for WCAG compliance.
- **Internationalization**: Hardcoded strings in English; i18n layer not present. Would require extraction and translation files.

---

## Contact Points

If future work references external specs or prior decisions:
- Check [HANDOFF.md](HANDOFF.md) for product & UI change context
- Check git log for commit messages explaining "why" behind changes
- If a spec like `MaxMonk_b1_McK_MB.md` is referenced, verify it exists before assuming it's authoritative
