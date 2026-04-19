import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

let socket = null;

export const connectSocket = () => {
  if (!socket) {
    const token = sessionStorage.getItem('smartpark-token');
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      auth: { token: token || '' },
    });
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinLot = (lotId) => {
  if (socket) socket.emit('joinLot', lotId);
};

export const leaveLot = (lotId) => {
  if (socket) socket.emit('leaveLot', lotId);
};
