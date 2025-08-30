import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const suits = ['♠', '♥', '♦', '♣'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

interface Player {
  id: string;
  name: string;
  cards: string[];
  chips: number;
  isFolded: boolean;
  avatar: string;
  betAmount: number;
  status: string;
  socketId: string;
  isReady: boolean;
  isConnected: boolean;
}

class GameRoom {
  id: string;
  hostId: string;
  players: Player[];
  gameState: {
    deck: string[];
    turn: number;
    pot: number;
    round: number;
    isPacked: boolean;
    showCards: Record<string, boolean>;
    winnerDeclared: boolean;
    gameStarted: boolean;
    isPaused: boolean;
    timeLeft: number;
  };

  constructor(roomId: string, hostId: string) {
    this.id = roomId;
    this.hostId = hostId;
    this.players = [];
    this.gameState = {
      deck: [],
      turn: 0,
      pot: 0,
      round: 1,
      isPacked: false,
      showCards: {},
      winnerDeclared: false,
      gameStarted: false,
      isPaused: false,
      timeLeft: 20
    };
  }

  shuffleDeck(): string[] {
    const deck: string[] = [];
    for (const suit of suits) {
      for (const value of values) {
        deck.push(`${value}${suit}`);
      }
    }
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  startGame(): boolean {
    if (this.players.length < 2) return false;
    
    this.gameState = {
      deck: this.shuffleDeck(),
      turn: 0,
      pot: 0,
      round: 1,
      isPacked: false,
      showCards: {},
      winnerDeclared: false,
      gameStarted: true,
      isPaused: false,
      timeLeft: 20
    };

    this.players.forEach(player => {
      player.cards = [];
      player.isFolded = false;
      player.betAmount = 0;
      player.status = 'Waiting';
    });

    for (let i = 0; i < 3; i++) {
      for (const player of this.players) {
        const card = this.gameState.deck.pop();
        if (card) {
          player.cards.push(card);
          io.to(this.id).emit('card_dealt', { playerId: player.id, card });
        }
      }
    }

    return true;
  }

  nextTurn(): void {
    for (let i = 1; i <= this.players.length; i++) {
      const next = (this.gameState.turn + i) % this.players.length;
      if (!this.players[next].isFolded) {
        this.gameState.turn = next;
        this.gameState.timeLeft = 20;
        return;
      }
    }
  }

  evaluateHand(cards: string[]): number {
    const cardValues = cards.map(c => values.indexOf(c.slice(0, -1))).sort((a, b) => a - b);
    const cardSuits = cards.map(c => c.slice(-1));
    const isSameSuit = cardSuits.every(s => s === cardSuits[0]);
    const isSequence = cardValues[2] - cardValues[1] === 1 && cardValues[1] - cardValues[0] === 1;
    const isTrail = cardValues[0] === cardValues[1] && cardValues[1] === cardValues[2];

    if (isTrail) return 6;
    if (isSequence && isSameSuit) return 5;
    if (isSameSuit) return 4;
    if (isSequence) return 3;
    if (cardValues[0] === cardValues[1] || cardValues[1] === cardValues[2] || cardValues[0] === cardValues[2]) return 2;
    return 1;
  }

  declareWinner(): boolean {
    const activePlayers = this.players.filter(p => !p.isFolded);
    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      winner.chips += this.gameState.pot;
      this.gameState.winnerDeclared = true;
      io.to(this.id).emit('winner_declared', { winnerId: winner.id, potAmount: this.gameState.pot });
      return true;
    }

    const scores = activePlayers.map(p => ({
      player: p,
      score: this.evaluateHand(p.cards)
    }));
    scores.sort((a, b) => b.score - a.score);

    const winner = scores[0].player;
    winner.chips += this.gameState.pot;
    this.gameState.winnerDeclared = true;
    io.to(this.id).emit('winner_declared', { winnerId: winner.id, potAmount: this.gameState.pot });
    return true;
  }

  getGameState() {
    return {
      ...this.gameState,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        cards: p.cards,
        chips: p.chips,
        isFolded: p.isFolded,
        avatar: p.avatar,
        betAmount: p.betAmount,
        status: p.status,
        socketId: p.socketId,
        isReady: p.isReady,
        isConnected: p.isConnected
      }))
    };
  }
}

const rooms = new Map<string, GameRoom>();

