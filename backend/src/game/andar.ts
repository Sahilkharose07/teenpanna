import { Card, GameState, Player, Room } from './interfaces';

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 5;
export const BETTING_TIME = 30000;
export const DEAL_DELAY = 500;
export const INITIAL_BALANCE = 1000;

const suits = ['♥', '♦', '♣', '♠'] as const;
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;


export function createShuffledDeck(): Card[] {
  const deck: Card[] = [];
  suits.forEach(suit => {
    values.forEach(value => {
      deck.push({ suit, value });
    });
  });

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

export function initializeGameState(): GameState {
  const deck = createShuffledDeck();
  const middleCard = deck.pop()!;

  return {
    deck,
    middleCard,
    andarCards: [],
    baharCards: [],
    gameStatus: 'waiting',
    winner: null,
    matchedCard: null,
    currentDealingSide: 'andar'
  };
}

export function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function createNewRoom(): Room {
  const roomId = generateRoomId();
  return {
    id: roomId,
    players: new Set(),
    playerOrder: [],
    currentTurnIndex: 0,
    gameState: initializeGameState(),
    status: 'waiting',
    createdAt: Date.now()
  };
}

export function findAvailableRoom(rooms: Map<string, Room>): Room | null {
  for (const [, room] of rooms) {
    if (room.players.size < MAX_PLAYERS && room.status === 'waiting') {
      return room;
    }
  }
  return null;
}

export function getEnhancedPlayerList(room: Room, players: Map<string, Player>) {
  return Array.from(room.players).map(socketId => {
    const player = players.get(socketId);
    if (!player) return null;

    return {
      id: player.id,
      name: player.name,
      balance: player.balance,
      betSide: player.betSide,
      betAmount: player.betAmount,
      isCurrentTurn: room.playerOrder[room.currentTurnIndex] === socketId
    };
  }).filter(Boolean);
}

export async function dealCards(room: Room, io: any, players: Map<string, Player>) {
  const { gameState } = room;

  while (gameState.deck.length > 0) {
    const card = gameState.deck.pop()!;

    if (gameState.currentDealingSide === 'andar') {
      gameState.andarCards.push(card);
    } else {
      gameState.baharCards.push(card);
    }

    if (card.value === gameState.middleCard?.value) {
      gameState.matchedCard = { card, side: gameState.currentDealingSide };
      gameState.winner = gameState.currentDealingSide;
      gameState.gameStatus = 'match-found';
      io.to(room.id).emit('game_state', gameState);
      await calculateResults(room, io, players);
      return;
    }

    io.to(room.id).emit('game_state', gameState);
    await new Promise(resolve => setTimeout(resolve, DEAL_DELAY));

    gameState.currentDealingSide = gameState.currentDealingSide === 'andar' ? 'bahar' : 'andar';
  }

  gameState.gameStatus = 'result';
  io.to(room.id).emit('game_state', gameState);
  await calculateResults(room, io, players);
}

async function calculateResults(room: Room, io: any, players: Map<string, Player>) {
  const winner = room.gameState.winner;
  const winningPlayers: Player[] = [];

  room.players.forEach(socketId => {
    const player = players.get(socketId);
    if (!player) return;

    if (player.betSide === winner) {
      const winnings = Math.floor(player.betAmount * 1.9);
      player.balance += winnings;
      winningPlayers.push(player);
    }

    player.betSide = null;
    player.betAmount = 0;
  });

  io.to(room.id).emit('player_update', getEnhancedPlayerList(room, players));
  io.to(room.id).emit('game_result', {
    winner,
    winningPlayers: winningPlayers.map(p => p.name),
    matchedCard: room.gameState.matchedCard
  });

  await new Promise(resolve => setTimeout(resolve, 5000));

  // Reset game for new round
  room.gameState = initializeGameState();
  room.gameState.gameStatus = 'betting';
  room.currentTurnIndex = 0;

  const firstPlayer = players.get(room.playerOrder[0]);
  if (firstPlayer) {
    io.to(room.id).emit('turn_update', {
      currentPlayer: firstPlayer.socketId,
      playerName: firstPlayer.name
    });
  }

  io.to(room.id).emit('game_state', room.gameState);
  io.to(room.id).emit('player_update', getEnhancedPlayerList(room, players));

  // Start new betting timer
  setTimeout(() => {
    if (room.gameState.gameStatus === 'betting') {
      startDealing(room, io, players);
    }
  }, BETTING_TIME);
}

export function startDealing(room: Room, io: any, players: Map<string, Player>) {
  room.gameState.gameStatus = 'dealing';
  io.to(room.id).emit('game_state', room.gameState);
  dealCards(room, io, players);
}
