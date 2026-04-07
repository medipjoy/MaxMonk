# MaxMonk_b1_McK_MD
## Clarity App — Phase 1 Enhancement Plan
### Claude Code Instruction Document

---

## HOW TO READ THIS DOCUMENT

Two segments only:

- **SEGMENT A — IMPLEMENT NOW:** Decided, frozen, must be coded in full.
- **SEGMENT B — PHASE 2 / ON HOLD:** Do not scaffold, stub, or partially implement. No TODO comments, no placeholder imports, no partial wiring for anything in Segment B.

When in doubt between A and B, treat it as B and leave it untouched.

---

## REPOSITORY CONTEXT

- **Framework:** React Native with Expo (~54), single codebase targeting iOS, Android, and Web
- **Language:** TypeScript (strict)
- **State:** Zustand (`src/clearday/store.ts`)
- **Storage:** AsyncStorage abstracted behind `src/clearday/storage.ts`
- **Navigation:** Currently uses `@react-navigation/stack` and `@react-navigation/bottom-tabs` — both will be removed and replaced with a custom single-screen state-based approach (see Section 4)
- **Single source of truth:** `src/clearday/` directory

---

## PRELIMINARY — DO FIRST BEFORE ANY FEATURE WORK

### Step 1: Delete all legacy code

Remove these files and directories entirely. Do not comment out, archive, or leave stubs:

```
src/screens/MatrixScreen.tsx
src/screens/AgendaScreen.tsx
src/screens/StatsScreen.tsx
src/screens/ClearDayScreen.tsx   ← will be fully rewritten, delete current version
src/store/taskStore.ts
src/store/types.ts
src/components/AddTaskSheet.tsx
src/components/FocusMode.tsx
src/components/QuadrantCell.tsx
src/components/TaskCard.tsx
src/db/database.ts
src/db/taskRepository.ts
src/utils/deadlineEscalation.ts
src/utils/quadrant.ts
```

Remove all imports referencing these files anywhere in the codebase.

### Step 2: Remove navigation libraries

Uninstall and remove all references to:
- `@react-navigation/stack`
- `@react-navigation/bottom-tabs`
- `@react-navigation/native`
- `react-native-gesture-handler` (unless still required by another retained dependency — check before removing)
- `react-native-screens`
- `react-native-safe-area-context` — **retain this**, it is needed for safe area insets

Update `App.tsx` to render the new single root screen component directly.

### Step 3: Verify retained files are untouched

The following files must be retained exactly as-is unless explicitly modified in Segment A:
- `src/clearday/store.ts`
- `src/clearday/storage.ts`
- `src/clearday/types.ts`
- `src/clearday/helpers.ts`
- `src/clearday/theme.ts`
- `src/clearday/aiStub.ts`
- `src/clearday/migration.ts`

---

---

# SEGMENT A — IMPLEMENT NOW

---

## 1. DESIGN TOKENS & THEME SYSTEM

### 1.1 Light mode as default

Replace `src/clearday/theme.ts` entirely with the following token system. Light mode is the primary design. Dark and System are available but light is the baseline all components are designed against.

```typescript
// src/clearday/theme.ts

export type ThemeMode = 'light' | 'dark' | 'system';
export type MatrixStyle = 'tinted' | 'editorial' | 'paper';
export type FontChoice = 'cormorant' | 'baskerville' | 'inter' | 'jakarta';

export interface ThemeTokens {
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  borderMid: string;
  text: string;
  textMuted: string;
  textGhost: string;
  accent: string;         // steel blue #1B3A5C
  gold: string;           // MIT gold #8A6A14
  goldLight: string;
  q1: string;             // Do Now red
  q2: string;             // Schedule green
  q3: string;             // Delegate blue
  q4: string;             // Eliminate grey
  q1Wash: string;
  q2Wash: string;
  q3Wash: string;
  q4Wash: string;
  overlay: string;
  axisLine: string;
}

export const lightTokens: ThemeTokens = {
  bg: '#F8F7F4',
  surface: '#FFFFFF',
  surface2: '#FEFCF8',
  border: 'rgba(0,0,0,0.07)',
  borderMid: 'rgba(0,0,0,0.12)',
  text: '#1A1814',
  textMuted: '#8B8880',
  textGhost: '#C4BFB8',
  accent: '#1B3A5C',
  gold: '#8A6A14',
  goldLight: '#B8A878',
  q1: '#B83232',
  q2: '#1A6B45',
  q3: '#1A5A8A',
  q4: '#6B6870',
  q1Wash: 'rgba(184,50,50,0.06)',
  q2Wash: 'rgba(26,107,69,0.05)',
  q3Wash: 'rgba(26,90,138,0.045)',
  q4Wash: 'rgba(107,104,112,0.04)',
  overlay: 'rgba(26,24,20,0.32)',
  axisLine: 'rgba(0,0,0,0.08)',
};

export const darkTokens: ThemeTokens = {
  bg: '#0C0E14',
  surface: '#131620',
  surface2: '#1A1D2B',
  border: 'rgba(255,255,255,0.07)',
  borderMid: 'rgba(255,255,255,0.12)',
  text: '#E8EAF0',
  textMuted: '#5A6070',
  textGhost: '#2A3050',
  accent: '#2A6EBB',
  gold: '#C9A84C',
  goldLight: '#8A6A14',
  q1: '#C0392B',
  q2: '#1F6B45',
  q3: '#2471A3',
  q4: '#4A4E5A',
  q1Wash: 'rgba(192,57,43,0.07)',
  q2Wash: 'rgba(31,107,69,0.05)',
  q3Wash: 'rgba(36,113,163,0.05)',
  q4Wash: 'rgba(74,78,90,0.03)',
  overlay: 'rgba(0,0,0,0.46)',
  axisLine: 'rgba(255,255,255,0.07)',
};

export function resolveTheme(mode: ThemeMode, systemScheme: 'light' | 'dark' | null): ThemeTokens {
  if (mode === 'light') return lightTokens;
  if (mode === 'dark') return darkTokens;
  return systemScheme === 'dark' ? darkTokens : lightTokens;
}
```

