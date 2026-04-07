# CLARITY APP — PHASE 0-4 IMPLEMENTATION PROMPT
## For Claude Code in VS Code

---

## 🚀 CRITICAL SETUP FIRST

**Before running ANY phase:**

Ask me: _"I'm about to implement Clarity Phase 0-4 fully. Do you want me to:_
- _A) Run all 4 phases autonomously without asking for permission between phases, OR_
- _B) Ask for your confirmation after each phase?"_

**If user chooses A (recommended):**
Proceed immediately through PHASE 0 → PHASE 1 → PHASE 2 → PHASE 3 → PHASE 4 consecutively. Build and verify at the end. Only report final status.

**If user chooses B:**
After each phase completes and builds successfully, ask: "Phase X complete. Proceed to Phase Y?"

---

## BEFORE YOU IMPLEMENT — DIAGNOSTIC CHECKS

Run these checks first and report findings:

### 1. Codebase Health Check
```
- [ ] Can you build the app? Run: npm run build or expo start
- [ ] Current entry point: App.tsx → ClearDayScreen (which still exists?)
- [ ] Navigation libs present: @react-navigation/stack, @react-navigation/bottom-tabs, @react-navigation/native
- [ ] Gesture handler: react-native-gesture-handler present
- [ ] Font loading: Any expo-font or @expo-google-fonts packages already installed?
- [ ] Zustand store: Present in src/clearday/store.ts — does it compile?
- [ ] AsyncStorage: @react-native-async-storage/async-storage already in package.json ✓
- [ ] SafeAreaContext: react-native-safe-area-context already in package.json ✓
```

