import { usePushToTalkVoice } from "./usePushToTalkVoice";
import { canUseRealtimeVoice, useRealtimeVoice } from "./useRealtimeVoice";

/**
 * Unified voice hook:
 * - Live WebRTC audio when supported
 * - Push-to-talk fallback when realtime audio is unavailable
 */
export function useVoiceChat(
  roomCode: string | null | undefined,
  userId: string | null | undefined,
  username: string | null | undefined,
  enabled: boolean,
) {
  const realtime = canUseRealtimeVoice();
  const live = useRealtimeVoice(
    roomCode,
    userId,
    username,
    enabled && realtime,
  );
  const ptt = usePushToTalkVoice(
    roomCode,
    userId,
    username,
    enabled && !realtime,
  );

  if (realtime) {
    return {
      ...live,
      isRecording: false,
      lastSpeaker: null as string | null,
      permissionGranted: true as boolean | null,
      startTalking: async () => {},
      stopTalking: async () => {},
    };
  }

  return ptt;
}

export type VoiceChatControls = ReturnType<typeof useVoiceChat>;
