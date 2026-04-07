# Project Guidelines

## Code Style
- TypeScript strict mode enabled with path aliases `@/*` → `src/*`
- Use token-based themes from [theme.ts](src/clearday/theme.ts)
- Follow responsive design utilities in [scale.ts](src/clearday/scale.ts)

## Architecture
This is Clarity, a 2D Eisenhower matrix task manager built with Expo + React Native.

- **State Management**: Single Zustand store in [store.ts](src/clearday/store.ts) containing all business logic
- **Navigation**: Custom context-based navigation in [navigation.ts](src/clearday/navigation.ts)
- **Storage**: AsyncStorage abstraction in [storage.ts](src/clearday/storage.ts)
- **Components**: Thin UI layer, screens subscribe to store
- **Unique Feature**: Tasks positioned in 2D space using cx,cy coordinates derived from urgency/importance sliders

See [MaxMonk_b1_McK_MB.md](MaxMonk_b1_McK_MB.md) for detailed implementation architecture.

## Build and Test
- Install: `npm install`
- Generate icons: `npx ts-node scripts/generateIcon.ts`
- Start dev: `npm start`
- Build: Use EAS - `eas build --platform ios|android --profile production`
- No test commands defined; run `tsc` for type checking

## Conventions
- Position system: Tasks stored as normalized cx,cy (0-1), quadrants determined dynamically
- Expiry policies: Vault items auto-delete after 60 days, hold items optional expiry
- Fonts: User-selectable serif sets with variant mapping
- Tags: Soft tags (Professional/Personal) with max 4, 12 chars each

See [Clarity_Screen_Design_Spec.md](Clarity_Screen_Design_Spec.md) for design tokens and screen specs.

For release process: [src/docs/release-hardening-checklist.md](src/docs/release-hardening-checklist.md)