### 1.2 Font system

Install the following Google Fonts via `expo-font`:
- `Cormorant_Garamond` — weights 400 (regular), 400 italic, 600
- `LibreBaskerville_400Regular`, `LibreBaskerville_400Italic`, `LibreBaskerville_700Bold`
- `Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold`
- `PlusJakartaSans_400Regular`, `PlusJakartaSans_500Medium`, `PlusJakartaSans_600SemiBold`

Use `@expo-google-fonts/cormorant-garamond`, `@expo-google-fonts/libre-baskerville`, `@expo-google-fonts/inter`, `@expo-google-fonts/plus-jakarta-sans`.

Create `src/clearday/fonts.ts`:

```typescript
export type FontChoice = 'cormorant' | 'baskerville' | 'inter' | 'jakarta';

export interface FontSet {
  serif: string;
  serifItalic: string;
  serifBold: string;
  sans: string;
  sansMedium: string;
  label: string;        // always Inter or Jakarta for system labels regardless of choice
}

export function getFontSet(choice: FontChoice): FontSet {
  switch (choice) {
    case 'cormorant':
      return {
        serif: 'Cormorant_Garamond_400Regular',
        serifItalic: 'Cormorant_Garamond_400Italic',
        serifBold: 'Cormorant_Garamond_600SemiBold',
        sans: 'Cormorant_Garamond_400Regular',
        sansMedium: 'Cormorant_Garamond_600SemiBold',
        label: 'Inter_500Medium',
      };
    case 'baskerville':
      return {
        serif: 'LibreBaskerville_400Regular',
        serifItalic: 'LibreBaskerville_400Italic',
        serifBold: 'LibreBaskerville_700Bold',
        sans: 'LibreBaskerville_400Regular',
        sansMedium: 'LibreBaskerville_700Bold',
        label: 'Inter_500Medium',
      };
    case 'inter':
      return {
        serif: 'Inter_400Regular',
        serifItalic: 'Inter_400Regular',
        serifBold: 'Inter_600SemiBold',
        sans: 'Inter_400Regular',
        sansMedium: 'Inter_500Medium',
        label: 'Inter_500Medium',
      };
    case 'jakarta':
      return {
        serif: 'PlusJakartaSans_400Regular',
        serifItalic: 'PlusJakartaSans_400Regular',
        serifBold: 'PlusJakartaSans_600SemiBold',
        sans: 'PlusJakartaSans_400Regular',
        sansMedium: 'PlusJakartaSans_500Medium',
        label: 'PlusJakartaSans_500Medium',
      };
  }
}

// Font display names for Settings UI
export const FONT_LABELS: Record<FontChoice, string> = {
  cormorant: 'Cg',
  baskerville: 'Lb',
  inter: 'In',
  jakarta: 'Pj',
};
```

### 1.3 AppConfig additions

Add the following fields to `AppConfig` in `src/clearday/types.ts`:

```typescript
fontChoice: FontChoice;        // default: 'cormorant'
matrixStyle: MatrixStyle;      // default: 'tinted'
mitResetHour: number;          // default: 0  (midnight, 0–23)
```

Update `loadConfig()` in `storage.ts` to include these defaults.

---

## 2. APP ICON & SPLASH SCREEN

### 2.1 Generate app icon programmatically

Create `scripts/generateIcon.ts`. Run with `npx ts-node scripts/generateIcon.ts` to produce `assets/icon.png` and `assets/adaptive-icon.png`.

