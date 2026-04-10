import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
  Dimensions,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useClearDayStore } from './store';
import { resolveTheme } from './theme';

// Screens
import { MatrixScreen } from '../screens/MatrixScreen';
import { ActiveScreen } from '../screens/ActiveScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { HoldScreen } from '../screens/HoldScreen';
import { VaultScreen } from '../screens/VaultScreen';
import { CompletedScreen } from '../screens/CompletedScreen';

// Panels / sheets
import { AddEditSheet } from '../components/AddEditSheet';
import { BubbleActionSheet } from '../components/BubbleActionSheet';
import { MoreSheet } from '../components/MoreSheet';
import { MITSelector } from '../components/MITSelector';
import { MITCarryForwardModal } from '../components/MITCarryForwardModal';
import { Toast } from '../components/Toast';

// Navigation types
export type Screen = 'matrix' | 'active' | 'hold' | 'vault' | 'settings' | 'completed';
export type Panel = 'add' | 'edit' | 'more' | 'mitSelector' | 'bubbleAction' | null;

export interface AddSheetPreset { urgency: number; importance: number; defaultDomain?: string; defaultText?: string; addToHold?: boolean; }
export interface BubbleActionTarget { agendaId: string }

interface ClarityAppProps {
  systemScheme: 'light' | 'dark' | null;
}

export interface NavContext {
  screen: Screen;
  panel: Panel;
  goTo: (s: Screen) => void;
  openPanel: (p: Panel) => void;
  closePanel: () => void;
  back: () => void;
  addSheetPreset: AddSheetPreset | null;
  setAddSheetPreset: (p: AddSheetPreset | null) => void;
  editAgendaId: string | null;
  setEditAgendaId: (id: string | null) => void;
  bubbleActionId: string | null;
  setBubbleActionId: (id: string | null) => void;
  showToast: (msg: string) => void;
  themeMode: string;
  systemScheme: 'light' | 'dark' | null;
}

export const NavCtx = React.createContext<NavContext>({} as NavContext);

