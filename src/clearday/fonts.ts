export type FontChoice = 'cormorant' | 'baskerville' | 'inter' | 'jakarta';

export interface FontSet {
  serif: string;
  serifItalic: string;
  serifBold: string;
  sans: string;
  sansMedium: string;
  label: string;        // always Inter or Jakarta for system labels regardless of choice
  lineHeightMultiplier: number;  // visual size normalization (Cormorant appears smaller at same size)
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
        lineHeightMultiplier: 1.27,
      };
    case 'baskerville':
      return {
        serif: 'LibreBaskerville_400Regular',
        serifItalic: 'LibreBaskerville_400Italic',
        serifBold: 'LibreBaskerville_700Bold',
        sans: 'LibreBaskerville_400Regular',
        sansMedium: 'LibreBaskerville_700Bold',
        label: 'Inter_500Medium',
        lineHeightMultiplier: 1.0,
      };
    case 'inter':
      return {
        serif: 'Inter_400Regular',
        serifItalic: 'Inter_400Regular',
        serifBold: 'Inter_600SemiBold',
        sans: 'Inter_400Regular',
        sansMedium: 'Inter_500Medium',
        label: 'Inter_500Medium',
        lineHeightMultiplier: 1.0,
      };
    case 'jakarta':
      return {
        serif: 'PlusJakartaSans_400Regular',
        serifItalic: 'PlusJakartaSans_400Regular',
        serifBold: 'PlusJakartaSans_600SemiBold',
        sans: 'PlusJakartaSans_400Regular',
        sansMedium: 'PlusJakartaSans_500Medium',
        label: 'PlusJakartaSans_500Medium',
        lineHeightMultiplier: 1.0,
      };
  }
}

/**
 * Returns font size normalized for visual consistency across font choices.
 * Cormorant appears ~13% smaller at the same fontSize, so we scale it up.
 * Optionally pass fontSizeMultiplier from user settings (default 1.0).
 */
export function getNormalizedFontSize(
  baseFontSize: number,
  fontChoice: FontChoice,
  fontSizeMultiplier: number = 1.0,
): number {
  const fontSet = getFontSet(fontChoice);
  return baseFontSize * fontSet.lineHeightMultiplier * fontSizeMultiplier;
}

// Font display names for Settings UI
export const FONT_LABELS: Record<FontChoice, string> = {
  cormorant: 'Cg',
  baskerville: 'Lb',
  inter: 'In',
  jakarta: 'Pj',
};
