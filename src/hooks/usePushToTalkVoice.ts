import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { io, Socket } from "socket.io-client";
import { API_BASE } from "../context/GameContext";

export function usePushToTalkVoice(
  roomCode: string | null | undefined,
  userId: string | null | undefined,
  username: string | null | undefined,
  enabled: boolean,
) {
  const socketRef = useRef<Socket | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [lastSpeaker, setLastSpeaker] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(
    true,
  );
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!enabled || !roomCode || !userId || roomCode === "LOCAL") {
      setIsConnected(false);
      return;
    }

    const socket = io(API_BASE, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 20000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("voice:join", {
        roomCode,
        userId,
        username: username || "Agent",
      });
    });

    socket.on("disconnect", () => setIsConnected(false));

    socket.on("voice:clip", (payload: any) => {
      if (!payload?.audioBase64 || payload.userId === userId) return;
      if (isMuted) return;

      setLastSpeaker(payload.username);
      setTimeout(() => setLastSpeaker(null), 3000);
    });

    return () => {
      socket.emit("voice:leave", { roomCode, userId });
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [enabled, roomCode, userId, username, isMuted]);

  const startTalking = useCallback(async () => {
    if (isMuted) return;
    const socket = socketRef.current;
    if (!socket?.connected) {
      Alert.alert("Voice chat", "Voice server unavailable.");
      return;
    }
    setIsRecording(true);
  }, [isMuted]);

  const stopTalking = useCallback(async () => {
    setIsRecording(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((value) => !value);
  }, []);

  return {
    mode: "push-to-talk" as const,
    isRecording,
    isMuted,
    lastSpeaker,
    permissionGranted,
    isConnected,
    isLive: false,
    peerCount: 0,
    remoteStreams: {} as Record<string, unknown>,
    startTalking,
    stopTalking,
    toggleMute,
  };
}
