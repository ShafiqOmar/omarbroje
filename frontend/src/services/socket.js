import { io } from 'socket.io-client';

let socket;

export const connectSocket = () => {
  if (socket) return socket;
  const token = localStorage.getItem('accessToken');
  socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
    auth: { token }
  });

  socket.on('connect', () => {
    console.log('⚡ Socket connected');
    // Join personal notification room
    socket.emit('join_notifications');
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected');
  });


   

  return socket;
};



export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) socket.disconnect();
};