Icon spec:
- 1024×1024px canvas
- Background: `#F8F7F4` (light warm white)
- Two perpendicular lines (crosshair), each 3px wide, color `#C8C2BB`, centered, full width/height — they do NOT touch the edges, stop 120px from each edge
- Three concentric circles centered at canvas center: outer radius 180px, mid radius 110px, inner radius 48px — stroke only, `#C8C2BB`, 2.5px stroke, no fill
- Innermost filled circle: radius 28px, fill `#8A6A14` (gold)
- All elements perfectly centered

Use the `canvas` npm package or `sharp` for PNG generation. Output at 1024×1024 and also 512×512 for adaptive.

Favicon (`assets/favicon.png`): same design at 64×64px, simplified — just the crosshair lines and the gold inner circle, no concentric rings.

### 2.2 Splash screen

Background color: `#F8F7F4`. Centered icon (the crosshair + concentric + gold dot) at 180×180px. No text. Update `app.json` splash config accordingly.

---

## 3. NAVIGATION — CUSTOM SINGLE-SCREEN STATE APPROACH

Remove all React Navigation dependencies. Replace with a simple screen state manager.

### 3.1 Screen state

Create `src/clearday/navigation.ts`:

```typescript
export type Screen = 'matrix' | 'active' | 'more';
export type Panel =
  | 'add'
  | 'detail'
  | 'sparks'
  | 'hold'
  | 'vault'
  | 'reflect'
  | 'pulse'
  | 'settings'
  | null;
```

The app has one root view. Screens are rendered conditionally based on a `currentScreen` state variable. Panels slide up as bottom sheets over any screen.

### 3.2 Floating pill navigation

The floating pill is the only persistent navigation element on the Matrix screen. It is **not** shown on the Active list or Settings views — those have their own back navigation.

**Pill spec:**
- Position: `position: 'absolute'`, `bottom: 18 + safeAreaInsets.bottom`, horizontally centered
- Background: `rgba(248,246,242,0.94)` light mode / `rgba(9,11,17,0.92)` dark mode
- Border: `0.5px solid rgba(0,0,0,0.13)` light / `1px solid rgba(255,255,255,0.08)` dark
- Border radius: 28px (pill shape)
- Padding: 9px vertical, 20px horizontal
- Gap between icons: 20px
- **Three icons only** (left to right):
  1. Crosshair — two perpendicular lines, no dot, color `textGhost` when inactive — tapping goes to Matrix screen
  2. List lines — three horizontal lines descending, color `textGhost` when inactive — tapping goes to Active list
  3. Three dots horizontal — color `textGhost` when inactive — tapping opens More bottom sheet
- Active icon: color `accent`
- Active indicator: 2px line above the active icon, color `accent`, width 16px, centered

**Visibility behaviour (critical):**
- **Mobile (iOS/Android):** Pill is hidden by default. It fades in (`opacity: 0 → 1`) over 200ms when the user touches/scrolls the screen. It fades out after 2500ms of inactivity. Use `Animated.Value` for opacity. Reset the fade-out timer on every touch event captured by a root `TouchableWithoutFeedback` wrapping the matrix area.
- **Web:** Pill fades in when the user moves the mouse over the matrix area (`onMouseEnter`), fades out 2500ms after `onMouseLeave` or last mouse movement.
- The pill is **never shown** when a panel/sheet is open.

### 3.3 More bottom sheet

Tapping the three-dots icon opens a bottom sheet listing secondary screens:

```
Log (Reflection)
On Hold
Archive
Settings
```

Each row: 44px height, Cormorant serif 14px, `text` color, right arrow icon `→`. Tap navigates to that view and closes the sheet.

### 3.4 Back navigation

Active list, Settings, Reflection, On Hold, Archive — all are full-screen views pushed over the matrix. Each has a back arrow (`←`) top-left that returns to Matrix. No tab bar. No pill shown on these screens.

### 3.5 iPad and web sidebar

On screens wider than 768px (detect via `Dimensions.get('window').width`):
- Replace the floating pill with a fixed left sidebar, 220px wide
- Sidebar background: `surface` color, right border `border` color
- Three navigation items stacked vertically with 48px touch targets, same icons as the pill
- Active item: left 2px accent line
- More items (Log, On Hold, Archive, Settings) shown directly below as text rows in the sidebar — no separate More sheet needed on wide screens
- Matrix and all content occupy remaining width to the right of the sidebar

---

## 4. FORM FACTOR & RESPONSIVE LAYOUT

This is a cross-platform app. Apply these rules everywhere, not just in one component.

### 4.1 Utility function

Create `src/clearday/scale.ts`:

```typescript
import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');
const BASE_WIDTH = 375;

export function moderateScale(size: number, factor = 0.5): number {
  return size + (width / BASE_WIDTH - 1) * size * factor;
}

export const isTablet = width >= 768;
export const isWeb = Platform.OS === 'web';
export const isWide = width >= 768;
```

Use `moderateScale()` for all font sizes and component padding. Never hardcode pixel values for layout dimensions.

