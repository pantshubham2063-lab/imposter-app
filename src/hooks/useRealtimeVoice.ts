import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { io, Socket } from "socket.io-client";
import { RTCPeerConnection, mediaDevices, RTCIceCandidate, RTCSessionDescription } from "react-native-webrtc";
import { API_BASE } from "../context/GameContext";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

type PeerInfo = { userId: string; username: string };

export function canUseRealtimeVoice(): boolean {
  return true;
}

export function useRealtimeVoice(
  roomCode: string | null | undefined,
  userId: string | null | undefined,
  username: string | null | undefined,
  enabled: boolean,
) {
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<any>(null);
  const peersRef = useRef<Map<string, any>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, any[]>>(new Map());

  const [isConnected, setIsConnected] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [peerCount, setPeerCount] = useState(0);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, any>>({});

  const isMutedRef = useRef(false);
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const updatePeerCount = useCallback(() => {
    setPeerCount(peersRef.current.size);
  }, []);

  const flushPendingCandidates = useCallback(
    async (remoteUserId: string, pc: any) => {
      const pending = pendingCandidatesRef.current.get(remoteUserId) || [];
      pendingCandidatesRef.current.delete(remoteUserId);
      for (const candidate of pending) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn("[Voice] ICE candidate failed:", e);
        }
      }
    },
    [],
  );

  const ensureLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;

    // Request audio only — platform constraints differ and typings in
    // react-native-webrtc are restrictive. Use a simple boolean here.
    const stream = await mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    localStreamRef.current = stream;
    setIsLive(true);
    return stream;
  }, []);

  const createPeerConnection = useCallback(
    async (remoteUserId: string, isInitiator: boolean) => {
      if (peersRef.current.has(remoteUserId)) return;

      const stream = await ensureLocalStream();
      const pc = new RTCPeerConnection(ICE_SERVERS);

      stream.getTracks().forEach((track: any) => {
        pc.addTrack(track, stream);
      });

      (pc as any).ontrack = (event: any) => {
        const remoteStream = event.streams?.[0];
        if (remoteStream) {
          setRemoteStreams((prev) => ({
            ...prev,
            [remoteUserId]: remoteStream,
          }));
        }
      };

      (pc as any).onicecandidate = (event: any) => {
        if (
          event.candidate &&
          socketRef.current?.connected &&
          roomCode &&
          userId
        ) {
          socketRef.current.emit("voice:rtc-ice", {
            roomCode,
            fromUserId: userId,
            toUserId: remoteUserId,
            candidate: event.candidate.toJSON
              ? event.candidate.toJSON()
              : event.candidate,
          });
        }
      };

      (pc as any).onconnectionstatechange = () => {
        if (
          (pc as any).connectionState === "failed" ||
          (pc as any).connectionState === "closed"
        ) {
          peersRef.current.delete(remoteUserId);
          setRemoteStreams((prev) => {
            const next = { ...prev };
            delete next[remoteUserId];
            return next;
          });
          updatePeerCount();
        }
      };

      peersRef.current.set(remoteUserId, pc);
      updatePeerCount();

      if (isInitiator && socketRef.current?.connected && roomCode && userId) {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: false,
        });
        await pc.setLocalDescription(offer);
        socketRef.current.emit("voice:rtc-offer", {
          roomCode,
          fromUserId: userId,
          toUserId: remoteUserId,
          sdp: offer,
        });
      }

      await flushPendingCandidates(remoteUserId, pc);
    },
    [
      ensureLocalStream,
      flushPendingCandidates,
      roomCode,
      updatePeerCount,
      userId,
    ],
  );

  const handleOffer = useCallback(
    async (fromUserId: string, sdp: any) => {
      let pc = peersRef.current.get(fromUserId);
      if (!pc) {
        await createPeerConnection(fromUserId, false);
        pc = peersRef.current.get(fromUserId);
      }
      if (!pc || !socketRef.current?.connected || !roomCode || !userId) return;

      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current.emit("voice:rtc-answer", {
        roomCode,
        fromUserId: userId,
        toUserId: fromUserId,
        sdp: answer,
      });
    },
    [createPeerConnection, roomCode, userId],
  );

  const handleAnswer = useCallback(async (fromUserId: string, sdp: any) => {
    const pc = peersRef.current.get(fromUserId);
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  }, []);

  const handleIce = useCallback(async (fromUserId: string, candidate: any) => {
    const pc = peersRef.current.get(fromUserId);
    if (!pc) {
      const list = pendingCandidatesRef.current.get(fromUserId) || [];
      list.push(candidate);
      pendingCandidatesRef.current.set(fromUserId, list);
      return;
    }
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.warn("[Voice] addIceCandidate failed:", e);
    }
  }, []);

  const removePeer = useCallback(
    (remoteUserId: string) => {
      const pc = peersRef.current.get(remoteUserId);
      if (pc) {
        try {
          pc.close();
        } catch {
          /* ignore */
        }
      }
      peersRef.current.delete(remoteUserId);
      pendingCandidatesRef.current.delete(remoteUserId);
      setRemoteStreams((prev) => {
        const next = { ...prev };
        delete next[remoteUserId];
        return next;
      });
      updatePeerCount();
    },
    [updatePeerCount],
  );

  const cleanup = useCallback(() => {
    peersRef.current.forEach((pc) => {
      try {
        pc.close();
      } catch {
        /* ignore */
      }
    });
    peersRef.current.clear();
    pendingCandidatesRef.current.clear();

    localStreamRef.current?.getTracks().forEach((t: any) => t.stop());
    localStreamRef.current = null;

    setRemoteStreams({});
    setIsLive(false);
    setPeerCount(0);
  }, []);

  useEffect(() => {
    if (
      !enabled ||
      !canUseRealtimeVoice() ||
      !roomCode ||
      !userId ||
      roomCode === "LOCAL"
    ) {
      return;
    }

    const socket = io(API_BASE, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
    });
    socketRef.current = socket;

    const joinVoice = () => {
      socket.emit("voice:join", {
        roomCode,
        userId,
        username: username || "Agent",
      });
    };

    socket.on("connect", async () => {
      setIsConnected(true);
      joinVoice();
      try {
        await ensureLocalStream();
      } catch (e) {
        console.warn("[Voice] mic access failed:", e);
        Alert.alert(
          "Microphone required",
          "Allow microphone access for live voice chat with your group.",
        );
      }
    });

    socket.on("disconnect", () => setIsConnected(false));

    socket.on("voice:peers", async ({ peers }: { peers: PeerInfo[] }) => {
      for (const peer of peers) {
        await createPeerConnection(peer.userId, true);
      }
    });

    socket.on("voice:peer-joined", async ({ userId: peerId }: PeerInfo) => {
      if (peerId === userId) return;
      // New peer initiates offers — existing clients wait for their offer
    });

    socket.on("voice:peer-left", ({ userId: peerId }: { userId: string }) => {
      removePeer(peerId);
    });

    socket.on("voice:rtc-offer", ({ fromUserId, sdp }) => {
      handleOffer(fromUserId, sdp).catch((e) =>
        console.warn("[Voice] offer failed:", e),
      );
    });

    socket.on("voice:rtc-answer", ({ fromUserId, sdp }) => {
      handleAnswer(fromUserId, sdp).catch((e) =>
        console.warn("[Voice] answer failed:", e),
      );
    });

    socket.on("voice:rtc-ice", ({ fromUserId, candidate }) => {
      handleIce(fromUserId, candidate).catch((e) =>
        console.warn("[Voice] ice failed:", e),
      );
    });

    return () => {
      socket.emit("voice:leave", { roomCode, userId });
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      cleanup();
      setIsConnected(false);
    };
  }, [
    enabled,
    roomCode,
    userId,
    username,
    createPeerConnection,
    ensureLocalStream,
    handleOffer,
    handleAnswer,
    handleIce,
    removePeer,
    cleanup,
  ]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      localStreamRef.current?.getAudioTracks().forEach((track: any) => {
        track.enabled = !next;
      });
      return next;
    });
  }, []);

  return {
    mode: "realtime" as const,
    isConnected,
    isLive,
    isMuted,
    peerCount,
    remoteStreams,
    toggleMute,
  };
}

export type RealtimeVoiceControls = ReturnType<typeof useRealtimeVoice>;
