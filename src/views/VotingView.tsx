import * as Haptics from "@/utils/haptics";
import {
    Crown,
    LogOut,
    ShieldAlert,
    User as UserIcon,
    Vote,
} from "lucide-react-native";
import React, { useState } from "react";
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

export const VotingView: React.FC = () => {
  const { room, currentUser, castVote } = useGame();

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  if (!room || !currentUser) return null;

  const localPlayer = room.players.find((p) => p.id === currentUser.id);
  const hasVoted =
    localPlayer?.votedForId !== null && localPlayer?.votedForId !== undefined;

  const alivePlayers = room.players.filter((p) => p.isAlive);
  const votedCount = alivePlayers.filter(
    (p) => p.votedForId !== null && p.votedForId !== undefined,
  ).length;

  // Ejection Details
  const ejectedPlayerId = room.gameState.selectedPlayerToEject;
  const ejectedPlayer = room.players.find((p) => p.id === ejectedPlayerId);
  const wasImposter = room.gameState.wasEjectedPlayerImposter;

  const handleCastVote = (targetId: string | null) => {
    castVote(targetId);
  };

  // EJECTION CINEMATIC CINEMA LAYOUT
  if (ejectedPlayerId !== null && ejectedPlayerId !== undefined) {
    const isEjectedImposter = wasImposter === true;
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={Theme.gradients.bg}
          style={StyleSheet.absoluteFill}
        />

        {/* Floating space dust ambient */}
        <View style={styles.cinematicBackdrop} />

        <View style={styles.cinematicCenter}>
          <View
            style={[
              styles.cinematicIconBg,
              {
                backgroundColor: isEjectedImposter
                  ? "rgba(255, 77, 77, 0.15)"
                  : "rgba(0, 229, 255, 0.15)",
              },
            ]}
          >
            <LogOut
              size={56}
              color={
                isEjectedImposter
                  ? Theme.colors.accentRed
                  : Theme.colors.accentCyan
              }
              strokeWidth={1.5}
              style={styles.ejectedIconShadow}
            />
          </View>

          <Text style={styles.ejectedName}>
            {ejectedPlayer ? ejectedPlayer.username.toUpperCase() : "NO ONE"}
          </Text>
          <Text style={styles.ejectedDesc}>
            {ejectedPlayer
              ? "WAS EJECTED INTO THE COLD ABYSS"
              : "WAS NOT EJECTED (TIE OR SKIPPED)"}
          </Text>

          {ejectedPlayer && (
            <Text
              style={[
                styles.ejectedReveal,
                {
                  color: isEjectedImposter
                    ? Theme.colors.accentGreen
                    : Theme.colors.accentRed,
                },
              ]}
            >
              {isEjectedImposter
                ? "THEY WERE THE IMPOSTER."
                : "THEY WERE NOT THE IMPOSTER."}
            </Text>
          )}
        </View>

        {/* Space dust particles */}
        <View style={styles.particlesRow}>
          {Array.from({ length: 15 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.particle,
                {
                  opacity: Math.random() * 0.4 + 0.1,
                  width: Math.random() * 3 + 1,
                  height: Math.random() * 3 + 1,
                  marginHorizontal: Math.random() * 6 + 2,
                },
              ]}
            />
          ))}
        </View>
      </View>
    );
  }

  // STANDARD ACTIVE VOTING LAYOUT
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Theme.gradients.bg}
        style={StyleSheet.absoluteFill}
      />

      {/* Danger glow orb */}
      <View style={styles.dangerGlow} />

      {/* Header Info */}
      <View style={styles.header}>
        <Vote
          size={34}
          color={Theme.colors.accentRed}
          style={styles.meetingIcon}
        />
        <Text style={styles.title}>CAST YOUR VOTE</Text>
        <Text style={styles.timer}>
          Time Remaining: {room.gameState.timerRemaining}s
        </Text>

        {/* Progress Tracker */}
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            {votedCount}/{alivePlayers.length} VOTED
          </Text>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: 100 * (votedCount / alivePlayers.length) },
              ]}
            />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardsContainer}>
          {alivePlayers.map((player) => {
            const isMe = player.id === currentUser.id;
            const isSelected = selectedPlayerId === player.id;

            return (
              <GlassCard
                key={player.id}
                style={[
                  styles.voteCard,
                  isSelected ? styles.selectedVoteCard : null,
                ]}
                cornerRadius={16}
                borderOpacity={isSelected ? 0.8 : 0.2}
                padding={14}
              >
                <Pressable
                  disabled={hasVoted || isMe}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedPlayerId(player.id);
                  }}
                  style={styles.cardPressable}
                >
                  <View style={styles.cardLeft}>
                    <View
                      style={[
                        styles.avatarCircle,
                        {
                          borderColor: isSelected
                            ? Theme.colors.accentRed
                            : "rgba(255,255,255,0.1)",
                        },
                      ]}
                    >
                      <UserIcon
                        size={18}
                        color={isSelected ? Theme.colors.accentRed : "#FFFFFF"}
                      />
                    </View>

                    <View style={styles.infoCol}>
                      <View style={styles.nameRow}>
                        <Text style={styles.username}>{player.username}</Text>
                        {isMe && (
                          <View style={styles.meBadge}>
                            <Text style={styles.meBadgeText}>YOU</Text>
                          </View>
                        )}
                        {player.isHost && (
                          <Crown
                            size={12}
                            color={Theme.colors.accentGold}
                            style={{ marginLeft: 6 }}
                          />
                        )}
                      </View>

                      <Text
                        style={[
                          styles.statusLabel,
                          {
                            color: player.votedForId
                              ? Theme.colors.accentGreen
                              : "rgba(255,255,255,0.3)",
                          },
                        ]}
                      >
                        {player.votedForId ? "Has voted" : "Hasn't voted yet"}
                      </Text>
                    </View>
                  </View>

                  {/* Actions column */}
                  <View style={styles.actionCol}>
                    {isSelected && !hasVoted ? (
                      <Pressable
                        style={styles.ejectBtn}
                        onPress={() => handleCastVote(player.id)}
                      >
                        <Text style={styles.ejectBtnText}>EJECT</Text>
                      </Pressable>
                    ) : hasVoted && localPlayer?.votedForId === player.id ? (
                      <ShieldAlert size={22} color={Theme.colors.accentRed} />
                    ) : null}
                  </View>
                </Pressable>
              </GlassCard>
            );
          })}

          {/* Skip Vote Button */}
          {!hasVoted && (
            <NeonButton
              title="SKIP VOTE"
              gradientColors={["#151A26", "#0C101A"]}
              onPress={() => handleCastVote(null)}
              style={styles.skipBtn}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dangerGlow: {
    position: "absolute",
    width: width,
    height: 350,
    backgroundColor: "rgba(255, 77, 77, 0.05)",
    top: -150,
    left: 0,
  },
  header: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 16,
  },
  meetingIcon: {
    marginBottom: 12,
    shadowColor: Theme.colors.accentRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  timer: {
    fontSize: 13,
    fontWeight: "bold",
    color: Theme.colors.accentGold,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 24,
  },
  progressText: {
    fontSize: 11,
    fontWeight: "bold",
    color: Theme.colors.textSecondary,
    letterSpacing: 1,
    marginRight: 10,
  },
  progressBarBg: {
    width: 100,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.surfaceDark,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: Theme.colors.accentRed,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 80,
  },
  cardsContainer: {
    marginTop: 12,
  },
  voteCard: {
    marginBottom: 12,
  },
  selectedVoteCard: {
    borderColor: "rgba(255, 77, 77, 0.4)",
  },
  cardPressable: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    marginRight: 14,
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  username: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  meBadge: {
    backgroundColor: "rgba(0, 229, 255, 0.15)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  meBadgeText: {
    color: Theme.colors.accentCyan,
    fontSize: 9,
    fontWeight: "900",
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 4,
  },
  actionCol: {
    justifyContent: "center",
  },
  ejectBtn: {
    backgroundColor: Theme.colors.accentRed,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: Theme.colors.accentRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  ejectBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  skipBtn: {
    marginTop: 8,
  },
  cinematicBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.85)",
  },
  cinematicCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  cinematicIconBg: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  ejectedIconShadow: {
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  ejectedName: {
    fontSize: 30,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 2,
    textAlign: "center",
  },
  ejectedDesc: {
    fontSize: 12,
    fontWeight: "bold",
    color: Theme.colors.textMuted,
    letterSpacing: 2,
    marginTop: 6,
    textAlign: "center",
  },
  ejectedReveal: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginTop: 32,
    textAlign: "center",
  },
  particlesRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 60,
  },
  particle: {
    backgroundColor: "#FFFFFF",
    borderRadius: 2,
  },
});
export default VotingView;