### 4.2 Safe area

Use `useSafeAreaInsets()` from `react-native-safe-area-context` on every screen. Apply `insets.bottom` to pill positioning and sheet padding. Apply `insets.top` to header padding.

### 4.3 Bubble positioning

Bubble `cx` and `cy` are fractional (0–1) of the container dimensions. Always compute pixel position as `cx * containerWidth` and `cy * containerHeight` measured via `onLayout`. Never use hardcoded pixel positions for bubbles.

### 4.4 Minimum touch targets

All interactive elements: minimum 44×44pt. Smaller visual elements (icons, chips) must have invisible hit slop padding to meet this minimum. Use `hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}` where needed.

---

## 5. MIT STRIP

Replace the existing MIT strip with the following spec.

### 5.1 Visual spec

- Height: **24px fixed**
- No background fill — transparent, sits directly on `bg` color
- Border bottom: `0.5px solid border` color
- Left icon: concentric target (three rings, innermost filled gold) — SVG inline, 14×14px
- Icon color: `gold` (`#8A6A14` light, `#C9A84C` dark)
- Text: agenda title in Cormorant italic, 10.5px, color `text`, flex 1, single line, truncated with ellipsis
- If no MIT set: placeholder text in Cormorant italic, 10px, color `textGhost`: *"Today's #1"*
- Right side: nothing (no chevron, no button — the entire strip is tappable)

### 5.2 Interaction

Tapping anywhere on the strip opens a compact bottom sheet:

- Title: *"Today's #1"* in Cormorant italic 16px
- First row: text input, placeholder *"Type a custom intention…"*, Cormorant italic, autofocus
- Below input: scrollable list of all `status === 'active'` agendas sorted Q1 first, then Q2, Q3, Q4. Each row: 44px, colour dot (quadrant colour), agenda text Cormorant 13px
- Tapping any agenda row or submitting the text input sets MIT and closes the sheet
- Sheet has a clear/reset option: small *"Clear MIT"* text link, Cormorant italic, `textGhost` colour, bottom of sheet

### 5.3 MIT auto-reset

On app launch (in `bootstrap()`), check if current time has passed `mitResetHour` (default: 0, midnight). If the date has changed since last MIT was set, clear the MIT string. Store last-set timestamp alongside MIT text in AsyncStorage.

### 5.4 Set as MIT from add/edit sheet

On the add agenda sheet and the edit agenda sheet, add a small row directly below the title input:

- Left: star icon (14×14px outline), gold colour when active, `textGhost` when inactive
- Right of star: Cormorant italic 9px text, `textGhost`: *"Set as today's MIT"*
- Tapping the row toggles the star filled/outline and marks the agenda as MIT on save
- Only one agenda can be MIT — if one is already set, this replaces it on save with a brief toast: *"MIT updated"*

### 5.5 MIT carry-forward morning prompt

On app launch, after `bootstrap()`:
- If yesterday's MIT was not completed (i.e., it was set and the day has rolled over but the agenda is still `status === 'active'`):
- Show a modal overlay (blurred background `overlay` color, 0.32 opacity)
- Modal card: `surface` background, 12px border radius, padding 16px
- Content:
  - Section label: *"Good morning"* — 7.5px, `textGhost`, letter-spacing 0.1em, uppercase, Inter
  - Heading: *"Yesterday's MIT was unfinished."* — Cormorant 11px, `text`
  - MIT text quoted: Cormorant italic 9px, `gold` colour
  - Body: *"Carry it forward to today?"* — Cormorant 8.5px, `textMuted`
  - Two buttons side by side: *"Not today"* (outlined) and *"Carry forward"* (filled dark)
- Tapping *"Carry forward"* sets that agenda as today's MIT and dismisses
- Tapping *"Not today"* clears MIT and dismisses
- This prompt appears maximum once per day — store last-shown date in AsyncStorage

---

## 6. MATRIX SCREEN

### 6.1 Layout structure (top to bottom)

```
SafeAreaView (bg color)
  ├── MIT Strip (24px)
  ├── Filter Row (22px)
  ├── Matrix Canvas (flex: 1)
  └── Floating Pill (absolute, bottom)
```

No header bar. No title. No hamburger menu.

### 6.2 Sparks icon (✦)

Position: absolute, top-right of the matrix canvas area (not the MIT strip).
- 28×28px touch target
- Icon: 4-point star SVG, 12×12px, color `goldLight`
- `top: 8`, `right: 8` relative to matrix canvas
- Always visible at opacity 0.6, brightens to 1.0 on press
- Tapping opens the Sparks capture bottom sheet (existing functionality, restyled)

### 6.3 Filter row

Height: 22px. Padding: 0 10px. Display: flex row, gap 4px.

