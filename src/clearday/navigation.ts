import { create } from 'zustand';

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

export interface NavigationState {
  currentScreen: Screen;
  currentPanel: Panel;

  goToMatrix: () => void;
  goToActive: () => void;
  goToMore: () => void;
  openPanel: (panel: Panel) => void;
  closePanel: () => void;
  back: () => void;
}

export const useNavigation = create<NavigationState>((set, get) => ({
  currentScreen: 'matrix',
  currentPanel: null,

  goToMatrix: () => set({ currentScreen: 'matrix', currentPanel: null }),
  goToActive: () => set({ currentScreen: 'active', currentPanel: null }),
  goToMore: () => set({ currentScreen: 'more', currentPanel: null }),

  openPanel: (panel: Panel) => set({ currentPanel: panel }),
  closePanel: () => set({ currentPanel: null }),

  back: () => {
    const { currentScreen, currentPanel } = get();
    if (currentPanel) {
      set({ currentPanel: null });
    } else if (currentScreen !== 'matrix') {
      set({ currentScreen: 'matrix' });
    }
  },
}));

// Helper to determine if pill/sidebar should be shown
export function shouldShowNavigation(screen: Screen, panelOpen: boolean): boolean {
  if (panelOpen) return false;
  return screen === 'matrix';
}