export function ClarityApp({ systemScheme }: ClarityAppProps) {
  const { config, ready, bootstrap, mit, setMit } = useClearDayStore();
  const insets = useSafeAreaInsets();

  const [screen, setScreen] = useState<Screen>('matrix');
  const [panel, setPanel] = useState<Panel>(null);
  const [addSheetPreset, setAddSheetPreset] = useState<AddSheetPreset | null>(null);
  const [editAgendaId, setEditAgendaId] = useState<string | null>(null);
  const [bubbleActionId, setBubbleActionId] = useState<string | null>(null);
  const [showMITCarryForward, setShowMITCarryForward] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<NodeJS.Timeout | null>(null);

  // Pill visibility (mobile: touch-triggered, web: mouse-triggered)
  const [pillVisible, setPillVisible] = useState(false);
  const pillTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { bootstrap(); }, []);

  // Show pill briefly when app first loads
  useEffect(() => {
    if (!ready) return;
    showPill();
  }, [ready]);

  // MIT carry-forward check
  useEffect(() => {
    if (!ready) return;
    checkMITCarryForward();
  }, [ready]);

  async function checkMITCarryForward() {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const lastShown = await AsyncStorage.getItem('@clarity_mit_carry_shown_date');
    const today = new Date().toDateString();
    if (lastShown === today) return;

    const lastMITDate = await AsyncStorage.getItem('@clarity_mit_last_set_date');
    const lastMITText = await AsyncStorage.getItem('@clarity_mit_text');
    if (!lastMITDate || !lastMITText) return;

    const lastDate = new Date(lastMITDate).toDateString();
    if (lastDate === today) return; // set today, no carry needed

    // Check if that agenda is still active
    const { agendas } = useClearDayStore.getState();
    const stillActive = agendas.some(a => a.text === lastMITText && a.status === 'active');
    if (!stillActive) return;

    setShowMITCarryForward(true);
    await AsyncStorage.setItem('@clarity_mit_carry_shown_date', today);
  }

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2000);
  };

  const goTo = (s: Screen) => { setScreen(s); setPanel(null); };
  const openPanel = (p: Panel) => setPanel(p);
  const closePanel = () => {
    setPanel(null);
    setEditAgendaId(null);
    setBubbleActionId(null);
    setAddSheetPreset(null);
  };
  const back = () => { setScreen('matrix'); setPanel(null); };

  const tokens = resolveTheme(config.themeMode, null);
  const { width } = Dimensions.get('window');
  const isWide = width >= 768;
  const fsm = config.fontSizeMultiplier ?? 1.0;

  // Pill show/hide
  const showPill = () => {
    if (panel) return;
    setPillVisible(true);
    if (pillTimer.current) clearTimeout(pillTimer.current);
    pillTimer.current = setTimeout(() => {
      setPillVisible(false);
    }, 2500);
  };

  const togglePill = () => {
    if (pillVisible) {
      if (pillTimer.current) clearTimeout(pillTimer.current);
      setPillVisible(false);
    } else {
      showPill();
    }
  };

  const isPillScreenActive = screen === 'matrix' && !panel;

  const navCtx: NavContext = {
    screen, panel, goTo, openPanel, closePanel, back,
    addSheetPreset, setAddSheetPreset,
    editAgendaId, setEditAgendaId,
    bubbleActionId, setBubbleActionId,
    showToast,
    themeMode: config.themeMode,
    systemScheme,
  };

  const renderScreen = () => {
    switch (screen) {
      case 'active': return <ActiveScreen tokens={tokens} fontChoice={config.fontChoice} />;
      case 'hold': return <HoldScreen tokens={tokens} fontChoice={config.fontChoice} />;
      case 'vault': return <VaultScreen tokens={tokens} fontChoice={config.fontChoice} />;
      case 'settings': return <SettingsScreen tokens={tokens} fontChoice={config.fontChoice} themeMode={config.themeMode} matrixStyle={config.matrixStyle} mitResetHour={config.mitResetHour} vaultRetentionDays={config.vaultRetentionDays ?? 30} />;
      case 'completed': return <CompletedScreen tokens={tokens} fontChoice={config.fontChoice} />;
      default: return (
        <MatrixScreen tokens={tokens} fontChoice={config.fontChoice} matrixStyle={config.matrixStyle} onPillToggle={togglePill} />
      );
    }
  };

  const pillAppearance = getPillAppearance(config.matrixStyle, tokens);

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: tokens.bg },
    wide: { flex: 1, flexDirection: 'row' },
    sidebar: { width: 90, backgroundColor: tokens.surface, borderRightWidth: 1, borderRightColor: tokens.border },
    main: { flex: 1 },
    pill: {
      position: 'absolute',
      bottom: 12 + insets.bottom,
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: pillAppearance.bg,
      borderWidth: pillAppearance.borderWidth,
      borderColor: pillAppearance.borderColor,
      borderRadius: Math.round(28 * fsm),
      paddingVertical: Math.round(9 * fsm),
      paddingHorizontal: Math.round(20 * fsm),
      gap: Math.round(20 * fsm),
    },
  });

  return (
    <NavCtx.Provider value={navCtx}>
      <View style={s.root}>
        {isWide ? (
          <View style={s.wide}>
            <Sidebar tokens={tokens} fontChoice={config.fontChoice} screen={screen} goTo={goTo} openPanel={openPanel} />
            <View style={s.main}>{renderScreen()}</View>
          </View>
        ) : (
          <>
            {renderScreen()}
            {isPillScreenActive && pillVisible && (
              <View
                style={s.pill}
                // @ts-ignore web only
                onMouseEnter={Platform.OS === 'web' ? showPill : undefined}
                onMouseLeave={Platform.OS === 'web' ? () => { if (pillTimer.current) clearTimeout(pillTimer.current); setPillVisible(false); } : undefined}
              >
                <PillIcons screen={screen} tokens={tokens} goTo={goTo} openPanel={openPanel} fsm={fsm} />
              </View>
            )}
          </>
        )}

        {/* Panels / Sheets */}
        {panel === 'more' && <MoreSheet tokens={tokens} fontChoice={config.fontChoice} />}
        {panel === 'mitSelector' && <MITSelector tokens={tokens} fontChoice={config.fontChoice} currentMit={mit} onSelect={(t) => { setMit(t); closePanel(); showToast(t ? 'MIT set' : 'MIT cleared'); }} onClose={closePanel} />}
        {(panel === 'add' || panel === 'edit') && <AddEditSheet tokens={tokens} fontChoice={config.fontChoice} agendaId={editAgendaId} preset={addSheetPreset} onClose={closePanel} onSave={(msg) => { closePanel(); showToast(msg); }} />}
        {panel === 'bubbleAction' && bubbleActionId && <BubbleActionSheet tokens={tokens} fontChoice={config.fontChoice} agendaId={bubbleActionId} onClose={closePanel} onAction={(msg) => { closePanel(); showToast(msg); }} onEdit={(id) => { setEditAgendaId(id); setPanel('edit'); }} />}

        {/* MIT carry-forward modal */}
        {showMITCarryForward && (
          <MITCarryForwardModal
            tokens={tokens}
            fontChoice={config.fontChoice}
            onCarry={() => { setShowMITCarryForward(false); }}
            onDismiss={() => { setMit(''); setShowMITCarryForward(false); }}
          />
        )}

        {/* Toast */}
        <Toast tokens={tokens} fontChoice={config.fontChoice} message={toastMsg} visible={toastVisible} bottomOffset={insets.bottom} />
      </View>
    </NavCtx.Provider>
  );
}

