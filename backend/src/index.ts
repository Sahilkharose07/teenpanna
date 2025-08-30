import cors from 'cors';
import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

import {
  Card,
  createDeck,
  dealCards,
  evaluateHand,
  shuffleDeck
} from './gameLogic';

interface Player {
  id: string;
  socketId: string;
  name: string;
  cards: string[];
  chips: number;
  isFolded: boolean;
  avatar: string;
  betAmount: number;
  status: string;
  isBot: boolean;
  roomId: string;
  handValue?: number;
  handDescription?: string;
  hasActed: boolean;
}

interface RoomGameState {
  deck: Card[];
  pot: number;
  round: number;
  gameStatus: 'betting' | 'dealing' | 'showdown' | 'finished' | 'waiting';
  currentBet: number;
  minBet: number;
  timer?: NodeJS.Timeout;
}

interface Room {
  id: string;
  players: Set<string>;
  playerOrder: string[];
  currentTurnIndex: number;
  status: 'waiting' | 'playing' | 'finished';
  gameState: RoomGameState;
  minPlayers: number;
  maxPlayers: number;
  created: number;
  bettingRound: number;
}

interface ChatMessage {
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}

const INITIAL_BALANCE = 1000;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 5;
const BETTING_TIME = 20000;
const BLIND_BET = 10;
const MIN_BET = 5;
const BLIND_BET_AMOUNT = 100;

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
  connectionStateRecovery: {
    maxDisconnectionDuration: 120000,
    skipMiddlewares: true,
  },
});

const players = new Map<string, Player>();
const rooms = new Map<string, Room>();

const findAvailableRoom = (): Room | null => {
  for (const room of rooms.values()) {
    if (room.players.size < room.maxPlayers && room.status === 'waiting') {
      return room;
    }
  }
  return null;
};

const createNewRoom = (): Room => {
  const roomId = uuidv4().substring(0, 6).toUpperCase();
  const newRoom: Room = {
    id: roomId,
    players: new Set(),
    playerOrder: [],
    currentTurnIndex: 0,
    status: 'waiting',
    gameState: {
      deck: [],
      pot: 0,
      round: 1,
      gameStatus: 'waiting',
      currentBet: 0,
      minBet: MIN_BET
    },
    minPlayers: MIN_PLAYERS,
    maxPlayers: MAX_PLAYERS,
    created: Date.now(),
    bettingRound: 0
  };
  rooms.set(roomId, newRoom);
  return newRoom;
};

const getSanitizedPlayerList = (room: Room): any[] => {
  return Array.from(room.players).map(socketId => {
    const player = players.get(socketId);
    if (!player) return null;
    
    return {
      id: player.id,
      socketId: player.socketId,
      name: player.name,
      cards: player.cards,
      chips: player.chips,
      isFolded: player.isFolded,
      avatar: player.avatar,
      betAmount: player.betAmount,
      status: player.status,
      hasActed: player.hasActed,
      handDescription: player.handDescription
    };
  }).filter(player => player !== null);
};

const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const startBettingTimer = (room: Room) => {
  if (room.gameState.timer) {
    clearTimeout(room.gameState.timer);
  }

  room.gameState.timer = setTimeout(() => {
    if (room.gameState.gameStatus === 'betting') {
      const currentPlayerId = room.playerOrder[room.currentTurnIndex];
      const player = players.get(currentPlayerId);

      if (player && !player.isFolded) {
        player.isFolded = true;
        player.status = 'Folded (Timeout)';
        player.hasActed = true;

        io.to(room.id).emit('playerFolded', {
          playerId: currentPlayerId,
          playerName: player.name,
          players: getSanitizedPlayerList(room)
        });

        moveToNextPlayer(room);
        checkRoundCompletion(room);
      }
    }
  }, BETTING_TIME);
};

