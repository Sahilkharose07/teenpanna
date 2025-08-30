import { io, Socket } from 'socket.io-client';

let socket: Socket;

export const initializeSocket = () => {
  socket = io('http://192.168.1.3:5000');
  return socket;
};

export const getSocket = () => {
  if (!socket) throw new Error('Socket not initialized');
  return socket;
};

export const disconnectSocket = () => {
  if (socket) socket.disconnect();
};