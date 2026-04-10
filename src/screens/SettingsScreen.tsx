import React, { useContext, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, Share, TextInput, TouchableWithoutFeedback, PanResponder } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';
import { useClearDayStore } from '../clearday/store';
import { ThemeTokens, ThemeMode, MatrixStyle } from '../clearday/theme';
import { getFontSet } from '../clearday/fonts';
import { moderateScale, fontScale } from '../clearday/scale';
import { NavCtx } from '../clearday/ClarityApp';
import { formatQuadrantPresetSummary, getQuadrantPresetIndex, QUADRANT_PRESETS } from '../clearday/quadrantPresets';

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
  const { config, setThemeMode, setTags, setVaultRetentionDays, addTag, removeTag, renameTag, setQuadrantLabels } = useClearDayStore();
  const store = useClearDayStore();
  const [showQuadrantPicker, setShowQuadrantPicker] = useState(false);

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

  // Tag editing state
  const [editingTagIdx, setEditingTagIdx] = useState<number | null>(null);
  const [editingTagValue, setEditingTagValue] = useState('');
  const [addingTag, setAddingTag] = useState(false);
  const [addingTagValue, setAddingTagValue] = useState('');
  const addInputRef = useRef<TextInput>(null);

  const tags = config.tags ?? ['Pro', 'Per'];
  const selectedQuadrantPreset = getQuadrantPresetIndex(config.quadrantLabels);
  const dismissPan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5,
    onPanResponderMove: () => {},
    onPanResponderRelease: (_, gs) => { if (gs.dy > 80) setShowQuadrantPicker(false); },
  })).current;

  const capFirst = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  const handleTagChange = (v: string) => {
    setEditingTagValue(capFirst(v.slice(0, 3)));
  };

  const handleTagBlur = async (oldTag: string) => {
    const val = editingTagValue.trim();
    if (val && val !== oldTag) {
      await renameTag(oldTag, val);
    }
    setEditingTagIdx(null);
    setEditingTagValue('');
  };

  const handleAddChange = (v: string) => {
    setAddingTagValue(capFirst(v.slice(0, 3)));
  };

  const handleAddBlur = async () => {
    const val = addingTagValue.trim();
    if (val) await addTag(val);
    setAddingTag(false);
    setAddingTagValue('');
  };

  const startAddTag = () => {
    setAddingTag(true);
    setAddingTagValue('');
    setTimeout(() => addInputRef.current?.focus(), 50);
  };

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
    presetSheetOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: tokens.overlay, justifyContent: 'flex-end' },
    presetSheet: { backgroundColor: tokens.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: insets.bottom + 8 },
    presetHandle: { width: 36, height: 3, backgroundColor: tokens.border, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
    presetRow: { height: 44, paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: tokens.border, justifyContent: 'center' },
    presetValue: { fontFamily: fonts.serif, fontSize: fontScale(11, fontSizeMultiplier), color: tokens.text },
    presetSelected: { color: tokens.accent },
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

        {/* Agenda Tags */}
        <Text style={s.sectionLabel}>Agenda Tags</Text>
        {tags.map((tag, idx) => (
          <View key={tag} style={s.row}>
            {editingTagIdx === idx ? (
              <TextInput
                autoFocus
                value={editingTagValue}
                onChangeText={handleTagChange}
                onBlur={() => handleTagBlur(tag)}
                onSubmitEditing={() => handleTagBlur(tag)}
                maxLength={3}
                style={[s.rowLabel, { flex: 1, padding: 0, borderBottomWidth: 1, borderBottomColor: tokens.accent }]}
                selectionColor={tokens.accent}
                returnKeyType="done"
              />
            ) : (
              <TouchableOpacity onPress={() => { setEditingTagIdx(idx); setEditingTagValue(tag); }} style={{ flex: 1 }}>
                <Text style={s.rowLabel}>{tag}</Text>
              </TouchableOpacity>
            )}
            {tags.length > 1 && (
              <TouchableOpacity onPress={() => removeTag(tag)} hitSlop={{ top: 8, bottom: 8, left: 12, right: 4 }}>
                <Text style={{ fontFamily: fonts.serif, fontSize: fontScale(14, fontSizeMultiplier), color: tokens.textGhost, marginLeft: 12 }}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        {tags.length < 4 && (
          addingTag ? (
            <View style={s.row}>
              <TextInput
                ref={addInputRef}
                value={addingTagValue}
                onChangeText={handleAddChange}
                onBlur={handleAddBlur}
                onSubmitEditing={handleAddBlur}
                maxLength={3}
                placeholder="Tag"
                placeholderTextColor={tokens.textGhost}
                style={[s.rowLabel, { flex: 1, padding: 0, borderBottomWidth: 1, borderBottomColor: tokens.accent }]}
                selectionColor={tokens.accent}
                returnKeyType="done"
              />
            </View>
          ) : (
            <TouchableOpacity style={s.row} onPress={startAddTag}>
              <Text style={[s.rowLabel, { color: tokens.textGhost }]}>+ Add tag</Text>
            </TouchableOpacity>
          )
        )}
        <Text style={s.helpText}>Short codes only — e.g. Per personal, Lrn learning, Wk work, Hlt health.</Text>

        {/* Archive */}
        <Text style={s.sectionLabel}>Archive</Text>
        <View style={s.row}>
          <Text style={s.rowLabel}>Delete after</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {([15, 60, 0] as const).map(days => {
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

        {/* Quadrants */}
        <Text style={s.sectionLabel}>Quadrants</Text>
        <TouchableOpacity style={s.row} onPress={() => setShowQuadrantPicker(true)}>
          <Text style={s.rowLabel}>Naming</Text>
          <Text style={[s.rowValue, { flex: 1, textAlign: 'right' }]} numberOfLines={1}>
            {formatQuadrantPresetSummary(config.quadrantLabels)}
          </Text>
        </TouchableOpacity>
        <Text style={s.helpText}>Choose one complete naming set for Q1–Q4. The selected labels update across the app.</Text>

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

      {showQuadrantPicker && (
        <TouchableWithoutFeedback onPress={() => setShowQuadrantPicker(false)}>
          <View style={s.presetSheetOverlay}>
            <TouchableWithoutFeedback>
              <View style={s.presetSheet}>
                <View style={s.presetHandle} {...dismissPan.panHandlers} />
                {QUADRANT_PRESETS.map((preset, index) => {
                  const active = index === selectedQuadrantPreset;
                  return (
                    <TouchableOpacity
                      key={`${preset.Q1}-${preset.Q2}-${preset.Q3}-${preset.Q4}`}
                      style={s.presetRow}
                      onPress={async () => {
                        await setQuadrantLabels(preset);
                        setShowQuadrantPicker(false);
                        nav.showToast('Quadrant naming updated');
                      }}
                    >
                      <Text style={[s.presetValue, active && s.presetSelected]} numberOfLines={1}>
                        {`${preset.Q1} / ${preset.Q2} / ${preset.Q3} / ${preset.Q4}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
}
