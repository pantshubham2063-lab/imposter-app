/**
 * Voice room relay: WebRTC signaling + push-to-talk clip fallback.
 */
function attachVoiceSocket(io) {
  /** @type {Map<string, Map<string, { socketId: string, username: string }>>} */
  const voiceRooms = new Map();

  const getRoom = (roomCode) => {
    if (!voiceRooms.has(roomCode)) voiceRooms.set(roomCode, new Map());
    return voiceRooms.get(roomCode);
  };

  const removePeer = (roomCode, userId) => {
    const room = voiceRooms.get(roomCode);
    if (!room) return;
    room.delete(userId);
    if (room.size === 0) voiceRooms.delete(roomCode);
  };

  const relayToUser = (roomCode, toUserId, event, payload) => {
    const peer = voiceRooms.get(roomCode)?.get(toUserId);
    if (peer) io.to(peer.socketId).emit(event, payload);
  };

  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on("voice:join", ({ roomCode, userId, username }) => {
      console.log(`[Socket] voice:join roomCode=${roomCode} userId=${userId} username=${username}`);
      if (!roomCode || !userId) return;

      const room = getRoom(roomCode);
      const existingPeers = [...room.entries()]
        .filter(([id]) => id !== userId)
        .map(([id, p]) => ({ userId: id, username: p.username }));

      room.set(userId, { socketId: socket.id, username: username || "Agent" });
      socket.join(`voice:${roomCode}`);
      socket.data.roomCode = roomCode;
      socket.data.userId = userId;
      socket.data.username = username || "Agent";

      socket.emit("voice:peers", { peers: existingPeers });
      socket.to(`voice:${roomCode}`).emit("voice:peer-joined", {
        userId,
        username: socket.data.username,
      });
    });

    // Push-to-talk clip relay fallback
    socket.on("voice:clip", (payload) => {
      const { roomCode, userId, username, audioBase64, mimeType } =
        payload || {};
      if (!roomCode || !userId || !audioBase64) return;
      socket.to(`voice:${roomCode}`).emit("voice:clip", {
        userId,
        username: username || "Agent",
        audioBase64,
        mimeType: mimeType || "audio/m4a",
      });
    });

    // WebRTC signaling
    socket.on("voice:rtc-offer", ({ roomCode, fromUserId, toUserId, sdp }) => {
      console.log(`[Socket] rtc-offer roomCode=${roomCode} from=${fromUserId} to=${toUserId}`);
      if (!roomCode || !fromUserId || !toUserId || !sdp) return;
      relayToUser(roomCode, toUserId, "voice:rtc-offer", { fromUserId, sdp });
    });

    socket.on("voice:rtc-answer", ({ roomCode, fromUserId, toUserId, sdp }) => {
      console.log(`[Socket] rtc-answer roomCode=${roomCode} from=${fromUserId} to=${toUserId}`);
      if (!roomCode || !fromUserId || !toUserId || !sdp) return;
      relayToUser(roomCode, toUserId, "voice:rtc-answer", { fromUserId, sdp });
    });

    socket.on(
      "voice:rtc-ice",
      ({ roomCode, fromUserId, toUserId, candidate }) => {
        console.log(`[Socket] rtc-ice roomCode=${roomCode} from=${fromUserId} to=${toUserId}`);
        if (!roomCode || !fromUserId || !toUserId || !candidate) return;
        relayToUser(roomCode, toUserId, "voice:rtc-ice", {
          fromUserId,
          candidate,
        });
      },
    );

    const handleLeave = (roomCode, userId) => {
      console.log(`[Socket] handleLeave roomCode=${roomCode} userId=${userId}`);
      if (!roomCode || !userId) return;
      socket.leave(`voice:${roomCode}`);
      removePeer(roomCode, userId);
      socket.to(`voice:${roomCode}`).emit("voice:peer-left", { userId });
    };

    socket.on("voice:leave", ({ roomCode, userId }) => {
      handleLeave(
        roomCode || socket.data.roomCode,
        userId || socket.data.userId,
      );
    });

    socket.on("disconnect", () => {
      const { roomCode, userId } = socket.data;
      console.log(`[Socket] Client disconnected: ${socket.id} roomCode=${roomCode} userId=${userId}`);
      if (roomCode && userId) handleLeave(roomCode, userId);
    });
  });
}

module.exports = { attachVoiceSocket };
