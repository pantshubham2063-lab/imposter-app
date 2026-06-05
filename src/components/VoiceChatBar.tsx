import { Mic, MicOff, Radio, Volume2 } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useVoiceChat, type VoiceChatControls } from "../hooks/useVoiceChat";
import { Theme } from "../theme/Theme";
import { RemoteVoiceStreams } from "./RemoteVoiceStreams";

type VoiceChatBarProps = {
  roomCode: string;
  userId: string;
  username: string;
  enabled?: boolean;
  voice?: VoiceChatControls;
  embedded?: boolean;
};

export const VoiceChatBar: React.FC<VoiceChatBarProps> = ({
  roomCode,
  userId,
  username,
  enabled = true,
  voice: voiceProp,
  embedded = false,
}) => {
  const internalVoice = useVoiceChat(
    roomCode,
    userId,
    username,
    enabled && !voiceProp,
  );
  const voice = voiceProp ?? internalVoice;

  const {
    mode,
    isRecording,
    isMuted,
    lastSpeaker,
    isConnected,
    isLive,
    peerCount,
    remoteStreams,
    startTalking,
    stopTalking,
    toggleMute,
  } = voice;

  const isRealtime = mode === "realtime";

  const statusText = !isConnected
    ? "Connecting to voice…"
    : isRealtime
      ? isMuted
        ? "Mic muted — tap speaker to unmute"
        : peerCount > 0
          ? `Live with ${peerCount + 1} agent${peerCount + 1 === 1 ? "" : "s"} — speak freely`
          : "Live — waiting for other agents…"
      : lastSpeaker
        ? `${lastSpeaker} is talking…`
        : isRecording
          ? "Transmitting…"
          : "Hold mic to talk to your group";

  return (
    <>
      {isRealtime && <RemoteVoiceStreams streams={remoteStreams} />}

      <View style={[styles.wrap, embedded && styles.wrapEmbedded]}>
        <LinearGradient
          colors={["rgba(0,229,255,0.06)", "rgba(0,229,255,0.02)"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.row}>
          <Pressable
            onPress={toggleMute}
            style={[styles.iconBtn, isMuted && styles.iconBtnMuted]}
          >
            {isMuted ? (
              <MicOff size={18} color={Theme.colors.accentRed} />
            ) : (
              <Volume2 size={18} color={Theme.colors.accentCyan} />
            )}
          </Pressable>

          <View style={styles.center}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>VOICE CHANNEL</Text>
              {isRealtime && isLive && isConnected && (
                <View style={styles.liveBadge}>
                  <Radio size={10} color="#FFFFFF" />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              )}
            </View>
            <Text style={styles.hint} numberOfLines={2}>
              {statusText}
            </Text>
          </View>

          {isRealtime ? (
            <View
              style={[
                styles.micBtn,
                styles.micBtnLive,
                isMuted && styles.micBtnDisabled,
              ]}
            >
              <Mic
                size={22}
                color={
                  isMuted ? Theme.colors.textMuted : Theme.colors.accentGreen
                }
              />
            </View>
          ) : (
            <Pressable
              onPressIn={startTalking}
              onPressOut={stopTalking}
              disabled={isMuted || !isConnected}
              style={({ pressed }) => [
                styles.micBtn,
                isRecording && styles.micBtnActive,
                (isMuted || !isConnected) && styles.micBtnDisabled,
                pressed && !isMuted && isConnected && styles.micBtnPressed,
              ]}
            >
              <Mic
                size={22}
                color={
                  isMuted
                    ? Theme.colors.textMuted
                    : isRecording
                      ? "#FFFFFF"
                      : Theme.colors.accentCyan
                }
              />
            </Pressable>
          )}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  wrapEmbedded: {
    marginHorizontal: 0,
    marginBottom: 12,
  },
  wrap: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0, 229, 255, 0.2)",
    overflow: "hidden",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(0, 229, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnMuted: {
    backgroundColor: "rgba(255, 59, 92, 0.12)",
  },
  center: {
    flex: 1,
    marginHorizontal: 10,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: "900",
    color: Theme.colors.accentCyan,
    letterSpacing: 1.2,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Theme.colors.accentGreen,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.8,
  },
  hint: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  micBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 229, 255, 0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(0, 229, 255, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  micBtnLive: {
    backgroundColor: "rgba(0, 255, 136, 0.12)",
    borderColor: "rgba(0, 255, 136, 0.45)",
  },
  micBtnActive: {
    backgroundColor: Theme.colors.accentCyan,
    borderColor: Theme.colors.accentCyan,
  },
  micBtnDisabled: {
    opacity: 0.45,
  },
  micBtnPressed: {
    transform: [{ scale: 0.96 }],
  },
});