const moveToNextPlayer = (room: Room) => {
  let nextIndex = (room.currentTurnIndex + 1) % room.playerOrder.length;
  let attempts = 0;

  while (attempts < room.playerOrder.length) {
    const nextPlayerId = room.playerOrder[nextIndex];
    const nextPlayer = players.get(nextPlayerId);

    if (nextPlayer && !nextPlayer.isFolded && !nextPlayer.hasActed) {
      room.currentTurnIndex = nextIndex;

      io.to(room.id).emit('turnUpdate', {
        currentPlayer: nextPlayerId,
        playerName: nextPlayer.name,
        turnIndex: room.currentTurnIndex
      });

      startBettingTimer(room);
      return;
    }

    nextIndex = (nextIndex + 1) % room.playerOrder.length;
    attempts++;
  }

  checkRoundCompletion(room);
};

const checkRoundCompletion = (room: Room) => {
  const activePlayers = Array.from(room.players).filter(socketId => {
    const player = players.get(socketId);
    return player && !player.isFolded;
  });

  if (activePlayers.length <= 1) {
    endRound(room, activePlayers[0]);
    return;
  }

  const allPlayersActed = room.playerOrder.every(playerId => {
    const player = players.get(playerId);
    if (!player || player.isFolded) return true;
    return player.hasActed || player.chips === 0;
  });

  if (allPlayersActed) {
    const activePlayersList = Array.from(room.players)
      .map(socketId => players.get(socketId))
      .filter(player => player && !player.isFolded) as Player[];

    const allBetsEqual = activePlayersList.every(player =>
      player.betAmount === room.gameState.currentBet || player.chips === 0
    );

    if (allBetsEqual) {
      if (room.bettingRound >= 2) {
        room.gameState.gameStatus = 'showdown';
        io.to(room.id).emit('gameStateUpdate', {
          players: getSanitizedPlayerList(room), 
          pot: room.gameState.pot,
          turnIndex: room.currentTurnIndex,
          gameState: {
            currentBet: room.gameState.currentBet,
            minBet: room.gameState.minBet,
            bettingRound: room.bettingRound,
            gameStatus: room.gameState.gameStatus
          }
        });

        determineRoomWinner(room);
      } else {
        room.bettingRound++;
        resetPlayerActions(room);
        startNewBettingRound(room);
      }
    } else {
      resetPlayerActions(room);
      moveToNextPlayer(room);
    }
  } else {
    moveToNextPlayer(room);
  }
};

const resetPlayerActions = (room: Room) => {
  Array.from(room.players).forEach(socketId => {
    const player = players.get(socketId);
    if (player) {
      player.hasActed = false;
    }
  });
};

const startNewBettingRound = (room: Room) => {
  room.gameState.currentBet = 0;
  room.currentTurnIndex = 0;
  const firstPlayerId = room.playerOrder[room.currentTurnIndex];
  const firstPlayer = players.get(firstPlayerId);

  if (firstPlayer) {
    io.to(room.id).emit('turnUpdate', {
      currentPlayer: firstPlayerId,
      playerName: firstPlayer.name,
      turnIndex: room.currentTurnIndex
    });

    startBettingTimer(room);
  }
};

const determineRoomWinner = (room: Room) => {
  const activePlayers = Array.from(room.players)
    .map(socketId => players.get(socketId))
    .filter(player => player && !player.isFolded) as Player[];

  if (activePlayers.length === 0) {
    const contributors = Array.from(room.players)
      .map(socketId => players.get(socketId))
      .filter(player => player && player.betAmount > 0) as Player[];

    if (contributors.length > 0) {
      const splitAmount = Math.floor(room.gameState.pot / contributors.length);
      contributors.forEach(player => {
        player.chips += splitAmount;
      });
    }

    endRound(room);
    return;
  }

  if (activePlayers.length === 1) {
    endRound(room, activePlayers[0].socketId);
    return;
  }

  const parseCardString = (cardString: string): Card => {
    const suit = cardString.slice(-1);
    const value = cardString.slice(0, -1);
    return { value, suit, code: cardString };
  };

  const playersWithEvaluatedHands = activePlayers.map(player => {
    const cards = player.cards.map(parseCardString);
    const evaluation = evaluateHand(cards);
    return {
      ...player,
      handValue: evaluation.numericValue,
      handDescription: evaluation.description
    };
  });

  playersWithEvaluatedHands.sort((a, b) => (b.handValue || 0) - (a.handValue || 0));
  const winningHandValue = playersWithEvaluatedHands[0].handValue;
  const winners = playersWithEvaluatedHands.filter(player => player.handValue === winningHandValue);

  winners.forEach(winner => {
    const player = players.get(winner.socketId);
    if (player) {
      player.handDescription = winner.handDescription;
    }
  });

  if (winners.length === 1) {
    const winner = winners[0];
    const player = players.get(winner.socketId);
    if (player) {
      player.chips += room.gameState.pot;
    }
    endRound(room, winner.socketId);
  } else {
    const splitAmount = Math.floor(room.gameState.pot / winners.length);
    winners.forEach(winner => {
      const player = players.get(winner.socketId);
      if (player) {
        player.chips += splitAmount;
      }
    });

    io.to(room.id).emit('tieGame', {
      winners: winners.map(w => ({ id: w.socketId, name: w.name })),
      potAmount: room.gameState.pot,
      handDescription: winners[0].handDescription
    });

    setTimeout(() => {
      resetGameForNewRound(room);
    }, 3000);
  }
};

