# Clarity App — Screen Design Specification
## Complete Visual & Interaction Guide for Claude Code

**Document Purpose:** Source of truth for visual implementation. Use this to validate each screen matches the agreed design.

---

## DESIGN TOKENS & CONSTANTS

### Colors (Light Mode — Default)
```
bg: #F8F7F4
surface: #FFFFFF
surface2: #FEFCF8
border: rgba(0,0,0,0.07)
borderMid: rgba(0,0,0,0.12)
text: #1A1814
textMuted: #8B8880
textGhost: #C4BFB8
accent: #1B3A5C (steel blue)
gold: #8A6A14
goldLight: #B8A878

Q1 (Do Now): #B83232 (red)
Q2 (Schedule): #1A6B45 (green)
Q3 (Delegate): #1A5A8A (blue)
Q4 (Eliminate): #6B6870 (grey)

Q1Wash: rgba(184,50,50,0.06)
Q2Wash: rgba(26,107,69,0.05)
Q3Wash: rgba(26,90,138,0.045)
Q4Wash: rgba(107,104,112,0.04)

overlay: rgba(26,24,20,0.32)
axisLine: rgba(0,0,0,0.08)
```

### Fonts
- **Serif headlines:** Cormorant Garamond (400 regular, 400 italic, 600 bold)
- **Serif fallback:** Libre Baskerville
- **Sans/labels:** Inter 500 (system labels)

### Bubble Sizes (by effort)
- Quick: 20px radius
- Short: 29px radius
- Medium: 38px radius
- Deep: 50px radius

### Safe Area & Insets
- Use `useSafeAreaInsets()` from `react-native-safe-area-context`
- Apply to pill positioning: `bottom: 18 + insets.bottom`
- Apply to header: `top: insets.top`

---

## SCREEN 1: MATRIX SCREEN (Primary View)

### Layout (Top to Bottom)
```
SafeAreaView (bg: #F8F7F4)
  ├── MIT Strip (24px fixed height)
  ├── Filter Row (22px)
  ├── Matrix Canvas (flex: 1)
  └── Floating Pill (absolute, bottom)
```

### 1.1 MIT Strip (24px)
**Visual:**
- Height: 24px fixed
- Background: transparent
- Border-bottom: 0.5px solid `border` color
- Left padding: 12px
- Right padding: 12px

**Content:**
- **Left:** Target icon (3 concentric circles + filled gold center) — 14×14px, color `gold`
- **Center:** MIT agenda text in Cormorant italic 10.5px, `text` color, flex 1, single line truncated
- **Placeholder (if no MIT set):** Cormorant italic 10px, `textGhost`: *"Today's #1"*
- **Interaction:** Entire strip tappable → opens MIT selector bottom sheet

**MIT Selector Sheet:**
- Title: *"Today's #1"* — Cormorant italic 16px
- Input: text input (Cormorant italic), placeholder *"Type a custom intention…"*, autofocus
- List: all `status === 'active'` agendas, sorted Q1 → Q2 → Q3 → Q4
  - Row height: 44px
  - Left: 4×4px circle (quadrant color)
  - Text: Cormorant 13px, `text` color
- Button: *"Clear MIT"* — Cormorant italic, `textGhost`, bottom of sheet

**MIT Reset Logic:**
- Check on app launch if current date > last-set date
- If yes, clear MIT
- Store last-set timestamp in AsyncStorage alongside MIT text

**MIT Carry-Forward Prompt (on app launch):**
- Trigger: Yesterday's MIT was active but not completed
- Modal: blurred overlay (`overlay` color, 0.32 opacity)
- Card: `surface` bg, 12px border-radius, padding 16px
  - Label: *"Good morning"* — 7.5px, `textGhost`, uppercase, Inter, letter-spacing 0.1em
  - Heading: *"Yesterday's MIT was unfinished."* — Cormorant 11px, `text`
  - MIT text quoted: Cormorant italic 9px, `gold`
  - Body: *"Carry it forward to today?"* — Cormorant 8.5px, `textMuted`
  - Buttons: *"Not today"* (outlined) | *"Carry forward"* (filled dark)
- Store last-shown date to prevent re-showing same day

---

### 1.2 Filter Row (22px)
**Layout:** Horizontal flex row, gap 4px, padding 0 10px

