import * as Haptics from "@/utils/haptics";
import * as SecureStore from "@/utils/storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  GameRoom,
  Message,
  Player,
  RoomSettings,
  User,
  mockBots
} from "../types/game";

// ─── Server config ─────────────────────────────────────────────────────────────
// If running on a physical device, replace with your PC's local IP address
// e.g. 'http://10.0.2.2:3001'
export const API_BASE = "http://10.0.2.2:3001";
export const TOKEN_KEY = "imposter_auth_token";

const withHostId = (room: GameRoom): GameRoom => {
  if (room.hostId) return room;
  const hostPlayer = room.players.find((p) => p.isHost);
  return hostPlayer ? { ...room, hostId: hostPlayer.id } : room;
};

const categoryIdStr = (
  category: { _id?: string } | string | null | undefined,
): string | null => {
  if (!category) return null;
  if (typeof category === "string") return category;
  return category._id ? String(category._id) : null;
};

const fetchRandomWord = async (
  categoryId: string,
): Promise<{ word: string; hint: string } | null> => {
  try {
    const res = await fetch(`${API_BASE}/api/game/word/${categoryId}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.word) return null;
    return { word: data.word, hint: data.hint || "" };
  } catch (e) {
    console.warn("Failed to fetch word:", e);
    return null;
  }
};

const mergeServerRoom = (
  local: GameRoom | null,
  server: GameRoom,
): GameRoom => {
  let merged = withHostId(server);

  const pick = <K extends keyof GameRoom>(key: K) => {
    const serverVal = merged[key];
    const localVal = local?.[key];
    if (
      (serverVal === undefined || serverVal === null || serverVal === "") &&
      localVal !== undefined &&
      localVal !== null &&
      localVal !== ""
    ) {
      merged = { ...merged, [key]: localVal };
    }
  };

  pick("secretWord");
  pick("hint");
  pick("categoryId");
  pick("categoryName");
  pick("hostId");

  return merged;
};

const needsWordFetch = (room: GameRoom) =>
  !room.secretWord ||
  room.secretWord === "Unknown" ||
  !room.hint ||
  room.hint === "Unknown";

type AppScreen =
  | "splash"
  | "onboarding"
  | "auth"
  | "home"
  | "categorySetup"
  | "lobby"
  | "gameplay"
  | "profile"
  | "localSetup"
  | "localGameplay"
  | "localVoting"
  | "multiplayerSetup";

interface GameContextType {
  currentUser: User | null;
  room: GameRoom | null;
  currentScreen: AppScreen;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (
    email: string,
    username: string,
    password: string,
  ) => Promise<User>;
  signOut: () => void;
  updateUser: (user: User) => void;
  createRoom: (settings: RoomSettings, categoryObj?: any) => Promise<void>;
  joinRoom: (roomCode: string) => Promise<void>;
  toggleReady: (isReady: boolean) => void;
  startGame: () => Promise<void>;
  sendMessage: (text: string) => void;
  callEmergencyMeeting: () => void;
  castVote: (targetId: string | null) => void;
  disconnectRoom: () => void;
  setScreen: (screen: AppScreen) => void;
  addBot: () => void;

  // Local Pass & Play Mode
  localPlayers: string[];
  isLocalMode: boolean;
  startLocalGame: (
    players: string[],
    imposters: number,
    categoryObj: any,
    votingTime?: number,
  ) => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [room, _setRoom] = useState<GameRoom | null>(null);

  // Custom setRoom that automatically intercepts and pushes all local mutations to the server in real-time
  const setRoom = (value: React.SetStateAction<GameRoom | null>) => {
    _setRoom((prev) => {
      const next =
        typeof value === "function" ? (value as Function)(prev) : value;
      if (next && !isLocalMode && next.roomCode !== "LOCAL") {
        fetch(`${API_BASE}/api/game/room/${next.roomCode}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        }).catch((e) => console.warn("[Sync] PUT Error:", e));
      }
      return next;
    });
  };

  const [currentScreen, setCurrentScreen] = useState<AppScreen>("splash");

  const [localPlayers, setLocalPlayers] = useState<string[]>([]);
  const [isLocalMode, setIsLocalMode] = useState(false);

  // Timers Refs
  const gameTimerRef = useRef<any | null>(null);
  const botJoinTimerRef = useRef<any | null>(null);
  const botReadyTimerRef = useRef<any | null>(null);
  const botVoteTimerRef = useRef<any | null>(null);

  // Active room codes registry for join validation
  const activeRoomCodesRef = useRef<Set<string>>(new Set());

  // Poll room state from the server for multiplayer games (every 2 seconds)
  useEffect(() => {
    if (!room || isLocalMode || room.roomCode === "LOCAL") return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/game/room/${room.roomCode}`);
        if (res.ok) {
          const data = await res.json();
          const serverRoom = data.room;

          // Resolve deep equivalence
          const merged = mergeServerRoom(room, serverRoom);
          if (JSON.stringify(merged) !== JSON.stringify(room)) {
            _setRoom(merged);

            // React to screen/phase transitions triggered by the Host
            if (serverRoom.gameState.phase !== room.gameState.phase) {
              if (
                serverRoom.gameState.phase === "Role Reveal" ||
                serverRoom.gameState.phase === "Gameplay"
              ) {
                setCurrentScreen("gameplay");
              } else if (serverRoom.gameState.phase === "Lobby") {
                setCurrentScreen("lobby");
              }
            }
          }
        }
      } catch (e) {
        console.warn("Error polling room state:", e);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [room?.roomCode, room?.gameState?.phase, isLocalMode]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  const clearAllTimers = () => {
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (botJoinTimerRef.current) clearInterval(botJoinTimerRef.current);
    if (botReadyTimerRef.current) clearInterval(botReadyTimerRef.current);
    if (botVoteTimerRef.current) clearInterval(botVoteTimerRef.current);
  };

  // ─── Auto-login on app startup ──────────────────────────────────────────────
  useEffect(() => {
    const tryAutoLogin = async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (!token) return; // No saved session

        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          setCurrentScreen("home");
        } else {
          // Token expired or invalid — clear it
          await SecureStore.deleteItemAsync(TOKEN_KEY);
        }
      } catch (err) {
        // Server not reachable — silent fail, stay on auth screen
        console.warn("[AutoLogin] Server unreachable:", err);
      }
    };
    tryAutoLogin();
  }, []);

  // ─── Auth: Login ────────────────────────────────────────────────────────────
  const login = async (email: string, password: string): Promise<User> => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Login failed.");
    }

    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    setCurrentUser(data.user);
    setCurrentScreen("home");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return data.user;
  };

  // ─── Auth: Register ─────────────────────────────────────────────────────────
  const register = async (
    email: string,
    username: string,
    password: string,
  ): Promise<User> => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Registration failed.");
    }

    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    setCurrentUser(data.user);
    setCurrentScreen("home");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return data.user;
  };

  // ─── Auth: Sign Out ─────────────────────────────────────────────────────────
  const signOut = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setCurrentUser(null);
    setRoom(null);
    clearAllTimers();
    setCurrentScreen("auth");
  };

  const updateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };

  const setScreen = (screen: AppScreen) => {
    setCurrentScreen(screen);
  };

  // Game actions
  const generateRoomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 6 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length)),
    ).join("");
  };

  const createRoom = async (settings: RoomSettings, categoryObj?: any) => {
    if (!currentUser) return;
    clearAllTimers();

    let secretWord = "Unknown";
    let hint = "Unknown";
    const catId = categoryIdStr(categoryObj);
    if (catId) {
      const wordData = await fetchRandomWord(catId);
      if (wordData) {
        secretWord = wordData.word;
        hint = wordData.hint;
      }
    }

    const hostPlayer: Player = {
      id: currentUser.id,
      username: currentUser.username,
      avatarUrl: currentUser.avatarUrl,
      isHost: true,
      isReady: false,
      isAlive: true,
      role: "Undecided",
    };

    const newRoom: GameRoom = {
      roomCode: generateRoomCode(),
      hostId: currentUser.id,
      categoryId: catId || undefined,
      categoryName: categoryObj?.name,
      secretWord,
      hint,
      players: [hostPlayer],
      settings,
      gameState: {
        phase: "Lobby",
        timerRemaining: 0,
        imposterCount: settings.imposterCount,
        discussionTime: settings.discussionTime,
        votingTime: settings.votingTime,
      },
      messages: [
        {
          id: "sys_" + Date.now(),
          senderId: "system",
          senderName: "SYSTEM",
          text: "Match lobby created. Waiting for agents to join...",
          timestamp: new Date().toISOString(),
          isSystem: true,
        },
      ],
    };

    // Register the entire room state on the server so other players can retrieve and join it
    try {
      await fetch(`${API_BASE}/api/game/room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRoom),
      });
    } catch (e) {
      console.warn("Failed to register room code on server:", e);
    }

    activeRoomCodesRef.current.add(newRoom.roomCode);

    _setRoom(withHostId(newRoom));
    setCurrentScreen("lobby");
  };

  const joinRoom = async (code: string) => {
    if (!currentUser) return;

    const normalizedCode = code.trim().toUpperCase();

    // Fetch the room state from the server
    let serverRoom: GameRoom;
    try {
      const res = await fetch(`${API_BASE}/api/game/room/${normalizedCode}`);
      if (!res.ok) {
        throw new Error("CODE_NOT_FOUND");
      }
      const data = await res.json();
      serverRoom = data.room;
    } catch (err: any) {
      throw new Error("CODE_NOT_FOUND");
    }

    clearAllTimers();

    const localPlayer: Player = {
      id: currentUser.id,
      username: currentUser.username,
      avatarUrl: currentUser.avatarUrl,
      isHost: false,
      isReady: false,
      isAlive: true,
      role: "Undecided",
    };

    // Add local player if they aren't already registered in the server's room list
    const updatedPlayers = [...serverRoom.players];
    if (!updatedPlayers.some((p) => p.id === currentUser.id)) {
      updatedPlayers.push(localPlayer);
    }

    const updatedMessages = [
      ...serverRoom.messages,
      {
        id: "sys_" + Date.now(),
        senderId: "system",
        senderName: "SYSTEM",
        text: `👤 ${currentUser.username} joined the lobby.`,
        timestamp: new Date().toISOString(),
        isSystem: true,
      },
    ];

    // Push the joining player update to the server immediately
    try {
      const pushRes = await fetch(
        `${API_BASE}/api/game/room/${normalizedCode}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            players: updatedPlayers,
            messages: updatedMessages,
          }),
        },
      );
      if (pushRes.ok) {
        const pushData = await pushRes.json();
        serverRoom = pushData.room;
      }
    } catch (e) {
      console.warn("Failed to update players list on server:", e);
    }

    _setRoom(
      mergeServerRoom(null, {
        ...withHostId(serverRoom),
        players: updatedPlayers,
        messages: updatedMessages,
      }),
    );
    setCurrentScreen("lobby");
  };

  const toggleReady = (isReady: boolean) => {
    if (!room || !currentUser) return;

    setRoom((prev) => {
      if (!prev) return null;
      const updatedPlayers = prev.players.map((p) =>
        p.id === currentUser.id ? { ...p, isReady } : p,
      );

      const newMessages = [
        ...prev.messages,
        {
          id: "sys_" + Date.now(),
          senderId: "system",
          senderName: "SYSTEM",
          text: `${currentUser.username} is ${isReady ? "READY" : "NOT READY"}`,
          timestamp: new Date().toISOString(),
          isSystem: true,
        },
      ];

      return {
        ...prev,
        players: updatedPlayers,
        messages: newMessages,
      };
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const promptLobbyReady = () => {
    if (!room || !currentUser) return;

    const waiting = room.players.filter((p) => !p.isReady);
    if (waiting.length === 0) return;

    const names = waiting.map((p) => p.username).join(", ");
    setRoom((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: "sys_ready_" + Date.now(),
            senderId: "system",
            senderName: "SYSTEM",
            text: `⏳ Waiting for agents to ready up: ${names}`,
            timestamp: new Date().toISOString(),
            isSystem: true,
          },
        ],
      };
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  const startGame = async () => {
    if (!room || !currentUser) return;

    const isHost =
      room.hostId === currentUser.id ||
      room.players.some((p) => p.id === currentUser.id && p.isHost);
    if (!isHost) return;

    const everyoneReady =
      room.players.length > 0 && room.players.every((p) => p.isReady);
    if (!everyoneReady) {
      promptLobbyReady();
      return;
    }

    let roomWithWord = room;
    if (needsWordFetch(room) && room.categoryId) {
      const wordData = await fetchRandomWord(String(room.categoryId));
      if (wordData) {
        roomWithWord = {
          ...room,
          secretWord: wordData.word,
          hint: wordData.hint,
        };
        setRoom(roomWithWord);
      }
    }

    // Choose imposter randomly among all players
    const updatedPlayers = [...roomWithWord.players];
    const imposterIdx = Math.floor(Math.random() * updatedPlayers.length);

    for (let i = 0; i < updatedPlayers.length; i++) {
      updatedPlayers[i].role = i === imposterIdx ? "Imposter" : "Crewmate";
      updatedPlayers[i].isAlive = true;
      updatedPlayers[i].votedForId = null;
    }

    setRoom({
      ...roomWithWord,
      players: updatedPlayers,
      gameState: {
        ...roomWithWord.gameState,
        phase: "Role Reveal",
        timerRemaining: 5,
      },
      messages: [
        ...roomWithWord.messages,
        {
          id: "sys_start_" + Date.now(),
          senderId: "system",
          senderName: "SYSTEM",
          text: "Match has begun! Role cards distributed.",
          timestamp: new Date().toISOString(),
          isSystem: true,
        },
      ],
    });

    setCurrentScreen("gameplay");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    startLoopTimer(5, handleRoleRevealEnd);
  };

  const handleRoleRevealEnd = () => {
    setRoom((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        gameState: {
          ...prev.gameState,
          phase: "Gameplay",
          timerRemaining: 90,
        },
        messages: [
          ...prev.messages,
          {
            id: "sys_game_" + Date.now(),
            senderId: "system",
            senderName: "SYSTEM",
            text: "⚡ Tasks are online. Find the Imposter!",
            timestamp: new Date().toISOString(),
            isSystem: true,
          },
        ],
      };
    });

    startLoopTimer(90, () => {
      // Game timed out -> Emergency Meeting automatically
      callEmergencyMeeting();
    });
  };

  const startLoopTimer = (duration: number, onTimeout: () => void) => {
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);

    let remaining = duration;
    gameTimerRef.current = setInterval(() => {
      remaining -= 1;
      setRoom((prev) => {
        if (!prev) {
          if (gameTimerRef.current) clearInterval(gameTimerRef.current);
          return null;
        }
        if (remaining <= 0) {
          if (gameTimerRef.current) clearInterval(gameTimerRef.current);
          setTimeout(onTimeout, 50);
          return {
            ...prev,
            gameState: { ...prev.gameState, timerRemaining: 0 },
          };
        }
        return {
          ...prev,
          gameState: { ...prev.gameState, timerRemaining: remaining },
        };
      });
    }, 1000);
  };

  const addBot = () => {
    setRoom((prev) => {
      if (!prev) return null;
      if (prev.players.length >= prev.settings.maxPlayers) return prev;

      // Find a bot name that isn't already in the room
      const currentBotIds = new Set(prev.players.map((p) => p.id));
      const nextBot = mockBots.find((b) => !currentBotIds.has(b.id));

      if (!nextBot) return prev;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      return {
        ...prev,
        players: [...prev.players, { ...nextBot, isReady: true }],
        messages: [
          ...prev.messages,
          {
            id: "sys_join_" + Date.now(),
            senderId: "system",
            senderName: "SYSTEM",
            text: `👤 ${nextBot.username} (AI Bot) joined the lobby.`,
            timestamp: new Date().toISOString(),
            isSystem: true,
          },
        ],
      };
    });
  };

  // Bot Login Simulation
  const startSimulatingBotLogins = (currentRoom: GameRoom) => {
    if (botJoinTimerRef.current) clearInterval(botJoinTimerRef.current);

    let count = 0;
    botJoinTimerRef.current = setInterval(() => {
      setRoom((prev) => {
        // Stop if no room, room is full, or we've exhausted all bots
        if (
          !prev ||
          prev.players.length >= prev.settings.maxPlayers ||
          count >= mockBots.length
        ) {
          if (botJoinTimerRef.current) clearInterval(botJoinTimerRef.current);
          if (prev) simulateBotReadyState(prev);
          return prev;
        }

        const nextBot = mockBots[count];
        count += 1;

        // Guard: skip if bot is undefined
        if (!nextBot) {
          if (botJoinTimerRef.current) clearInterval(botJoinTimerRef.current);
          return prev;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        return {
          ...prev,
          players: [...prev.players, nextBot],
          messages: [
            ...prev.messages,
            {
              id: "sys_join_" + Date.now(),
              senderId: "system",
              senderName: "SYSTEM",
              text: `👤 ${nextBot.username} joined the lobby.`,
              timestamp: new Date().toISOString(),
              isSystem: true,
            },
          ],
        };
      });
    }, 2000);
  };

  const simulateBotReadyState = (currentRoom: GameRoom) => {
    if (botReadyTimerRef.current) clearInterval(botReadyTimerRef.current);

    botReadyTimerRef.current = setInterval(() => {
      setRoom((prev) => {
        if (!prev) return null;

        const unreadyBot = prev.players.find(
          (p) => !p.isReady && p.id.startsWith("bot"),
        );
        if (!unreadyBot) {
          if (botReadyTimerRef.current) clearInterval(botReadyTimerRef.current);
          return prev;
        }

        const updated = prev.players.map((p) =>
          p.id === unreadyBot.id ? { ...p, isReady: true } : p,
        );

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        return {
          ...prev,
          players: updated,
          messages: [
            ...prev.messages,
            {
              id: "sys_ready_" + Date.now(),
              senderId: "system",
              senderName: "SYSTEM",
              text: `${unreadyBot.username} is READY`,
              timestamp: new Date().toISOString(),
              isSystem: true,
            },
          ],
        };
      });
    }, 1500);
  };

  // Gameplay Chat Messages
  const sendMessage = (text: string) => {
    if (!room || !currentUser) return;

    const newMessage: Message = {
      id: "msg_" + Date.now(),
      senderId: currentUser.id,
      senderName: currentUser.username,
      text,
      timestamp: new Date().toISOString(),
      isSystem: false,
    };

    setRoom((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [...prev.messages, newMessage],
      };
    });

    // Trigger Bot comments
    triggerBotChatResponse(text);
  };

  const triggerBotChatResponse = (inputText: string) => {
    setTimeout(() => {
      setRoom((prev) => {
        if (
          !prev ||
          (prev.gameState.phase !== "Discussion" &&
            prev.gameState.phase !== "Gameplay")
        )
          return prev;

        const liveBots = prev.players.filter(
          (p) => p.id.startsWith("bot") && p.isAlive,
        );
        if (liveBots.length === 0) return prev;

        const speakingBot =
          liveBots[Math.floor(Math.random() * liveBots.length)];
        let response = "";

        const normalized = inputText.toLowerCase();
        if (normalized.includes("who") || normalized.includes("sus")) {
          const suspects = prev.players.filter(
            (p) => p.id !== speakingBot.id && p.isAlive,
          );
          if (suspects.length > 0) {
            const suspect =
              suspects[Math.floor(Math.random() * suspects.length)];
            response = `I think ${suspect.username} is acting really sus. I saw them running back and forth.`;
          }
        } else if (normalized.includes("where")) {
          const locations = [
            "Reactor",
            "Cafeteria",
            "MedBay",
            "Electrical",
            "Navigation",
          ];
          response = `I was in ${locations[Math.floor(Math.random() * locations.length)]} doing tasks. Didn't see anything odd.`;
        } else {
          const items = [
            "Let's stay safe and finish our tasks.",
            "Wait, are we sure about this?",
            "I'm just trying to stay alive guys.",
            "Let's stick together so the imposter can't attack.",
          ];
          response = items[Math.floor(Math.random() * items.length)];
        }

        return {
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: "bot_msg_" + Date.now(),
              senderId: speakingBot.id,
              senderName: speakingBot.username,
              text: response,
              timestamp: new Date().toISOString(),
              isSystem: false,
            },
          ],
        };
      });
    }, 1200);
  };

  const callEmergencyMeeting = () => {
    if (!room || !currentUser) return;

    clearAllTimers();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    setRoom((prev) => {
      if (!prev) return null;

      const resetPlayers = prev.players.map((p) => ({
        ...p,
        votedForId: null,
      }));

      return {
        ...prev,
        players: resetPlayers,
        gameState: {
          ...prev.gameState,
          phase: "Discussion",
          timerRemaining: prev.settings.discussionTime,
        },
        messages: [
          ...prev.messages,
          {
            id: "sys_meeting_" + Date.now(),
            senderId: "system",
            senderName: "SYSTEM",
            text: `🔴 EMERGENCY MEETING CALLED BY ${currentUser.username.toUpperCase()}!`,
            timestamp: new Date().toISOString(),
            isSystem: true,
          },
        ],
      };
    });

    simulateDiscussionChatBots();
    startLoopTimer(room.settings.discussionTime, handleDiscussionEnd);
  };

  const simulateDiscussionChatBots = () => {
    // Bot banter in discussion
    setTimeout(() => {
      setRoom((prev) => {
        if (!prev || prev.gameState.phase !== "Discussion") return prev;
        const bots = prev.players.filter(
          (p) => p.id.startsWith("bot") && p.isAlive,
        );
        if (bots.length < 1) return prev;
        return {
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: "sys_banter_1_" + Date.now(),
              senderId: bots[0].id,
              senderName: bots[0].username,
              text: "Wait, why was the button pressed? Who died?",
              timestamp: new Date().toISOString(),
              isSystem: false,
            },
          ],
        };
      });
    }, 2000);

    setTimeout(() => {
      setRoom((prev) => {
        if (!prev || prev.gameState.phase !== "Discussion") return prev;
        const bots = prev.players.filter(
          (p) => p.id.startsWith("bot") && p.isAlive,
        );
        if (bots.length < 2) return prev;
        const targets = prev.players.filter((p) => p.isAlive);
        const target = targets[Math.floor(Math.random() * targets.length)];
        return {
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: "sys_banter_2_" + Date.now(),
              senderId: bots[1].id,
              senderName: bots[1].username,
              text: `I suspect it's ${target.username}. They disappeared from my sight near Electrical.`,
              timestamp: new Date().toISOString(),
              isSystem: false,
            },
          ],
        };
      });
    }, 4500);
  };

  const handleDiscussionEnd = () => {
    setRoom((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        gameState: {
          ...prev.gameState,
          phase: "Voting",
          timerRemaining: prev.settings.votingTime,
        },
        messages: [
          ...prev.messages,
          {
            id: "sys_vote_open_" + Date.now(),
            senderId: "system",
            senderName: "SYSTEM",
            text: "🗳️ Voting is open! Choose who to eject.",
            timestamp: new Date().toISOString(),
            isSystem: true,
          },
        ],
      };
    });

    simulateBotVoting();
    startLoopTimer(room?.settings.votingTime || 20, ejectSelectedPlayer);
  };

  const castVote = (targetId: string | null) => {
    if (!room || !currentUser) return;

    setRoom((prev) => {
      if (!prev) return null;
      const updated = prev.players.map((p) =>
        p.id === currentUser.id ? { ...p, votedForId: targetId || "skip" } : p,
      );

      return {
        ...prev,
        players: updated,
        messages: [
          ...prev.messages,
          {
            id: "sys_cast_" + Date.now(),
            senderId: "system",
            senderName: "SYSTEM",
            text: `🗳️ ${currentUser.username} has cast their vote.`,
            timestamp: new Date().toISOString(),
            isSystem: true,
          },
        ],
      };
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Check if everyone voted
    setTimeout(checkVotingCompletion, 100);
  };

  const simulateBotVoting = () => {
    if (botVoteTimerRef.current) clearInterval(botVoteTimerRef.current);

    let votingBots =
      room?.players.filter((p) => p.id.startsWith("bot") && p.isAlive) || [];

    botVoteTimerRef.current = setInterval(() => {
      setRoom((prev) => {
        if (
          !prev ||
          prev.gameState.phase !== "Voting" ||
          votingBots.length === 0
        ) {
          if (botVoteTimerRef.current) clearInterval(botVoteTimerRef.current);
          return prev;
        }

        const bot = votingBots.shift();
        if (!bot) return prev;

        const aliveOthers = prev.players.filter(
          (p) => p.isAlive && p.id !== bot.id,
        );
        const randomVote =
          Math.random() > 0.2 && aliveOthers.length > 0
            ? aliveOthers[Math.floor(Math.random() * aliveOthers.length)].id
            : "skip";

        const updated = prev.players.map((p) =>
          p.id === bot.id ? { ...p, votedForId: randomVote } : p,
        );

        return {
          ...prev,
          players: updated,
          messages: [
            ...prev.messages,
            {
              id: "sys_botvote_" + Date.now(),
              senderId: "system",
              senderName: "SYSTEM",
              text: `🗳️ ${bot.username} has voted.`,
              timestamp: new Date().toISOString(),
              isSystem: true,
            },
          ],
        };
      });

      setTimeout(checkVotingCompletion, 50);
    }, 1800);
  };

  const checkVotingCompletion = () => {
    setRoom((prev) => {
      if (!prev || prev.gameState.phase !== "Voting") return prev;

      const aliveVoters = prev.players.filter((p) => p.isAlive);
      const totalVoted = aliveVoters.filter(
        (p) => p.votedForId !== null && p.votedForId !== undefined,
      ).length;

      if (totalVoted >= aliveVoters.length) {
        if (botVoteTimerRef.current) clearInterval(botVoteTimerRef.current);
        if (gameTimerRef.current) clearInterval(gameTimerRef.current);

        // Push to ejection immediately
        setTimeout(ejectSelectedPlayer, 100);
      }
      return prev;
    });
  };

  const ejectSelectedPlayer = () => {
    setRoom((prev) => {
      if (!prev) return null;

      // Count votes
      const tallies: { [key: string]: number } = {};
      prev.players.forEach((p) => {
        if (p.isAlive && p.votedForId && p.votedForId !== "skip") {
          tallies[p.votedForId] = (tallies[p.votedForId] || 0) + 1;
        }
      });

      const sorted = Object.entries(tallies).sort((a, b) => b[1] - a[1]);
      let ejectedId: string | null = null;
      let isTie = false;

      if (sorted.length > 0) {
        const [firstId, firstCount] = sorted[0];
        if (sorted.length > 1 && sorted[1][1] === firstCount) {
          isTie = true;
        } else {
          ejectedId = firstId;
        }
      }

      let systemAlert = "";
      let isImposter = false;
      const updatedPlayers = prev.players.map((p) => {
        if (p.id === ejectedId) {
          isImposter = p.role === "Imposter";
          systemAlert = `✨ ${p.username} was ejected. ${isImposter ? "They WERE the Imposter!" : "They were NOT the Imposter."}`;
          return { ...p, isAlive: false };
        }
        return p;
      });

      if (isTie || !ejectedId) {
        systemAlert =
          "Ejection results: No player was ejected (Tie or skipped votes).";
      }

      // Transition to Results Overlay cinematic sequence (6s duration)
      setTimeout(handleEjectionSequenceEnd, 6000);

      return {
        ...prev,
        players: updatedPlayers,
        gameState: {
          ...prev.gameState,
          phase: "Voting", // Keep in voting view but showing ejection modal overlay
          selectedPlayerToEject: ejectedId,
          wasEjectedPlayerImposter: ejectedId ? isImposter : null,
          timerRemaining: 6,
        },
        messages: [
          ...prev.messages,
          {
            id: "sys_eject_" + Date.now(),
            senderId: "system",
            senderName: "SYSTEM",
            text: systemAlert,
            timestamp: new Date().toISOString(),
            isSystem: true,
          },
        ],
      };
    });
  };

  const handleEjectionSequenceEnd = () => {
    setRoom((prev) => {
      if (!prev) return null;

      // Check win conditions
      const aliveImposters = prev.players.filter(
        (p) => p.isAlive && p.role === "Imposter",
      ).length;
      const aliveCrew = prev.players.filter(
        (p) => p.isAlive && p.role === "Crewmate",
      ).length;

      let nextPhase: "Results" | "Gameplay" = "Gameplay";
      let winner: "Imposter" | "Crewmate" | null = null;
      let victoryMsg = "";

      if (aliveImposters === 0) {
        nextPhase = "Results";
        winner = "Crewmate";
        victoryMsg = "🏆 CREWMATES WIN! Imposters have been neutralized.";
      } else if (aliveCrew <= aliveImposters) {
        nextPhase = "Results";
        winner = "Imposter";
        victoryMsg = "🩸 IMPOSTERS WIN! The spaceship control is lost.";
      }

      if (nextPhase === "Results") {
        clearAllTimers();

        // Update user stats
        if (currentUser) {
          const userWon =
            (winner === "Crewmate" &&
              prev.players.find((p) => p.id === currentUser.id)?.role ===
              "Crewmate") ||
            (winner === "Imposter" &&
              prev.players.find((p) => p.id === currentUser.id)?.role ===
              "Imposter");

          setCurrentUser((prevUser) => {
            if (!prevUser) return null;
            return {
              ...prevUser,
              gamesPlayed: prevUser.gamesPlayed + 1,
              wins: prevUser.wins + (userWon ? 1 : 0),
              losses: prevUser.losses + (userWon ? 0 : 1),
              xp: prevUser.xp + (userWon ? 200 : 50),
              level:
                prevUser.xp + (userWon ? 200 : 50) >= prevUser.level * 1000
                  ? prevUser.level + 1
                  : prevUser.level,
              coins: prevUser.coins + (userWon ? 100 : 20),
            };
          });
        }

        return {
          ...prev,
          gameState: {
            ...prev.gameState,
            phase: "Results",
            winningRole: winner,
          },
          messages: [
            ...prev.messages,
            {
              id: "sys_results_" + Date.now(),
              senderId: "system",
              senderName: "SYSTEM",
              text: victoryMsg,
              timestamp: new Date().toISOString(),
              isSystem: true,
            },
          ],
        };
      } else {
        // Return to gameplay
        startLoopTimer(60, () => {
          callEmergencyMeeting();
        });

        // Reset votes for round
        const resetVotes = prev.players.map((p) => ({
          ...p,
          votedForId: null,
        }));

        return {
          ...prev,
          players: resetVotes,
          gameState: {
            ...prev.gameState,
            phase: "Gameplay",
            timerRemaining: 60,
            selectedPlayerToEject: null,
            wasEjectedPlayerImposter: null,
          },
          messages: [
            ...prev.messages,
            {
              id: "sys_return_" + Date.now(),
              senderId: "system",
              senderName: "SYSTEM",
              text: "Return to ships. Complete tasks and stay cautious.",
              timestamp: new Date().toISOString(),
              isSystem: true,
            },
          ],
        };
      }
    });
  };

  const disconnectRoom = () => {
    clearAllTimers();
    setRoom(null);
    setLocalPlayers([]);
    setIsLocalMode(false);
    setCurrentScreen("home");
  };

  const startLocalGame = async (
    players: string[],
    imposters: number,
    categoryObj: any,
    votingTime: number = 60,
  ) => {
    if (!currentUser) return;
    clearAllTimers();
    setIsLocalMode(true);
    setLocalPlayers(players);

    let secretWord = "Unknown";
    let hint = "Unknown";
    const catId = categoryIdStr(categoryObj);
    if (catId) {
      const wordData = await fetchRandomWord(catId);
      if (wordData) {
        secretWord = wordData.word;
        hint = wordData.hint;
      }
    }

    // Assign roles
    const assignedPlayers = players.map((name) => ({
      id: name,
      username: name,
      avatarUrl: "agent_cyan",
      isHost: false,
      isReady: true,
      isAlive: true,
      role: "Crewmate" as "Crewmate" | "Imposter" | "Undecided",
    }));

    // Randomize imposters
    let imposterIndexes = new Set<number>();
    while (imposterIndexes.size < imposters) {
      imposterIndexes.add(Math.floor(Math.random() * players.length));
    }

    imposterIndexes.forEach((idx) => {
      assignedPlayers[idx].role = "Imposter";
    });

    const newRoom: GameRoom = {
      roomCode: "LOCAL",
      hostId: currentUser.id,
      categoryId: catId || undefined,
      categoryName: categoryObj?.name,
      secretWord,
      hint,
      players: assignedPlayers,
      settings: {
        maxPlayers: players.length,
        imposterCount: imposters,
        discussionTime: 120,
        votingTime: votingTime,
      },
      gameState: {
        phase: "Gameplay", // Bypass lobby, go straight to pass & play
        timerRemaining: 0,
        imposterCount: imposters,
        discussionTime: 120,
        votingTime: votingTime,
      },
      messages: [],
    };

    setRoom(newRoom);
    setCurrentScreen("localGameplay");
  };

  return (
    <GameContext.Provider
      value={{
        currentUser,
        room,
        currentScreen,
        isAuthenticated: currentUser !== null,
        login,
        register,
        signOut,
        updateUser,
        createRoom,
        joinRoom,
        toggleReady,
        startGame,
        sendMessage,
        callEmergencyMeeting,
        castVote,
        disconnectRoom,
        setScreen: setCurrentScreen,
        addBot,
        localPlayers,
        isLocalMode,
        startLocalGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
export default GameContext;