const endRound = (room: Room, winnerId?: string) => {
  if (winnerId) {
    const winner = players.get(winnerId);
    if (winner) {
      winner.chips += room.gameState.pot;

      io.to(room.id).emit('winnerDeclared', {
        winnerId,
        winnerName: winner.name,
        potAmount: room.gameState.pot,
        handDescription: winner.handDescription
      });
    }
  }

  setTimeout(() => {
    resetGameForNewRound(room);
  }, 3000);
};

const resetGameForNewRound = (room: Room) => {
  room.gameState.round++;
  room.gameState.gameStatus = 'waiting';
  room.status = 'waiting';
  room.gameState.currentBet = 0;
  room.gameState.minBet = MIN_BET;
  room.bettingRound = 0;

  Array.from(room.players).forEach(socketId => {
    const player = players.get(socketId);
    if (player) {
      player.cards = [];
      player.betAmount = 0;
      player.isFolded = false;
      player.status = 'Waiting';
      player.handDescription = undefined;
      player.hasActed = false;

      if (player.chips <= 0) {
        player.chips = INITIAL_BALANCE;
      }
    }
  });

  room.gameState.pot = 0;

  const playerList = getSanitizedPlayerList(room);
  io.to(room.id).emit('roundEnded', {
    players: playerList,
    nextRound: room.gameState.round
  });
};

const startGame = (room: Room) => {
  if (room.players.size < room.minPlayers) return;

  room.status = 'playing';
  room.gameState.gameStatus = 'dealing';

  Array.from(room.players).forEach(socketId => {
    const player = players.get(socketId);
    if (player) {
      player.cards = [];
      player.isFolded = false;
      player.status = 'Playing';
      player.hasActed = false;
    }
  });

  const deck = shuffleDeck(createDeck());
  const playerCount = room.players.size;
  const { hands, remainingDeck } = dealCards(deck, playerCount);

  room.gameState.deck = remainingDeck;
  room.gameState.currentBet = BLIND_BET;
  room.gameState.minBet = MIN_BET;
  room.bettingRound = 1;

  const playerList = Array.from(room.players);
  playerList.forEach((socketId, index) => {
    const player = players.get(socketId);
    if (player) {
      player.cards = hands[index].map(card => `${card.value}${card.suit}`);
    }
  });

  room.playerOrder = shuffleArray([...playerList]);
  room.currentTurnIndex = 0;

  io.to(room.id).emit('gameStarted', {
    players: getSanitizedPlayerList(room),
    pot: room.gameState.pot,
    turnIndex: room.currentTurnIndex,
    currentPlayer: room.playerOrder[room.currentTurnIndex],
    gameState: {
      currentBet: room.gameState.currentBet,
      minBet: room.gameState.minBet,
      bettingRound: room.bettingRound,
      gameStatus: room.gameState.gameStatus
    }
  });

  startBettingTimer(room);
};

