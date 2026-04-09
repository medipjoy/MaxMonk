# CLARITY APP — FINAL IMPLEMENTATION PROMPT
## For Claude Code in VS Code

**Status:** Phases 1-2 complete. Remaining work: tap interactions, visuals, bug fixes.

---

## BEFORE YOU START

Ask me: _"Ready to implement all remaining fixes in one continuous autonomous mode?"_

If yes: Run through all sections consecutively. Build & verify at end. Report final status.

If no: I'll guide you section-by-section.

---

## SECTION A: Pill Visibility & Timer Fix

**Issue:** Pill doesn't appear or disappears immediately.

**Fix:** Update `src/components/FloatingPill.tsx`

```
"IMPLEMENT: Fix pill visibility + auto-disappear timer

Current behavior broken:
- Pill opacity state not tracking correctly
- Timer fires but doesn't actually hide pill
- Web hover state interfering with mobile touch state

Update FloatingPill.tsx:
1. Change visibility from 'opacity' to actual 'display' toggle (appear/disappear, not fade)
2. Fix timer logic:
   - On touch/hover: set visible = true, clear existing timer
   - Start new 2.5s timer ONLY
   - Timer fires: set visible = false
3. On web: use onMouseEnter/onMouseLeave
4. On mobile: use onTouchStart (from parent MatrixScreen)
5. Verify: pill appears on tap → no activity 2.5s → disappears

Test on both iOS simulator and web before proceeding."
```

---

## SECTION B: Single Tap = Pill Toggle, Double Tap = New Item

**Issue:** Tap behavior undefined. Need to distinguish single vs. double-tap on matrix canvas.

**Fix:** Update `src/screens/MatrixScreen.tsx`

```
"IMPLEMENT: Tap interaction on matrix canvas

Logic:
1. Single tap on matrix canvas (not on bubble) → toggle pill visibility
   - If pill hidden: show it
   - If pill visible: hide it

2. Double tap on matrix canvas (not on bubble) → open Add agenda sheet with tap location
   - Capture tap X,Y position
   - Convert to cx, cy (0–1 fractional)
   - Convert cx, cy to urgency, importance (urgency = cx * 90 + 5; importance = cy * 90 + 5)
   - Pass as 'preset' to AddEditSheet
   - Open sheet

3. Single tap on bubble (not canvas) → long-press detection (500ms hold)
   - If released < 500ms: ignore (it's a quick tap, don't open sheet yet)
   - If held 500ms+: show context menu (Done, Edit, Archive, Delete)
   - If dragged: handle drag-to-reposition (existing logic)

Implementation:
- Add TapGestureHandler or use onLongPress for bubbles
- Add onDoubleTap handler for canvas
- Ensure bubble tap doesn't trigger canvas tap
- Don't use navigation to show sheet; directly open BubbleActionSheet for existing bubbles
- For new item: pass urgency/importance to AddEditSheet as preset values

Test: single tap canvas = pill toggle, double tap canvas = new item with location, long-press bubble = actions"
```

---

## SECTION C: Capture Tap Location → Urgency/Importance

**Issue:** New item sheet shows NaN for urgency/importance when opened from tap.

**Fix:** Update `src/components/AddEditSheet.tsx`

```
"IMPLEMENT: Fix NaN in AddEditSheet when preset provided

Root cause: preset is undefined when sheet opens from tap, but code tries to read preset.urgency.

Fix in AddEditSheet.tsx:
1. Change useState initialization:
   OLD: const [urgency, setUrgency] = useState(preset?.urgency ?? ... ?? 50)
   NEW: const [urgency, setUrgency] = useState(preset?.urgency || preset?.urgency === 0 ? preset.urgency : 50)
   (Check for 0 value explicitly)

2. When MatrixScreen calls openAddSheet with tap location:
   - Calculate urgency = Math.round((tapX / canvasWidth) * 90 + 5)
   - Calculate importance = Math.round((tapY / canvasHeight) * 90 + 5)
   - Pass as: openAddSheet({ urgency, importance })
   - This becomes 'preset' in AddEditSheet

3. Display urgency/importance sliders with initial values from preset
4. Render quadrant preview that updates as sliders change

Test: double-tap different areas of matrix → sheet opens with correct urgency/importance values, no NaN"
```

