import * as Haptics from "@/utils/haptics";
import {
    ArrowRightCircle,
    ChevronRight,
    Coins,
    Gamepad,
    PlusCircle,
    Star,
    TrendingUp,
    User as UserIcon,
} from "lucide-react-native";
import React, { useState } from "react";
import {
    Dimensions,
    Modal,
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
import { useGame } from "../context/GameContext";
import { Theme } from "../theme/Theme";

const { width } = Dimensions.get("window");

// Mock list of active online friends
const onlineFriends = [
  { id: "f1", username: "NovaGamer", level: 16 },
  { id: "f2", username: "HelixCoder", level: 8 },
  { id: "f3", username: "AstroFlyer", level: 12 },
];

// Mock list of recent matches
const recentMissions = [
  {
    id: "m1",
    role: "Crewmate",
    result: "Victory",
    xpGained: 200,
    date: "10m ago",
  },
  {
    id: "m2",
    role: "Imposter",
    result: "Defeat",
    xpGained: 50,
    date: "1h ago",
  },
  {
    id: "m3",
    role: "Crewmate",
    result: "Victory",
    xpGained: 200,
    date: "1d ago",
  },
];

export const HomeView: React.FC = () => {
  const { currentUser, joinRoom, setScreen } = useGame();

  // Sheet states
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Form values
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleJoinRoom = async () => {
    setJoinError(null);
    if (joinCode.trim().length !== 6) {
      setJoinError("Room code must be exactly 6 characters.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await joinRoom(joinCode.toUpperCase());
      setShowJoinModal(false);
      setJoinCode("");
    } catch (err: any) {
      if (err?.message === "CODE_NOT_FOUND") {
        setJoinError("❌ Code not found. Check the code and try again.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        setJoinError("Something went wrong. Please try again.");
      }
    }
  };

  if (!currentUser) return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Theme.gradients.bg}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <View>
            <Text style={styles.headerWelcome}>WELCOME BACK</Text>
            <Text style={styles.headerUsername}>
              {currentUser.username.toUpperCase()}
            </Text>
          </View>

          <Pressable
            style={styles.profileBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setScreen("profile");
            }}
          >
            <UserIcon size={20} color={Theme.colors.accentCyan} />
          </Pressable>
        </View>

        {/* Stats Grid Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsScroll}
        >
          {/* Level Stat Card */}
          <GlassCard
            style={styles.statCard}
            cornerRadius={16}
            borderOpacity={0.25}
          >
            <Star
              size={16}
              color={Theme.colors.accentGold}
              style={{ marginBottom: 10 }}
            />
            <Text style={styles.statVal}>{currentUser.level}</Text>
            <Text style={styles.statTitle}>LEVEL</Text>
          </GlassCard>

          {/* Win Rate Stat Card */}
          <GlassCard
            style={styles.statCard}
            cornerRadius={16}
            borderOpacity={0.25}
          >
            <TrendingUp
              size={16}
              color={Theme.colors.accentGreen}
              style={{ marginBottom: 10 }}
            />
            <Text style={styles.statVal}>
              {currentUser.gamesPlayed > 0
                ? `${Math.round((currentUser.wins / currentUser.gamesPlayed) * 100)}%`
                : "0%"}
            </Text>
            <Text style={styles.statTitle}>WIN RATE</Text>
          </GlassCard>

          {/* Matches Stat Card */}
          <GlassCard
            style={styles.statCard}
            cornerRadius={16}
            borderOpacity={0.25}
          >
            <Gamepad
              size={16}
              color={Theme.colors.accentCyan}
              style={{ marginBottom: 10 }}
            />
            <Text style={styles.statVal}>{currentUser.gamesPlayed}</Text>
            <Text style={styles.statTitle}>MATCHES</Text>
          </GlassCard>

          {/* Coins Stat Card */}
          <GlassCard
            style={styles.statCard}
            cornerRadius={16}
            borderOpacity={0.25}
          >
            <Coins
              size={16}
              color={Theme.colors.accentGold}
              style={{ marginBottom: 10 }}
            />
            <Text style={styles.statVal}>{currentUser.coins}</Text>
            <Text style={styles.statTitle}>COINS</Text>
          </GlassCard>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Create Room */}
          <Pressable
            style={({ pressed }) => [
              styles.actionCard,
              pressed && styles.actionPressed,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setScreen("localSetup");
            }}
          >
            <PlusCircle
              size={32}
              color={Theme.colors.accentCyan}
              style={styles.actionIcon}
            />
            <Text style={styles.actionText}>LOCAL{"\n"}GAME</Text>
          </Pressable>

          {/* Multiplayer */}
          <Pressable
            style={({ pressed }) => [
              styles.actionCard,
              pressed && styles.actionPressed,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowJoinModal(true);
              setJoinCode("");
              setJoinError(null);
            }}
          >
            <ArrowRightCircle
              size={32}
              color={Theme.colors.accentGold}
              style={styles.actionIcon}
            />
            <Text style={styles.actionText}>MULTIPLAYER</Text>
          </Pressable>
        </View>

        {/* Friends Online Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ONLINE AGENTS</Text>
          <View style={styles.greenDotRow}>
            <View style={styles.greenDot} />
            <Text style={styles.greenDotText}>{onlineFriends.length}</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.friendsScroll}
        >
          {onlineFriends.map((friend) => (
            <View key={friend.id} style={styles.friendBubble}>
              <View style={styles.avatarCircle}>
                <UserIcon size={22} color={Theme.colors.accentCyan} />
                <View style={styles.activeDot} />
              </View>
              <Text style={styles.friendName}>{friend.username}</Text>
              <Text style={styles.friendLvl}>LVL {friend.level}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Recent Matches */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RECENT MISSIONS</Text>
        </View>

        <View style={styles.missionsContainer}>
          {recentMissions.map((match) => (
            <GlassCard
              key={match.id}
              style={styles.missionCard}
              cornerRadius={14}
              borderOpacity={0.15}
              padding={12}
            >
              <View style={styles.missionRow}>
                {/* Role Icon */}
                <View
                  style={[
                    styles.roleIconBg,
                    {
                      backgroundColor:
                        match.role === "Imposter"
                          ? "rgba(255, 77, 77, 0.12)"
                          : "rgba(0, 229, 255, 0.12)",
                    },
                  ]}
                >
                  <Star
                    size={18}
                    color={
                      match.role === "Imposter"
                        ? Theme.colors.accentRed
                        : Theme.colors.accentCyan
                    }
                  />
                </View>

                {/* Role Label */}
                <View style={styles.missionInfo}>
                  <Text style={styles.roleLabel}>
                    {match.role.toUpperCase()}
                  </Text>
                  <Text style={styles.missionDate}>{match.date}</Text>
                </View>

                {/* Outcome */}
                <View style={styles.outcomeCol}>
                  <Text
                    style={[
                      styles.outcomeResult,
                      {
                        color:
                          match.result === "Victory"
                            ? Theme.colors.accentGreen
                            : Theme.colors.accentRed,
                      },
                    ]}
                  >
                    {match.result}
                  </Text>
                  <Text style={styles.outcomeXp}>+{match.xpGained} XP</Text>
                </View>
              </View>
            </GlassCard>
          ))}
        </View>
      </ScrollView>

      {/* MULTIPLAYER MODAL */}
      <Modal visible={showJoinModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <LinearGradient
            colors={["#0C101A", "#0F1520", "#08111E"]}
            style={styles.modalContent}
          >
            {/* Handle Bar */}
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>MULTIPLAYER</Text>
              <Pressable
                onPress={() => {
                  setShowJoinModal(false);
                  setJoinCode("");
                  setJoinError(null);
                }}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.closeBtn}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.joinText}>
              Create a group and share the code with friends, or enter a code to
              join an existing group.
            </Text>

            {/* CREATE GROUP */}
            <Pressable
              style={({ pressed }) => [
                styles.mpOptionCard,
                {
                  borderColor: "rgba(0,229,255,0.3)",
                  backgroundColor: pressed
                    ? "rgba(0,229,255,0.08)"
                    : "rgba(0,229,255,0.04)",
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowJoinModal(false);
                setJoinCode("");
                setJoinError(null);
                setScreen("multiplayerSetup");
              }}
            >
              <View
                style={[
                  styles.mpOptionIcon,
                  { backgroundColor: "rgba(0,229,255,0.1)" },
                ]}
              >
                <PlusCircle size={28} color={Theme.colors.accentCyan} />
              </View>
              <View style={styles.mpOptionInfo}>
                <Text style={styles.mpOptionTitle}>CREATE GROUP</Text>
                <Text style={styles.mpOptionDesc}>
                  Host a room, pick a category, set rules & share your code
                </Text>
              </View>
              <ChevronRight size={18} color={Theme.colors.accentCyan} />
            </Pressable>

            {/* Divider */}
            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View>

            {/* JOIN GROUP */}
            <Text style={styles.joinGroupLabel}>JOIN AN EXISTING GROUP</Text>

            <TextInput
              placeholder="ENTER 6-CHARACTER CODE"
              placeholderTextColor="rgba(255,255,255,0.2)"
              style={[
                styles.joinCodeInput,
                joinError ? { borderColor: Theme.colors.accentRed } : {},
              ]}
              autoCapitalize="characters"
              maxLength={6}
              value={joinCode}
              onChangeText={(v) => {
                setJoinCode(v);
                setJoinError(null);
              }}
            />

            {joinError && <Text style={styles.joinErrorText}>{joinError}</Text>}

            <View style={{ marginTop: 10 }}>
              <NeonButton
                title="JOIN GROUP"
                gradientColors={
                  joinCode.trim().length === 6
                    ? Theme.gradients.gold
                    : ["#151A26", "#0C101A"]
                }
                onPress={handleJoinRoom}
                disabled={joinCode.trim().length !== 6}
              />
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginTop: 60,
    marginBottom: 24,
  },
  headerWelcome: {
    fontSize: 11,
    fontWeight: "bold",
    color: Theme.colors.textMuted,
    letterSpacing: 2,
  },
  headerUsername: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1.5,
    marginTop: 4,
  },
  profileBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(0, 229, 255, 0.4)",
  },
  statsScroll: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  statCard: {
    width: 120,
    marginRight: 12,
  },
  statVal: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: Theme.colors.textSecondary,
    letterSpacing: 1.5,
  },
  actionsContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  actionCard: {
    flex: 1,
    backgroundColor: "rgba(21, 26, 38, 0.65)",
    borderWidth: 1.5,
    borderColor: "rgba(44, 54, 77, 0.3)",
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  actionPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  actionIcon: {
    marginBottom: 10,
  },
  actionText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 14,
    letterSpacing: 0.8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: Theme.colors.textSecondary,
    letterSpacing: 1.5,
  },
  greenDotRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.accentGreen,
    marginRight: 6,
  },
  greenDotText: {
    fontSize: 12,
    fontWeight: "bold",
    color: Theme.colors.accentGreen,
  },
  friendsScroll: {
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  friendBubble: {
    alignItems: "center",
    marginRight: 16,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Theme.colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  activeDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Theme.colors.accentGreen,
    borderWidth: 2,
    borderColor: Theme.colors.bgPrimary,
  },
  friendName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "rgba(255,255,255,0.85)",
    marginBottom: 2,
  },
  friendLvl: {
    fontSize: 9,
    fontWeight: "bold",
    color: Theme.colors.textMuted,
    letterSpacing: 1.2,
  },
  missionsContainer: {
    paddingHorizontal: 24,
  },
  missionCard: {
    marginBottom: 10,
  },
  missionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  roleIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  missionInfo: {
    flex: 1,
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  missionDate: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  outcomeCol: {
    alignItems: "flex-end",
  },
  outcomeResult: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  outcomeXp: {
    fontSize: 10,
    fontWeight: "bold",
    color: Theme.colors.accentGold,
    marginTop: 2,
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    maxHeight: "85%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingTop: 12,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1.5,
  },
  closeBtn: {
    fontSize: 12,
    fontWeight: "bold",
    color: Theme.colors.textMuted,
  },
  modalIconCenter: {
    alignItems: "center",
    marginVertical: 12,
  },
  settingsCard: {
    width: "100%",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: "bold",
    color: Theme.colors.textSecondary,
    letterSpacing: 1,
  },
  settingVal: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
    marginRight: 10,
  },
  settingDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  joinText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  joinCodeInput: {
    backgroundColor: Theme.colors.surfaceDark,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(0, 229, 255, 0.4)",
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 8,
    paddingVertical: 14,
    marginVertical: 14,
  },
  joinErrorText: {
    color: Theme.colors.accentRed,
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 8,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "center",
    marginBottom: 20,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },
  mpOptionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 16,
    marginBottom: 8,
  },
  mpOptionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  mpOptionInfo: { flex: 1 },
  mpOptionTitle: {
    fontFamily: Theme.fonts.black,
    fontSize: 15,
    color: "#FFFFFF",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  mpOptionDesc: {
    fontFamily: Theme.fonts.medium,
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    lineHeight: 16,
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    gap: 10,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  orText: {
    fontFamily: Theme.fonts.bold,
    fontSize: 10,
    color: Theme.colors.textMuted,
    letterSpacing: 2,
  },
  joinGroupLabel: {
    fontFamily: Theme.fonts.bold,
    fontSize: 11,
    color: Theme.colors.accentGold,
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 12,
  },
  settingLabel: {
    fontFamily: Theme.fonts.bold,
    fontSize: 12,
    color: Theme.colors.textSecondary,
    letterSpacing: 1,
  },
});
export default HomeView;
