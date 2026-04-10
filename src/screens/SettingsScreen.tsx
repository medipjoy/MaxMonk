import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';
import { useClearDayStore } from '../clearday/store';
import { ThemeTokens, ThemeMode, MatrixStyle } from '../clearday/theme';
import { getFontSet } from '../clearday/fonts';
import { moderateScale, fontScale } from '../clearday/scale';
import { NavCtx } from '../clearday/ClarityApp';

interface Props {
  tokens: ThemeTokens;
  fontChoice: string;
  themeMode: ThemeMode;
  matrixStyle: MatrixStyle;
  mitResetHour: number;
  vaultRetentionDays: number;
}

function OptionSelector<T extends string>({ options, value, onChange, tokens, fonts }: { options: T[]; value: T; onChange: (v: T) => void; tokens: ThemeTokens; fonts: any }) {
  const fontSizeMultiplier = useClearDayStore(s => s.config?.fontSizeMultiplier ?? 1.0);
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {options.map(opt => {
        const active = opt === value;
        return (
          <TouchableOpacity key={opt} onPress={() => onChange(opt)}>
            <Text style={{
              fontFamily: fonts.serif,
              fontSize: fontScale(12, fontSizeMultiplier),
              color: active ? tokens.text : tokens.textGhost,
              borderBottomWidth: active ? 1 : 0,
              borderBottomColor: tokens.text,
              paddingBottom: active ? 1 : 0,
              textTransform: 'capitalize',
            }}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const FONT_LABELS: Record<string, string> = { cormorant: 'Cg', baskerville: 'Lb', inter: 'In', jakarta: 'Pj' };
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_LABEL = (h: number) => h === 0 ? '12:00 am' : h < 12 ? `${h}:00 am` : h === 12 ? '12:00 pm' : `${h - 12}:00 pm`;

const FONT_SIZE_OPTIONS: { label: string; value: number }[] = [
  { label: 'Small', value: 0.85 },
  { label: 'Normal', value: 1.0 },
  { label: 'Large', value: 1.15 },
  { label: 'XL', value: 1.3 },
];

export function SettingsScreen({ tokens, fontChoice, themeMode, matrixStyle, mitResetHour, vaultRetentionDays }: Props) {
  const insets = useSafeAreaInsets();
  const fonts = getFontSet(fontChoice as any);
  const nav = useContext(NavCtx);
  const { config, setThemeMode, setTags, setVaultRetentionDays } = useClearDayStore();
  const store = useClearDayStore();

  // Proxy setters via store (we add these to action functions)
  const setMatrixStyle = async (style: MatrixStyle) => {
    const newCfg = { ...config, matrixStyle: style };
    await (store as any).saveConfig?.(newCfg) ?? store.setThemeMode(config.themeMode); // fallback
    useClearDayStore.setState({ config: newCfg });
  };

  const setFontChoice = async (font: string) => {
    const newCfg = { ...config, fontChoice: font as any };
    useClearDayStore.setState({ config: newCfg });
  };

  const setMitResetHour = async (h: number) => {
    const newCfg = { ...config, mitResetHour: h };
    useClearDayStore.setState({ config: newCfg });
  };

  const setFontSizeMultiplier = (multiplier: number) => {
    const newCfg = { ...config, fontSizeMultiplier: multiplier };
    useClearDayStore.setState({ config: newCfg });
  };

  const currentFontSize = config.fontSizeMultiplier ?? 1.0;
  const fontSizeMultiplier = currentFontSize;

  const { agendas, vault } = useClearDayStore();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const tsToISO = (ts?: number) => ts ? new Date(ts).toISOString() : '';
      const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;

      const header = ['id', 'text', 'quadrant', 'domain', 'effort', 'status', 'cx', 'cy',
        'createdAt', 'doneAt', 'onHoldAt', 'archivedAt'];

      const rows: string[][] = [];
      for (const a of agendas) {
        rows.push([
          a.id, a.text, a.quadrant, a.domain, a.time, a.status,
          a.cx.toFixed(4), a.cy.toFixed(4),
          tsToISO(a.createdAt), tsToISO(a.doneAt), tsToISO(a.onHoldAt), '',
        ]);
      }
      for (const v of vault) {
        rows.push([
          v.id, v.text, v.quadrant, v.domain, v.time, 'archived',
          v.cx.toFixed(4), v.cy.toFixed(4),
          tsToISO(v.createdAt), tsToISO(v.doneAt), tsToISO(v.onHoldAt), tsToISO(v.archivedAt),
        ]);
      }

      const csv = [header, ...rows]
        .map(row => row.map((cell, i) => (i === 1 || i === 3 ? escape(String(cell)) : String(cell))).join(','))
        .join('\n');

      const filename = `maxmonk-export-${new Date().toISOString().slice(0, 10)}.csv`;

      if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        nav.showToast('Exported');
      } else {
        await Share.share({ message: csv, title: filename });
      }
    } finally {
      setExporting(false);
    }
  };

  const TAGLINE = `Most people confuse being busy with being productive. The Eisenhower Matrix changes that. By sorting tasks into four clear quadrants, you stop reacting to noise and start investing your time where it genuinely creates impact and drives meaning.`;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: tokens.bg, paddingTop: insets.top },
    header: { height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: tokens.border },
    backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    title: { fontFamily: fonts.serif, fontSize: fontScale(22, fontSizeMultiplier), color: tokens.text, fontWeight: '300', letterSpacing: -0.3 },
    scroll: { flex: 1 },
    sectionLabel: { fontFamily: fonts.sansMedium, fontSize: fontScale(7, fontSizeMultiplier), color: tokens.textGhost, textTransform: 'uppercase', letterSpacing: 0.12 * fontScale(7, fontSizeMultiplier), paddingHorizontal: 16, paddingTop: 20, paddingBottom: 6 },
    row: { height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: tokens.border, justifyContent: 'space-between' },
    rowLabel: { fontFamily: fonts.serif, fontSize: fontScale(12, fontSizeMultiplier), color: tokens.text },
    rowValue: { fontFamily: fonts.serif, fontSize: fontScale(12, fontSizeMultiplier), color: tokens.textMuted },
    helpText: { fontFamily: fonts.serifItalic, fontSize: fontScale(8, fontSizeMultiplier), color: tokens.textGhost, lineHeight: fontScale(8, fontSizeMultiplier) * 1.5, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10 },
    tagline: { fontFamily: fonts.serifItalic, fontSize: fontScale(8, fontSizeMultiplier), color: tokens.textGhost, lineHeight: fontScale(8, fontSizeMultiplier) * 1.6, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 40 },
    fontSizeRow: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: tokens.border },
    fontSizeLabel: { fontFamily: fonts.serif, fontSize: fontScale(12, fontSizeMultiplier), color: tokens.text, marginBottom: 8 },
    fontSizeBtns: { flexDirection: 'row', gap: 8 },
    fontSizeBtn: { borderRadius: 4, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 0.5 },
    fontSizeBtnText: { fontFamily: fonts.serif, fontSize: fontScale(11, fontSizeMultiplier) },
  });

  const fontOptions = ['cormorant', 'baskerville', 'inter', 'jakarta'] as const;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={nav.back}>
          <Svg width={16} height={16} viewBox="0 0 16 16">
            <Line x1={10} y1={3} x2={5} y2={8} stroke={tokens.accent} strokeWidth={1.5} strokeLinecap="round" />
            <Line x1={5} y1={8} x2={10} y2={13} stroke={tokens.accent} strokeWidth={1.5} strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={s.title}>Settings</Text>
      </View>

      <ScrollView style={s.scroll}>
        {/* Appearance */}
        <Text style={s.sectionLabel}>Appearance</Text>
        <View style={s.row}>
          <Text style={s.rowLabel}>Theme</Text>
          <OptionSelector options={['light', 'dark'] as ThemeMode[]} value={themeMode} onChange={v => setThemeMode(v)} tokens={tokens} fonts={fonts} />
        </View>
        <View style={s.row}>
          <Text style={s.rowLabel}>Style</Text>
          <OptionSelector options={['tinted', 'editorial', 'paper'] as MatrixStyle[]} value={matrixStyle} onChange={setMatrixStyle} tokens={tokens} fonts={fonts} />
        </View>
        <View style={s.row}>
          <Text style={s.rowLabel}>Font</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {fontOptions.map(f => {
              const active = fontChoice === f;
              return (
                <TouchableOpacity key={f} onPress={() => setFontChoice(f)}>
                  <Text style={{ fontFamily: fonts.serif, fontSize: fontScale(12, fontSizeMultiplier), color: active ? tokens.text : tokens.textGhost, borderBottomWidth: active ? 1 : 0, borderBottomColor: tokens.text, paddingBottom: active ? 1 : 0 }}>
                    {FONT_LABELS[f]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Font Size */}
        <View style={s.fontSizeRow}>
          <Text style={s.fontSizeLabel}>Size</Text>
          <View style={s.fontSizeBtns}>
            {FONT_SIZE_OPTIONS.map(({ label, value }) => {
              const active = Math.abs((currentFontSize) - value) < 0.01;
              return (
                <TouchableOpacity
                  key={label}
                  style={[s.fontSizeBtn, {
                    backgroundColor: active ? tokens.accent : 'transparent',
                    borderColor: active ? tokens.accent : tokens.textGhost,
                  }]}
                  onPress={() => setFontSizeMultiplier(value)}
                >
                  <Text style={[s.fontSizeBtnText, { color: active ? tokens.surface : tokens.textGhost }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Today's Focus */}
        <Text style={s.sectionLabel}>Today's Focus</Text>
        <View style={s.row}>
          <Text style={s.rowLabel}>MIT resets at</Text>
          <Text style={s.rowValue}>{HOUR_LABEL(mitResetHour)}</Text>
        </View>
        <Text style={s.helpText}>MIT = Most Important Task. Your top agenda wins the day.</Text>

        {/* Archive */}
        <Text style={s.sectionLabel}>Archive</Text>
        <View style={s.row}>
          <Text style={s.rowLabel}>Auto-clears after</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {([7, 14, 30, 60, 0] as const).map(days => {
              const active = vaultRetentionDays === days;
              const label = days === 0 ? 'Never' : `${days}d`;
              return (
                <TouchableOpacity key={days} onPress={() => setVaultRetentionDays(days)}>
                  <Text style={{
                    fontFamily: fonts.serif,
                    fontSize: fontScale(12, fontSizeMultiplier),
                    color: active ? tokens.text : tokens.textGhost,
                    borderBottomWidth: active ? 1 : 0,
                    borderBottomColor: tokens.text,
                    paddingBottom: active ? 1 : 0,
                  }}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <Text style={s.helpText}>Archived agendas older than this are permanently deleted on next launch.</Text>

        {/* Data */}
        <Text style={s.sectionLabel}>Data</Text>
        <TouchableOpacity style={s.row} onPress={handleExport} disabled={exporting}>
          <Text style={s.rowLabel}>Export to CSV</Text>
          <Text style={[s.rowValue, { color: exporting ? tokens.textGhost : tokens.accent }]}>
            {exporting ? 'Exporting…' : `${agendas.length + vault.length} agendas ↓`}
          </Text>
        </TouchableOpacity>
        <Text style={s.helpText}>Exports all agendas.</Text>

        {/* Clarity footer */}
        <Text style={s.sectionLabel}>Clarity</Text>
        <Text style={s.tagline}>{TAGLINE}</Text>
      </ScrollView>
    </View>
  );
}