---

## SECTION D: Cormorant Font Size +13%

**Issue:** Cormorant appears smaller than other fonts at same fontSize.

**Fix:** Update `src/clearday/fonts.ts`

```
"IMPLEMENT: Add lineHeightMultiplier for font size normalization

Add to FontSet interface:
interface FontSet {
  serif: string;
  serifItalic: string;
  serifBold: string;
  sans: string;
  sansMedium: string;
  label: string;
  lineHeightMultiplier?: number;  // NEW: visual size normalization
}

In getFontSet():
- cormorant: add lineHeightMultiplier: 1.13 (13% increase)
- baskerville: add lineHeightMultiplier: 1.0
- inter: add lineHeightMultiplier: 1.0
- jakarta: add lineHeightMultiplier: 1.0

Create helper function:
function getNormalizedFontSize(baseFontSize: number, fontChoice: FontChoice): number {
  const fontSet = getFontSet(fontChoice);
  return baseFontSize * (fontSet.lineHeightMultiplier || 1.0);
}

In components (MatrixScreen, ActiveScreen, etc.):
- Where you use fontSize={14} with cormorant font
- Change to fontSize={getNormalizedFontSize(14, config.fontChoice)}

This scales Cormorant up 13% everywhere while keeping others at 1x.

Test: Compare Cormorant vs Inter at same font size → should look visually similar now"
```

---

## SECTION E: Web Sidebar = 90px + Icon-Only

**Issue:** Sidebar too wide (220px), hides pill on web.

**Fix:** Update `src/clearday/ClarityApp.tsx`

```
"IMPLEMENT: Reduce web sidebar to 90px, icon-only with hover labels

In ClarityApp.tsx:

1. Change sidebar width:
   OLD: width: 220
   NEW: width: 90

2. Update navigation items in sidebar:
   - Show only icons (no text labels)
   - Icons: 32×32px
   - On hover: show tooltip with label (position: 'absolute', left: 90)

3. Reposition pill on mobile (< 768px):
   - Pill should still appear on mobile, centered bottom
   - Don't show pill if sidebar visible (web)

4. Test on web:
   - Sidebar 90px narrow
   - Hover icons → tooltip appears
   - No pill visible on web (sidebar replaces it)

5. Test on mobile:
   - Pill appears at bottom center (unchanged)
   - Sidebar not visible

Confirm: sidebar 90px, icons clear, hover labels work, pill appears on mobile only"
```

---

## SECTION F: MIT Strip Notch Padding (Device Detection Only)

**Issue:** MIT strip overlapped by notch on iOS devices with notch.

**Fix:** Update `src/components/MITStrip.tsx`

```
"IMPLEMENT: Add paddingTop for notch-only devices

In MITStrip.tsx:

1. Import useSafeAreaInsets from 'react-native-safe-area-context'
2. Get insets: const insets = useSafeAreaInsets()
3. Add paddingTop only if insets.top > 0 (device has notch):
   style={{
     paddingTop: insets.top > 0 ? insets.top : 0,
     ...
   }}

4. Ensure height accounts for padding:
   OLD: height: 24
   NEW: height: 24 + (insets.top > 0 ? insets.top : 0)

5. Canvas below should NOT be shifted (stays in main safeArea)

Test on iOS device with notch → MIT strip pushed down, no overlap
Test on device without notch → MIT strip at top as before
Test on Android → no notch, no padding"
```

---

## SECTION G: Canvas Padding for Corner Bubbles

**Issue:** Bubbles at edges (effort=100, cx/cy near 1) may clip.

**Fix:** Update `src/screens/MatrixScreen.tsx`

