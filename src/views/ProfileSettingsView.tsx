import * as Haptics from "@/utils/haptics";
import {
    ArrowLeft,
    Coins,
    Gamepad2,
    Star,
    TrendingUp,
    User as UserIcon
} from "lucide-react-native";
import React from "react";
import {
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
import { useGame } from "../context/GameContext";
import { Theme } from "../theme/Theme";

const { width } = Dimensions.get("window");

export const ProfileSettingsView: React.FC = () => {
  const { currentUser, signOut, setScreen } = useGame();

  if (!currentUser) return null;

  const winRate =
    currentUser.gamesPlayed > 0
      ? Math.round((currentUser.wins / currentUser.gamesPlayed) * 100)
      : 0;

  const xpProgress = currentUser.xp / (currentUser.level * 1000);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Theme.gradients.bg}
        style={StyleSheet.absoluteFill}
      />

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
        <Text style={styles.headerTitle}>AGENT PROFILE</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar and Name Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarRing}>
            <LinearGradient
              colors={Theme.gradients.cyan}
              style={styles.avatarGradient}
            >
              <UserIcon size={40} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <Text style={styles.username}>
            {currentUser.username.toUpperCase()}
          </Text>
          <Text style={styles.email}>{currentUser.email}</Text>

          {/* Level Badge */}
          <View style={styles.levelBadge}>
            <Star
              size={12}
              color={Theme.colors.accentGold}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.levelText}>LEVEL {currentUser.level}</Text>
          </View>
        </View>

        {/* XP Progress */}
        <GlassCard
          style={styles.xpCard}
          cornerRadius={18}
          borderOpacity={0.3}
          padding={16}
        >
          <View style={styles.xpHeaderRow}>
            <Text style={styles.xpLabel}>EXPERIENCE POINTS</Text>
            <Text style={styles.xpAmount}>
              {currentUser.xp} / {currentUser.level * 1000}
            </Text>
          </View>
          <View style={styles.xpBarBg}>
            <LinearGradient
              colors={[Theme.colors.accentCyan, Theme.colors.accentGold]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.xpBarFill,
                { width: (width - 96) * Math.min(xpProgress, 1) },
              ]}
            />
          </View>
        </GlassCard>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <GlassCard
            style={styles.statItem}
            cornerRadius={14}
            borderOpacity={0.2}
            padding={14}
          >
            <Gamepad2
              size={18}
              color={Theme.colors.accentCyan}
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.statVal}>{currentUser.gamesPlayed}</Text>
            <Text style={styles.statLabel}>GAMES</Text>
          </GlassCard>

          <GlassCard
            style={styles.statItem}
            cornerRadius={14}
            borderOpacity={0.2}
            padding={14}
          >
            <TrendingUp
              size={18}
              color={Theme.colors.accentGreen}
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.statVal}>{winRate}%</Text>
            <Text style={styles.statLabel}>WIN RATE</Text>
          </GlassCard>

          <GlassCard
            style={styles.statItem}
            cornerRadius={14}
            borderOpacity={0.2}
            padding={14}
          >
            <Coins
              size={18}
              color={Theme.colors.accentGold}
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.statVal}>{currentUser.coins}</Text>
            <Text style={styles.statLabel}>COINS</Text>
          </GlassCard>
        </View>

        {/* Win/Loss Breakdown */}
        <GlassCard
          style={styles.breakdownCard}
          cornerRadius={16}
          borderOpacity={0.2}
          padding={16}
        >
          <Text style={styles.breakdownTitle}>MISSION RECORD</Text>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <Text
                style={[
                  styles.breakdownVal,
                  { color: Theme.colors.accentGreen },
                ]}
              >
                {currentUser.wins}
              </Text>
              <Text style={styles.breakdownLabel}>VICTORIES</Text>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownItem}>
              <Text
                style={[styles.breakdownVal, { color: Theme.colors.accentRed }]}
              >
                {currentUser.losses}
              </Text>
              <Text style={styles.breakdownLabel}>DEFEATS</Text>
            </View>
          </View>
        </GlassCard>

        {/* Sign Out */}
        <NeonButton
          title="SIGN OUT"
          gradientColors={Theme.gradients.red}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            signOut();
          }}
          hapticStyle="warning"
          style={styles.signOutBtn}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginTop: 60,
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Theme.colors.surfaceDark,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1.5,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 80,
    alignItems: "center",
  },
  avatarSection: { alignItems: "center", marginBottom: 28 },
  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2.5,
    borderColor: Theme.colors.accentCyan,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: Theme.colors.accentCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  username: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  email: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 4,
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.12)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 12,
  },
  levelText: {
    fontSize: 11,
    fontWeight: "900",
    color: Theme.colors.accentGold,
    letterSpacing: 1,
  },
  xpCard: { width: "100%", marginBottom: 20 },
  xpHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  xpLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: Theme.colors.textMuted,
    letterSpacing: 1.5,
  },
  xpAmount: {
    fontSize: 12,
    fontWeight: "bold",
    color: Theme.colors.accentCyan,
  },
  xpBarBg: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.surfaceDark,
    overflow: "hidden",
  },
  xpBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  statItem: { flex: 1, alignItems: "center", marginHorizontal: 4 },
  statVal: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: Theme.colors.textMuted,
    letterSpacing: 1,
  },
  breakdownCard: { width: "100%", marginBottom: 24 },
  breakdownTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: Theme.colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 14,
    textAlign: "center",
  },
  breakdownRow: { flexDirection: "row", alignItems: "center" },
  breakdownItem: { flex: 1, alignItems: "center" },
  breakdownVal: { fontSize: 28, fontWeight: "900" },
  breakdownLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: Theme.colors.textMuted,
    letterSpacing: 1,
    marginTop: 4,
  },
  breakdownDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  signOutBtn: { width: "100%" },
});
export default ProfileSettingsView;
