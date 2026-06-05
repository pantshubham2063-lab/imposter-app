import * as Haptics from "@/utils/haptics";
import {
    ArrowLeft,
    Coffee,
    Cpu,
    Film,
    HelpCircle,
    Leaf,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { GlassCard } from "../components/GlassCard";
import { NeonButton } from "../components/NeonButton";
import { API_BASE, useGame } from "../context/GameContext";
import { Theme } from "../theme/Theme";

const { width } = Dimensions.get("window");

// Map backend icon strings to Lucide components
const IconMap: Record<string, any> = {
  Leaf: Leaf,
  Coffee: Coffee,
  Film: Film,
  Cpu: Cpu,
  HelpCircle: HelpCircle,
};

export const CategorySelectionView: React.FC = () => {
  const { setScreen, currentUser, createRoom } = useGame();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Settings states (copied from original HomeView)
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [imposterCount, setImposterCount] = useState(1);
  const [difficulty, setDifficulty] = useState("Medium"); // new setting

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/game/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (e) {
      console.warn("Failed to fetch categories", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGame = () => {
    if (!selectedCategory) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const categoryObj = categories.find((c) => c._id === selectedCategory);

    createRoom(
      {
        maxPlayers,
        imposterCount,
        discussionTime: 120, // default
        votingTime: 30, // default
      },
      categoryObj,
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Theme.gradients.bg}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Background Accent Orb */}
      <View style={styles.glowOrb} />

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
          <Text style={styles.headerTitle}>GAME SETUP</Text>
          <Text style={styles.headerSubtitle}>HOST A NEW MATCH</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>SELECT CATEGORY</Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={Theme.colors.accentCyan}
            style={{ marginVertical: 40 }}
          />
        ) : (
          <View style={styles.categoryGrid}>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat._id;
              const IconComponent = IconMap[cat.icon] || HelpCircle;

              return (
                <Pressable
                  key={cat._id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCategory(cat._id);
                  }}
                  style={[
                    styles.categoryCardWrapper,
                    { width: (width - 48) / 2 - 8 },
                  ]}
                >
                  <GlassCard
                    style={[
                      styles.categoryCard,
                      isSelected && styles.categoryCardSelected,
                    ]}
                    cornerRadius={16}
                    borderOpacity={isSelected ? 1 : 0.2}
                    padding={16}
                  >
                    <IconComponent
                      size={28}
                      color={
                        isSelected
                          ? Theme.colors.accentCyan
                          : "rgba(255,255,255,0.7)"
                      }
                    />
                    <Text
                      style={[
                        styles.categoryName,
                        isSelected && styles.categoryNameSelected,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </GlassCard>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.divider} />

        {/* Basic Settings */}
        <Text style={styles.sectionTitle}>ROOM SETTINGS</Text>
        <GlassCard
          style={styles.settingsCard}
          cornerRadius={16}
          borderOpacity={0.2}
          padding={20}
        >
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Total Players</Text>
              <Text style={styles.settingValue}>{maxPlayers}</Text>
            </View>
            <View style={styles.stepper}>
              <Pressable
                onPress={() => setMaxPlayers(Math.max(3, maxPlayers - 1))}
                style={styles.stepperBtn}
              >
                <Text style={styles.stepperTxt}>-</Text>
              </Pressable>
              <Pressable
                onPress={() => setMaxPlayers(Math.min(12, maxPlayers + 1))}
                style={styles.stepperBtn}
              >
                <Text style={styles.stepperTxt}>+</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Imposters</Text>
              <Text style={styles.settingValue}>{imposterCount}</Text>
            </View>
            <View style={styles.stepper}>
              <Pressable
                onPress={() => setImposterCount(Math.max(1, imposterCount - 1))}
                style={styles.stepperBtn}
              >
                <Text style={styles.stepperTxt}>-</Text>
              </Pressable>
              <Pressable
                onPress={() => setImposterCount(Math.min(3, imposterCount + 1))}
                style={styles.stepperBtn}
              >
                <Text style={styles.stepperTxt}>+</Text>
              </Pressable>
            </View>
          </View>
        </GlassCard>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomDock}>
        <NeonButton
          title="CREATE GAME"
          gradientColors={
            selectedCategory ? Theme.gradients.cyan : ["#151A26", "#0C101A"]
          }
          onPress={handleCreateGame}
          disabled={!selectedCategory}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.bgPrimary },
  glowOrb: {
    position: "absolute",
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(0, 229, 255, 0.15)",
    transform: [{ scale: 2 }],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  headerCenter: { alignItems: "center" },
  headerTitle: {
    fontFamily: Theme.fonts.black,
    fontSize: 20,
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontFamily: Theme.fonts.bold,
    fontSize: 10,
    color: Theme.colors.accentCyan,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 120, paddingTop: 10 },
  sectionTitle: {
    fontFamily: Theme.fonts.bold,
    fontSize: 12,
    color: Theme.colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 16,
    marginTop: 10,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  categoryCardWrapper: {
    marginBottom: 16,
  },
  categoryCard: {
    alignItems: "center",
    justifyContent: "center",
    height: 110,
    borderColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
  },
  categoryCardSelected: {
    borderColor: Theme.colors.accentCyan,
    backgroundColor: "rgba(0, 229, 255, 0.1)",
  },
  categoryName: {
    fontFamily: Theme.fonts.bold,
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginTop: 12,
    textAlign: "center",
  },
  categoryNameSelected: {
    color: Theme.colors.accentCyan,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 10,
  },
  settingsCard: {
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  settingLabel: {
    fontFamily: Theme.fonts.medium,
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
  },
  settingValue: {
    fontFamily: Theme.fonts.bold,
    fontSize: 24,
    color: "#FFFFFF",
    marginTop: 4,
  },
  stepper: {
    flexDirection: "row",
    gap: 8,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperTxt: {
    fontFamily: Theme.fonts.medium,
    fontSize: 24,
    color: Theme.colors.accentCyan,
    marginTop: -2,
  },
  bottomDock: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 40,
    backgroundColor: Theme.colors.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
});
