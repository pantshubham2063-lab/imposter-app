import * as Haptics from "@/utils/haptics";
import {
    ArrowLeft,
    Clock,
    EyeOff,
    Lightbulb,
    Star,
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

export const MultiplayerSetupView: React.FC = () => {
  const { setScreen, createRoom } = useGame();

  const [imposterCountText, setImposterCountText] = useState("1");
  const [maxPlayersText, setMaxPlayersText] = useState("8");
  const [votingTimeText, setVotingTimeText] = useState("60");
  const [showHints, setShowHints] = useState(true);
  const [difficulty, setDifficulty] = useState("easy");

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
        if (data.length > 0) setSelectedCategory(data[0]._id);
      }
    } catch (e) {
      console.warn("Failed to fetch categories", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    const impCount = parseInt(imposterCountText) || 1;
    const maxPlayers = parseInt(maxPlayersText) || 8;
    const votingTime = parseInt(votingTimeText) || 60;
    if (!selectedCategory) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsStarting(true);
    const categoryObj = categories.find((c) => c._id === selectedCategory);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    await createRoom(
      {
        maxPlayers,
        imposterCount: impCount,
        discussionTime: votingTime,
        votingTime: votingTime,
        showHints,
      },
      categoryObj,
    );
    setIsStarting(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Theme.gradients.bg}
        style={StyleSheet.absoluteFill}
      />
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
          <Text style={styles.headerTitle}>CREATE GROUP</Text>
          <Text style={styles.headerSubtitle}>MULTIPLAYER MATCH</Text>
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
          {/* Info Banner */}
          <GlassCard
            cornerRadius={16}
            borderOpacity={0.3}
            padding={16}
            style={{ marginBottom: 24 }}
          >
            <Text style={styles.infoBannerText}>
              🌐 Share the room code from the lobby with your friends so they
              can join!
            </Text>
          </GlassCard>

          {/* Game Settings */}
          <Text style={styles.sectionTitle}>GAME SETTINGS</Text>
          <GlassCard
            cornerRadius={20}
            borderOpacity={0.25}
            padding={20}
            style={{ marginBottom: 24 }}
          >
            {/* Imposters */}
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

            {/* Max Players */}
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
                  <Text style={styles.settingLabel}>MAX PLAYERS</Text>
                  <Text style={styles.settingHint}>Teammates limit</Text>
                </View>
              </View>
              <TextInput
                style={styles.settingInput}
                keyboardType="number-pad"
                maxLength={2}
                value={maxPlayersText}
                onChangeText={setMaxPlayersText}
                selectTextOnFocus
              />
            </View>

            <View style={styles.settingDivider} />

            {/* Voting / Discussion Time */}
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
                  <Text style={styles.settingLabel}>DISCUSS TIME</Text>
                  <Text style={styles.settingHint}>Seconds to discuss</Text>
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

            <View style={styles.settingDivider} />

            {/* Show Hints Toggle */}
            <Pressable
              style={styles.settingRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowHints(!showHints);
              }}
            >
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.settingIconBg,
                    {
                      backgroundColor: showHints
                        ? "rgba(16, 185, 129, 0.12)"
                        : "rgba(255,255,255,0.06)",
                    },
                  ]}
                >
                  <Lightbulb
                    size={18}
                    color={
                      showHints
                        ? Theme.colors.accentGreen
                        : Theme.colors.textMuted
                    }
                  />
                </View>
                <View>
                  <Text style={styles.settingLabel}>SHOW IMPOSTER HINTS</Text>
                  <Text style={styles.settingHint}>
                    {showHints
                      ? "Imposter gets category hints"
                      : "No clues for Imposter"}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.toggleSwitch,
                  showHints && styles.toggleSwitchActive,
                ]}
              >
                <View
                  style={[
                    styles.toggleKnob,
                    showHints && styles.toggleKnobActive,
                  ]}
                />
              </View>
            </Pressable>
          </GlassCard>

          {/* Difficulty */}
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

          {/* Category */}
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
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Start Button */}
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
          title={isStarting ? "CREATING GROUP..." : "CREATE GROUP & GET CODE"}
          gradientColors={
            selectedCategory ? Theme.gradients.cyan : ["#151A26", "#0C101A"]
          }
          onPress={handleCreateGroup}
          disabled={!selectedCategory || isStarting}
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
  headerCenter: { alignItems: "center", justifyContent: "center" },
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
  infoBannerText: {
    fontFamily: Theme.fonts.medium,
    fontSize: 13,
    color: Theme.colors.accentCyan,
    textAlign: "center",
    lineHeight: 20,
  },
  sectionTitle: {
    fontFamily: Theme.fonts.bold,
    fontSize: 11,
    color: Theme.colors.textMuted,
    letterSpacing: 2,
    marginBottom: 14,
    marginTop: 4,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
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
  settingInputRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  settingUnit: {
    fontFamily: Theme.fonts.medium,
    fontSize: 12,
    color: Theme.colors.textMuted,
  },
  settingDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginVertical: 14,
  },
  difficultyRow: { flexDirection: "row", marginBottom: 28, gap: 10 },
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
  bottomDock: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 2,
  },
  toggleSwitchActive: {
    backgroundColor: Theme.colors.accentGreen,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
  },
});
