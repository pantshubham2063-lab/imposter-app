import * as Haptics from "@/utils/haptics";
import {
    ArrowLeft,
    Clock,
    EyeOff,
    PlusCircle,
    Star,
    Trash2,
    Users,
    Zap,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { GlassCard } from "../components/GlassCard";
import { NeonButton } from "../components/NeonButton";
import { API_BASE, useGame } from "../context/GameContext";
import { Theme } from "../theme/Theme";

const { width } = Dimensions.get("window");

const DIFFICULTY_LEVELS = [
  {
    key: "easy",
    label: "EASY",
    color: "#10B981",
    desc: "Simple & common words",
  },
  {
    key: "moderate",
    label: "MODERATE",
    color: "#F59E0B",
    desc: "Trickier vocabulary",
  },
  {
    key: "hard",
    label: "HARD",
    color: "#FF4D4D",
    desc: "Rare & obscure words",
  },
];

export const LocalSetupView: React.FC = () => {
  const { setScreen, startLocalGame } = useGame();

  // Player names
  const [players, setPlayers] = useState<string[]>([
    "Player 1",
    "Player 2",
    "Player 3",
  ]);
  const [newName, setNewName] = useState("");

  // Editable game settings - all keyboard-only, no limits
  const [imposterCountText, setImposterCountText] = useState("1");
  const [votingTimeText, setVotingTimeText] = useState("60");
  const [difficulty, setDifficulty] = useState("easy");

  // Category
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/game/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
        if (data.length > 0) {
          setSelectedCategory(data[0]._id);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch categories", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = () => {
    if (!newName.trim()) return;
    const updated = [...players, newName.trim()];
    setPlayers(updated);
    setNewName("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRemovePlayer = (index: number) => {
    if (players.length <= 3) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    const newPlayers = [...players];
    newPlayers.splice(index, 1);
    setPlayers(newPlayers);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleStartGame = async () => {
    const impCount = parseInt(imposterCountText) || 1;
    const votingTime = parseInt(votingTimeText) || 60;
    if (players.length < 3 || !selectedCategory) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (impCount >= players.length) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsStarting(true);
    const categoryObj = categories.find((c) => c._id === selectedCategory);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await startLocalGame(players, impCount, categoryObj, votingTime);
    setIsStarting(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Theme.gradients.bg}
        style={StyleSheet.absoluteFill}
      />

      {/* Background Accent Orbs */}
      <View style={styles.glowOrb} />
      <View style={styles.glowOrb2} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setScreen("home");
          }}
        >
          <ArrowLeft size={18} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>CREATE ROOM</Text>
          <Text style={styles.headerSubtitle}>SET UP YOUR MATCH</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── GAME SETTINGS ──────────────────────────────────────────── */}
          <Text style={styles.sectionTitle}>GAME SETTINGS</Text>
          <GlassCard
            cornerRadius={20}
            borderOpacity={0.25}
            padding={20}
            style={{ marginBottom: 24 }}
          >
            {/* Players Count - auto from list */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.settingIconBg,
                    { backgroundColor: "rgba(0, 229, 255, 0.12)" },
                  ]}
                >
                  <Users size={18} color={Theme.colors.accentCyan} />
                </View>
                <View>
                  <Text style={styles.settingLabel}>PLAYERS</Text>
                  <Text style={styles.settingHint}>Add names below</Text>
                </View>
              </View>
              <View style={styles.settingInputBox}>
                <Text style={styles.settingInputValue}>{players.length}</Text>
              </View>
            </View>

            <View style={styles.settingDivider} />

            {/* Imposter Count - unlimited, keyboard editable */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.settingIconBg,
                    { backgroundColor: "rgba(255, 77, 77, 0.12)" },
                  ]}
                >
                  <EyeOff size={18} color={Theme.colors.accentRed} />
                </View>
                <View>
                  <Text style={styles.settingLabel}>IMPOSTERS</Text>
                  <Text style={styles.settingHint}>Type any number</Text>
                </View>
              </View>
              <TextInput
                style={styles.settingInput}
                keyboardType="number-pad"
                maxLength={3}
                value={imposterCountText}
                onChangeText={setImposterCountText}
                selectTextOnFocus
              />
            </View>

            <View style={styles.settingDivider} />

            {/* Voting Time - keyboard editable */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.settingIconBg,
                    { backgroundColor: "rgba(255, 213, 79, 0.12)" },
                  ]}
                >
                  <Clock size={18} color={Theme.colors.accentGold} />
                </View>
                <View>
                  <Text style={styles.settingLabel}>VOTING TIME</Text>
                  <Text style={styles.settingHint}>Seconds before vote</Text>
                </View>
              </View>
              <View style={styles.settingInputRow}>
                <TextInput
                  style={styles.settingInput}
                  keyboardType="number-pad"
                  maxLength={4}
                  value={votingTimeText}
                  onChangeText={setVotingTimeText}
                  selectTextOnFocus
                />
                <Text style={styles.settingUnit}>sec</Text>
              </View>
            </View>
          </GlassCard>

          {/* ─── DIFFICULTY LEVEL ───────────────────────────────────────── */}
          <Text style={styles.sectionTitle}>DIFFICULTY LEVEL</Text>
          <View style={styles.difficultyRow}>
            {DIFFICULTY_LEVELS.map((level) => {
              const isSelected = difficulty === level.key;
              return (
                <Pressable
                  key={level.key}
                  style={[
                    styles.difficultyCard,
                    isSelected && {
                      borderColor: level.color,
                      backgroundColor: `${level.color}15`,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setDifficulty(level.key);
                  }}
                >
                  <Zap
                    size={20}
                    color={isSelected ? level.color : "rgba(255,255,255,0.3)"}
                    style={{ marginBottom: 8 }}
                  />
                  <Text
                    style={[
                      styles.difficultyLabel,
                      isSelected && { color: level.color },
                    ]}
                  >
                    {level.label}
                  </Text>
                  <Text style={styles.difficultyDesc}>{level.desc}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* ─── CATEGORY ───────────────────────────────────────────────── */}
          <Text style={styles.sectionTitle}>SELECT CATEGORY</Text>
          {loading ? (
            <ActivityIndicator
              size="small"
              color={Theme.colors.accentCyan}
              style={{ marginVertical: 20 }}
            />
          ) : (
            <GlassCard
              cornerRadius={20}
              borderOpacity={0.2}
              padding={0}
              style={{ marginBottom: 24, overflow: "hidden" }}
            >
              {categories.map((cat, index) => {
                const isSelected = selectedCategory === cat._id;
                return (
                  <Pressable
                    key={cat._id}
                    style={[
                      styles.categoryRow,
                      isSelected && {
                        backgroundColor: "rgba(0, 229, 255, 0.08)",
                      },
                      index < categories.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: "rgba(255,255,255,0.04)",
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedCategory(cat._id);
                    }}
                  >
                    <Text
                      style={[
                        styles.categoryName,
                        isSelected && { color: Theme.colors.accentCyan },
                      ]}
                    >
                      {cat.name}
                    </Text>
                    {isSelected && (
                      <Star size={16} color={Theme.colors.accentCyan} />
                    )}
                  </Pressable>
                );
              })}
            </GlassCard>
          )}

          {/* ─── PLAYERS LIST ───────────────────────────────────────────── */}
          <Text style={styles.sectionTitle}>
            PLAYER NAMES ({players.length})
          </Text>

          <GlassCard
            cornerRadius={20}
            borderOpacity={0.2}
            padding={16}
            style={{ marginBottom: 24 }}
          >
            {/* Add Player Input */}
            <View style={styles.addPlayerRow}>
              <TextInput
                style={styles.addPlayerInput}
                placeholder="Type a player name..."
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={newName}
                onChangeText={setNewName}
                onSubmitEditing={handleAddPlayer}
                returnKeyType="done"
              />
              <Pressable style={styles.addPlayerBtn} onPress={handleAddPlayer}>
                <PlusCircle size={22} color={Theme.colors.accentCyan} />
              </Pressable>
            </View>

            <View style={styles.playerDivider} />

            {/* Player List */}
            {players.map((p, idx) => (
              <View key={idx} style={styles.playerRow}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <View style={styles.playerNumberBg}>
                    <Text style={styles.playerNumber}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.playerName} numberOfLines={1}>
                    {p}
                  </Text>
                </View>

                <Pressable
                  onPress={() => handleRemovePlayer(idx)}
                  style={styles.removeBtn}
                  hitSlop={8}
                >
                  <Trash2 size={14} color={Theme.colors.accentRed} />
                </Pressable>
              </View>
            ))}
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Dock - Start Button */}
      <View style={styles.bottomDock}>
        <LinearGradient
          colors={[
            "rgba(8,11,17,0)",
            Theme.colors.bgPrimary,
            Theme.colors.bgPrimary,
          ]}
          style={StyleSheet.absoluteFill}
        />
        <NeonButton
          title={isStarting ? "SETTING UP..." : "START MATCH"}
          gradientColors={
            selectedCategory && players.length >= 3
              ? Theme.gradients.cyan
              : ["#151A26", "#0C101A"]
          }
          onPress={handleStartGame}
          disabled={!selectedCategory || players.length < 3 || isStarting}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.bgPrimary },
  glowOrb: {
    position: "absolute",
    top: -120,
    right: -120,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(0, 229, 255, 0.06)",
    transform: [{ scale: 2.5 }],
  },
  glowOrb2: {
    position: "absolute",
    bottom: 100,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(255, 77, 77, 0.04)",
    transform: [{ scale: 2 }],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    zIndex: 10,
    position: "relative",
    minHeight: 110,
  },
  backBtn: {
    position: "absolute",
    left: 24,
    top: 60,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  headerCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: Theme.fonts.black,
    fontSize: 22,
    color: "#FFFFFF",
    letterSpacing: 1.5,
  },
  headerSubtitle: {
    fontFamily: Theme.fonts.bold,
    fontSize: 10,
    color: Theme.colors.accentCyan,
    letterSpacing: 2,
    marginTop: 4,
  },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 140, paddingTop: 16 },
  sectionTitle: {
    fontFamily: Theme.fonts.bold,
    fontSize: 11,
    color: Theme.colors.textMuted,
    letterSpacing: 2,
    marginBottom: 14,
    marginTop: 4,
  },

  // ─── Settings ──────────────────────────────────────────────────
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  settingIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: {
    fontFamily: Theme.fonts.bold,
    fontSize: 14,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  settingHint: {
    fontFamily: Theme.fonts.medium,
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  settingInput: {
    width: 64,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
    textAlign: "center",
    color: "#FFFFFF",
    fontFamily: Theme.fonts.bold,
    fontSize: 20,
  },
  settingInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  settingUnit: {
    fontFamily: Theme.fonts.medium,
    fontSize: 12,
    color: Theme.colors.textMuted,
  },
  settingInputBox: {
    width: 64,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.15)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  settingInputValue: {
    fontFamily: Theme.fonts.bold,
    fontSize: 20,
    color: Theme.colors.accentCyan,
  },
  settingDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginVertical: 14,
  },

  // ─── Difficulty ────────────────────────────────────────────────
  difficultyRow: {
    flexDirection: "row",
    marginBottom: 28,
    gap: 10,
  },
  difficultyCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  difficultyLabel: {
    fontFamily: Theme.fonts.black,
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 1,
    marginBottom: 4,
  },
  difficultyDesc: {
    fontFamily: Theme.fonts.medium,
    fontSize: 9,
    color: "rgba(255,255,255,0.3)",
    textAlign: "center",
  },

  // ─── Category ──────────────────────────────────────────────────
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  categoryName: {
    fontFamily: Theme.fonts.bold,
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
  },

  // ─── Players ───────────────────────────────────────────────────
  addPlayerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  addPlayerInput: {
    flex: 1,
    height: 48,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 14,
    paddingHorizontal: 18,
    color: "#FFFFFF",
    fontFamily: Theme.fonts.medium,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  addPlayerBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(0, 229, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 229, 255, 0.25)",
  },
  playerDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginBottom: 8,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingLeft: 4,
  },
  playerNumberBg: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0, 229, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  playerNumber: {
    fontFamily: Theme.fonts.bold,
    fontSize: 12,
    color: Theme.colors.accentCyan,
  },
  playerName: {
    fontFamily: Theme.fonts.bold,
    fontSize: 14,
    color: "#FFFFFF",
    flex: 1,
  },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 77, 77, 0.08)",
  },

  // ─── Bottom Dock ───────────────────────────────────────────────
  bottomDock: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
  },
});