### 2. Current theme.ts Mismatch
The existing `src/clearday/theme.ts` has:
- Wrong colors (purple accent #7356E8, not steel blue #1B3A5C)
- Missing quadrant colors (Q1/Q2/Q3/Q4 and their wash variants)
- Missing gold/goldLight
- Missing textMuted, textGhost
- Missing axisLine

**Decision: Replace entire file or surgically update?**
→ REPLACE IT ENTIRELY per markdown spec.

### 3. Dependency Status
Current package.json has:
- ✓ React Native, Expo (good)
- ✓ AsyncStorage, SafeAreaContext (good)
- ✓ Zustand (good)
- ✓ react-native-svg (good for icons)
- ✗ NO @expo-google-fonts packages (required)
- ✗ NO expo-font (required for font loading)
- ✓ Navigation libs present (TO BE REMOVED in Segment A cleanup)

**Required new packages:**
```
@expo-google-fonts/cormorant-garamond
@expo-google-fonts/libre-baskerville
@expo-google-fonts/inter
@expo-google-fonts/plus-jakarta-sans
expo-font
```

### 4. Legacy Code Status
The following MUST be deleted per markdown (Preliminary, Step 1):
```
src/screens/MatrixScreen.tsx
src/screens/AgendaScreen.tsx
src/screens/StatsScreen.tsx
src/screens/ClearDayScreen.tsx (currently referenced in App.tsx!)
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

Are these files present? If yes, delete them before implementing.

### 5. App.tsx Current State
Currently imports `ClearDayScreen` which will be deleted.
**Must be replaced** with SafeAreaProvider wrapper + ClarityApp component (not yet built).

---

## IMPLEMENTATION SEQUENCE

### PHASE 0: Setup & Cleanup (Start Here)

**Prompt to Claude Code:**
```
"DIAGNOSTIC MODE ONLY — Do NOT implement yet.

1. Verify the codebase state:
   - Can you run 'npm run build' without errors? (Report any errors)
   - List all files in src/screens/ and src/store/ — are they the ones mentioned in my deleted files list?
   - Check if src/clearday/store.ts exists and compiles
   - Confirm @expo-google-fonts packages are NOT in package.json

2. After you confirm the status, I will give you the cleanup prompt.

Report findings as a checklist."
```

After cleanup is confirmed, proceed to Phase 1.

---

### PHASE 1: Design Tokens & Fonts (Section 1)

**Prompt to Claude Code:**
```
"IMPLEMENT PHASE 1 — Design Tokens & Fonts System (from MaxMonk_b1_McK_MD.md Section 1)

DO THIS IN ORDER:

1. INSTALL NEW DEPENDENCIES
   npm install @expo-google-fonts/cormorant-garamond @expo-google-fonts/libre-baskerville @expo-google-fonts/inter @expo-google-fonts/plus-jakarta-sans expo-font

2. REPLACE src/clearday/theme.ts ENTIRELY
   - Use light mode as default
   - Include all token names: bg, surface, surface2, border, borderMid, text, textMuted, textGhost, accent, gold, goldLight
   - Add quadrant colors: q1, q2, q3, q4 (all exact hex from markdown)
   - Add quadrant washes: q1Wash, q2Wash, q3Wash, q4Wash (exact rgba from markdown)
   - Add overlay, axisLine
   - Export lightTokens, darkTokens, resolveTheme() function
   - Dark mode colors must also be included (exact hex from markdown)

3. CREATE src/clearday/fonts.ts
   - Export FontChoice type: 'cormorant' | 'baskerville' | 'inter' | 'jakarta'
   - Export FontSet interface with serif, serifItalic, serifBold, sans, sansMedium, label properties
   - Export getFontSet(choice: FontChoice): FontSet function
   - Export FONT_LABELS: Record<FontChoice, string> with { cormorant: 'Cg', baskerville: 'Lb', inter: 'In', jakarta: 'Pj' }
   - Use exact font family names from Google Fonts: 'Cormorant_Garamond_400Regular', etc.

4. UPDATE src/clearday/types.ts
   - Ensure AppConfig type exists
   - ADD these three fields:
     • fontChoice: FontChoice (default: 'cormorant')
     • matrixStyle: MatrixStyle (default: 'tinted') where MatrixStyle = 'tinted' | 'editorial' | 'paper'
     • mitResetHour: number (default: 0, range 0–23)
   - Export these types

5. UPDATE src/clearday/storage.ts
   - In loadConfig() function, add default values for the three new fields:
     • fontChoice: 'cormorant'
     • matrixStyle: 'tinted'
     • mitResetHour: 0

6. VERIFY
   - All colors use exact hex from markdown (e.g., #F8F7F4, not #f8f7f4)
   - All font family names match Google Fonts package names exactly
   - No hardcoded font sizes — tokens only
   - AppConfig type is TypeScript-strict with all required fields
   - No runtime errors in theme token resolution

STOP HERE. Do NOT scaffold screens or components yet. Just tokens and fonts.
Build and verify: npm run build or expo start"
```

---

### PHASE 2: Cleanup & App.tsx (After Phase 1 builds successfully)

**Prompt to Claude Code:**
```
"IMPLEMENT PHASE 2 — Cleanup & Root Component Setup

1. DELETE legacy files (these should not exist):
   - Delete src/screens/MatrixScreen.tsx
   - Delete src/screens/AgendaScreen.tsx
   - Delete src/screens/StatsScreen.tsx
   - Delete src/screens/ClearDayScreen.tsx
   - Delete src/store/taskStore.ts
   - Delete src/store/types.ts
   - Delete src/components/AddTaskSheet.tsx
   - Delete src/components/FocusMode.tsx
   - Delete src/components/QuadrantCell.tsx
   - Delete src/components/TaskCard.tsx
   - Delete src/db/ directory entirely
   - Delete src/utils/deadlineEscalation.ts
   - Delete src/utils/quadrant.ts
   
   Report which files were found and deleted.

2. REMOVE navigation libraries from package.json:
   - Remove @react-navigation/stack
   - Remove @react-navigation/bottom-tabs
   - Remove @react-navigation/native
   - Remove react-native-gesture-handler (unless needed by another dependency)
   - Remove react-native-screens
   - KEEP react-native-safe-area-context (needed)
   
   Then run: npm install

3. VERIFY NO IMPORTS reference deleted files
   Search entire codebase for:
   - 'src/screens/ClearDayScreen'
   - 'src/store/taskStore'
   - 'src/components/'
   - 'src/db/'
   - '@react-navigation'
   
   Report all matches. Delete any imports found.

4. REPLACE App.tsx
   Implement exactly as shown in markdown Section 16:
   - Import SafeAreaProvider from 'react-native-safe-area-context'
   - Import useFonts from 'expo-font'
   - Import ClarityApp from './src/clearday/ClarityApp' (not yet created — will error)
   - Load all four font families in useFonts hook
   - Return null while fonts load
   - Wrap ClarityApp in SafeAreaProvider
   
   Code structure:
   ```
   import 'react-native-gesture-handler'; // safe to keep for now
   import React from 'react';
   import { SafeAreaProvider } from 'react-native-safe-area-context';
   import { useFonts } from 'expo-font';
   import { ClarityApp } from './src/clearday/ClarityApp';
   
   export default function App() {
     const [fontsLoaded] = useFonts({
       Cormorant_Garamond_400Regular: require('@expo-google-fonts/cormorant-garamond/Cormorant_Garamond_400Regular.ttf'),
       Cormorant_Garamond_400Italic: require('@expo-google-fonts/cormorant-garamond/Cormorant_Garamond_400Italic.ttf'),
       Cormorant_Garamond_600SemiBold: require('@expo-google-fonts/cormorant-garamond/Cormorant_Garamond_600SemiBold.ttf'),
       // ... add remaining fonts
     });
     
     if (!fontsLoaded) return null;
     
     return (
       <SafeAreaProvider>
         <ClarityApp />
       </SafeAreaProvider>
     );
   }
   ```

5. CREATE STUB src/clearday/ClarityApp.tsx
   For now, just return a simple placeholder:
   ```
   import React from 'react';
   import { View, Text } from 'react-native';
   
   export function ClarityApp() {
     return (
       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
         <Text>Clarity App — Bootstrap in progress</Text>
       </View>
     );
   }
   ```

6. BUILD & VERIFY
   npm run build or expo start
   
   Report:
   - Any TypeScript errors?
   - Fonts loading?
   - App starts without crashes?

STOP HERE. Next phase is navigation state."
```

---

### PHASE 3: Navigation State (After Phase 2 builds)

**Prompt to Claude Code:**
```
"IMPLEMENT PHASE 3 — Navigation State Management (Section 3)

1. CREATE src/clearday/navigation.ts
   Define exactly as markdown Section 3.1:
   ```
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

2. CREATE src/clearday/scale.ts
   Implement the responsive scaling utility (Section 4.1):
   ```
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

3. UPDATE src/clearday/ClarityApp.tsx
   Add Zustand state management:
   - Import useStore from './store'
   - Add local state: currentScreen, openPanel
   - Implement conditional rendering (stub each screen)
   - Add bootstrap() logic to load config and agendas
   - Implement MIT carry-forward prompt trigger logic
   
   Structure:
   ```
   import React, { useEffect } from 'react';
   import { View, Text } from 'react-native';
   import { useSafeAreaInsets } from 'react-native-safe-area-context';
   import { useStore } from './store';
   import { resolveTheme } from './theme';
   
   export function ClarityApp() {
     const [currentScreen, setCurrentScreen] = React.useState<Screen>('matrix');
     const [openPanel, setOpenPanel] = React.useState<Panel>(null);
     const insets = useSafeAreaInsets();
     const store = useStore();
     
     useEffect(() => {
       // bootstrap logic here
     }, []);
     
     const theme = resolveTheme(store.config.themeMode, ...);
     
     return (
       <View style={{ flex: 1, backgroundColor: theme.bg }}>
         {currentScreen === 'matrix' && <MatrixScreen />}
         {/* other screens */}
         {openPanel && <Panel />}
       </View>
     );
   }
   ```

4. BUILD & VERIFY
   - No TypeScript errors
   - App starts with bootstrap stub
   - No crashes

STOP HERE. Next phase is MIT strip (first visible component)."
```

---

### PHASE 4: MIT Strip Component (After Phase 3 builds)

**Prompt to Claude Code:**
```
"IMPLEMENT PHASE 4 — MIT Strip Component (Section 5 of markdown + Design Spec)

BEFORE CODING: Open Clarity_Screen_Design_Spec.md (Section 5.1 MIT Strip) and keep it visible.

1. CREATE src/components/MitStrip.tsx
   
   Reference Section 5.1 of design spec for exact dimensions:
   - Height: 24px fixed
   - Background: transparent
   - Border-bottom: 0.5px solid border color (from theme)
   - Left padding: 12px, right padding: 12px
   - Left icon: target icon (3 concentric circles + filled gold center) — 14×14px
   - MIT text: Cormorant italic 10.5px, text color, flex 1, single line truncated
   - Placeholder when no MIT: 'Today's #1' in Cormorant italic 10px, textGhost color
   - Entire strip tappable
   - onPress: opens MIT selector bottom sheet
   
   Props:
   - mit: string | null
   - onPress: () => void
   - theme: ThemeTokens

2. CREATE src/components/MitSelector.tsx
   
   Reference Section 5.2 of design spec:
   - Title: 'Today's #1' — Cormorant italic 16px
   - Input: text input, placeholder 'Type a custom intention…', Cormorant italic, autofocus
   - List: all status==='active' agendas sorted Q1→Q2→Q3→Q4
     • Row height: 44px
     • Left: 4×4px circle (quadrant color)
     • Text: Cormorant 13px, text color
   - Clear button: 'Clear MIT' — Cormorant italic, textGhost, at bottom
   - Modal background: overlay color at 0.32 opacity
   - onSelect: (text: string) => void
   - onClose: () => void

3. UPDATE src/clearday/ClarityApp.tsx
   
   Add MIT state and logic:
   - Import MitStrip and MitSelector
   - Add state: const [showMitSelector, setShowMitSelector] = useState(false)
   - Render MitStrip at top of matrix screen
   - Render MitSelector when showMitSelector === true
   - Call store.setMit(text) on selection
   - Implement MIT auto-reset logic (Section 5.3):
     • Check on app mount if current date > stored mit date
     • If yes, clear MIT
     • Store timestamp alongside MIT text
   
   MIT carry-forward prompt logic (Section 5.5):
   - On app launch, check if yesterday's MIT was active but not completed
   - Show modal once per day max
   - Modal: 'Good morning' label, 'Yesterday's MIT was unfinished', quote MIT text in gold, 'Carry it forward?'
   - Buttons: 'Not today' (outlined) | 'Carry forward' (filled dark)
   - Store last-shown date to prevent re-showing

4. STYLING RULES (from Design Spec + Section 4 responsive layout)
   
   All dimensions:
   - Use moderateScale() for font sizes — NO hardcoded pixels for text
   - Use exact hex colors from theme (e.g., #8A6A14 for gold, #C4BFB8 for textGhost)
   - Apply insets.bottom to any bottom-positioned elements (from useSafeAreaInsets hook)
   - Icon sizes: 14×14px for MIT icon, 4×4px for quadrant dots
   - Border radius: 6px for inputs, 12px for modals
   
5. STORE INTEGRATION
   
   Update src/clearday/store.ts to add:
   - mit: string | null
   - mitLastSetDate: number (timestamp)
   - setMit(text: string | null): void
   - clearMitIfExpired(): void (called on bootstrap)
   - mitCarryForwardShownToday: boolean
   - setMitCarryForwardShown(shown: boolean): void

6. VERIFY PIXEL PERFECT AGAINST DESIGN SPEC
   
   Before submitting, compare:
   - [ ] MIT strip height exactly 24px
   - [ ] Icon 14×14px, positioned left 12px
   - [ ] Text truncates at single line, font size 10.5px
   - [ ] Border-bottom 0.5px, exact border color from theme
   - [ ] Placeholder text is 'Today's #1' in textGhost color
   - [ ] Selector modal has correct overlay opacity (0.32)
   - [ ] Input autofocuses on sheet open
   - [ ] List rows are 44px with 4×4px quadrant dots
   - [ ] Clear button styled as Cormorant italic, textGhost color, at sheet bottom
   - [ ] All colors match hex from theme exactly (no approximations)

7. BUILD & VERIFY
   npm run build or expo start
   
   Report:
   - TypeScript errors? (If any, fix them)
   - MIT strip renders at top?
   - Can tap strip to open selector?
   - Can set/clear MIT?
   - MIT persists after reload?
   - Colors match design spec?

REFERENCE: All dimensions, colors, and interactions come from:
- Clarity_Screen_Design_Spec.md Section 5 (MIT Strip spec)
- MaxMonk_b1_McK_MD.md Section 5 (implementation details)
- Design Spec Section 1 (exact color hex values)"
```

---

## KEY PRINCIPLES WHILE IMPLEMENTING

1. **Match markdown exactly** — hex colors, font names, dimensions, all from Section 1-16 of markdown
2. **Type safety** — strict TypeScript, no `any` types
3. **No premature optimization** — build what's needed, don't scaffold unused code
4. **Verify at each phase** — test builds before moving to next phase
5. **Use design spec document** — reference Clarity_Screen_Design_Spec.md for pixel-perfect layout

---

## WHEN TO USE THIS

Copy **Phase 0** into Claude Code first. After Claude confirms diagnostic status and cleanup is done, proceed with **Phase 1**, then **Phase 2**, then **Phase 3**.

Do NOT jump phases. Each phase must build successfully before moving forward.

---

## YOUR GITHUB REFERENCE

Current state: https://github.com/medipjoy/MaxMonk/tree/B1_McK

The B1_McK branch has navigation libs and legacy screens still present. You're moving to a cleaner architecture.

---

**Ready? Copy Phase 0 prompt into your Claude Code chat and report findings.**
