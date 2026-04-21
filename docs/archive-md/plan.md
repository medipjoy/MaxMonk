# Consolidated Interaction and Visual Fix Plan

## Summary

Refine the new quadrant preset UX, fix the broken graph-tap/edit slider behavior, clean up keyboard-edge blending and toast styling, standardize completion/edit icon language, replace the broken drag implementation with long-press row reordering, and add subtle active-bubble resizing on the matrix.

This pass will:
- replace the current quadrant preset chooser with a compact single-line scroller list
- repair urgency/importance rendering and saved-position behavior with custom controlled slider visuals
- blend the add/edit sheet cleanly into the keyboard edge for every style
- make toast fill style-aware, move it higher, and shorten its dwell time
- standardize completion/edit iconography and copy
- remove the redundant edit icon from Completed
- replace non-working drag handles with long-press row drag
- allow Active cross-section drag, updating quadrant and urgency/importance to the destination quadrant’s average position
- add outline-drag bubble resizing for active matrix bubbles only

## Key Changes

### Quadrant Preset Chooser
- Replace the current multi-line bottom-sheet cards in [src/screens/SettingsScreen.tsx](/workspaces/MaxMonk/src/screens/SettingsScreen.tsx) with a vertically scrollable compact list.
- Each preset should render as a single concise line, not a 4-cell preview block.
- Keep the current Settings row compact; tapping it still opens a chooser sheet.
- Keep the same 7 preset sets and existing persistence through `config.quadrantLabels`.

### Urgency / Importance Slider Repair
- Stop relying on native slider visuals for correctness.
- Build controlled custom-rendered slider visuals in [src/components/AddEditSheet.tsx](/workspaces/MaxMonk/src/components/AddEditSheet.tsx) so:
  - the filled track and thumb always reflect the actual value
  - graph-tap presets paint correctly immediately
  - edit-mode values paint correctly from saved `cx/cy`
- Keep urgency/importance values driven by the existing coordinate model, but ensure the inverse mapping and saved update path remain consistent.
- Preserve the current behavior that editing urgency/importance updates bubble position on save, but make the custom slider visuals and preview always match the values being saved.

### Add/Edit Sheet Edge and Motion
- Remove visible seam/corner artifacts between keyboard and add/edit sheet by blending the lower edge using the active sheet theme styling rather than a flat generic fill.
- Match the edge treatment to the selected style so paper/editorial/tinted feel coherent.
- Keep the smoother open/close motion work, but tighten the keyboard coordination so the sheet and field appear/disappear seamlessly.

### Toast / Action Feedback
- Update [src/components/Toast.tsx](/workspaces/MaxMonk/src/components/Toast.tsx):
  - style fill/border according to the selected matrix style and theme rather than a stark neutral white
  - move the toast up by roughly 25% of the current bottom placement
  - reduce visible dwell time by about 40%
- Keep the fade-in/fade-out behavior, just faster and better matched to style.

### Icon and Action Copy Consistency
- Replace text-based edit affordances with one consistent simple pencil icon across the app.
- Update completion affordances so the icon treatment matches the agreed tick style rather than inconsistent text glyphs.
- Remove the separate edit icon from Completed rows, since row tap already opens edit.
- Replace completion feedback/action copy from `Done` to `Marked Completed` wherever this action is surfaced:
  - edit quick actions
  - list actions
  - bubble action sheet
  - toast/update text

### Active and Hold Reordering
- Remove the current `ReorderHandle` interaction; it is not working reliably because it conflicts with row press behavior.
- Replace it with long-press row drag in both Active and Hold.
- Hold:
  - reorder within the flat hold list only
  - persist order as before
- Active:
  - allow dragging across quadrant sections
  - when an item crosses into a different quadrant section, update:
    - `quadrant`
    - `cx`
    - `cy`
  - set new `cx/cy` to that destination quadrant’s average/default placement rather than leaving stale coordinates
  - persist reordered placement and destination section
- Keep simple tap behavior for row actions when the user is not long-pressing.

### Active Bubble Resize
- Add subtle outline-drag resizing for active matrix bubbles only in [src/screens/MatrixScreen.tsx](/workspaces/MaxMonk/src/screens/MatrixScreen.tsx).
- Resizing should snap through the existing effort ladder rather than creating continuous arbitrary sizes.
- Dragging the outline should:
  - preview radius changes live
  - commit back to the corresponding effort/time level on release
- This interaction must coexist safely with normal bubble dragging:
  - moving the bubble stays the default gesture
  - grabbing the outline specifically enters resize behavior
- No resizing on non-active surfaces.

## Public Interfaces / Types
- Add any small UI-local preset chooser helpers needed for one-line display.
- Replace the current visible native urgency/importance paint path with a custom slider visual component while preserving existing value semantics.
- Extend the active-list reorder implementation so cross-section moves can update quadrant and stored coordinates.
- Add a store action for resizing/snap-updating bubble effort if needed, rather than overloading position updates.
- Remove or retire the current reorder-handle path once long-press row drag is in place.

## Test Plan
- Quadrant chooser:
  - Settings still stays compact
  - chooser opens as a one-line scrollable list
  - selecting a preset persists and updates labels across the app
- Sliders:
  - graph-tap opens add/edit with urgency and importance visually correct
  - edit-mode sliders paint correctly from saved values
  - saving urgency/importance changes moves the bubble to the expected place on the matrix
- Keyboard edge:
  - no visible seam/corner mismatch between keyboard and sheet in tinted, editorial, and paper
  - open/close motion feels smooth
- Toast:
  - fill matches the selected style/theme better
  - toast appears higher
  - dwell time is shorter
- Icons/copy:
  - pencil icon is consistent everywhere edit is shown
  - Completed rows no longer show a separate edit icon
  - completion feedback reads `Marked Completed`
- Drag:
  - Hold long-press reorder works and persists
  - Active long-press reorder works within and across sections
  - crossing sections updates quadrant and saved matrix position appropriately
- Bubble resize:
  - only active matrix bubbles can resize
  - outline drag changes effort by snapped levels
  - normal bubble move still works when not dragging the outline

## Assumptions
- The quadrant chooser should remain a sheet, but its content should become a compact one-line scroller list.
- Custom slider visuals are the preferred fix over further native-slider patching.
- Active cross-section drag should intentionally change the task’s quadrant and stored coordinates.
- Completion wording should be standardized to `Marked Completed`.
- Outline-drag resize is only for active matrix bubbles and should map directly to existing effort levels.