**Tag chips:** For each active tag in `config.tags`:
- Border: `1px solid accent` when selected, `0.5px solid borderMid` when not selected
- Border radius: 2px
- Padding: 1px 6px
- Left: 3×3px circle filled with tag colour
- Right: tag abbreviation (Initial-cap, e.g. "Pro"), 6.5px, `accent` when selected, `textGhost` when not
- Background: transparent always
- Default state: ALL tags selected

**No effort filter chip.** Remove any existing effort filter.

### 6.4 Matrix canvas — Tinted style (default)

The matrix is divided into four quadrant cells in a 2×2 grid layout with no gap:

- Q2 (Schedule) top-left: background `q2Wash`
- Q1 (Do Now) top-right: background `q1Wash`, separated from Q2 by 1px `q1` color at 12% opacity
- Q4 (Eliminate) bottom-left: background `q4Wash`, separated from Q2 by 1px `rgba(0,0,0,0.06)`
- Q3 (Delegate) bottom-right: background `q3Wash`
- Central horizontal divider: 1px `axisLine`
- Central vertical divider: 1px `axisLine`
- Quadrant watermark labels: Cormorant italic, 7.5px, positioned bottom-left of each quadrant for Q2/Q4 and bottom-right for Q1/Q3, opacity 0.38, colour is the quadrant colour

