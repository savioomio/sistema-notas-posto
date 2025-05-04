// src/frontend/services/socketService.js
const { io } = require('socket.io-client');

let socket = null;

// Conectar ao WebSocket
function connect(apiUrl) {
  if (socket) return socket;
  
  socket = io(apiUrl, {
    transports: ['websocket']
  });
  
  socket.on('connect', () => {
    console.log('WebSocket conectado');
  });
  
  socket.on('disconnect', () => {
    console.log('WebSocket desconectado');
  });
  
  return socket;
}

// Escutar eventos
function on(event, callback) {
  if (!socket) return;
  socket.on(event, callback);
}

// Remover listener
function off(event, callback) {
  if (!socket) return;
  socket.off(event, callback);
}

// Disconnectar
function disconnect() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

module.exports = {
  connect,
  on,
  off,
  disconnect
};