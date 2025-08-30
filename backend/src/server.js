// server.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// -------------------- UTILITIES --------------------
function generateRoomId() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

function generatePlayerId() {
  return Math.random().toString(36).substr(2, 9);
}

function getDeck() {
  const suits = ["S", "H", "D", "C"];
  const ranks = [
    "2", "3", "4", "5", "6", "7", "8", "9", "10",
    "J", "Q", "K", "A"
  ];
  const deck = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push(rank + suit);
    }
  }
  return deck;
}

function shuffle(array) {
  let currentIndex = array.length, randomIndex;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]
    ];
  }

  return array;
}

function findPlayerBySocket(room, socketId) {
  return room.players.find((p) => p.socketId === socketId);
}

// -------------------- DATA --------------------
const rooms = {};

// -------------------- SOCKET HANDLERS --------------------
io.on("connection", (socket) => {
  console.log("🟢 New client connected:", socket.id);

  // Create Room
  socket.on("createRoom", ({ playerName }) => {
    const roomId = generateRoomId();
    const player = {
      id: generatePlayerId(),
      name: playerName || "Player",
      socketId: socket.id,
      isHost: true,
      isFolded: false,
      cards: [],
      chips: 1000,
      betAmount: 0,
      status: "Waiting",
      avatar: `https://i.pravatar.cc/100?img=${Math.floor(Math.random() * 70) + 1}`
    };

    rooms[roomId] = {
      id: roomId,
      players: [player],
      hostId: player.id,
      gameStarted: false,
      turnIndex: 0,
      turnPlayerId: player.id,
      turnSocketId: socket.id,
      pot: 0,
    };

    socket.join(roomId);
    socket.emit("roomCreated", { roomId, player });
    console.log(`✅ Room created: ${roomId} by ${player.name}`);
  });

  // Join Room
  socket.on("joinRoom", ({ roomId, playerName }) => {
    const room = rooms[roomId];
    if (!room) {
      socket.emit("error", { message: "Room not found" });
      return;
    }

    if (room.players.length >= 5) {
      socket.emit("error", { message: "Room is full" });
      return;
    }

    const player = {
      id: generatePlayerId(),
      name: playerName || "Player",
      socketId: socket.id,
      isHost: false,
      isFolded: false,
      cards: [],
      chips: 1000,
      betAmount: 0,
      status: "Waiting",
      avatar: `https://i.pravatar.cc/100?img=${Math.floor(Math.random() * 70) + 1}`
    };

    room.players.push(player);
    socket.join(roomId);

    io.to(roomId).emit("playerJoined", { player, players: room.players });
    console.log(`👥 Player joined room ${roomId}`);
  });

  socket.on('startGame', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;

    const player = findPlayerBySocket(room, socket.id);
    if (!player || player.id !== room.hostId) {
      socket.emit('error', { message: "Only host can start the game" });
      return;
    }

    if (room.players.length < 2) {
      socket.emit('error', { message: "Need at least 2 players to start" });
      return;
    }

    const deck = shuffle(getDeck());
    room.players.forEach((p) => {
      p.cards = deck.splice(0, 3);
      p.isFolded = false;
      p.betAmount = 0;
      p.status = "Playing";
    });

    room.gameStarted = true;
    room.turnIndex = 0;
    room.turnPlayerId = room.players[0].id;
    room.turnSocketId = room.players[0].socketId; // CRITICAL: Set the socket ID
    room.pot = 0;

    console.log('🚀 Starting game - turnSocketId:', room.turnSocketId);
    console.log('Players:', room.players.map(p => ({ name: p.name, socketId: p.socketId })));

    io.to(roomId).emit('gameStarted', {
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        socketId: p.socketId, // Make sure this is included
        cards: p.cards,
        chips: p.chips || 1000,
        isFolded: p.isFolded,
        betAmount: p.betAmount,
        status: p.status,
        avatar: p.avatar
      })),
      turnIndex: room.turnIndex,
      turnPlayerId: room.turnPlayerId,
      turnSocketId: room.turnSocketId, // THIS MUST BE SENT
      pot: room.pot,
    });
  });

  // Also update the placeBet handler to properly handle turn changes:
  socket.on('placeBet', ({ roomId, amount }) => {
    const room = rooms[roomId];
    if (!room || !room.gameStarted) return;

    const player = findPlayerBySocket(room, socket.id);
    if (!player || player.isFolded) return;

    // Update player chips and bet
    player.chips -= amount;
    player.betAmount += amount;
    room.pot += amount;

    // Find next active player (not folded)
    let nextIndex = room.turnIndex;
    let attempts = 0;

    do {
      nextIndex = (nextIndex + 1) % room.players.length;
      attempts++;
    } while (room.players[nextIndex].isFolded && attempts < room.players.length * 2);

    room.turnIndex = nextIndex;
    room.turnPlayerId = room.players[nextIndex].id;
    room.turnSocketId = room.players[nextIndex].socketId; // CRITICAL: Set socket ID

    console.log('💰 Bet placed - New turnSocketId:', room.turnSocketId);

    io.to(roomId).emit('betPlaced', {
      playerId: player.id,
      amount,
      pot: room.pot,
      turnIndex: room.turnIndex,
      turnPlayerId: room.turnPlayerId,
      turnSocketId: room.turnSocketId, // THIS MUST BE SENT
      players: room.players.map(p => ({
        id: p.id,
        chips: p.chips,
        betAmount: p.betAmount
      }))
    });
  });

  // And update the fold handler:
  socket.on('fold', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || !room.gameStarted) return;

    const player = findPlayerBySocket(room, socket.id);
    if (!player) return;

    player.isFolded = true;
    player.status = "Folded";

    // Find next active player
    let nextIndex = room.turnIndex;
    let attempts = 0;
    let activePlayers = room.players.filter(p => !p.isFolded);

    if (activePlayers.length === 0) {
      // All players folded (shouldn't happen)
      return;
    }

    do {
      nextIndex = (nextIndex + 1) % room.players.length;
      attempts++;
    } while (room.players[nextIndex].isFolded && attempts < room.players.length * 2);

    room.turnIndex = nextIndex;
    room.turnPlayerId = room.players[nextIndex].id;
    room.turnSocketId = room.players[nextIndex].socketId; // CRITICAL: Set socket ID

    console.log('📦 Player folded - New turnSocketId:', room.turnSocketId);

    io.to(roomId).emit('playerFolded', {
      playerId: player.id,
      turnIndex: room.turnIndex,
      turnPlayerId: room.turnPlayerId,
      turnSocketId: room.turnSocketId // THIS MUST BE SENT
    });

    // Check if game should end
    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      winner.chips += room.pot;
      io.to(roomId).emit('gameOver', {
        winnerId: winner.id,
        winnerName: winner.name,
        pot: room.pot,
        reason: "All other players folded"
      });
    }
  });

  // Show Cards
  socket.on("show", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || !room.gameStarted) return;

    const player = findPlayerBySocket(room, socket.id);
    if (!player) return;

    io.to(roomId).emit("cardsShown", {
      playerId: player.id,
      cards: player.cards
    });
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);

    for (const roomId in rooms) {
      const room = rooms[roomId];
      const index = room.players.findIndex((p) => p.socketId === socket.id);

      if (index !== -1) {
        const [removed] = room.players.splice(index, 1);

        // If host left → assign new host
        if (removed.id === room.hostId && room.players.length > 0) {
          room.hostId = room.players[0].id;
          room.players[0].isHost = true;
        }

        io.to(roomId).emit("playerLeft", { playerId: removed.id });

        if (room.players.length === 0) {
          delete rooms[roomId];
          console.log(`🗑️ Room ${roomId} deleted`);
        }
      }
    }
  });
});

// -------------------- START SERVER --------------------
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});