// --- Floating Pill Icons ---
function PillIcons({ screen, tokens, goTo, openPanel, fsm }: { screen: Screen; tokens: any; goTo: (s: Screen) => void; openPanel: (p: Panel) => void; fsm: number }) {
  const isMatrix = screen === 'matrix';
  const isActive = screen === 'active';

  const iconColor = (active: boolean) => active ? tokens.accent : tokens.textGhost;
  const indicatorColor = tokens.accent;
  const iconSize = Math.round(16 * fsm);

  return (
    <>
      {/* Crosshair — Matrix */}
      <PillButton onPress={() => goTo('matrix')} active={isMatrix} indicatorColor={indicatorColor} fsm={fsm}>
        <CrosshairIcon color={iconColor(isMatrix)} size={iconSize} />
      </PillButton>

      {/* List — Active */}
      <PillButton onPress={() => goTo('active')} active={isActive} indicatorColor={indicatorColor} fsm={fsm}>
        <ListIcon color={iconColor(isActive)} size={iconSize} />
      </PillButton>

      {/* Dots — More */}
      <PillButton onPress={() => openPanel('more')} active={false} indicatorColor={indicatorColor} fsm={fsm}>
        <DotsIcon color={iconColor(false)} size={iconSize} />
      </PillButton>

      {/* Plus — Add */}
      <PillButton onPress={() => openPanel('add')} active={false} indicatorColor={indicatorColor} fsm={fsm}>
        <PlusIcon color={tokens.accent} size={iconSize} />
      </PillButton>
    </>
  );
}