**Tag Chips:**
- For each active tag in `config.tags`
- Border: `1px solid accent` (selected) or `0.5px solid borderMid` (unselected)
- Border-radius: 2px
- Padding: 1px 6px
- Left: 3×3px circle (tag color)
- Right: tag abbreviation, 6.5px, `accent` (selected) or `textGhost` (unselected)
- Background: transparent always
- Default: ALL tags selected

**No effort filter.** Remove entirely.

---

### 1.3 Matrix Canvas (flex: 1)
**Layout:** 2×2 grid, no gap between cells

**Quadrant Backgrounds:**
- Q2 (top-left): `q2Wash` (#1A6B45 at 5% opacity)
- Q1 (top-right): `q1Wash` (#B83232 at 6% opacity)
- Q4 (bottom-left): `q4Wash` (#6B6870 at 4% opacity)
- Q3 (bottom-right): `q3Wash` (#1A5A8A at 4.5% opacity)

**Dividers:**
- Horizontal: 1px `axisLine`
- Vertical: 1px `axisLine`
- Q1/Q2 boundary: optional thin Q1 color line at 12% opacity

**Watermark Labels (bottom corner of each quadrant):**
- Q2/Q4: bottom-left corner
- Q1/Q3: bottom-right corner
- Font: Cormorant italic 7.5px
- Color: quadrant color, opacity 0.38
- Text: quadrant name (e.g., "Schedule", "Do Now")

**Matrix Styles (toggle in Settings):**

1. **Tinted (default):** Colored wash backgrounds as described above
2. **Editorial:** Pure white background, thin 1px `axisLine` crosshair only, watermarks at 10% opacity
3. **Paper:** White background + SVG grid pattern
   - Minor lines: every 10px, 4% opacity
   - Major lines: every 50px, 8% opacity
   - Axis labels: *"urgency →"* and *"importance ↑"* in Cormorant italic 6.5px at far edges

**Bubble Positioning:**
- `cx` and `cy` are fractional (0–1) of container
- Compute pixel position: `cx * containerWidth`, `cy * containerHeight`
- Measure container via `onLayout` callback
- Bounds: clamp `cx` 0.03–0.97, `cy` 0.03–0.97

---

### 1.4 Bubble Visual (Light Mode)
**Shape & Size:**
- Perfect circle
- Radius: `getR(effort)` where quick=20, short=29, medium=38, deep=50 (in px)

**Styling:**
- Background: quadrant wash at 1.5× opacity (slightly darker than quadrant bg)
- Border: 1.5px solid quadrant color at 72% opacity
- No shadow, no glow (except on drag)
- Label: Cormorant regular, `text` color, 6.5–8px (scales with radius), centered, max 2 lines, truncated

**On-Hold Bubbles:**
- Opacity: 0.42
- Pause icon: 10×10px, top-right corner, `textGhost` color

**Drag Interaction:**
- On drag start:
  - Border opacity → 100%
  - Very subtle shadow: `shadowOpacity: 0.15`, `shadowRadius: 8`, shadow color = quadrant color
  - Scale: 1.06
  - Z-index: 30
- On drop:
  - Persist new `cx`, `cy`
  - Recompute quadrant via `qFromPos()`
- Bounds check: clamp to 0.03–0.97 both axes

**Tap Interaction (not drag):**
- Opens 5-action bottom sheet (see 1.5)

---

### 1.5 Bubble Action Sheet

**Header:**
- Agenda text: Cormorant italic 13px, `text`, 2 lines max
- Meta: quadrant label · tag abbr · effort label — Cormorant 8px, `textGhost`, separated by ` · `

**Five Action Rows (44px each, separated by 0.5px border):**

| Action | Icon | Icon Color | Text | Text Color |
|--------|------|-----------|------|-----------|
| Done | checkmark | `q2` | Done | `text` |
| Edit | pencil lines | `textMuted` | Edit | `text` |
| Hold | pause | `textMuted` | Hold / Resume | `text` |
| Archive | box | `textMuted` | Archive | `text` |
| Delete | trash | `q1` | Delete | `q1` |

- Font: Cormorant 13px
- Height: 44px
- Tappable full width

---

### 1.6 Sparks Icon (✦)
**Position:** Absolute, top-right of matrix canvas
- `top: 8`, `right: 8` relative to canvas
- Touch target: 28×28px
- Icon: 4-point star SVG, 12×12px, color `goldLight`
- Opacity: 0.6 default, 1.0 on press
- Tap: opens Sparks capture sheet (Section 7)

---

### 1.7 Q1 Overflow Warning
**Trigger:** `count of Q1 active agendas > 5`

**Display:**
- Position: bottom of Q1 quadrant
- Background: `rgba(184,50,50,0.08)`
- Border: `rgba(184,50,50,0.22)`, border-radius 3px
- Padding: 2px 6px
- Text: Cormorant italic 6.5px, `q1` color: *"5+ items — consider delegating"*
- Auto-disappears when count ≤ 5

---

### 1.8 Floating Pill (Mobile & Web)

**Mobile (touch) Behavior:**
- Hidden by default
- Fades in (0 → 1 opacity) over 200ms on first touch/scroll in matrix area
- Fades out after 2500ms inactivity
- Reset timer on each touch event
- Use `Animated.Value` for opacity
- Wrap matrix area in `TouchableWithoutFeedback` to capture all touch events

**Web Behavior:**
- Fade in on mouse enter over matrix area
- Fade out 2500ms after mouse leave or last movement
- Use `onMouseEnter`, `onMouseLeave`, `onMouseMove`

**Never Shown When:**
- Any panel/sheet is open

**Pill Spec (always):**
- Position: absolute, `bottom: 18 + insets.bottom`, horizontally centered
- Background: `rgba(248,246,242,0.94)` light / `rgba(9,11,17,0.92)` dark
- Border: `0.5px solid rgba(0,0,0,0.13)` light / `1px solid rgba(255,255,255,0.08)` dark
- Border-radius: 28px (pill shape)
- Padding: 9px vertical, 20px horizontal
- Gap: 20px between icons

**Three Icons (left to right):**
1. **Crosshair** (two perpendicular lines)
   - Color: `textGhost` (inactive), `accent` (active)
   - Tap: go to Matrix screen
2. **List lines** (three horizontal lines descending)
   - Color: `textGhost` (inactive), `accent` (active)
   - Tap: go to Active list screen
3. **Three dots** (horizontal)
   - Color: `textGhost` (inactive), `accent` (active)
   - Tap: open More bottom sheet

**Active Indicator:**
- 2px line above the active icon
- Color: `accent`
- Width: 16px, centered under icon

---

### 1.9 More Bottom Sheet
**Rows (44px each, Cormorant serif 14px, `text` color):**
- Log (Reflection)
- On Hold
- Archive
- Settings

**Right arrow icon:** `→`

**Tap action:** Navigate to that screen, close sheet

---

## SCREEN 2: ACTIVE LIST SCREEN

**Full-screen, pill hidden, back arrow top-left returns to Matrix**

### 2.1 Header
- Back arrow (`←`) top-left, 32×32px touch target
- Title: *"Active"* — Cormorant 22px, weight 300, letter-spacing -0.3px, `text`

### 2.2 Content
**Filter:** Shows only `status === 'active'` agendas (excludes on-hold)

**Section Headers:** Grouped by quadrant
- Inter 500, 7.5px, uppercase, letter-spacing 0.1em, `textGhost`
- Text: `DO NOW · Q1`, `SCHEDULE · Q2`, etc.

**Row Spec (44px):**
- Left: 4×4px circle (quadrant color)
- Centre: agenda text, Cormorant regular 12px, `text`, single line truncated
- Right: two icon-only buttons (32×32px each)
  - Icon 1: loop/restore icon, `textMuted`, tap opens action sheet
  - Icon 2: archive box icon, `textMuted`, tap archives with toast *"Archived"*
- Separator: 0.5px `border` between rows

**Row Tap (not icons):**
- Opens 5-action sheet (same as bubble action sheet from 1.5)

**Empty State:** None expected (all active agendas shown here)

---

## SCREEN 3: ADD / EDIT AGENDA SHEET

**Bottom sheet, `surface` background, border-radius 16px top corners**

### Handle Bar
- Width: 36px, height: 3px, color `border`, centered
- Top margin: 12px

### 3.1 Fields (Top to Bottom)

**1. Title Input**
- Font: Cormorant italic 14px, `text` color
- Placeholder: *"Name this agenda…"* in `textGhost`
- Max: 80 chars, single line
- Background: `surface2`, border `0.5px border`, border-radius 6px
- Padding: 10px 12px
- Autofocus on open

**2. Set as MIT Row**
- Height: 36px
- Left: star SVG 13×13px — outline `textGhost` (inactive), filled `gold` (active)
- Right: Cormorant italic 9px `textGhost`: *"Set as today's MIT"*
- Entire row tappable
- Toggling star = will set as MIT on save (replaces existing)

**3. Urgency Slider**
- Label: Inter 500, 9px, uppercase, letter-spacing 0.1em, `textMuted`: `URGENCY`
- Value: Inter 600, 13px, `accent`, right-aligned
- Range: 5–95, step 1
- Help text: Cormorant italic 9px `textGhost`: *"Urgent = delay creates real consequences"*

**4. Importance Slider** (same structure)
- Label: `IMPORTANCE`
- Help text: *"Important = advances your goals, not someone else's urgency"*

**5. Effort Slider**
- Label: `EFFORT`
- Range: 1–7 mapped to quick/short/medium/deep
- Value: time label string (e.g., "1 hr", "8 hrs+")

**6. Category Selector**
- One row of tag chips (same style as filter row)
- Single-select: active = filled `accent` background, white text
- Inactive = transparent, `textGhost` border

**7. Quadrant Preview**
- Small 44×44px 2×2 grid showing which quadrant is active (colored cell)
- Below: Cormorant italic 9px `accent`: *"→ Schedule · Do First"* (updates live as sliders move)

**8. Submit Button**
- Full width, 48px height
- Background: `text` color, border-radius 6px
- Text: Cormorant 14px white: *"Place in [QuadrantName]"*
- Disabled (opacity 0.35) until title is non-empty

---

## SCREEN 4: ON HOLD SCREEN

**Full-screen, back arrow, background `bg`**

### Header
- Back arrow top-left
- Title: *"On Hold"* — Cormorant weight 300, 22px

### Content
**Filter:** Shows only `status === 'onhold'` agendas

**Row Spec (44px):**
- Left: 4×4px circle (quadrant color)
- Centre: agenda text, Cormorant 12px, `text`, single line truncated
- Right: two icon-only buttons (32×32px each)
  - Icon 1: restore/loop icon, tap restores to `status: 'active'` with toast *"Restored"*
  - Icon 2: archive box icon, tap archives with toast *"Archived"*
- Tapping row body opens 5-action sheet

**Empty State:** Cormorant italic 13px `textGhost`, centered: *"Nothing paused. Everything in motion."*

---

## SCREEN 5: ARCHIVE (VAULT) SCREEN

**Full-screen, back arrow, background `bg`**

### Header
- Title: *"Archive"* — Cormorant 300, 22px

### Sections
**Active (within expiry) and Expired (past expiry, if expiry enabled)**

**Row Spec (44px):**
- Left: 4×4px circle (quadrant color)
- Centre: agenda text, Cormorant 12px, `text`
  - Expired rows: `textGhost` with strikethrough
- Right of text: if expiry enabled, days remaining in Cormorant italic 8px `textGhost` (red if < 10 days)
- Right: two icon-only buttons (32×32px each)
  - Icon 1: restore loop, restores to active with toast
  - Icon 2: delete ✕, permanently deletes with toast *"Deleted"*

**Empty State:** Cormorant italic 13px `textGhost`, centered: *"The archive is clear."*

---

## SCREEN 6: SETTINGS SCREEN

**Full-screen, back arrow, background `bg`, scrollable**

### Header
- Title: *"Settings"* — Cormorant weight 300, 22px, letter-spacing -0.3px

### 6.1 Appearance Section
**Label:** Inter 500, 7px, uppercase, letter-spacing 0.12em, `textGhost`: `APPEARANCE`

**Rows (44px each):**

| Setting | Options |
|---------|---------|
| Theme | Light · Dark · System |
| Style | Editorial · Tinted · Paper |
| Font | Cg · Lb · In · Pj |

**Option Styling:** Active option = `text` color with `1px solid text` bottom border, padding-bottom 1px. Inactive = `textGhost`, no border. Options separated by 10px.

---

### 6.2 Today's Focus Section

**Row:** MIT resets at [time] (e.g., "12:00 am") — Cormorant 10px `text`, tappable → time picker

**Help Text Below:** Cormorant italic 8px `textGhost`, line-height 1.5:
*"MIT = Most Important Task. Your top agenda wins the day."*

---

### 6.3 Categories Section

**Each Row (36px):**
- Left: 3×3px colour dot
- Centre-left: abbreviation (e.g., "Pro") — Cormorant 9px `text`
- Centre: full name (e.g., "Professional") — Cormorant italic 8px `textGhost`
- Right: `→` arrow, tappable → inline rename for abbr + full name

**Add Row:** *"+ Add category"* — Cormorant italic 8px `textGhost`
- Max 4 categories
- Hidden if 4 already exist

---

### 6.4 Manage Section

**Rows (44px):**
- On Hold — *"N items →"* → navigate to On Hold screen
- Archive — *"N items →"* → navigate to Archive screen
- Archive expires — right: *"60 days"* with chevron, tap opens picker (Off / 30 days / 60 days / Never)

---

### 6.5 Clarity (Footer)

**Label:** Inter 500, 7px, uppercase, `textGhost`: `CLARITY`

**Rows:**
- About me → (placeholder screen)
- Contact → (email link)

**Tagline Below Rows** (Cormorant italic 8px `textGhost`, line-height 1.6, padding-top 10px):
*"Most people confuse being busy with being productive. The Eisenhower Matrix changes that. By sorting tasks into four clear quadrants, you stop reacting to noise and start investing your time where it genuinely creates impact and drives meaning."*

---

## SCREEN 7: SPARKS CAPTURE SHEET

**Bottom sheet, `surface` background, same handle bar**

### Header
- Title: *"Sparks"* — Cormorant weight 300, 18px
- Subtitle: Cormorant italic 9px `textGhost`: *"Raw thoughts, unfiltered."*

### Input Row
- Text input (Cormorant italic 13px) + *"Add"* button (Cormorant 11px, `accent` colour, no background)

### Spark List (44px rows each)
- Left: small dot `textGhost`
- Centre: spark text, Cormorant 12px, `text`, 2 lines max
- Right: two icon-only buttons
  - Icon 1: arrow-up-right (promote) icon, `accent` color, tap opens AI suggestion flow
  - Icon 2: delete ✕, `textGhost`, tap removes

### AI Suggestion Card (appears when promoting)
- Background: `surface2`
- Border: `0.5px borderMid`
- Border-radius: 8px
- Padding: 12px
- Thinking state: Cormorant italic 10px `textGhost`: *"Thinking…"* (animated blink)
- Result state: refined text, quadrant label, reason
- Buttons: *"Place on Matrix"* (filled) · *"Dismiss"* (outlined)

---

## SCREEN 8: REFLECTION SCREEN

**Full-screen, back arrow, background `bg`**

### Header
- Title: *"Reflection"* — Cormorant weight 300, 22px
- Subtitle: Cormorant italic 9px `textGhost`: *"End of day. What moved."*

### Trigger Button
- Full-width, 44px
- Border: `0.5px borderMid`
- Border-radius: 6px
- Text: Cormorant 13px `text`: *"Generate reflection"*

### Reflection Text (after generation)
- Cormorant italic 14px `text`
- Line-height: 1.8
- Padding: 16px
- No background — floats on `bg`

### Pulse Section (below reflection)
- Two buttons: *"This Week"* · *"This Month"*
- Result: three numbered insight rows, Cormorant 12px `textMuted`
- Each preceded by 3×3px `accent` dot

---

## TOAST NOTIFICATIONS

**Position:** absolute, `bottom: 18 + insets.bottom + pill height`, horizontally centered
**Width:** 80% of screen, max 320px
**Background:** `surface2`
**Border:** `0.5px borderMid`
**Border-radius:** 8px
**Text:** Cormorant italic 11px `text`, centered
**Animation:** fade in 150ms, hold 1600ms, fade out 250ms
**Interaction:** `pointerEvents: 'none'` — never blocks touch

---

## DATA MODEL

### Agenda Type
```typescript
type Agenda = {
  id: string;
  title: string;
  quadrant: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  urgency: number;        // 5–95
  importance: number;     // 5–95
  effort: number;         // 1–7 (quick=1, short=2, medium=3, deep=4–7)
  tag: string;            // category abbreviation
  status: 'active' | 'onhold' | 'archived' | 'done';
  cx: number;             // 0–1 fractional position
  cy: number;             // 0–1 fractional position
  createdAt: number;      // timestamp
  completedAt?: number;
  archivedAt?: number;
};
```

### AppConfig Type
```typescript
type AppConfig = {
  themMode: 'light' | 'dark' | 'system';
  matrixStyle: 'tinted' | 'editorial' | 'paper';
  fontChoice: 'cormorant' | 'baskerville' | 'inter' | 'jakarta';
  mitResetHour: number;   // 0–23 (default: 0, midnight)
  tags: Array<{ abbr: string; name: string; color: string }>;
  archiveExpiry: 'off' | '30days' | '60days' | 'never';
};
```

---

## RESPONSIVE LAYOUT RULES

**Use `moderateScale()` for all font sizes and padding:**
```typescript
const { width } = Dimensions.get('window');
const BASE_WIDTH = 375;

function moderateScale(size: number, factor = 0.5): number {
  return size + (width / BASE_WIDTH - 1) * size * factor;
}
```

**Detect form factors:**
```typescript
const isTablet = width >= 768;
const isWeb = Platform.OS === 'web';
const isWide = width >= 768;
```

**On wide screens (768px+):**
- Replace floating pill with fixed left sidebar (220px wide)
- Sidebar background: `surface`, right border `border`
- 48×48px touch targets for nav items
- More items (Log, On Hold, Archive, Settings) shown directly in sidebar
- Matrix + content occupy remaining width to right

**Minimum touch targets:** 44×44pt everywhere. Use `hitSlop` for smaller visual elements.

---

## INTERACTION FLOWS

### Add Agenda Flow
1. Tap empty matrix space → opens Add sheet with urgency/importance pre-filled from tap position
2. Fill title, toggle MIT, adjust sliders, select category
3. Preview quadrant updates live
4. Tap "Place in [Quadrant]" → agenda created, sheet closes, bubble appears

### Edit Agenda Flow
1. Tap bubble → action sheet opens
2. Tap "Edit" → opens Edit sheet (pre-filled with current values)
3. Modify fields, save
4. Bubble updates position/appearance

### Mark Done Flow
1. Tap bubble → action sheet
2. Tap "Done" → agenda moved to `status: 'done'`, bubble disappears, toast *"Done"*

### Hold / Resume Flow
1. Tap bubble → action sheet
2. Tap "Hold" → `status: 'onhold'`, bubble dims (opacity 0.42)
3. From On Hold screen, tap restore → `status: 'active'`, toast *"Restored"*

### Archive Flow
1. Tap bubble or row → action sheet
2. Tap "Archive" → `status: 'archived'`, moved to Archive screen
3. If expiry enabled, tracked for deletion
4. From Archive, restore or permanently delete

### Sparks Flow
1. Tap ✦ icon → Sparks sheet opens
2. Type raw thought, tap "Add" → added to list
3. Tap promote icon → AI suggests quadrant + wording
4. Accept → spark placed as new bubble on matrix
5. Dismiss → spark removed

---

## VALIDATION CHECKLIST

Each screen implementation should verify:

- [ ] Colors match exact hex values from design tokens
- [ ] Font sizes use `moderateScale()` for responsive scaling
- [ ] Touch targets minimum 44×44pt
- [ ] Safe area insets applied to edges (top/bottom)
- [ ] Opacity values for inactive/disabled states match spec
- [ ] Border colors and stroke widths exact
- [ ] Animation timing (fade 150ms in, 1600ms hold, 250ms out)
- [ ] Empty states display correct text and styling
- [ ] Bubbles sized correctly per effort level
- [ ] Quadrant watermarks positioned and opacity correct
- [ ] MIT strip updates on app launch
- [ ] Floating pill behavior (mobile vs web) correct
- [ ] All buttons have correct label text and styling
- [ ] Sheet handle bar centered and correct dimensions
- [ ] Icons match intended designs (SVG inline where possible)

---

## NOTES FOR CLAUDE CODE

When uploading to Claude Code with this design spec:
1. Start with **one screen at a time**
2. Use this document as the source of truth
3. Validate visual output matches the spec before moving to next screen
4. Reference exact hex colors, font names, and dimensions from this document
5. Test on mobile (iOS/Android) and web during implementation
6. Use the data model provided for state management