**Editorial style:** Pure white (#FFFFFF) background, no tints. Thin 1px `axisLine` crosshair only. Quadrant watermarks in Cormorant italic at 10% opacity.

**Paper style:** White background with SVG grid pattern — minor grid lines every 10px at 4% opacity, major grid lines every 50px at 8% opacity. Crosshair lines slightly darker (14% opacity). Axis labels *"urgency →"* and *"importance ↑"* in Cormorant italic 6.5px at far edges.

Apply the correct background via `config.matrixStyle`. The matrix layout structure (bubbles, dividers, quadrant labels) is identical across all three styles — only the background/grid rendering changes.

### 6.5 Quadrant overflow warning

If Q1 (`status === 'active'` agendas with `quadrant === 'Q1'`) count exceeds 5:
- Show a small inline notice inside the Q1 quadrant, bottom of the quadrant
- Background: `rgba(184,50,50,0.08)`, border `rgba(184,50,50,0.22)`, border-radius 3px, padding 2px 6px
- Text: Cormorant italic 6.5px, `q1` color: *"5+ items — consider delegating"*
- Disappears automatically when count drops to 5 or below

### 6.6 Bubble visual (light mode)

- Shape: perfect circle
- Size: `getR(time)` — quick=20, short=29, medium=38, deep=50 (radius in px)
- Background: quadrant wash colour at 1.5× opacity (slightly stronger than quadrant background)
- Border: `1.5px solid` quadrant colour at 72% opacity
- No shadow, no glow (except during drag — see 6.7)
- Label: Cormorant regular, `text` colour, 6.5–8px depending on radius, centered, max 2 lines, truncated
- On-hold bubbles: opacity 0.42, pause icon top-right 10px

### 6.7 Bubble drag

- On drag start: border brightens to 100% opacity, very subtle shadow (`shadowOpacity: 0.15`, `shadowRadius: 8`, shadow color = quadrant colour)
- Scale: 1.06 during drag
- Z-index: 30 during drag
- On drop: persist new `cx`, `cy`, recompute `quadrant` via `qFromPos()`
- Bounds: `cx` clamped 0.03–0.97, `cy` clamped 0.03–0.97

### 6.8 Bubble tap — action sheet

Single tap on bubble (when not dragged) opens a bottom sheet:

**Header:**
- Agenda text: Cormorant italic 13px, `text`, 2 lines max
- Meta row: quadrant label · tag abbreviation · effort label — Cormorant 8px, `textGhost`, separated by ` · `

**Five action rows** (full width, 44px each, separated by `0.5px border`):
1. **Done** — checkmark SVG icon `q2` colour, Cormorant 13px `text`
2. **Edit** — edit lines SVG icon `textMuted`, Cormorant 13px `text` — opens the edit sheet
3. **Hold** — pause SVG icon `textMuted`, Cormorant 13px `text` — if already on hold, label becomes *"Resume"*
4. **Archive** — box SVG icon `textMuted`, Cormorant 13px `text`
5. **Delete** — trash SVG icon `q1` colour, Cormorant 13px `q1` colour

**Matrix canvas tap (not on a bubble):** Opens the add agenda sheet with urgency/importance pre-filled from tap position using `slidersFromPos()`.

---

## 7. ADD / EDIT AGENDA SHEET

### 7.1 Visual spec

Bottom sheet. Background `surface`. Border radius 16px top corners. Handle bar: 36px wide, 3px tall, `border` colour, centered, 12px top margin.

**Fields (top to bottom):**

1. **Title input**
   - Cormorant italic, 14px, `text` colour
   - Placeholder: *"Name this agenda…"* in `textGhost`
   - Single line, max 80 chars
   - Background `surface2`, border `0.5px border`, border-radius 6px, padding 10px 12px
   - Autofocus on open

2. **Set as MIT row** (directly below title input)
   - Left: star SVG 13×13px — outline `textGhost` when inactive, filled `gold` when active
   - Right: Cormorant italic 9px `textGhost`: *"Set as today's MIT"*
   - Entire row tappable, 36px height
   - Toggling filled star = will set as MIT on save

3. **Urgency slider**
   - Label: Inter 500, 9px, uppercase, letter-spacing 0.1em, `textMuted`: `URGENCY`
   - Value display: Inter 600, 13px, `accent`, right-aligned
   - Slider range: 5–95, step 1
   - Help text below: Cormorant italic 9px `textGhost`: *"Urgent = delay creates real consequences"*

4. **Importance slider** — same structure as urgency
   - Help text: *"Important = advances your goals, not someone else's urgency"*

5. **Effort slider**
   - Label: `EFFORT`
   - Range: 1–7 mapped to quick/short/medium/deep
   - Value display: the time label string (e.g., "1 hr")

6. **Category selector**
   - One row of tag chips, same style as filter row but selectable
   - Single-select, active = filled accent background, white text

7. **Quadrant preview** (live, updates as sliders move)
   - Small 44×44px 2×2 grid showing which quadrant is active (coloured cell)
   - Below it: Cormorant italic 9px `accent`: *"→ Schedule · Do First"* (quadrant name · action label)

8. **Submit button**
   - Full width, 48px height, background `text` colour, border-radius 6px
   - Cormorant 14px white: *"Place in [QuadrantName]"*
   - Disabled (opacity 0.35) until title is non-empty

---

## 8. ACTIVE LIST SCREEN

Full-screen view (pill hidden). Back arrow top-left returns to Matrix.

### 8.1 Filter

Shows `status === 'active'` agendas **only**. On-hold agendas are NOT shown here.

### 8.2 Row spec

- Row height: 44px
- Left: 4×4px circle filled with quadrant colour
- Centre: agenda text, Cormorant regular 12px, `text`, single line truncated
- Right: two icon buttons, each 32×32px touch target
  - Icon 1: restore/loop icon — tapping opens action sheet
  - Icon 2: archive box icon — tapping archives immediately with toast *"Archived"*
- Separator: `0.5px border` between rows
- Group by quadrant with section headers: Inter 500, 7.5px, uppercase, letter-spacing 0.1em, `textGhost` — e.g., `DO NOW · Q1`

### 8.3 Row tap

Tapping anywhere on the row (not the icon buttons) opens the same 5-action sheet as bubble tap (Done · Edit · Hold · Archive · Delete).

### 8.4 No bulk select

No select-all. No checkboxes. No multi-select of any kind.

---

## 9. SETTINGS SCREEN

Full-screen. Back arrow top-left. Scrollable to bottom. Background `bg`.

Header: *"Settings"* — Cormorant weight 300, 22px, letter-spacing -0.3px, `text`.

### 9.1 Section: Appearance

Section label: Inter 500, 7px, uppercase, letter-spacing 0.12em, `textGhost`

Each setting row: 44px height, Cormorant 10px `text` left label, options right-aligned.

**Active selection style (Option B — underline):** Active option text is `text` colour with `1px solid text` bottom border, padding-bottom 1px. Inactive options are `textGhost`, no border. Options separated by 10px horizontal gap.

Rows:
- **Theme:** Light · Dark · System
- **Style:** Editorial · Tinted · Paper
- **Font:** Cg · Lb · In · Pj (abbreviations — Cormorant italic for Cg, regular for others)

### 9.2 Section: Today's Focus

- **MIT resets at:** Right side shows time (e.g., *"12:00 am"*) in Cormorant 10px `text`. Tapping opens a time picker (platform native). Default: midnight (00:00).
- Below the row, in very light Cormorant italic 8px `textGhost`, line-height 1.5:
  *"MIT = Most Important Task. Your top agenda wins the day."*

### 9.3 Section: Categories

- Each category row: 36px height
  - Left: 3×3px colour dot
  - Centre-left: abbreviation (e.g., "Pro") — Cormorant 9px `text`
  - Centre: full name (e.g., "Professional") — Cormorant italic 8px `textGhost`
  - Right: `→` arrow icon — tapping opens inline rename for both abbreviation and full name
- Below list: *"Add category"* row with `+` icon, Cormorant italic 8px `textGhost`. Max 4 categories. Not shown if 4 already exist.

### 9.4 Section: Manage

Rows (each 44px, Cormorant 10px `text`, right side Cormorant italic `textGhost`):
- **On Hold** — *"N items →"* — tapping navigates to On Hold screen
- **Archive** — *"N items →"* — tapping navigates to Archive screen
- **Archive expires** — right: *"60 days"* with chevron, tapping opens picker (Off / 30 days / 60 days / Never)

### 9.5 Section: Clarity (app footer)

Section label: Inter 500, 7px, uppercase, `textGhost`: `CLARITY`

Rows:
- **About me** → (tappable, navigates to placeholder screen)
- **Contact** → (tappable, opens email link)

Below the rows, Cormorant italic 8px `textGhost`, line-height 1.6, padding-top 10px:

*"Most people confuse being busy with being productive. The Eisenhower Matrix changes that. By sorting tasks into four clear quadrants, you stop reacting to noise and start investing your time where it genuinely creates impact and drives meaning."*

---

## 10. ON HOLD SCREEN

Full-screen. Back arrow top-left. Background `bg`.

Header: *"On Hold"* — Cormorant 300, 22px.

Shows all `status === 'onhold'` agendas.

### Row spec (44px)
- Left: 4×4px circle, quadrant colour
- Centre: agenda text Cormorant 12px `text`, single line truncated
- Right: two icon-only buttons (32×32px each):
  - ↩ restore icon: tapping restores to `status: 'active'` with toast *"Restored"*
  - 🗄 archive icon: tapping archives with toast *"Archived"*
- Tapping row body: opens 5-action sheet

Empty state: Cormorant italic 13px `textGhost`, centered: *"Nothing paused. Everything in motion."*

---

## 11. ARCHIVE (VAULT) SCREEN

Full-screen. Back arrow. Background `bg`.

Header: *"Archive"* — Cormorant 300, 22px.

Two sections: **Active** (within expiry) and **Expired** (past expiry, if expiry is enabled).

### Row spec (44px)
- Left: 4×4px circle, quadrant colour
- Centre: agenda text Cormorant 12px `text`. Expired rows: `textGhost` with strikethrough.
- Right of text: if expiry on, days remaining in Cormorant italic 8px `textGhost` (red if < 10 days)
- Right: two icon-only buttons:
  - ↩ restore: restores to active with toast
  - ✕ delete: permanently deletes with toast *"Deleted"*

Empty state: Cormorant italic 13px `textGhost`, centered: *"The archive is clear."*

---

## 12. SPARKS CAPTURE SHEET

Restyled existing functionality. No logic changes.

Bottom sheet. Same header style as other sheets.

Title: *"Sparks"* — Cormorant 300, 18px.
Subtitle: Cormorant italic 9px `textGhost`: *"Raw thoughts, unfiltered."*

**Input row:** text input (Cormorant italic 13px) + *"Add"* button (Cormorant 11px, `accent` colour, no background).

**Spark list rows (44px each):**
- Left: small dot `textGhost`
- Centre: spark text Cormorant 12px `text`, 2 lines max
- Right: two icon-only buttons:
  - ↗ promote icon (`accent` colour): opens AI suggestion flow (existing aiStub logic, restyled)
  - ✕ delete: removes spark

**AI suggestion card** (appears below list when active):
- Background `surface2`, border `0.5px borderMid`, border-radius 8px, padding 12px
- Animated blink on *"Thinking…"* state: Cormorant italic 10px `textGhost`
- On result: shows refined text, quadrant label, reason
- Two buttons: *"Place on Matrix"* (filled) · *"Dismiss"* (outlined)

---

## 13. REFLECTION SCREEN

Restyled existing functionality. No logic changes to `aiStub.ts`.

Full-screen. Back arrow. Background `bg`.

Header: *"Reflection"* — Cormorant 300, 22px.
Subtitle: Cormorant italic 9px `textGhost`: *"End of day. What moved."*

**Trigger button:** Full-width, 44px, border `0.5px borderMid`, border-radius 6px, Cormorant 13px `text`: *"Generate reflection"*

**Reflection text:** When returned from `aiStub.reflectDay()`, displayed in Cormorant italic 14px `text`, line-height 1.8, padding 16px. No card background — floats on `bg`.

**Pulse section below:**
- Two buttons side by side: *"This Week"* · *"This Month"*
- Pulse result: three numbered insight rows, Cormorant 12px `textMuted`, each preceded by a 3×3px `accent` dot

---

## 14. TOAST NOTIFICATIONS

Replace any existing alert/confirm dialogs with toast notifications.

Spec:
- Position: absolute, bottom `18 + insets.bottom + pill height`, horizontally centered
- Width: 80% of screen width, max 320px
- Background: `surface2`
- Border: `0.5px borderMid`
- Border radius: 8px
- Text: Cormorant italic 11px `text`, centered
- Animation: fade in 150ms, hold 1600ms, fade out 250ms
- Never blocks touch — `pointerEvents: 'none'`

---

## 15. `app.json` UPDATES

```json
{
  "expo": {
    "name": "Clarity",
    "slug": "clarity",
    "version": "1.0.0",
    "userInterfaceStyle": "light",
    "splash": {
      "backgroundColor": "#F8F7F4",
      "resizeMode": "contain"
    },
    "ios": {
      "bundleIdentifier": "com.clarity.app",
      "supportsTablet": true
    },
    "android": {
      "package": "com.clarity.app",
      "adaptiveIcon": {
        "backgroundColor": "#F8F7F4"
      }
    }
  }
}
```

---

## 16. `App.tsx` — ROOT COMPONENT

```typescript
import 'react-native-gesture-handler'; // remove if gesture handler is fully removed
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { ClarityApp } from './src/clearday/ClarityApp';

export default function App() {
  const [fontsLoaded] = useFonts({
    // all four font families loaded here
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ClarityApp />
    </SafeAreaProvider>
  );
}
```

Create `src/clearday/ClarityApp.tsx` as the new root component. It handles:
- `bootstrap()` on mount
- MIT carry-forward prompt logic
- Screen state (`currentScreen`, `openPanel`)
- Theme resolution
- Rendering the correct screen + floating pill + open panel/sheet

---

---

# SEGMENT B — PHASE 2 / DO NOT TOUCH

**Do not implement, scaffold, stub, or reference any of the following. Leave no code, imports, comments, or TODOs for these items.**

### B.1 Authentication & user accounts
- Google Sign-In
- Apple Sign-In
- Microsoft O365 Sign-In
- Any other IAM / OAuth flow
- Supabase Auth or any remote auth library

### B.2 Backend / cloud sync
- Supabase database
- Firebase / Firestore
- Any remote API for data persistence
- Share-via-code feature (generating or reading shared snapshots)
- Any `window.storage` shared-mode usage

### B.3 AI features (logic only — UI is restyled in Segment A)
- Replacing `aiStub.ts` with real Anthropic API calls
- API key management
- Streaming responses
- Any network calls to `api.anthropic.com`

### B.4 Weekly Snapshot / Share Card
- Generating a shareable summary card
- Any export-to-image functionality

### B.5 Notifications & background tasks
- Push notifications
- Local scheduled notifications
- Background fetch or background tasks of any kind

### B.6 Recurrence / repeating agendas
- Any `recurrence` field on the Agenda type
- Auto-respawn after completion

### B.7 Focus timer
- Any timer or countdown functionality attached to agendas

### B.8 Additional persona themes
- Ink theme (dark executive)
- Slate theme (engineering)
- Any theme beyond light/dark

### B.9 Collaboration / team features
- Any multi-user functionality
- Read-only snapshot views for teammates

---

---

# IMPLEMENTATION ORDER (recommended)

Follow this order to minimise broken states during development:

1. Preliminary: delete legacy files, remove navigation libraries, update `App.tsx`
2. Design tokens (`theme.ts`) and font system (`fonts.ts`)
3. App icon and splash generation script
4. `AppConfig` type updates and storage defaults
5. `ClarityApp.tsx` root component with screen state management
6. MIT strip (smallest, most visible win)
7. Matrix screen — layout, filter row, Sparks ✦ icon
8. Matrix canvas — Tinted style default, bubble visuals
9. Floating pill — visibility behaviour (mobile + web)
10. Add / Edit agenda sheet including Set as MIT interaction
11. Bubble action sheet
12. MIT carry-forward morning prompt
13. Active list screen
14. On Hold screen
15. Archive screen
16. Settings screen (all sections)
17. Sparks sheet restyle
18. Reflection screen restyle
19. Toast system
20. Quadrant overflow warning
21. iPad/web sidebar nav
22. Responsive layout audit across all screens
23. `app.json` final update, icon/splash asset placement
24. Remove any remaining legacy imports or dead code

---

# QUALITY CHECKLIST (verify before considering Phase 1 complete)

- [ ] No imports referencing any deleted legacy file
- [ ] No `@react-navigation` imports anywhere
- [ ] App runs on iOS simulator, Android emulator, and `expo start --web` without errors
- [ ] MIT strip shows, updates, and resets correctly
- [ ] Floating pill fades in/out on touch (mobile) and hover (web)
- [ ] Bubble drag updates position and quadrant correctly
- [ ] Bubble tap opens action sheet (not drag)
- [ ] All three matrix styles (Editorial, Tinted, Paper) render correctly
- [ ] Settings font switcher changes typeface app-wide
- [ ] Settings theme switcher changes colours app-wide
- [ ] On Hold screen shows only `onhold` agendas
- [ ] Active list shows only `active` agendas
- [ ] No bulk-select UI anywhere
- [ ] No effort filter chip in filter row
- [ ] No tab bar visible anywhere
- [ ] Carry-forward prompt shows maximum once per day
- [ ] Q1 overflow warning appears at 6+ items and disappears below 6
- [ ] iPad layout uses sidebar nav not pill
- [ ] All touch targets minimum 44×44pt
- [ ] No hardcoded pixel layout values (all use `moderateScale` or `onLayout` fractions)
- [ ] No Segment B code exists anywhere in the codebase