```
"IMPLEMENT: Add canvas padding to show corner bubbles fully

In MatrixScreen.tsx:

1. Add padding to canvas container:
   OLD: canvasContainer no padding
   NEW: paddingHorizontal: 8, paddingVertical: 8

2. Update bubble positioning math:
   - Bubbles use cx, cy (0–1) fractional positions
   - Clamp: cx = Math.max(0.03, Math.min(0.97, cx))
           cy = Math.max(0.03, Math.min(0.97, cy))
   - This ensures even largest bubbles (r=50) stay visible

3. Test: Add agenda at bottom-right corner (urgency=95, importance=95)
   - Effort=100 (largest bubble, r=50)
   - Should be fully visible, not clipped

Confirm: largest bubbles in all four corners are fully visible"
```

---

## SECTION H: Theme Default = Always Light + Cormorant + Tinted (Ignore System)

**Issue:** Web shows dark mode because systemScheme forces theme despite config.themeMode='light'.

**Fix:** Update `src/clearday/ClarityApp.tsx`

```
"IMPLEMENT: Ignore systemScheme, always use config.themeMode

In ClarityApp.tsx:

OLD: const tokens = resolveTheme(config.themeMode, systemScheme)

NEW: const tokens = resolveTheme(config.themeMode, null)
     (pass null as systemScheme so resolveTheme always uses config.themeMode)

Ensure storage.ts loadConfig() defaults:
  themeMode: 'light',
  fontChoice: 'cormorant',
  matrixStyle: 'tinted',

This means:
- First app launch: always light theme, Cormorant font, Tinted matrix style
- Regardless of device system settings
- User can change in Settings later, but defaults are locked

Test on web: should show light theme (not dark)
Test on iOS: should show light theme (not respecting system dark mode setting)
Test on Android: same"
```

---

## SECTION I: Settings Screen = Add Font Size Toggle

**Issue:** No way for users to increase/decrease font sizes.

**Fix:** Update `src/screens/SettingsScreen.tsx`

```
"IMPLEMENT: Add font size toggle in Settings

Add new setting in SettingsScreen:

1. Add to AppConfig type (src/clearday/types.ts):
   fontSizeMultiplier: number (default: 1.0, range: 0.85 to 1.3, step: 0.05)

2. In SettingsScreen, add section:
   Label: 'Font Size'
   Options: Small (0.85) | Normal (1.0) | Large (1.15) | Extra Large (1.3)
   Display as toggle buttons, highlight current selection

3. Store selection in config via store

4. In components using fontSize:
   Change fontSize={14} to fontSize={14 * config.fontSizeMultiplier}

5. Also apply to getNormalizedFontSize():
   return baseFontSize * (fontSet.lineHeightMultiplier || 1.0) * config.fontSizeMultiplier

Test: Toggle font size in Settings → all text resizes proportionally"
```

---

## BUILD & VERIFY ALL AT ONCE

Run after all sections above:

```bash
npm run build
# or
expo start --web
# and
expo start --ios
```

**Verify Checklist:**
- [ ] Web: light theme (not dark), sidebar 90px, no pill visible
- [ ] iOS: light theme, MIT strip has notch padding, pill appears/disappears on tap
- [ ] Android: same as iOS
- [ ] Double-tap matrix → new sheet with urgency/importance from tap location (no NaN)
- [ ] Single-tap canvas → pill toggle
- [ ] Long-press bubble (500ms) → context menu
- [ ] Cormorant font visually matches Inter/Baskerville at same size
- [ ] Bubbles in all four corners fully visible
- [ ] Settings has font size toggle (Small/Normal/Large/XL)
- [ ] Change font size in Settings → all text resizes

---

## FINAL CHECKLIST

- [ ] All sections A–I implemented
- [ ] No compilation errors
- [ ] App builds on web, iOS, Android
- [ ] All 8 visual issues fixed
- [ ] Tap interactions work as specified (single=pill toggle, double=new item)
- [ ] Cormorant normalized
- [ ] Settings has font size toggle
- [ ] Ready to test on real devices

Report any errors or failed tests, and we'll fix them.
