export type Suit = '♥' | '♦' | '♣' | '♠';
export type CardValue = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export type Card = {
  suit: Suit;
  value: CardValue;
};

export type Player = {
  id: string;
  name: string;
  socketId: string;
  roomId: string;
  balance: number;
  betSide: 'andar' | 'bahar' | null;
  betAmount: number;
  isBot: boolean;
};

export type GameState = {
  deck: Card[];
  middleCard: Card | null;
  andarCards: Card[];
  baharCards: Card[];
  gameStatus: 'waiting' | 'betting' | 'dealing' | 'match-found' | 'result';
  winner: 'andar' | 'bahar' | null;
  matchedCard: { card: Card; side: 'andar' | 'bahar' } | null;
  currentDealingSide: 'andar' | 'bahar';
};

export type Room = {
  id: string;
  players: Set<string>;
  playerOrder: string[];
  currentTurnIndex: number;
  gameState: GameState;
  status: 'waiting' | 'playing';
  createdAt: number;
};






