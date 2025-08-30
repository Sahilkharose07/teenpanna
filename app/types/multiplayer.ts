export interface Card {
  value: string;
  suit: '♥' | '♦' | '♣' | '♠';
}

export interface Player {
  id: string;
  name: string;
  balance: number;
  betSide?: 'andar' | 'bahar';
  betAmount?: number;
  isHost?: boolean;
  avatar?: string;
}

export interface RoomState {
  roomId: string;
  players: Player[];
  gameStatus: 'waiting' | 'betting' | 'dealing' | 'result';
  middleCard?: Card;
  andarCards: Card[];
  baharCards: Card[];
  winner?: 'andar' | 'bahar';
  matchedCard?: { card: Card, side: 'andar' | 'bahar' };
  currentPlayerTurn?: string;
  deck: Card[];
}