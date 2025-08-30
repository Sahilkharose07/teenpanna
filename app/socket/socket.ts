import { io } from 'socket.io-client';

const URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';

export const socket = io(URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ['websocket']
});

export const GameEvents = {
  // Room events  
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  ROOM_CREATED: 'room_created',
  ROOM_JOINED: 'room_joined',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  ROOM_FULL: 'room_full',
  INVALID_ROOM: 'invalid_room',
  
  // Game events
  START_GAME: 'start_game',
  GAME_STARTED: 'game_started',
  PLACE_BET: 'place_bet',
  BET_PLACED: 'bet_placed',
  CARD_DEALT: 'card_dealt',
  GAME_RESULT: 'game_result',
  PLAY_AGAIN: 'play_again',
  
  // Error events
  ERROR: 'error'
};

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};