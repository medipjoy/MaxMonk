/**
 * MVP-1 STATUS:
 * - Reflection & Pulse features hidden (code preserved for MVP-2)
 * - Will be enabled after full redesign in MVP-2
 * - See notes in aiStub.ts
 */

import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
  Alert,
  useColorScheme,
} from 'react-native';
import Slider from '@react-native-community/slider';
import Svg, { Circle, Line } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useClearDayStore } from '../clearday/store';
import { resolveTheme, ThemeTokens } from '../clearday/theme';
import { getFontSet } from '../clearday/fonts';
import { moderateScale, fontScale } from '../clearday/scale';
import { suggestSparkQuadrant } from '../clearday/sparksAI';
import { NavCtx } from '../clearday/ClarityApp';
import { QUADRANT_META, DEFAULT_QUADRANT_LABELS, FontChoice, Quadrant, SparkSuggestion, Spark } from '../clearday/types';

interface Props {
  tokens: ThemeTokens;
  fontChoice: FontChoice;
  matrixStyle: string;
  onPillToggle: () => void;
}

export function ClearDayScreen({ tokens, fontChoice, matrixStyle, onPillToggle }: Props) {
  const insets = useSafeAreaInsets();
  const nav = useContext(NavCtx);
  const store = useClearDayStore();
  const { agendas, sparks, config, mit, addAgenda, addSpark, removeSpark, completeAgenda, toggleHold, bulkDelete, updateAgenda } = store;

  // Panel state
  const [panel, setPanel] = useState<'add' | 'detail' | 'sparks' | 'agendaList' | 'holdList' | 'deletedList' | 'completed' | 'settings' | null>(null);
  const [selectedAgendaId, setSelectedAgendaId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Add/Edit form
  const [newText, setNewText] = useState('');
  const [newUrgency, setNewUrgency] = useState(50);
  const [newImportance, setNewImportance] = useState(50);
  const [newDomain, setNewDomain] = useState('Professional');
  const [newTime, setNewTime] = useState<'quick' | 'short' | 'medium' | 'deep'>('short');

  // Sparks
  const [sparkText, setSparkText] = useState('');
  const [sparkTarget, setSparkTarget] = useState<Spark | null>(null);
  const [sparkSuggestion, setSparkSuggestion] = useState<SparkSuggestion | null>(null);
  const [sparkLoading, setSparkLoading] = useState(false);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef<NodeJS.Timeout | null>(null);

  const fonts = getFontSet(fontChoice);
  const selectedAgenda = selectedAgendaId ? agendas.find(a => a.id === selectedAgendaId) : null;
  const doneAgendas = agendas.filter(a => a.status === 'done');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2000);
  };

  // Get quadrant name from config or default
  const getQuadrantName = (quad: Quadrant) => config.quadrantLabels?.[quad] || DEFAULT_QUADRANT_LABELS[quad] || quad;

  // Render
  const s = createStyles(tokens, fonts, config.fontSizeMultiplier || 1.0);

  return (
    <View style={s.root}>
      {/* MIT Strip */}
      <View style={[s.mitStrip, insets.top > 0 && { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => nav.openPanel('mitSelector')}>
          <Text style={s.mitText}>{mit || 'Set Today\'s Focus'}</Text>
        </TouchableOpacity>
      </View>

      {/* Main Canvas - Matrix Grid */}
      <View style={s.canvas}>
        <ScrollView style={{ flex: 1 }} scrollEnabled={true}>
          {/* Q1, Q2, Q3, Q4 grid rendering */}
          <Text style={s.placeholder}>Matrix View (MVP-1 in progress)</Text>
        </ScrollView>
      </View>

      {/* Menu Button */}
      <TouchableOpacity
        style={s.menuBtn}
        onPress={() => setMenuOpen(!menuOpen)}
      >
        <Text style={s.menuBtnText}>⋯</Text>
      </TouchableOpacity>

      {/* Menu Popover */}
      {menuOpen && (
        <View style={s.menuPopover}>
          <TouchableOpacity
            style={s.menuItem}
            onPress={() => {
              setMenuOpen(false);
              setPanel('agendaList');
            }}
          >
            <Text style={s.menuItemText}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.menuItem}
            onPress={() => {
              setMenuOpen(false);
              setPanel('holdList');
            }}
          >
            <Text style={s.menuItemText}>On Hold</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.menuItem}
            onPress={() => {
              setMenuOpen(false);
              setPanel('deletedList');
            }}
          >
            <Text style={s.menuItemText}>Deleted</Text>
          </TouchableOpacity>
          <View style={s.menuDivider} />
          <TouchableOpacity
            style={s.menuItem}
            onPress={() => {
              setMenuOpen(false);
              setPanel('completed');
            }}
          >
            <Text style={s.menuItemText}>Completed</Text>
          </TouchableOpacity>
          <View style={s.menuDivider} />
          <TouchableOpacity
            style={s.menuItem}
            onPress={() => {
              setMenuOpen(false);
              setPanel('settings');
            }}
          >
            <Text style={s.menuItemText}>Settings</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sparks Button */}
      <TouchableOpacity
        style={s.sparksBtn}
        onPress={() => setPanel('sparks')}
      >
        <Text style={s.sparksBtnText}>✨</Text>
      </TouchableOpacity>

      {/* Toast */}
      {toastMsg && (
        <View style={s.toast}>
          <Text style={s.toastText}>{toastMsg}</Text>
        </View>
      )}

      {/* Bottom Panels */}
      {panel === 'add' && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.panel}
        >
          <View style={s.panelMinimalHeader}>
            <View style={s.dragHandle} />
          </View>
          <ScrollView contentContainerStyle={[s.panelScrollContent, { paddingBottom: 100 }]}>
            <Text style={s.panelTitle}>Add Agenda</Text>
            <TextInput
              value={newText}
              onChangeText={setNewText}
              placeholder="What needs to happen?"
              placeholderTextColor={tokens.textMuted}
              style={s.input}
            />
            {/* Domain selector */}
            <Text style={s.label}>Domain</Text>
            <View style={s.selectorRow}>
              {['Professional', 'Personal'].map(d => (
                <TouchableOpacity
                  key={d}
                  onPress={() => setNewDomain(d)}
                  style={[s.selectorBtn, newDomain === d && s.selectorBtnActive]}
                >
                  <Text style={newDomain === d ? s.selectorBtnTextActive : s.selectorBtnText}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Time selector */}
            <Text style={s.label}>Time</Text>
            <View style={s.selectorRow}>
              {['quick', 'short', 'medium', 'deep'].map(t => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setNewTime(t as any)}
                  style={[s.selectorBtn, newTime === t && s.selectorBtnActive]}
                >
                  <Text style={newTime === t ? s.selectorBtnTextActive : s.selectorBtnText}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Urgency slider */}
            <Text style={s.label}>Urgency: {newUrgency}</Text>
            <Slider
              style={s.slider}
              minimumValue={5}
              maximumValue={95}
              value={newUrgency}
              onValueChange={setNewUrgency}
            />

            {/* Importance slider */}
            <Text style={s.label}>Importance: {newImportance}</Text>
            <Slider
              style={s.slider}
              minimumValue={5}
              maximumValue={95}
              value={newImportance}
              onValueChange={setNewImportance}
            />

            <TouchableOpacity
              style={s.submitBtn}
              onPress={async () => {
                if (!newText.trim()) return;
                await addAgenda({
                  text: newText,
                  domain: newDomain,
                  time: newTime,
                  urgency: newUrgency,
                  importance: newImportance,
                });
                setNewText('');
                setNewUrgency(50);
                setNewImportance(50);
                setPanel(null);
                showToast('Agenda added');
              }}
            >
              <Text style={s.submitBtnText}>Create</Text>
            </TouchableOpacity>

            <View style={s.panelBottomActions}>
              <TouchableOpacity onPress={() => setPanel(null)}>
                <Text style={s.panelBackBtnBottomText}>Back</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* Detail/Edit Panel */}
      {panel === 'detail' && selectedAgenda && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.panel}
        >
          <View style={s.panelMinimalHeader}>
            <View style={s.dragHandle} />
          </View>
          <ScrollView contentContainerStyle={[s.panelScrollContent, { paddingBottom: 100 }]}>
            <Text style={s.panelTitle}>Edit Agenda</Text>
            <TextInput
              value={newText}
              onChangeText={setNewText}
              placeholder="What needs to happen?"
              placeholderTextColor={tokens.textMuted}
              style={s.input}
            />

            {/* Domain selector */}
            <Text style={s.label}>Domain</Text>
            <View style={s.selectorRow}>
              {['Professional', 'Personal'].map(d => (
                <TouchableOpacity
                  key={d}
                  onPress={() => setNewDomain(d)}
                  style={[s.selectorBtn, newDomain === d && s.selectorBtnActive]}
                >
                  <Text style={newDomain === d ? s.selectorBtnTextActive : s.selectorBtnText}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Time selector */}
            <Text style={s.label}>Time</Text>
            <View style={s.selectorRow}>
              {['quick', 'short', 'medium', 'deep'].map(t => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setNewTime(t as any)}
                  style={[s.selectorBtn, newTime === t && s.selectorBtnActive]}
                >
                  <Text style={newTime === t ? s.selectorBtnTextActive : s.selectorBtnText}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Urgency slider */}
            <Text style={s.label}>Urgency: {newUrgency}</Text>
            <Slider
              style={s.slider}
              minimumValue={5}
              maximumValue={95}
              value={newUrgency}
              onValueChange={setNewUrgency}
            />

            {/* Importance slider */}
            <Text style={s.label}>Importance: {newImportance}</Text>
            <Slider
              style={s.slider}
              minimumValue={5}
              maximumValue={95}
              value={newImportance}
              onValueChange={setNewImportance}
            />

            {/* Quadrant preview */}
            <View style={[s.quadrantPreview, { backgroundColor: QUADRANT_META[selectedAgenda.quadrant].color }]}>
              <Text style={s.quadrantPreviewText}>{getQuadrantName(selectedAgenda.quadrant)}</Text>
            </View>

            {/* Action buttons */}
            {selectedAgenda && (
              <View style={s.actionButtonsRow}>
                <TouchableOpacity
                  onPress={async () => {
                    await completeAgenda(selectedAgenda.id);
                    setPanel(null);
                    showToast('Marked done');
                  }}
                  style={s.actionIconBtn}
                >
                  <Text style={s.actionBtnIcon}>✓</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => showToast('Already editing')}
                  style={s.actionIconBtn}
                >
                  <Text style={s.actionBtnIcon}>✏</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    await toggleHold(selectedAgenda.id);
                    setPanel(null);
                    showToast(selectedAgenda.status === 'onhold' ? 'Resumed' : 'On Hold');
                  }}
                  style={s.actionIconBtn}
                >
                  <Text style={s.actionBtnIcon}>⏸</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    // TODO: Implement archive to vault
                    showToast('Archive coming soon');
                  }}
                  style={s.actionIconBtn}
                >
                  <Text style={s.actionBtnIcon}>📦</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={s.submitBtn}
              onPress={async () => {
                if (!newText.trim()) return;
                // TODO: Implement update for detail view
                setPanel(null);
                showToast('Changes saved');
              }}
            >
              <Text style={s.submitBtnText}>Save</Text>
            </TouchableOpacity>

            <View style={s.panelBottomActions}>
              <TouchableOpacity onPress={() => setPanel(null)}>
                <Text style={s.panelBackBtnBottomText}>Back</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* Sparks Panel */}
      {panel === 'sparks' && (
        <View style={s.panel}>
          <View style={s.panelMinimalHeader}>
            <View style={s.dragHandle} />
          </View>
          <ScrollView contentContainerStyle={s.panelScrollContent}>
            <Text style={s.panelTitle}>Sparks</Text>

            {/* Input row */}
            <View style={s.sparkInputRow}>
              <TextInput
                value={sparkText}
                onChangeText={setSparkText}
                placeholder="Capture a thought..."
                placeholderTextColor={tokens.textMuted}
                style={s.sparkInput}
              />
              <TouchableOpacity
                onPress={async () => {
                  if (!sparkText.trim()) return;
                  await addSpark(sparkText);
                  setSparkText('');
                  showToast('Spark added');
                }}
                style={s.sparkAddBtn}
              >
                <Text style={s.sparkAddBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* Sparks list */}
            {sparks.length === 0 ? (
              <Text style={s.emptyStateText}>No sparks yet. Capture raw thoughts here.</Text>
            ) : (
              sparks.map((spark) => (
                <View key={spark.id} style={s.sparkRow}>
                  <Text style={s.sparkDot}>•</Text>
                  <Text style={s.sparkText} numberOfLines={3}>{spark.text}</Text>
                  <TouchableOpacity
                    onPress={async () => {
                      setSparkTarget(spark);
                      setSparkLoading(true);
                      const suggestion = await suggestSparkQuadrant(spark.text);
                      setSparkSuggestion(suggestion);
                      setSparkLoading(false);
                    }}
                    style={s.sparkActionBtn}
                  >
                    <Text style={s.sparkActionBtnIcon}>‹</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={async () => {
                      await removeSpark(spark.id);
                      showToast('Spark removed');
                    }}
                    style={s.sparkActionBtn}
                  >
                    <Text style={s.sparkActionBtnIcon}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}

            {/* Suggestion card */}
            {sparkSuggestion && (
              <View style={[s.suggestionCard, { borderColor: QUADRANT_META[sparkSuggestion.quadrant].color }]}>
                <Text style={s.suggestionTitle}>Suggestion</Text>
                <Text style={s.suggestionText}>{sparkSuggestion.refined}</Text>
                <Text style={s.suggestionMeta}>
                  {sparkSuggestion.quadrant} • {sparkSuggestion.domain} • {sparkSuggestion.time}
                </Text>
                <View style={s.suggestionButtonRow}>
                  <TouchableOpacity
                    onPress={async () => {
                      setNewText(sparkSuggestion.refined);
                      setNewUrgency(sparkSuggestion.urgency);
                      setNewImportance(sparkSuggestion.importance);
                      setNewDomain(sparkSuggestion.domain);
                      setNewTime(sparkSuggestion.time);
                      setSparkText('');
                      setSparkTarget(null);
                      setSparkSuggestion(null);
                      setPanel('add');
                    }}
                    style={[s.suggestionBtn, { backgroundColor: tokens.text }]}
                  >
                    <Text style={{ color: tokens.bg, fontSize: 12, fontFamily: fonts.serif }}>Place on Matrix</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setSparkTarget(null);
                      setSparkSuggestion(null);
                    }}
                    style={[s.suggestionBtn, { borderWidth: 1, borderColor: tokens.border, backgroundColor: 'transparent' }]}
                  >
                    <Text style={{ color: tokens.text, fontSize: 12, fontFamily: fonts.serif }}>Dismiss</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Active List */}
      {panel === 'agendaList' && (
        <View style={s.panel}>
          <View style={s.panelMinimalHeader}>
            <View style={s.dragHandle} />
          </View>
          <ScrollView contentContainerStyle={s.panelScrollContent}>
            <Text style={s.panelTitle}>Active</Text>
            {['Q1', 'Q2', 'Q3', 'Q4'].map((quad) => {
              const quadAgendas = agendas.filter((a) => a.status === 'active' && a.quadrant === quad as Quadrant);
              if (quadAgendas.length === 0) return null;
              return (
                <View key={quad}>
                  <Text style={s.groupHeader}>{getQuadrantName(quad as Quadrant)}</Text>
                  {quadAgendas.map((agenda) => (
                    <View key={agenda.id} style={s.listRow}>
                      <View style={[s.listDot, { backgroundColor: QUADRANT_META[agenda.quadrant].color }]} />
                      <Text style={s.listItemText} numberOfLines={1}>{agenda.text}</Text>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedAgendaId(agenda.id);
                          setPanel('detail');
                        }}
                        style={s.listActionBtn}
                      >
                        <Text style={s.listActionBtnText}>⋯</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={async () => {
                          await toggleHold(agenda.id);
                          showToast('Moved to On Hold');
                        }}
                        style={s.listActionBtn}
                      >
                        <Text style={s.listActionBtnText}>⏸</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={async () => {
                          Alert.alert('Delete?', 'Move to Deleted?', [
                            { text: 'Cancel', onPress: () => {} },
                            { text: 'Delete', onPress: async () => {
                              await bulkDelete([agenda.id]);
                              showToast('Moved to Deleted');
                            }, style: 'destructive' },
                          ]);
                        }}
                        style={s.listActionBtn}
                      >
                        <Text style={s.listActionBtnText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              );
            })}
            <TouchableOpacity
              style={s.addListBtn}
              onPress={() => {
                setNewText('');
                setNewUrgency(50);
                setNewImportance(50);
                setPanel('add');
              }}
            >
              <Text style={s.addListBtnText}>+ Add</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* On Hold List */}
      {panel === 'holdList' && (
        <View style={s.panel}>
          <View style={s.panelMinimalHeader}>
            <View style={s.dragHandle} />
          </View>
          <ScrollView contentContainerStyle={s.panelScrollContent}>
            <Text style={s.panelTitle}>On Hold</Text>
            {agendas.filter((a) => a.status === 'onhold').length === 0 ? (
              <Text style={s.emptyStateText}>Nothing on hold.</Text>
            ) : (
              agendas.filter((a) => a.status === 'onhold').map((agenda) => (
                <View key={agenda.id} style={s.listRow}>
                  <View style={[s.listDot, { backgroundColor: QUADRANT_META[agenda.quadrant].color }]} />
                  <Text style={s.listItemText} numberOfLines={1}>{agenda.text}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedAgendaId(agenda.id);
                      setPanel('detail');
                    }}
                    style={s.listActionBtn}
                  >
                    <Text style={s.listActionBtnText}>⋯</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={async () => {
                      await toggleHold(agenda.id);
                      showToast('Moved to Active');
                    }}
                    style={s.listActionBtn}
                  >
                    <Text style={s.listActionBtnText}>↻</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={async () => {
                      Alert.alert('Delete?', 'Move to Deleted?', [
                        { text: 'Cancel', onPress: () => {} },
                        { text: 'Delete', onPress: async () => {
                          await bulkDelete([agenda.id]);
                          showToast('Moved to Deleted');
                        }, style: 'destructive' },
                      ]);
                    }}
                    style={s.listActionBtn}
                  >
                    <Text style={s.listActionBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
            <TouchableOpacity
              style={s.addListBtn}
              onPress={() => {
                setNewText('');
                setNewUrgency(50);
                setNewImportance(50);
                setNewDomain('Professional');
                setNewTime('short');
                setPanel('add');
              }}
            >
              <Text style={s.addListBtnText}>+ Add</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Deleted List */}
      {panel === 'deletedList' && (
        <View style={s.panel}>
          <View style={s.panelMinimalHeader}>
            <View style={s.dragHandle} />
          </View>
          <ScrollView contentContainerStyle={s.panelScrollContent}>
            <Text style={s.panelTitle}>Deleted</Text>
            {agendas.filter((a) => a.status === 'deleted').length === 0 ? (
              <Text style={s.emptyStateText}>No deleted items.</Text>
            ) : (
              agendas.filter((a) => a.status === 'deleted').map((agenda) => (
                <View key={agenda.id} style={s.listRow}>
                  <View style={[s.listDot, { backgroundColor: QUADRANT_META[agenda.quadrant].color }]} />
                  <Text style={s.listItemText} numberOfLines={1}>{agenda.text}</Text>
                  <TouchableOpacity
                    onPress={async () => {
                      // TODO: Implement restore from deleted
                      showToast('Restore coming soon');
                    }}
                    style={s.listActionBtn}
                  >
                    <Text style={s.listActionBtnText}>↻</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={async () => {
                      // TODO: Implement move to hold from deleted
                      showToast('Move to hold coming soon');
                    }}
                    style={s.listActionBtn}
                  >
                    <Text style={s.listActionBtnText}>⏸</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={async () => {
                      Alert.alert('Permanently Delete?', 'This cannot be undone.', [
                        { text: 'Cancel', onPress: () => {} },
                        { text: 'Delete Forever', onPress: async () => {
                          // Implement permanent delete from vault
                          showToast('Permanently deleted');
                        }, style: 'destructive' },
                      ]);
                    }}
                    style={s.listActionBtn}
                  >
                    <Text style={s.listActionBtnText}>🗑</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {/* Settings Panel */}
      {panel === 'settings' && (
        <View style={s.panel}>
          <View style={s.panelMinimalHeader}>
            <View style={s.dragHandle} />
          </View>
          <ScrollView contentContainerStyle={s.panelScrollContent}>
            <Text style={s.panelTitle}>Settings</Text>
            <Text style={s.settingLabel}>Theme</Text>
            <Text style={s.settingValue}>{config.themeMode}</Text>
            <View style={s.panelBottomActions}>
              <TouchableOpacity onPress={() => setPanel(null)}>
                <Text style={s.panelBackBtnBottomText}>Back</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Completed List */}
      {panel === 'completed' && (
        <View style={s.panel}>
          <View style={s.panelMinimalHeader}>
            <View style={s.dragHandle} />
          </View>
          <ScrollView contentContainerStyle={s.panelScrollContent}>
            <Text style={s.panelTitle}>Completed</Text>
            {doneAgendas.length === 0 ? (
              <Text style={s.emptyStateText}>No completed items yet.</Text>
            ) : (
              doneAgendas.map((agenda) => (
                <View key={agenda.id} style={s.listRow}>
                  <Text style={s.completedCheckmark}>✓</Text>
                  <Text style={[s.listItemText, { textDecorationLine: 'line-through', color: tokens.textGhost }]} numberOfLines={1}>
                    {agenda.text}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

function createStyles(tokens: ThemeTokens, fonts: any, fontMultiplier: number) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: tokens.bg },
    mitStrip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderBottomWidth: 0.5,
      borderBottomColor: tokens.border,
      justifyContent: 'center',
    },
    mitText: {
      fontFamily: fonts.serif,
      fontSize: fontScale(11, fontMultiplier),
      color: tokens.text,
      fontStyle: 'italic',
    },
    canvas: {
      flex: 1,
      backgroundColor: tokens.surface,
    },
    placeholder: {
      textAlign: 'center',
      marginTop: 40,
      color: tokens.textMuted,
      fontFamily: fonts.serif,
    },
    menuBtn: {
      position: 'absolute',
      top: 54,
      right: 12,
      width: 44,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    menuBtnText: {
      fontSize: 20,
      color: tokens.text,
    },
    menuPopover: {
      position: 'absolute',
      top: 100,
      right: 12,
      backgroundColor: tokens.surface,
      borderWidth: 0.5,
      borderColor: tokens.border,
      borderRadius: 6,
      minWidth: 120,
      zIndex: 100,
    },
    menuItem: {
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    menuItemText: {
      fontFamily: fonts.serif,
      fontSize: fontScale(11, fontMultiplier),
      color: tokens.text,
    },
    menuDivider: {
      height: 0.5,
      backgroundColor: tokens.border,
      marginVertical: 4,
    },
    sparksBtn: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: tokens.accent,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sparksBtnText: {
      fontSize: 20,
    },
    panel: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '80%',
      backgroundColor: tokens.surface,
      borderTopWidth: 0.5,
      borderTopColor: tokens.border,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
    },
    panelMinimalHeader: {
      paddingVertical: 12,
      alignItems: 'center',
      borderBottomWidth: 0.5,
      borderBottomColor: tokens.border,
    },
    dragHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: tokens.border,
    },
    panelScrollContent: {
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    panelTitle: {
      fontFamily: fonts.serif,
      fontSize: fontScale(18, fontMultiplier),
      color: tokens.text,
      marginBottom: 16,
    },
    panelBackBtnBottomText: {
      fontFamily: fonts.serif,
      fontSize: fontScale(12, fontMultiplier),
      color: tokens.accent,
    },
    panelBottomActions: {
      paddingTop: 20,
      paddingBottom: 16,
      borderTopWidth: 0.5,
      borderTopColor: tokens.border,
      alignItems: 'flex-end',
    },
    input: {
      borderWidth: 0.5,
      borderColor: tokens.border,
      borderRadius: 6,
      padding: 10,
      fontFamily: fonts.serif,
      fontSize: fontScale(13, fontMultiplier),
      color: tokens.text,
      marginBottom: 12,
    },
    label: {
      fontFamily: fonts.serif,
      fontSize: fontScale(10, fontMultiplier),
      color: tokens.textGhost,
      marginBottom: 6,
      marginTop: 12,
    },
    selectorRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    selectorBtn: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderWidth: 0.5,
      borderColor: tokens.border,
      borderRadius: 4,
      backgroundColor: tokens.surface2,
    },
    selectorBtnActive: {
      backgroundColor: tokens.text,
    },
    selectorBtnText: {
      fontFamily: fonts.serif,
      fontSize: fontScale(11, fontMultiplier),
      color: tokens.text,
      textAlign: 'center',
    },
    selectorBtnTextActive: {
      fontFamily: fonts.serif,
      fontSize: fontScale(11, fontMultiplier),
      color: tokens.surface,
      textAlign: 'center',
    },
    slider: {
      height: 20,
      marginBottom: 12,
    },
    submitBtn: {
      backgroundColor: tokens.accent,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 6,
      marginTop: 16,
    },
    submitBtnText: {
      fontFamily: fonts.serif,
      fontSize: fontScale(12, fontMultiplier),
      color: tokens.surface,
      textAlign: 'center',
    },
    sparkInputRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
      paddingHorizontal: 0,
    },
    sparkInput: {
      flex: 1,
      borderWidth: 0.5,
      borderColor: tokens.border,
      borderRadius: 6,
      padding: 10,
      fontFamily: fonts.serif,
      fontSize: fontScale(13, fontMultiplier),
      color: tokens.text,
    },
    sparkAddBtn: {
      paddingHorizontal: 16,
      justifyContent: 'center',
    },
    sparkAddBtnText: {
      fontFamily: fonts.serif,
      fontSize: fontScale(12, fontMultiplier),
      color: tokens.accent,
    },
    sparkDot: {
      fontSize: 8,
      color: tokens.textMuted,
      marginRight: 8,
    },
    sparkText: {
      flex: 1,
      fontFamily: fonts.serif,
      fontSize: fontScale(12, fontMultiplier),
      color: tokens.text,
      lineHeight: 16,
    },
    sparkRow: {
      flexDirection: 'row',
      paddingVertical: 10,
      paddingHorizontal: 0,
      borderBottomWidth: 0.5,
      borderBottomColor: tokens.border,
      alignItems: 'flex-start',
    },
    sparkActionBtn: {
      padding: 6,
      marginLeft: 4,
    },
    sparkActionBtnIcon: {
      fontSize: fontScale(14, fontMultiplier),
      color: tokens.textMuted,
    },
    suggestionCard: {
      marginTop: 16,
      padding: 12,
      borderRadius: 8,
      borderLeftWidth: 3,
      backgroundColor: tokens.surface2,
    },
    suggestionTitle: {
      fontFamily: fonts.serif,
      fontSize: fontScale(10, fontMultiplier),
      color: tokens.textGhost,
      marginBottom: 8,
      fontStyle: 'italic',
    },
    suggestionText: {
      fontFamily: fonts.serif,
      fontSize: fontScale(12, fontMultiplier),
      color: tokens.text,
      marginBottom: 6,
      lineHeight: 16,
    },
    suggestionMeta: {
      fontFamily: fonts.sansMedium,
      fontSize: fontScale(9, fontMultiplier),
      color: tokens.textMuted,
      marginBottom: 12,
    },
    suggestionButtonRow: {
      flexDirection: 'row',
      gap: 8,
    },
    suggestionBtn: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyStateText: {
      fontFamily: fonts.serif,
      fontSize: fontScale(12, fontMultiplier),
      color: tokens.textMuted,
      textAlign: 'center',
      marginTop: 16,
    },
    listRow: {
      flexDirection: 'row',
      paddingVertical: 10,
      paddingHorizontal: 0,
      borderBottomWidth: 0.5,
      borderBottomColor: tokens.border,
      alignItems: 'center',
    },
    listDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 8,
    },
    listItemText: {
      flex: 1,
      fontFamily: fonts.serif,
      fontSize: fontScale(12, fontMultiplier),
      color: tokens.text,
    },
    listActionBtn: {
      padding: 6,
      marginLeft: 4,
    },
    listActionBtnText: {
      fontSize: fontScale(14, fontMultiplier),
      color: tokens.textMuted,
    },
    completedCheckmark: {
      fontSize: fontScale(14, fontMultiplier),
      color: tokens.text,
      marginRight: 8,
    },
    actionButtonsRow: {
      flexDirection: 'row',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 0,
      alignItems: 'center',
    },
    actionIconBtn: {
      width: 36,
      height: 36,
      borderRadius: 6,
      borderWidth: 0.5,
      borderColor: tokens.border,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: tokens.surface,
    },
    actionBtnIcon: {
      fontSize: fontScale(16, fontMultiplier),
      color: tokens.text,
    },
    toast: {
      position: 'absolute',
      bottom: 20,
      alignSelf: 'center',
      backgroundColor: tokens.text,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
    },
    toastText: {
      fontFamily: fonts.serif,
      fontSize: fontScale(11, fontMultiplier),
      color: tokens.bg,
    },
    settingLabel: {
      fontFamily: fonts.serif,
      fontSize: fontScale(10, fontMultiplier),
      color: tokens.textGhost,
      marginTop: 16,
    },
    settingValue: {
      fontFamily: fonts.serif,
      fontSize: fontScale(12, fontMultiplier),
      color: tokens.text,
      marginTop: 4,
    },
    groupHeader: {
      fontFamily: fonts.serif,
      fontSize: fontScale(11, fontMultiplier),
      color: tokens.textGhost,
      marginTop: 16,
      marginBottom: 8,
    },
    listGroupHeader: {
      fontFamily: fonts.serif,
      fontSize: fontScale(10, fontMultiplier),
      color: tokens.textGhost,
      marginTop: 12,
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    addListBtn: {
      marginTop: 16,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderWidth: 0.5,
      borderColor: tokens.border,
      borderRadius: 6,
      backgroundColor: tokens.surface2,
    },
    addListBtnText: {
      fontFamily: fonts.serif,
      fontSize: fontScale(12, fontMultiplier),
      color: tokens.accent,
      textAlign: 'center',
    },
    quadrantPreview: {
      marginTop: 16,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    quadrantPreviewText: {
      fontFamily: fonts.serif,
      fontSize: fontScale(12, fontMultiplier),
      color: tokens.bg,
      fontWeight: '500',
    },
  });
}
