import {
  BETTING_TIME,
  createNewRoom,
  findAvailableRoom,
  getEnhancedPlayerList,
  INITIAL_BALANCE,
  MIN_PLAYERS,
  startDealing
} from '@game/andar';
import cors from 'cors';
import express from 'express';
import http from 'http';
import 'module-alias/register';
import { Server, Socket } from 'socket.io';

import { Player, Room } from '@game/interfaces';

const app = express();
app.use(cors());
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

io.on('connection', (socket: Socket) => {
  console.log(`New connection: ${socket.id}`);

  const heartbeatInterval = setInterval(() => {
    if (socket.connected) socket.emit('heartbeat');
  }, 15000);

  socket.on('join_room', (data: { playerId: string; name: string }, callback) => {
    const { playerId, name } = data;

    let room = findAvailableRoom(rooms);
    if (!room) {
      room = createNewRoom();
      rooms.set(room.id, room);
      console.log(`Created new room: ${room.id}`);
    }

    const player: Player = {
      id: playerId,
      name,
      socketId: socket.id,
      roomId: room.id,
      balance: INITIAL_BALANCE,
      betSide: null,
      betAmount: 0,
      isBot: false
    };

    players.set(socket.id, player);
    room.players.add(socket.id);
    room.playerOrder.push(socket.id);
    socket.join(room.id);

    io.to(room.id).emit('player_joined', {
      playerId: socket.id,
      name,
      balance: INITIAL_BALANCE
    });

    if (room.playerOrder.length === 1) {
      io.to(room.id).emit('turn_update', {
        currentPlayer: socket.id,
        playerName: name
      });
    }

    if (room.players.size >= MIN_PLAYERS && room.status === 'waiting') {
      room.status = 'playing';
      room.gameState.gameStatus = 'betting';

      setTimeout(() => {
        if (room.gameState.gameStatus === 'betting') {
          startDealing(room, io, players);
        }
      }, BETTING_TIME);
    }

    callback({
      success: true,
      roomId: room.id,
      gameState: room.gameState,
      players: getEnhancedPlayerList(room, players),
      currentTurn: room.playerOrder[room.currentTurnIndex],
      isNewRoom: room.players.size === 1
    });

    io.to(room.id).emit('room_update', {
      roomId: room.id,
      gameState: room.gameState,
      players: getEnhancedPlayerList(room, players),
      status: room.status
    });
  });

  socket.on('place_bet', (data: { side: 'andar' | 'bahar'; amount: number }, callback) => {
  const player = players.get(socket.id);
  if (!player) {
    if (typeof callback === 'function') {
      callback({ success: false, message: 'Player not found' });
    }
    return;
  }

  const room = rooms.get(player.roomId);
  if (!room || room.gameState.gameStatus !== 'betting') {
    if (typeof callback === 'function') {
      callback({ success: false, message: 'Betting not allowed now' });
    }
    return;
  }

  const currentTurnPlayer = room.playerOrder[room.currentTurnIndex];
  if (socket.id !== currentTurnPlayer) {
    if (typeof callback === 'function') {
      callback({ success: false, message: 'Not your turn' });
    }
    return;
  }

  if (player.balance < data.amount) {
    if (typeof callback === 'function') {
      callback({ success: false, message: 'Insufficient balance' });
    }
    return;
  }

  player.betSide = data.side;
  player.betAmount = data.amount;
  player.balance -= data.amount;

  room.currentTurnIndex = (room.currentTurnIndex + 1) % room.playerOrder.length;

  const allPlayersBet = Array.from(room.players).every(playerId => {
    const p = players.get(playerId);
    return p && p.betSide !== null && p.betAmount > 0;
  });

  if (allPlayersBet) {
    setTimeout(() => startDealing(room, io, players), 1000);
  } else {
    const nextPlayerId = room.playerOrder[room.currentTurnIndex];
    const nextPlayer = players.get(nextPlayerId);
    if (nextPlayer) {
      io.to(room.id).emit('turn_update', {
        currentPlayer: nextPlayer.socketId,
        playerName: nextPlayer.name
      });
    }
  }

  io.to(room.id).emit('player_update', getEnhancedPlayerList(room, players));
  if (typeof callback === 'function') {
    callback({ success: true, balance: player.balance });
  }
});


  socket.on('disconnect', () => {
    const player = players.get(socket.id);
    if (!player) return;

    const room = rooms.get(player.roomId);
    if (!room) return;

    players.delete(socket.id);
    room.players.delete(socket.id);

    const playerIndex = room.playerOrder.indexOf(socket.id);
    if (playerIndex !== -1) {
      room.playerOrder.splice(playerIndex, 1);

      if (room.currentTurnIndex > playerIndex) {
        room.currentTurnIndex--;
      }

      if (room.currentTurnIndex === playerIndex && room.playerOrder.length > 0) {
        room.currentTurnIndex %= room.playerOrder.length;
        const nextPlayer = players.get(room.playerOrder[room.currentTurnIndex]);
        if (nextPlayer) {
          io.to(room.id).emit('turn_update', {
            currentPlayer: nextPlayer.socketId,
            playerName: nextPlayer.name
          });
        }
      }
    }

    if (room.players.size === 0) {
      rooms.delete(room.id);
    } else {
      io.to(room.id).emit('room_update', {
        roomId: room.id,
        gameState: room.gameState,
        players: getEnhancedPlayerList(room, players),
        status: room.status
      });

      if (room.players.size < MIN_PLAYERS && room.status === 'playing') {
        room.status = 'waiting';
        room.gameState.gameStatus = 'waiting';
        io.to(room.id).emit('game_state', room.gameState);
      }
    }

    clearInterval(heartbeatInterval);
  });
});

export { app, io, server };