function PillButton({ onPress, active, indicatorColor, fsm, children }: { onPress: () => void; active: boolean; indicatorColor: string; fsm: number; children: React.ReactNode }) {
  const btnSize = Math.round(28 * fsm);
  const dotW = Math.round(16 * fsm);
  return (
    <TouchableWithoutFeedback onPress={onPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <View style={{ width: btnSize, height: btnSize, justifyContent: 'center', alignItems: 'center' }}>
        {active && (
          <View style={{ position: 'absolute', top: -2, width: dotW, height: 2, backgroundColor: indicatorColor, borderRadius: 1 }} />
        )}
        {children}
      </View>
    </TouchableWithoutFeedback>
  );
}

// --- Sidebar (wide screens, 90px icon-only) ---
function SidebarItem({
  icon, label, active, onPress, tokens,
}: { icon: React.ReactNode; label: string; active: boolean; onPress: () => void; tokens: any }) {
  const [hovered, setHovered] = useState(false);

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <View
        style={{ height: 52, justifyContent: 'center', alignItems: 'center', position: 'relative' }}
        // @ts-ignore web only
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {active && (
          <View style={{ position: 'absolute', left: 0, top: 10, bottom: 10, width: 2, backgroundColor: tokens.accent, borderRadius: 1 }} />
        )}
        <View style={{ width: 32, height: 32, justifyContent: 'center', alignItems: 'center' }}>
          {icon}
        </View>
        {hovered && (
          <View style={{
            position: 'absolute', left: 90, top: '50%', transform: [{ translateY: -12 }],
            backgroundColor: tokens.surface, borderWidth: 0.5, borderColor: tokens.border,
            borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4, zIndex: 999,
          }}>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: tokens.text, whiteSpace: 'nowrap' } as any}>
              {label}
            </Text>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

function Sidebar({ tokens, fontChoice, screen, goTo, openPanel }: { tokens: any; fontChoice: string; screen: Screen; goTo: (s: Screen) => void; openPanel: (p: Panel) => void }) {
  const SUB_SCREENS: { key: Screen; label: string }[] = [
    { key: 'completed', label: 'Completed' },
    { key: 'hold', label: 'On Hold' },
    { key: 'vault', label: 'Archive' },
    { key: 'settings', label: 'Settings' },
  ];

  return (
    <View style={{ width: 90, backgroundColor: tokens.surface, borderRightWidth: 1, borderRightColor: tokens.border }}>
      <View style={{ paddingTop: 32, flex: 1 }}>
        <SidebarItem
          icon={<CrosshairIcon color={screen === 'matrix' ? tokens.accent : tokens.textGhost} size={20} />}
          label="Matrix"
          active={screen === 'matrix'}
          onPress={() => goTo('matrix')}
          tokens={tokens}
        />
        <SidebarItem
          icon={<ListIcon color={screen === 'active' ? tokens.accent : tokens.textGhost} size={20} />}
          label="Active"
          active={screen === 'active'}
          onPress={() => goTo('active')}
          tokens={tokens}
        />
        <View style={{ height: 0.5, backgroundColor: tokens.border, marginVertical: 8, marginHorizontal: 16 }} />
        {SUB_SCREENS.map(({ key, label }) => (
          <SidebarItem
            key={key}
            icon={<DotsIcon color={screen === key ? tokens.accent : tokens.textGhost} size={16} />}
            label={label}
            active={screen === key}
            onPress={() => goTo(key)}
            tokens={tokens}
          />
        ))}
      </View>
    </View>
  );
}

function getPillAppearance(matrixStyle: string, tokens: any): { bg: string; borderWidth: number; borderColor: string } {
  const isDark = tokens.bg === '#0C0E14';
  if (matrixStyle === 'editorial') {
    return {
      bg: isDark ? 'rgba(12,14,20,0.97)' : 'rgba(248,247,244,0.97)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(232,234,240,0.10)' : 'rgba(26,24,20,0.10)',
    };
  }
  if (matrixStyle === 'paper') {
    return {
      bg: isDark ? 'rgba(26,29,43,0.96)' : 'rgba(254,252,248,0.96)',
      borderWidth: 0.5,
      borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
    };
  }
  // tinted (default)
  return {
    bg: isDark ? 'rgba(19,22,32,0.93)' : 'rgba(255,255,255,0.93)',
    borderWidth: 0.75,
    borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
  };
}

// Inline SVG icons using react-native-svg
import Svg, { Line, Circle, Rect } from 'react-native-svg';

function CrosshairIcon({ color, size }: { color: string; size: number }) {
  const c = size / 2;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Line x1={0} y1={c} x2={size} y2={c} stroke={color} strokeWidth={1.75} />
      <Line x1={c} y1={0} x2={c} y2={size} stroke={color} strokeWidth={1.75} />
    </Svg>
  );
}

function ListIcon({ color, size }: { color: string; size: number }) {
  const gap = size / 4;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Line x1={gap} y1={gap} x2={size - gap} y2={gap} stroke={color} strokeWidth={1.75} strokeLinecap="round" />
      <Line x1={gap} y1={size / 2} x2={size - gap} y2={size / 2} stroke={color} strokeWidth={1.75} strokeLinecap="round" />
      <Line x1={gap} y1={size - gap} x2={size - gap} y2={size - gap} stroke={color} strokeWidth={1.75} strokeLinecap="round" />
    </Svg>
  );
}

function PlusIcon({ color, size }: { color: string; size: number }) {
  const c = size / 2;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Line x1={c} y1={2} x2={c} y2={size - 2} stroke={color} strokeWidth={1.75} strokeLinecap="round" />
      <Line x1={2} y1={c} x2={size - 2} y2={c} stroke={color} strokeWidth={1.75} strokeLinecap="round" />
    </Svg>
  );
}

function DotsIcon({ color, size }: { color: string; size: number }) {
  const r = size * 0.08;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={size * 0.25} cy={size / 2} r={r} fill={color} />
      <Circle cx={size / 2} cy={size / 2} r={r} fill={color} />
      <Circle cx={size * 0.75} cy={size / 2} r={r} fill={color} />
    </Svg>
  );
}
