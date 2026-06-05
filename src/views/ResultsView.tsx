import * as Haptics from "@/utils/haptics";
import {
    Coins,
    EyeOff,
    Heart,
    HeartOff,
    Shield,
    Trophy,
    Wrench,
    XOctagon,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { GlassCard } from "../components/GlassCard";
import { NeonButton } from "../components/NeonButton";
import { useGame } from "../context/GameContext";
import { Theme } from "../theme/Theme";

const { width } = Dimensions.get("window");

export const ResultsView: React.FC = () => {
  const { room, currentUser, disconnectRoom } = useGame();

  const [showVictoryText, setShowVictoryText] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [xpBarWidth, setXpBarWidth] = useState(0);
  const glowAnim = useRef(new Animated.Value(0.6)).current;

  if (!room || !currentUser) return null;

  const localPlayer = room.players.find((p) => p.id === currentUser.id);
  const winnerRole = room.gameState.winningRole;
  const didWin = localPlayer?.role === winnerRole;
  const isImposter = localPlayer?.role === "Imposter";
  const isAlive = localPlayer?.isAlive || false;
  const xpGained = didWin ? 200 : 50;
  const coinsGained = didWin ? 100 : 20;

  useEffect(() => {
    // Pulsating glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.6,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Victory text reveal
    const t1 = setTimeout(() => {
      setShowVictoryText(true);
      Haptics.notificationAsync(
        didWin
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Error,
      );
    }, 800);

    // Stats reveal
    const t2 = setTimeout(() => {
      setShowStats(true);
    }, 1800);

    // XP bar animation
    const t3 = setTimeout(() => {
      const progress = currentUser.xp / (currentUser.level * 1000);
      setXpBarWidth(Math.min(progress, 1) * (width - 120));
    }, 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const accentColor = didWin ? Theme.colors.accentGold : Theme.colors.accentRed;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={
          didWin
            ? ["#0A0D14", "#1A1500", "#0A0D14"]
            : ["#0A0D14", "#1A0505", "#0A0D14"]
        }
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Radial Glow */}
      <Animated.View
        style={[
          styles.radialGlow,
          {
            backgroundColor: accentColor,
            opacity: Animated.multiply(glowAnim, new Animated.Value(0.15)),
          },
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Trophy / Defeat Icon */}
        <View style={styles.iconWrapper}>
          <View style={[styles.iconGlowBg, { backgroundColor: accentColor }]} />
          {didWin ? (
            <Trophy
              size={70}
              color={accentColor}
              strokeWidth={1.5}
              style={styles.iconShadow}
            />
          ) : (
            <XOctagon
              size={70}
              color={accentColor}
              strokeWidth={1.5}
              style={styles.iconShadow}
            />
          )}
        </View>

        {/* Victory / Defeat Text */}
        {showVictoryText && (
          <View style={styles.resultTextContainer}>
            <Text style={[styles.resultTitle, { color: accentColor }]}>
              {didWin ? "VICTORY" : "DEFEAT"}
            </Text>
            <Text style={styles.resultSubtitle}>
              {winnerRole === "Imposter"
                ? "IMPOSTERS TAKE OVER"
                : "CREWMATES PREVAIL"}
            </Text>

            <View style={styles.roleRow}>
              {isImposter ? (
                <EyeOff
                  size={14}
                  color={Theme.colors.accentRed}
                  style={{ marginRight: 6 }}
                />
              ) : (
                <Shield
                  size={14}
                  color={Theme.colors.accentCyan}
                  style={{ marginRight: 6 }}
                />
              )}
              <Text style={styles.roleLabel}>
                You were: {isImposter ? "Imposter" : "Crewmate"}
              </Text>
            </View>
          </View>
        )}

        {/* Match Stats */}
        {showStats && (
          <View style={styles.statsSection}>
            {/* XP Progress Card */}
            <GlassCard
              style={styles.xpCard}
              cornerRadius={20}
              borderOpacity={0.4}
              padding={20}
            >
              <View style={styles.xpHeader}>
                <Text style={styles.xpLabel}>XP GAINED</Text>
                <Text style={styles.xpValue}>+{xpGained}</Text>
              </View>

              {/* XP Bar */}
              <View style={styles.xpBarBg}>
                <LinearGradient
                  colors={[Theme.colors.accentCyan, Theme.colors.accentGold]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.xpBarFill, { width: xpBarWidth }]}
                />
              </View>

              <View style={styles.xpLevelRow}>
                <Text style={styles.xpLevelCurrent}>
                  LVL {currentUser.level}
                </Text>
                <Text style={styles.xpLevelNext}>
                  LVL {currentUser.level + 1}
                </Text>
              </View>
            </GlassCard>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <GlassCard
                style={styles.statPill}
                cornerRadius={14}
                borderOpacity={0.2}
                padding={12}
              >
                <Wrench
                  size={16}
                  color={Theme.colors.accentCyan}
                  style={{ marginBottom: 8 }}
                />
                <Text style={styles.statPillVal}>4/4</Text>
                <Text style={styles.statPillLabel}>TASKS</Text>
              </GlassCard>

              <GlassCard
                style={styles.statPill}
                cornerRadius={14}
                borderOpacity={0.2}
                padding={12}
              >
                <Coins
                  size={16}
                  color={Theme.colors.accentGold}
                  style={{ marginBottom: 8 }}
                />
                <Text style={styles.statPillVal}>+{coinsGained}</Text>
                <Text style={styles.statPillLabel}>COINS</Text>
              </GlassCard>

              <GlassCard
                style={styles.statPill}
                cornerRadius={14}
                borderOpacity={0.2}
                padding={12}
              >
                {isAlive ? (
                  <Heart
                    size={16}
                    color={Theme.colors.accentGreen}
                    style={{ marginBottom: 8 }}
                  />
                ) : (
                  <HeartOff
                    size={16}
                    color={Theme.colors.accentRed}
                    style={{ marginBottom: 8 }}
                  />
                )}
                <Text style={styles.statPillVal}>
                  {isAlive ? "ALIVE" : "DEAD"}
                </Text>
                <Text style={styles.statPillLabel}>STATUS</Text>
              </GlassCard>
            </View>

            {/* Action Buttons */}
            <NeonButton
              title="PLAY AGAIN"
              gradientColors={Theme.gradients.cyan}
              onPress={disconnectRoom}
              hapticStyle="success"
              style={styles.actionBtn}
            />

            <NeonButton
              title="RETURN TO BASE"
              gradientColors={["#151A26", "#0C101A"]}
              onPress={disconnectRoom}
              style={styles.actionBtn}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  radialGlow: {
    position: "absolute",
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: (width * 1.5) / 2,
    top: "10%",
    left: "-25%",
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: 80,
  },
  iconWrapper: {
    marginTop: 80,
    marginBottom: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  iconGlowBg: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.12,
  },
  iconShadow: {
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  resultTextContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  resultTitle: {
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: 6,
  },
  resultSubtitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: Theme.colors.textMuted,
    letterSpacing: 2,
    marginTop: 8,
  },
  roleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "rgba(255,255,255,0.7)",
  },
  statsSection: {
    width: "100%",
    paddingHorizontal: 24,
  },
  xpCard: {
    marginBottom: 16,
  },
  xpHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  xpLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: Theme.colors.textMuted,
    letterSpacing: 1.5,
  },
  xpValue: {
    fontSize: 22,
    fontWeight: "900",
    color: Theme.colors.accentGold,
  },
  xpBarBg: {
    width: "100%",
    height: 10,
    borderRadius: 5,
    backgroundColor: Theme.colors.surfaceDark,
    overflow: "hidden",
    marginBottom: 10,
  },
  xpBarFill: {
    height: "100%",
    borderRadius: 5,
    shadowColor: Theme.colors.accentGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  xpLevelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  xpLevelCurrent: {
    fontSize: 11,
    fontWeight: "bold",
    color: Theme.colors.accentCyan,
    letterSpacing: 1,
  },
  xpLevelNext: {
    fontSize: 11,
    fontWeight: "bold",
    color: Theme.colors.textMuted,
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statPill: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 4,
  },
  statPillVal: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statPillLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: Theme.colors.textMuted,
    letterSpacing: 1,
  },
  actionBtn: {
    marginBottom: 12,
  },
});
export default ResultsView;
