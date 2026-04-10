# MaxMonk / Clarity — Handoff Context

## Project Snapshot

Cross-platform Eisenhower Matrix task manager for iOS, Android, and Web. Stack: React Native + Expo 54, TypeScript strict, Zustand, AsyncStorage.

The live app shell is centered on [src/clearday/ClarityApp.tsx](/workspaces/MaxMonk/src/clearday/ClarityApp.tsx), which owns current screen/panel navigation through `NavCtx`. There is no `@react-navigation`.

## Primary Files To Read First

- [src/clearday/ClarityApp.tsx](/workspaces/MaxMonk/src/clearday/ClarityApp.tsx) — app shell, navigation, pill/sidebar, overlays
- [src/clearday/store.ts](/workspaces/MaxMonk/src/clearday/store.ts) — main Zustand store and business logic
- [src/clearday/types.ts](/workspaces/MaxMonk/src/clearday/types.ts) — config types and constants
- [src/clearday/storage.ts](/workspaces/MaxMonk/src/clearday/storage.ts) — persistence/bootstrap
- [src/screens/MatrixScreen.tsx](/workspaces/MaxMonk/src/screens/MatrixScreen.tsx) — matrix canvas and interaction model
- [src/components/AddEditSheet.tsx](/workspaces/MaxMonk/src/components/AddEditSheet.tsx) — add/edit workflow
- [src/screens/ActiveScreen.tsx](/workspaces/MaxMonk/src/screens/ActiveScreen.tsx)
- [src/screens/HoldScreen.tsx](/workspaces/MaxMonk/src/screens/HoldScreen.tsx)
- [src/screens/VaultScreen.tsx](/workspaces/MaxMonk/src/screens/VaultScreen.tsx)
- [src/screens/SettingsScreen.tsx](/workspaces/MaxMonk/src/screens/SettingsScreen.tsx)
- [src/screens/CompletedScreen.tsx](/workspaces/MaxMonk/src/screens/CompletedScreen.tsx)

## Context Captured From The Previous Claude Code Chat

The prior session made the following product and UI changes:

1. Vault retention options were changed to `[15d, 60d, Never]`, with default `Never` (`0`), and the label changed from "Auto-clears after" to "Delete after".
2. Floating pill appearance was split by `matrixStyle`, and icon stroke width was increased from `1.5` to `1.75`.
3. Agenda tags were tightened: `TAG_MAX_LENGTH` changed from `12` to `3`, `DEFAULT_TAGS` changed to `['Pro', 'Per']`, and tag normalization now truncates and capitalizes values. Settings gained inline tag editing, deletion, and add-tag controls.
4. Matrix filter chip gap was reduced from `4px` to `2px`.
5. The matrix canvas was made full-width by removing canvas padding and fixing SVG sizing/offsets.
6. Bubble visuals were strengthened by increasing border opacity and wash opacity in both light and dark themes.
7. Paper style quadrant labeling was changed from edge labels to center watermark labels, while keeping a horizontal urgency label and adding a vertical importance label.
8. Editorial axis label opacity increased from `0.15` to `0.17`.
9. The `QuadPreview` bubble was changed to scale with the effort slider.
10. A slider remount fix was added so urgency/importance sliders refresh correctly after canvas preset taps.
11. A fourth floating pill action was added for opening the add sheet.
12. Hold screen gained an add flow parallel to Active, using `AddSheetPreset.addToHold` so new items can be created directly in hold.
13. Hold screen resume action changed from `‹` to `+` and resumes by calling `toggleHold`.
14. Vault actions were simplified so the right-side actions are restore to active (`+`), restore to hold (`↑`), and delete (`✕`).

## Current Verified State

- `DEFAULT_TAGS = ['Pro', 'Per']`
- `TAG_MAX_LENGTH = 3`
- `vaultRetentionDays` defaults to `0` in persistence/store config
- `CompletedScreen` exists and is wired into the current app shell
- `aiStub.ts` is not present
- `ReflectionScreen` and `SparksSheet` are not present

## Important Caveat: Stale References Still Exist

The previous handoff said removed features should not be re-added, and that is directionally correct, but a few stale references still remain in the repo:

- [src/clearday/navigation.ts](/workspaces/MaxMonk/src/clearday/navigation.ts) still mentions old panel names including `sparks` and `reflect`
- [src/clearday/helpers.ts](/workspaces/MaxMonk/src/clearday/helpers.ts) still includes a `sparks` storage key
- [src/docs/release-hardening-checklist.md](/workspaces/MaxMonk/src/docs/release-hardening-checklist.md) still mentions `sparks` in QA gates

Use [src/clearday/ClarityApp.tsx](/workspaces/MaxMonk/src/clearday/ClarityApp.tsx) as the source of truth for active navigation and product surface.

## Validation Status

The previous Claude session reported that `npx tsc --noEmit` passed after those changes. This handoff update did not rerun TypeScript; it only verified file presence and current source references.

## Missing Older Reference

An older Claude guidance file referenced `MaxMonk_b1_McK_MB.md` as an authoritative spec, but that file was not present in the repository during this handoff refresh. If future work depends on that spec, verify its location first instead of assuming it still exists.
