import * as Haptics from "@/utils/haptics";
import {
    ArrowLeft,
    CheckCircle,
    Clock,
    Crown,
    EyeOff,
    Mic,
    Send,
    User as UserIcon,
    Users,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
    Dimensions,
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
import { VoiceChatBar } from "../components/VoiceChatBar";
import { useGame } from "../context/GameContext";
import { useVoiceChat } from "../hooks/useVoiceChat";
import { Theme } from "../theme/Theme";

const { width, height } = Dimensions.get("window");

export const LobbyView: React.FC = () => {
  const {
    room,
    currentUser,
    toggleReady,
    startGame,
    sendMessage,
    disconnectRoom,
  } = useGame();

  const [chatInput, setChatInput] = useState("");

  const chatListRef = useRef<ScrollView | null>(null);

  // Automatically scroll chat to bottom when message arrives
  useEffect(() => {
    if (chatListRef.current && room?.messages) {
      setTimeout(() => {
        chatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [room?.messages.length]);

  if (!room || !currentUser) return null;

  const localPlayer = room.players.find((p) => p.id === currentUser.id);
  const isHost = room.hostId === currentUser.id || !!localPlayer?.isHost;
  const isReady = localPlayer?.isReady || false;

  // All players (including host) must be ready before the host can start
  const allPlayersReady =
    room.players.length > 0 && room.players.every((p) => p.isReady);
  const canStart = isHost && allPlayersReady;
  const voiceEnabled = room.roomCode !== "LOCAL";
  const voice = useVoiceChat(
    room.roomCode,
    currentUser.id,
    currentUser.username,
    voiceEnabled,
  );

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    sendMessage(chatInput.trim());
    setChatInput("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

      {/* Top Navigation Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            disconnectRoom();
          }}
        >
          <ArrowLeft size={18} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>GAME LOBBY</Text>
          <Text style={styles.headerSubtitle}>
            {room.players.length}/{room.settings.maxPlayers} AGENTS
          </Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Room Code Display */}
        <GlassCard
          style={styles.codeCard}
          cornerRadius={20}
          borderOpacity={0.4}
          padding={20}
        >
          <Text style={styles.codeLabel}>ROOM CODE</Text>
          <Text style={styles.codeText}>{room.roomCode}</Text>
          <Text style={styles.codeHint}>
            Share this code with friends to join
          </Text>
        </GlassCard>

        {/* Player Grid Title */}
        <Text style={styles.sectionTitle}>CONNECTED AGENTS</Text>

        {/* Custom 2-column list of players */}
        <View style={styles.gridContainer}>
          {room.players.map((player) => (
            <GlassCard
              key={player.id}
              style={[
                styles.playerCard,
                player.isReady ? styles.playerReadyCard : null,
              ]}
              cornerRadius={16}
              borderOpacity={player.isReady ? 0.6 : 0.2}
              padding={12}
            >
              <View style={styles.playerRow}>
                <View
                  style={[
                    styles.avatarBg,
                    {
                      backgroundColor: player.isHost
                        ? "rgba(255, 215, 0, 0.15)"
                        : Theme.colors.surfaceLight,
                    },
                  ]}
                >
                  {player.isHost ? (
                    <Crown size={16} color={Theme.colors.accentGold} />
                  ) : (
                    <UserIcon size={16} color={Theme.colors.accentCyan} />
                  )}
                </View>

                <View style={styles.playerInfo}>
                  <Text style={styles.playerName} numberOfLines={1}>
                    {player.username}
                  </Text>
                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: player.isReady
                            ? Theme.colors.accentGreen
                            : Theme.colors.accentRed,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: player.isReady
                            ? Theme.colors.accentGreen
                            : Theme.colors.textMuted,
                        },
                      ]}
                    >
                      {player.isReady ? "READY" : "WAITING"}
                    </Text>
                  </View>
                </View>
              </View>
            </GlassCard>
          ))}
        </View>

        {/* Real-time Integrated Chatbox directly in the space! */}
        <Text style={styles.sectionTitle}>LOBBY SPACE DEBRIEF (CHAT)</Text>
        <GlassCard
          cornerRadius={20}
          borderOpacity={0.3}
          padding={16}
          style={{ height: 260, marginBottom: 20 }}
        >
          {/* Scrollable messages */}
          <ScrollView
            ref={chatListRef}
            contentContainerStyle={{ paddingBottom: 10 }}
            style={{ flex: 1 }}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            {room.messages.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.chatBubble,
                  item.senderId === currentUser.id && {
                    alignSelf: "flex-end",
                    backgroundColor: "rgba(0, 229, 255, 0.08)",
                  },
                ]}
              >
                {item.isSystem ? (
                  <Text style={styles.systemBubbleText}>📢 {item.text}</Text>
                ) : (
                  <View>
                    <Text
                      style={[
                        styles.chatBubbleSender,
                        item.senderId === currentUser.id && {
                          color: Theme.colors.accentGreen,
                        },
                      ]}
                    >
                      {item.senderName}
                    </Text>
                    <Text style={styles.chatBubbleText}>{item.text}</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          <View style={[styles.chatDivider, { marginVertical: 8 }]} />

          {/* Integrated input bar */}
          <View
            style={[styles.chatInputBar, { marginTop: 0, marginBottom: 0 }]}
          >
            <TextInput
              placeholder="Message this space..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              style={[styles.chatInput, { height: 38 }]}
              value={chatInput}
              onChangeText={setChatInput}
              onSubmitEditing={handleSendChat}
            />
            {voiceEnabled &&
              (voice.mode === "realtime" ? (
                <Pressable
                  onPress={voice.toggleMute}
                  style={[
                    styles.chatMicBtn,
                    { height: 38, width: 38 },
                    voice.isMuted && styles.chatMicBtnMuted,
                    !voice.isMuted && voice.isLive && styles.chatMicBtnLive,
                  ]}
                >
                  <Mic
                    size={16}
                    color={
                      voice.isMuted
                        ? Theme.colors.textMuted
                        : Theme.colors.accentGreen
                    }
                  />
                </Pressable>
              ) : (
                <Pressable
                  onPressIn={voice.startTalking}
                  onPressOut={voice.stopTalking}
                  disabled={voice.isMuted}
                  style={[
                    styles.chatMicBtn,
                    { height: 38, width: 38 },
                    voice.isRecording && styles.chatMicBtnActive,
                  ]}
                >
                  <Mic
                    size={16}
                    color={
                      voice.isMuted
                        ? Theme.colors.textMuted
                        : voice.isRecording
                          ? "#FFFFFF"
                          : Theme.colors.accentCyan
                    }
                  />
                </Pressable>
              ))}
            <Pressable
              style={[styles.chatSendBtn, { height: 38, width: 38 }]}
              onPress={handleSendChat}
            >
              <Send size={14} color={Theme.colors.accentCyan} />
            </Pressable>
          </View>
        </GlassCard>

        {/* Category Info Card */}
        {room.categoryName && (
          <GlassCard
            style={[styles.settingsSummary, { marginBottom: 16 }]}
            cornerRadius={16}
            borderOpacity={0.4}
            padding={16}
          >
            <View style={{ alignItems: "center" }}>
              <Text style={styles.pillLbl}>CATEGORY</Text>
              <Text
                style={[
                  styles.pillVal,
                  {
                    color: Theme.colors.accentGold,
                    marginTop: 4,
                    fontSize: 18,
                  },
                ]}
              >
                {room.categoryName}
              </Text>
            </View>
          </GlassCard>
        )}

        {/* Room Settings Summary Card */}
        <GlassCard
          style={styles.settingsSummary}
          cornerRadius={16}
          borderOpacity={0.2}
          padding={16}
        >
          <View style={styles.pillsRow}>
            {/* Players count */}
            <View style={styles.pill}>
              <Users
                size={14}
                color="rgba(0, 229, 255, 0.7)"
                style={{ marginBottom: 6 }}
              />
              <Text style={styles.pillVal}>{room.settings.maxPlayers}</Text>
              <Text style={styles.pillLbl}>Players</Text>
            </View>

            {/* Imposter count */}
            <View style={styles.pill}>
              <EyeOff
                size={14}
                color="rgba(0, 229, 255, 0.7)"
                style={{ marginBottom: 6 }}
              />
              <Text style={styles.pillVal}>{room.settings.imposterCount}</Text>
              <Text style={styles.pillLbl}>Imposters</Text>
            </View>

            {/* Discussion time */}
            <View style={styles.pill}>
              <Clock
                size={14}
                color="rgba(0, 229, 255, 0.7)"
                style={{ marginBottom: 6 }}
              />
              <Text style={styles.pillVal}>
                {room.settings.discussionTime}s
              </Text>
              <Text style={styles.pillLbl}>Discuss</Text>
            </View>

            {/* Voting time */}
            <View style={styles.pill}>
              <CheckCircle
                size={14}
                color="rgba(0, 229, 255, 0.7)"
                style={{ marginBottom: 6 }}
              />
              <Text style={styles.pillVal}>{room.settings.votingTime}s</Text>
              <Text style={styles.pillLbl}>Vote</Text>
            </View>
          </View>
        </GlassCard>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomDock}>
        <LinearGradient
          colors={[
            "rgba(8,11,17,0)",
            Theme.colors.bgPrimary,
            Theme.colors.bgPrimary,
          ]}
          style={StyleSheet.absoluteFill}
        />

        {voiceEnabled && (
          <VoiceChatBar
            roomCode={room.roomCode}
            userId={currentUser.id}
            username={currentUser.username}
            voice={voice}
            embedded
          />
        )}

        <View style={styles.dockRow}>
          {/* Ready Button */}
          <NeonButton
            title={isReady ? "NOT READY" : "READY UP"}
            gradientColors={
              isReady ? ["#151A26", "#0C101A"] : Theme.gradients.cyan
            }
            onPress={() => toggleReady(!isReady)}
            style={styles.readyBtn}
          />

          {/* Start Button (Host Only) */}
          {isHost && (
            <NeonButton
              title="START"
              gradientColors={
                canStart ? Theme.gradients.red : ["#202738", "#151A26"]
              }
              onPress={startGame}
              style={styles.startBtn}
            />
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
  glowOrb: {
    position: "absolute",
    width: width,
    height: 350,
    backgroundColor: "rgba(0, 229, 255, 0.05)",
    top: -150,
    left: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginTop: 60,
    marginBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Theme.colors.surfaceDark,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: Theme.colors.accentCyan,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  chatToggleBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Theme.colors.surfaceDark,
    alignItems: "center",
    justifyContent: "center",
  },
  chatIconWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  redDot: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.accentRed,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 240,
  },
  codeCard: {
    alignItems: "center",
    marginVertical: 12,
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: Theme.colors.textMuted,
    letterSpacing: 2,
  },
  codeText: {
    fontSize: 36,
    fontWeight: "900",
    color: Theme.colors.accentCyan,
    letterSpacing: 10,
    marginVertical: 8,
  },
  codeHint: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginBottom: 8,
  },
  addBotBtn: {
    marginTop: 10,
    backgroundColor: "rgba(0, 229, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(0, 229, 255, 0.3)",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  addBotBtnText: {
    color: Theme.colors.accentCyan,
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: Theme.colors.textMuted,
    letterSpacing: 1.5,
    marginVertical: 14,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  playerCard: {
    width: (width - 60) / 2,
    marginBottom: 12,
  },
  playerReadyCard: {
    borderColor: "rgba(16, 185, 129, 0.4)",
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  settingsSummary: {
    marginVertical: 10,
  },
  pillsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pill: {
    flex: 1,
    alignItems: "center",
  },
  pillVal: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  pillLbl: {
    fontSize: 8,
    fontWeight: "bold",
    color: Theme.colors.textMuted,
    letterSpacing: 1.2,
  },
  bottomDock: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 28 : 16,
  },
  chatMicBtn: {
    borderRadius: 10,
    backgroundColor: "rgba(0, 229, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(0, 229, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  chatMicBtnActive: {
    backgroundColor: Theme.colors.accentCyan,
    borderColor: Theme.colors.accentCyan,
  },
  chatMicBtnLive: {
    backgroundColor: "rgba(0, 255, 136, 0.15)",
    borderColor: "rgba(0, 255, 136, 0.45)",
  },
  chatMicBtnMuted: {
    opacity: 0.5,
  },
  dockRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  readyBtn: {
    flex: 1,
    marginRight: 8,
  },
  startBtn: {
    width: 120,
  },
  chatDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  chatBubble: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    maxWidth: "90%",
    alignSelf: "flex-start",
  },
  systemBubbleText: {
    fontSize: 11,
    fontWeight: "bold",
    color: Theme.colors.accentGold,
  },
  chatBubbleSender: {
    fontSize: 10,
    fontWeight: "bold",
    color: Theme.colors.accentCyan,
    marginBottom: 2,
  },
  chatBubbleText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 18,
  },
  chatInputBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: Platform.OS === "ios" ? 12 : 4,
  },
  chatInput: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    color: "#FFFFFF",
    fontSize: 14,
    height: 44,
    paddingHorizontal: 14,
    marginRight: 10,
  },
  chatSendBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Theme.colors.surfaceDark,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 229, 255, 0.2)",
  },
});
export default LobbyView;
