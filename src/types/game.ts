export type PlayerRole = 'Crewmate' | 'Imposter' | 'Undecided';

export type GamePhase = 'Lobby' | 'Role Reveal' | 'Gameplay' | 'Discussion' | 'Voting' | 'Results';

export interface Player {
  id: string;
  username: string;
  avatarUrl: string;
  isHost: boolean;
  isReady: boolean;
  isAlive: boolean;
  role: PlayerRole;
  votedForId?: string | null; // Who this player voted for (or 'skip')
}

export interface RoomSettings {
  maxPlayers: number;
  imposterCount: number;
  discussionTime: number;
  votingTime: number;
  showHints?: boolean;
}

export interface GameState {
  phase: GamePhase;
  timerRemaining: number;
  imposterCount: number;
  discussionTime: number;
  votingTime: number;
  selectedPlayerToEject?: string | null;
  wasEjectedPlayerImposter?: boolean | null;
  winningRole?: PlayerRole | null;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string; // ISO String
  isSystem: boolean;
}

export interface GameRoom {
  roomCode: string;
  hostId: string;
  categoryId?: string;
  categoryName?: string;
  secretWord?: string;
  hint?: string;
  players: Player[];
  settings: RoomSettings;
  gameState: GameState;
  messages: Message[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  level: number;
  xp: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  coins: number;
}

// Mock templates matching Swift mock data generators
export const mockHostUser: User = {
  id: 'user_imposter_1',
  username: 'ApexAgent',
  email: 'agent@imposter.app',
  avatarUrl: 'agent_cyan',
  level: 14,
  xp: 450,
  gamesPlayed: 142,
  wins: 89,
  losses: 53,
  coins: 2450,
};

export const mockBots: Player[] = [
  { id: 'bot_1', username: 'NebulaGhost', avatarUrl: 'agent_red', isHost: false, isReady: true, isAlive: true, role: 'Undecided' },
  { id: 'bot_2', username: 'XenonGamer', avatarUrl: 'agent_gold', isHost: false, isReady: true, isAlive: true, role: 'Undecided' },
  { id: 'bot_3', username: 'QuantumCode', avatarUrl: 'agent_green', isHost: false, isReady: true, isAlive: true, role: 'Undecided' },
  { id: 'bot_4', username: 'VortexValkyrie', avatarUrl: 'agent_blue', isHost: false, isReady: false, isAlive: true, role: 'Undecided' },
  { id: 'bot_5', username: 'ShadowStalker', avatarUrl: 'agent_purple', isHost: false, isReady: true, isAlive: true, role: 'Undecided' },
];