io.on('connection', (socket: Socket) => {
  console.log(`Player connected: ${socket.id}`);

  const heartbeatInterval = setInterval(() => {
    socket.emit('heartbeat');
  }, 15000);

  socket.on('createRoom', (data: { playerName: string }) => {
    try {
      const { playerName } = data;

      const player: Player = {
        id: uuidv4(),
        socketId: socket.id,
        name: playerName,
        cards: [],
        chips: INITIAL_BALANCE,
        isFolded: false,
        avatar: `https://i.pravatar.cc/100?img=${Math.floor(Math.random() * 70) + 1}`,
        betAmount: 0,
        status: 'Waiting',
        isBot: false,
        roomId: '',
        hasActed: false
      };

      players.set(socket.id, player);

      const room = createNewRoom();
      room.players.add(socket.id);
      player.roomId = room.id;

      socket.join(room.id);

      const blindBetAmount = BLIND_BET_AMOUNT;
      if (player.chips >= blindBetAmount) {
        player.chips -= blindBetAmount;
        player.betAmount += blindBetAmount;
        room.gameState.pot += blindBetAmount;
        console.log(`Host ${playerName} placed blind bet of ${blindBetAmount}`);
      }

      socket.emit('roomCreated', {
        roomId: room.id,
        players: getSanitizedPlayerList(room),
        pot: room.gameState.pot
      });

      console.log(`Room ${room.id} created by ${playerName}`);
    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit('error', { message: 'Failed to create room' });
    }
  });

  socket.on('joinRoom', (data: { roomId: string; playerName: string }) => {
    try {
      const { roomId, playerName } = data;
      const room = rooms.get(roomId);

      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.players.size >= room.maxPlayers) {
        socket.emit('error', { message: 'Room is full' });
        return;
      }

      if (room.status !== 'waiting') {
        socket.emit('error', { message: 'Game already in progress' });
        return;
      }

      const player: Player = {
        id: uuidv4(),
        socketId: socket.id,
        name: playerName,
        cards: [],
        chips: INITIAL_BALANCE,
        isFolded: false,
        avatar: `https://i.pravatar.cc/100?img=${Math.floor(Math.random() * 70) + 1}`,
        betAmount: 0,
        status: 'Waiting',
        isBot: false,
        roomId: room.id,
        hasActed: false
      };

      players.set(socket.id, player);
      room.players.add(socket.id);
      socket.join(room.id);

      const blindBetAmount = BLIND_BET_AMOUNT;
      if (player.chips >= blindBetAmount) {
        player.chips -= blindBetAmount;
        player.betAmount += blindBetAmount;
        room.gameState.pot += blindBetAmount;
        console.log(`Player ${playerName} placed blind bet of ${blindBetAmount}`);
      }

      io.to(room.id).emit('playerJoined', {
        players: getSanitizedPlayerList(room),
        pot: room.gameState.pot
      });

      socket.emit('roomJoined', {
        roomId: room.id,
        players: getSanitizedPlayerList(room),
        pot: room.gameState.pot
      });

      console.log(`Player ${playerName} joined room ${room.id}`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  socket.on('startGame', (roomId: string) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const player = players.get(socket.id);
    if (!player || !room.players.has(socket.id)) return;

    const isHost = Array.from(room.players)[0] === socket.id;
    if (!isHost) {
      socket.emit('error', { message: 'Only the host can start the game' });
      return;
    }

    if (room.players.size < room.minPlayers) {
      socket.emit('error', { message: `Need at least ${room.minPlayers} players to start` });
      return;
    }

    startGame(room);
  });

  socket.on('placeBet', (data: { roomId: string; amount: number; playerId: string }) => {
    const { roomId, amount, playerId } = data;
    const room = rooms.get(roomId);
    if (!room) return;

    const player = players.get(socket.id);
    if (!player || player.id !== playerId) return;

    const currentPlayerSocketId = room.playerOrder[room.currentTurnIndex];
    if (currentPlayerSocketId !== socket.id) {
      socket.emit('error', { message: 'Not your turn' });
      return;
    }

    if (player.chips < amount) {
      socket.emit('error', { message: 'Not enough chips' });
      return;
    }

    const minBet = room.gameState.minBet;
    if (amount < minBet && amount !== player.chips) {
      socket.emit('error', { message: `Minimum bet is ${minBet}` });
      return;
    }

    const betAmount = Math.min(amount, player.chips);
    player.chips -= betAmount;
    player.betAmount += betAmount;
    player.hasActed = true;
    room.gameState.pot += betAmount;

    if (betAmount > room.gameState.currentBet) {
      room.gameState.currentBet = betAmount;
      resetPlayerActions(room);
      player.hasActed = true;
    }

    io.to(room.id).emit('betPlaced', {
      playerId: socket.id,
      playerName: player.name,
      amount: betAmount,
      pot: room.gameState.pot,
      players: getSanitizedPlayerList(room)
    });

    moveToNextPlayer(room);
    checkRoundCompletion(room);
  });

  socket.on('fold', (data: { roomId: string; playerId: string }) => {
    const { roomId, playerId } = data;
    const room = rooms.get(roomId);
    if (!room) return;

    const player = players.get(socket.id);
    if (!player || player.id !== playerId) return;

    const currentPlayerSocketId = room.playerOrder[room.currentTurnIndex];
    if (currentPlayerSocketId !== socket.id) {
      socket.emit('error', { message: 'Not your turn' });
      return;
    }

    player.isFolded = true;
    player.status = 'Folded';
    player.hasActed = true;

    io.to(room.id).emit('playerFolded', {
      playerId: socket.id,
      playerName: player.name,
      players: getSanitizedPlayerList(room)
    });

    moveToNextPlayer(room);
    checkRoundCompletion(room);
  });

  socket.on('check', (data: { roomId: string; playerId: string }) => {
    const { roomId, playerId } = data;
    const room = rooms.get(roomId);
    if (!room) return;

    const player = players.get(socket.id);
    if (!player || player.id !== playerId) return;

    const currentPlayerSocketId = room.playerOrder[room.currentTurnIndex];
    if (currentPlayerSocketId !== socket.id) {
      socket.emit('error', { message: 'Not your turn' });
      return;
    }

    if (room.gameState.currentBet > 0 && player.betAmount < room.gameState.currentBet) {
      socket.emit('error', { message: 'Cannot check, you need to call or raise' });
      return;
    }

    player.hasActed = true;

    io.to(room.id).emit('playerChecked', {
      playerId: socket.id,
      playerName: player.name,
      players: getSanitizedPlayerList(room)
    });

    moveToNextPlayer(room);
    checkRoundCompletion(room);
  });

  socket.on('show', (data: { roomId: string; playerId: string }) => {
    const { roomId, playerId } = data;
    const room = rooms.get(roomId);
    if (!room) return;

    const player = players.get(socket.id);
    if (!player || player.id !== playerId) return;

    const currentPlayerId = room.playerOrder[room.currentTurnIndex];
    if (currentPlayerId !== socket.id) {
      socket.emit('error', { message: 'Not your turn' });
      return;
    }

    const parseCardString = (cardString: string): Card => {
      const suit = cardString.slice(-1);
      const value = cardString.slice(0, -1);
      return { value, suit, code: cardString };
    };

    const cards = player.cards.map(parseCardString);
    const evaluation = evaluateHand(cards);

    player.handDescription = evaluation.description;

    room.gameState.gameStatus = 'showdown';
    io.to(room.id).emit('showdown', {
      playerId: socket.id,
      playerName: player.name,
      handDescription: evaluation.description,
      players: getSanitizedPlayerList(room)
    });

    determineRoomWinner(room);
  });

  socket.on('chatMessage', (data: { roomId: string; message: string }) => {
    const { roomId, message } = data;
    const room = rooms.get(roomId);
    if (!room) return;

    const player = players.get(socket.id);
    if (!player) return;

    const chatMessage: ChatMessage = {
      playerId: socket.id,
      playerName: player.name,
      message: message.trim(),
      timestamp: Date.now()
    };

    io.to(room.id).emit('chatMessage', chatMessage);
  });
  
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    clearInterval(heartbeatInterval);

    const player = players.get(socket.id);
    if (!player) return;

    const room = rooms.get(player.roomId);
    if (!room) return;

    room.players.delete(socket.id);
    players.delete(socket.id);

    io.to(room.id).emit('playerLeft', {
      playerId: socket.id,
      players: getSanitizedPlayerList(room)
    });

    if (room.players.size === 0) {
      rooms.delete(room.id);
      console.log(`Room ${room.id} deleted`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Teen Patti server running on port ${PORT}`);
});

export { app, io, server };
