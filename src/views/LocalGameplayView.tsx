import * as Haptics from "@/utils/haptics";
import {
    AlertTriangle,
    ChevronRight,
    Clock,
    EyeOff,
    Hand,
    Shield,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { GlassCard } from "../components/GlassCard";
import { NeonButton } from "../components/NeonButton";
import { useGame } from "../context/GameContext";
import { Theme } from "../theme/Theme";

const { width } = Dimensions.get("window");

export const LocalGameplayView: React.FC = () => {
  const { room, setScreen, disconnectRoom } = useGame();

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false);
  const [allRevealed, setAllRevealed] = useState(false);

  // Timer States
  const votingDuration = room?.settings?.votingTime || 60;
  const [timeLeft, setTimeLeft] = useState(votingDuration);
  const [timerFinished, setTimerFinished] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (allRevealed && !timerFinished) {
      setTimeLeft(votingDuration);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setTimerFinished(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [allRevealed, votingDuration]);

  if (!room) return null;

  const currentPlayer = room.players[currentPlayerIndex];
  const isImposter = currentPlayer?.role === "Imposter";

  const handleNextPlayer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentPlayerIndex < room.players.length - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
    } else {
      setAllRevealed(true);
    }
  };

  const handleEndGame = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    disconnectRoom();
  };

  if (allRevealed) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={Theme.gradients.bg}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.header}>
          <View>
            <Text style={styles.headerLabel}>ACTIVE MATCH</Text>
            <Text style={styles.headerTitleText}>
              {room.categoryName?.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.revealCenter}>
          {!timerFinished ? (
            <GlassCard
              cornerRadius={30}
              borderOpacity={0.2}
              padding={30}
              style={{ alignItems: "center", width: "100%" }}
            >
              <Clock
                size={64}
                color={Theme.colors.accentCyan}
                style={{ marginBottom: 20 }}
              />
              <Text
                style={[
                  styles.hiddenCardTitle,
                  { color: Theme.colors.accentCyan },
                ]}
              >
                DISCUSS PHASE
              </Text>

              <View style={styles.timerCircle}>
                <Text style={styles.timerText}>{timeLeft}</Text>
                <Text style={styles.timerSub}>seconds left</Text>
              </View>

              <Text style={styles.hiddenCardDesc}>
                All roles have been revealed!
                {"\n\n"}
                Discuss and ask each other questions about the secret word.
                {"\n\n"}
                Voting will begin automatically when the timer reaches zero.
              </Text>
            </GlassCard>
          ) : (
            <GlassCard
              cornerRadius={30}
              borderOpacity={0.25}
              padding={30}
              style={{
                alignItems: "center",
                width: "100%",
                borderColor: Theme.colors.accentRed,
                borderWidth: 1,
              }}
            >
              <AlertTriangle
                size={64}
                color={Theme.colors.accentRed}
                style={{ marginBottom: 20 }}
              />
              <Text
                style={[
                  styles.hiddenCardTitle,
                  { color: Theme.colors.accentRed },
                ]}
              >
                VOTING TIME
              </Text>
              <Text style={styles.hiddenCardDesc}>
                Timer has ended!
                {"\n\n"}
                It is now time to accuse, vote, and reveal who the Imposter is!
                {"\n\n"}
                Tap the button below to end the game and see who was selected.
              </Text>
            </GlassCard>
          )}

          <NeonButton
            title="END GAME & REVEAL IMPOSTER"
            gradientColors={
              timerFinished ? Theme.gradients.red : ["#202738", "#151A26"]
            }
            onPress={handleEndGame}
            style={{ width: "100%", marginTop: 40 }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Theme.gradients.bg}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>PASS & PLAY</Text>
          <Text style={styles.headerTitleText}>
            {room.categoryName?.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.progressText}>
          {currentPlayerIndex + 1} / {room.players.length}
        </Text>
      </View>

      <View style={styles.revealCenter}>
        {/* Background Glowing Orb based on state */}
        <View
          style={[
            styles.roleRevealOrb,
            {
              backgroundColor: isRevealing
                ? isImposter
                  ? Theme.colors.accentRed
                  : Theme.colors.accentCyan
                : "rgba(255,255,255,0.05)",
            },
          ]}
        />

        {/* Top/Center Card Content */}
        <View style={styles.cardWrapper}>
          {isRevealing ? (
            <GlassCard
              style={styles.revealCard}
              cornerRadius={30}
              borderOpacity={0.6}
              padding={24}
            >
              {isImposter ? (
                <View style={{ alignItems: "center", width: "100%" }}>
                  <LinearGradient
                    colors={Theme.gradients.red}
                    style={styles.revealIconBg}
                  >
                    <EyeOff size={64} color="#FFFFFF" strokeWidth={1.5} />
                  </LinearGradient>
                  <Text
                    style={[
                      styles.revealRoleText,
                      { color: Theme.colors.accentRed, fontSize: 36 },
                    ]}
                  >
                    IMPOSTER
                  </Text>
                  <Text style={styles.imposterWarningText}>
                    Do not let them know you are the imposter!
                  </Text>

                  <View style={styles.imposterDetailsBox}>
                    <Text style={styles.imposterDetailsLabel}>CATEGORY</Text>
                    <Text style={styles.imposterDetailsValue}>
                      {room.categoryName}
                    </Text>

                    {room.settings?.showHints !== false && (
                      <>
                        <View style={styles.divider} />
                        <Text style={styles.imposterDetailsLabel}>HINT</Text>
                        <Text style={styles.imposterDetailsValue}>
                          "{room.hint}"
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              ) : (
                <View style={{ alignItems: "center", width: "100%" }}>
                  <LinearGradient
                    colors={Theme.gradients.cyan}
                    style={styles.revealIconBg}
                  >
                    <Shield size={64} color="#FFFFFF" strokeWidth={1.5} />
                  </LinearGradient>
                  <Text
                    style={[
                      styles.revealRoleText,
                      { color: Theme.colors.accentCyan },
                    ]}
                  >
                    YOUR WORD
                  </Text>
                  <Text style={styles.secretWordText}>{room.secretWord}</Text>
                </View>
              )}
            </GlassCard>
          ) : (
            <GlassCard
              style={styles.hiddenCard}
              cornerRadius={30}
              borderOpacity={0.2}
              padding={30}
            >
              <Hand
                size={64}
                color={Theme.colors.accentGold}
                strokeWidth={1.5}
                style={{ marginBottom: 20 }}
              />
              <Text
                style={[
                  styles.hiddenCardTitle,
                  { color: Theme.colors.accentGold },
                ]}
              >
                PASS DEVICE
              </Text>
              <Text style={styles.hiddenCardDesc}>
                Please pass the device to:
              </Text>
              <Text style={styles.passToName}>{currentPlayer.username}</Text>
              <Text
                style={[styles.hiddenCardDesc, { marginTop: 24, fontSize: 12 }]}
              >
                Make sure no one else is looking before you reveal your role.
              </Text>
            </GlassCard>
          )}
        </View>

        {/* Bottom Button Actions Wrapper */}
        <View style={styles.actionsWrapper}>
          {/* Hold to Reveal Interaction */}
          <Pressable
            onPressIn={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              setIsRevealing(true);
            }}
            onPressOut={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsRevealing(false);
            }}
            style={({ pressed }) => [
              styles.revealBtnContainer,
              pressed && styles.revealBtnPressed,
            ]}
          >
            <LinearGradient
              colors={
                isRevealing
                  ? isImposter
                    ? Theme.gradients.red
                    : Theme.gradients.cyan
                  : ["#202738", "#151A26"]
              }
              style={styles.revealBtnBg}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text
                style={[
                  styles.revealBtnText,
                  isRevealing && { color: "#FFFFFF" },
                ]}
              >
                {isRevealing ? "RELEASE TO HIDE" : "HOLD TO REVEAL"}
              </Text>
            </LinearGradient>
          </Pressable>

          {/* Next Player Button - Only shows when not revealing */}
          {!isRevealing ? (
            <Pressable onPress={handleNextPlayer} style={styles.nextPlayerBtn}>
              <Text style={styles.nextPlayerText}>
                {currentPlayerIndex < room.players.length - 1
                  ? "NEXT PLAYER"
                  : "FINISH REVEALS"}
              </Text>
              <ChevronRight size={16} color={Theme.colors.accentCyan} />
            </Pressable>
          ) : (
            <View style={styles.nextPlayerBtnPlaceholder} />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginTop: 60,
    marginBottom: 12,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: Theme.colors.textMuted,
    letterSpacing: 2,
  },
  headerTitleText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1,
    marginTop: 4,
  },
  progressText: {
    fontSize: 18,
    fontWeight: "900",
    color: Theme.colors.accentCyan,
  },
  revealCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 30,
    marginTop: 0,
    paddingTop: 10,
    paddingBottom: 30,
  },
  cardWrapper: {
    width: "100%",
    flex: 1,
    justifyContent: "center",
  },
  actionsWrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  nextPlayerBtnPlaceholder: {
    height: 44,
  },
  roleRevealOrb: {
    position: "absolute",
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: (width * 1.2) / 2,
    opacity: 0.2,
  },
  revealCard: {
    width: "100%",
    alignItems: "center",
    minHeight: 280,
    justifyContent: "center",
  },
  hiddenCard: {
    width: "100%",
    alignItems: "center",
    minHeight: 280,
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  hiddenCardTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 2,
    marginBottom: 16,
  },
  hiddenCardDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    paddingHorizontal: 10,
    lineHeight: 22,
  },
  passToName: {
    fontSize: 36,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 16,
    textAlign: "center",
  },
  revealIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  revealRoleText: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 16,
  },
  secretWordText: {
    fontSize: 42,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1,
    textAlign: "center",
  },
  imposterWarningText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  imposterDetailsBox: {
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  imposterDetailsLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: Theme.colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  imposterDetailsValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
  },
  divider: {
    width: "80%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 12,
  },
  revealBtnContainer: {
    width: "100%",
    height: 64,
    borderRadius: 32,
    marginTop: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  revealBtnPressed: {
    transform: [{ scale: 0.96 }],
  },
  revealBtnBg: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 32,
  },
  revealBtnText: {
    fontSize: 16,
    fontWeight: "900",
    color: Theme.colors.textSecondary,
    letterSpacing: 2,
  },
  nextPlayerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    padding: 12,
  },
  nextPlayerText: {
    fontSize: 14,
    fontWeight: "bold",
    color: Theme.colors.accentCyan,
    marginRight: 8,
    letterSpacing: 1,
  },
  timerCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: Theme.colors.accentCyan,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24,
    backgroundColor: "rgba(0, 229, 255, 0.04)",
    shadowColor: Theme.colors.accentCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  timerText: {
    fontSize: 48,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  timerSub: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 2,
  },
});
