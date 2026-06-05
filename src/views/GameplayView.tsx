import * as Haptics from "@/utils/haptics";
import { AlertTriangle, EyeOff, Send, Shield } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
    Dimensions,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { GlassCard } from "../components/GlassCard";
import { NeonButton } from "../components/NeonButton";
import { VoiceChatBar } from "../components/VoiceChatBar";
import { useGame } from "../context/GameContext";
import { Theme } from "../theme/Theme";
import { ResultsView } from "./ResultsView";
import { VotingView } from "./VotingView";

const { width } = Dimensions.get("window");

export const GameplayView: React.FC = () => {
  const { room, currentUser, callEmergencyMeeting, sendMessage } = useGame();

  // Local screen states
  const [isRevealing, setIsRevealing] = useState(false);
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);
  const [showComms, setShowComms] = useState(false);
  const [commsInput, setCommsInput] = useState("");

  const commsListRef = useRef<FlatList<any> | null>(null);

  // Auto scroll comms chat
  useEffect(() => {
    if (showComms && commsListRef.current && room?.messages) {
      setTimeout(() => {
        commsListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [room?.messages.length, showComms]);

  if (!room || !currentUser) return null;

  const localPlayer = room.players.find((p) => p.id === currentUser.id);
  const isImposter = localPlayer?.role === "Imposter";
  const isAlive = localPlayer?.isAlive || false;

  const handleSendComms = () => {
    if (!commsInput.trim()) return;
    sendMessage(commsInput.trim());
    setCommsInput("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Active voting phase
  if (room.gameState.phase === "Voting") {
    return <VotingView />;
  }

  // Results phase
  if (room.gameState.phase === "Results") {
    return <ResultsView />;
  }

  // DISCUSSION/EMERGENCY MEETING PHASE
  if (room.gameState.phase === "Discussion") {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={Theme.gradients.bg}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.meetingHeader}>
          <AlertTriangle
            size={48}
            color={Theme.colors.accentRed}
            style={styles.meetingIcon}
          />
          <Text style={styles.meetingTitle}>DISCUSSION PHASE</Text>
          <Text style={styles.meetingTimer}>
            Voting Starts in: {room.gameState.timerRemaining}s
          </Text>
        </View>

        <View style={styles.meetingChatDivider} />

        <FlatList
          data={room.messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.meetingChatList}
          renderItem={({ item }) => (
            <View style={styles.chatBubble}>
              {item.isSystem ? (
                <Text style={styles.systemBubbleText}>📢 {item.text}</Text>
              ) : (
                <View>
                  <Text style={styles.chatBubbleSender}>{item.senderName}</Text>
                  <Text style={styles.chatBubbleText}>{item.text}</Text>
                </View>
              )}
            </View>
          )}
        />

        {room.roomCode !== "LOCAL" && (
          <VoiceChatBar
            roomCode={room.roomCode}
            userId={currentUser.id}
            username={currentUser.username}
          />
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.meetingInputBar}>
            <TextInput
              placeholder="Discuss who is the imposter..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              style={styles.meetingInput}
              value={commsInput}
              onChangeText={setCommsInput}
              onSubmitEditing={handleSendComms}
            />
            <Pressable style={styles.meetingSendBtn} onPress={handleSendComms}>
              <Send size={16} color={Theme.colors.accentCyan} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // HOLD TO REVEAL PHASE
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Theme.gradients.bg}
        style={StyleSheet.absoluteFill}
      />

      {/* Game Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>ACTIVE MATCH</Text>
          <Text style={styles.headerTitleText}>
            {room.categoryName?.toUpperCase()}
          </Text>
        </View>

        {/* Circular Timer Clock */}
        <View style={styles.timerCircle}>
          <Text style={styles.timerText}>{room.gameState.timerRemaining}</Text>
          <Text style={styles.timerSec}>SEC</Text>
        </View>
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
                <Text style={styles.secretWordText}>
                  {room.secretWord && room.secretWord !== "Unknown"
                    ? room.secretWord
                    : "—"}
                </Text>
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
            <Shield
              size={64}
              color="rgba(255,255,255,0.2)"
              strokeWidth={1.5}
              style={{ marginBottom: 20 }}
            />
            <Text style={styles.hiddenCardTitle}>SECRET ROLE</Text>
            <Text style={styles.hiddenCardDesc}>
              Make sure no one else is looking at your screen before revealing.
            </Text>
          </GlassCard>
        )}

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
          />
          <Text
            style={[styles.revealBtnText, isRevealing && { color: "#FFFFFF" }]}
          >
            {isRevealing ? "RELEASE TO HIDE" : "HOLD TO REVEAL"}
          </Text>
        </Pressable>
      </View>

      {/* Floating Bottom action Dock */}
      <View style={styles.bottomDock}>
        <View style={styles.dockRow}>
          <Pressable
            disabled={!isAlive}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              setShowEmergencyConfirm(true);
            }}
            style={({ pressed }) => [
              styles.emergencyBtn,
              pressed && styles.emergencyBtnPressed,
              !isAlive && styles.disabledEmergency,
            ]}
          >
            <AlertTriangle
              size={18}
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.emergencyBtnText}>VOTE NOW</Text>
          </Pressable>
        </View>
      </View>

      {/* VOTE CONFIRM OVERLAY MODAL */}
      <Modal visible={showEmergencyConfirm} animationType="fade" transparent>
        <View style={styles.overlayBg}>
          <GlassCard
            style={styles.confirmCard}
            cornerRadius={24}
            borderOpacity={0.5}
            padding={24}
          >
            <AlertTriangle
              size={48}
              color={Theme.colors.accentRed}
              style={styles.confirmIcon}
            />
            <Text style={styles.confirmTitle}>CALL A VOTE?</Text>
            <Text style={styles.confirmDesc}>
              This will pause the game and force everyone to discuss and vote
              for the Imposter.
            </Text>
            <View style={styles.confirmBtnRow}>
              <NeonButton
                title="CANCEL"
                gradientColors={["#151A26", "#0C101A"]}
                onPress={() => setShowEmergencyConfirm(false)}
                style={styles.confirmBtn}
              />
              <NeonButton
                title="CONFIRM"
                gradientColors={Theme.gradients.red}
                onPress={() => {
                  setShowEmergencyConfirm(false);
                  callEmergencyMeeting();
                }}
                style={styles.confirmBtn}
              />
            </View>
          </GlassCard>
        </View>
      </Modal>
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
  timerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: Theme.colors.accentCyan,
    alignItems: "center",
    justifyContent: "center",
  },
  timerText: {
    fontSize: 16,
    fontWeight: "900",
    color: Theme.colors.accentCyan,
  },
  timerSec: {
    fontSize: 8,
    fontWeight: "bold",
    color: Theme.colors.accentCyan,
    letterSpacing: 0.5,
    marginTop: -2,
  },
  revealCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    marginTop: -40,
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
    minHeight: 380,
    justifyContent: "center",
  },
  hiddenCard: {
    width: "100%",
    alignItems: "center",
    minHeight: 380,
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
    color: "rgba(255,255,255,0.3)",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 22,
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
    marginTop: 40,
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
  bottomDock: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  dockRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  emergencyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF3B30",
    borderRadius: 16,
    height: 56,
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  emergencyBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  disabledEmergency: {
    backgroundColor: "#3b0f0b",
    shadowOpacity: 0,
    opacity: 0.4,
  },
  emergencyBtnText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  overlayBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  confirmCard: {
    width: "100%",
    alignItems: "center",
  },
  confirmIcon: {
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  confirmDesc: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  confirmBtnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  confirmBtn: {
    flex: 1,
    marginHorizontal: 6,
  },
  meetingHeader: {
    alignItems: "center",
    paddingTop: 80,
    paddingBottom: 20,
  },
  meetingIcon: {
    marginBottom: 12,
  },
  meetingTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: Theme.colors.accentRed,
    letterSpacing: 2,
    marginBottom: 8,
  },
  meetingTimer: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  meetingChatDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    width: "100%",
  },
  meetingChatList: {
    padding: 24,
    paddingBottom: 40,
  },
  chatBubble: {
    marginBottom: 16,
  },
  systemBubbleText: {
    fontSize: 12,
    fontWeight: "bold",
    color: Theme.colors.accentGold,
    textAlign: "center",
    marginVertical: 8,
  },
  chatBubbleSender: {
    fontSize: 11,
    fontWeight: "bold",
    color: Theme.colors.textSecondary,
    marginBottom: 4,
  },
  chatBubbleText: {
    fontSize: 14,
    color: "#FFFFFF",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 12,
    borderRadius: 12,
    overflow: "hidden",
    lineHeight: 20,
  },
  meetingInputBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingBottom: 40,
    backgroundColor: Theme.colors.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  meetingInput: {
    flex: 1,
    height: 48,
    backgroundColor: Theme.colors.surfaceDark,
    borderRadius: 24,
    paddingHorizontal: 20,
    color: "#FFFFFF",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  meetingSendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 229, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
});