function createPlayer(socketId: string, name: string, chips: number): Player {
  return {
    id: socketId,
    name,
    cards: [],
    chips,
    isFolded: false,
    avatar: `https://i.pravatar.cc/150?u=${socketId}`,
    betAmount: 0,
    status: 'Waiting',
    socketId,
    isReady: false,
    isConnected: true
  };
}

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
  console.log('New connection:', socket.id);

  socket.on('create_room', ({ playerName, initialChips }) => {
    const roomId = generateRoomId();
    const room = new GameRoom(roomId, socket.id);
    const player = createPlayer(socket.id, playerName, initialChips);
    
    room.players.push(player);
    rooms.set(roomId, room);
    
    socket.join(roomId);
    socket.emit('room_created', { roomId });
    io.to(roomId).emit('game_state', room.getGameState());
  });

  // In your join_room handler, replace with this:
socket.on('join_room', ({ roomId, playerName, initialChips }) => {
  try {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('join_error', { message: 'Room not found' });
      return;
    }
    if (room.players.length >= 6) {
      socket.emit('join_error', { message: 'Room is full' });
      return;
    }

    const player = createPlayer(socket.id, playerName, initialChips);
    room.players.push(player);
    socket.join(roomId);

    // Notify all players in the room
    io.to(roomId).emit('player_joined', player);
    io.to(roomId).emit('game_state', room.getGameState());

    // Send success response directly to the joining player
    socket.emit('join_success', { 
      roomId,
      gameState: room.getGameState(),
      players: room.players,
      isHost: false
    });
  } catch (error) {
    console.error('Join room error:', error);
    socket.emit('join_error', { message: 'Failed to join room' });
  }
});

  socket.on('toggle_ready', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    player.isReady = !player.isReady;
    io.to(roomId).emit('game_state', room.getGameState());
  });

  socket.on('start_game', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room || room.hostId !== socket.id) return;
    if (room.players.length < 2) return;
    if (!room.players.every(p => p.isReady)) return;

    if (room.startGame()) {
      io.to(roomId).emit('game_started');
      io.to(roomId).emit('game_state', room.getGameState());
    }
  });

  socket.on('place_bet', ({ amount, roomId }) => {
    const room = rooms.get(roomId);
    if (!room || !room.gameState.gameStarted) return;
    if (room.players[room.gameState.turn].socketId !== socket.id) return;

    const player = room.players[room.gameState.turn];
    if (player.chips < amount) return;

    player.chips -= amount;
    player.betAmount = amount;
    room.gameState.pot += amount;
    room.nextTurn();

    io.to(roomId).emit('game_state', room.getGameState());
  });

  socket.on('fold', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room || !room.gameState.gameStarted) return;
    if (room.players[room.gameState.turn].socketId !== socket.id) return;

    room.players[room.gameState.turn].isFolded = true;
    room.nextTurn();

    const activePlayers = room.players.filter(p => !p.isFolded);
    if (activePlayers.length === 1) {
      room.declareWinner();
    }

    io.to(roomId).emit('game_state', room.getGameState());
  });

  socket.on('show_cards', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room || !room.gameState.gameStarted) return;
    if (room.players[room.gameState.turn].socketId !== socket.id) return;

    room.gameState.showCards[socket.id] = true;
    room.players[room.gameState.turn].status = String(room.evaluateHand(room.players[room.gameState.turn].cards) - 1);
    room.nextTurn();

    io.to(roomId).emit('game_state', room.getGameState());
  });

  socket.on('leave_room', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.players = room.players.filter(p => p.socketId !== socket.id);
    socket.leave(roomId);

    if (room.players.length === 0) {
      rooms.delete(roomId);
    } else {
      if (room.hostId === socket.id) {
        room.hostId = room.players[0].socketId;
      }
      io.to(roomId).emit('player_left', socket.id);
      io.to(roomId).emit('game_state', room.getGameState());
    }
  });

  socket.on('disconnect', () => {
    console.log('Disconnected:', socket.id);
    for (const [roomId, room] of rooms) {
      const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        
        if (room.players.length === 0) {
          rooms.delete(roomId);
        } else {
          if (room.hostId === socket.id) {
            room.hostId = room.players[0].socketId;
          }
          io.to(roomId).emit('player_left', socket.id);
          io.to(roomId).emit('game_state', room.getGameState());
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});   