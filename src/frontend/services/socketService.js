// src/frontend/services/socketService.js
const { io } = require('socket.io-client');

let socket = null;
let isConnected = false;
let eventHandlers = {}; // Armazenar handlers para reuso
let reconnectInterval = null;

// Conectar ao WebSocket
function connect(apiUrl) {
  if (socket && isConnected) return socket;
  
  // Verificar se temos um token
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('WebSocket: Não conectando - usuário não autenticado');
    return null; // Não conectar se não houver token
  }
  
  console.log(`Conectando WebSocket em: ${apiUrl}`);
  
  socket = io(apiUrl, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 3000,
    auth: {
      token: token
    }
  });
  
  socket.on('connect', () => {
    isConnected = true;
    console.log('WebSocket conectado');
    
    if (reconnectInterval) {
      clearInterval(reconnectInterval);
      reconnectInterval = null;
    }
    
    // Reinscrever em todos os handlers existentes
    Object.keys(eventHandlers).forEach(event => {
      const handlers = eventHandlers[event];
      if (handlers && handlers.length > 0) {
        handlers.forEach(handler => {
          socket.on(event, handler);
        });
      }
    });
  });
  
  socket.on('disconnect', () => {
    isConnected = false;
    console.log('WebSocket desconectado');
    
    // Tentar reconectar periodicamente
    if (!reconnectInterval) {
      reconnectInterval = setInterval(() => {
        if (!isConnected) {
          console.log('Tentando reconectar WebSocket...');
          socket.connect();
        } else {
          clearInterval(reconnectInterval);
          reconnectInterval = null;
        }
      }, 5000);
    }
  });
  
  socket.on('connect_error', (error) => {
    console.error('Erro de conexão WebSocket:', error);
  });
  
  return socket;
}

// Escutar eventos com persistência
function on(event, callback) {
  if (!socket) return;
  
  // Armazenar o handler para reinscrição em caso de reconexão
  if (!eventHandlers[event]) {
    eventHandlers[event] = [];
  }
  
  // Evitar duplicação de handlers
  const existingHandlerIndex = eventHandlers[event].findIndex(
    h => h.toString() === callback.toString()
  );
  
  if (existingHandlerIndex === -1) {
    eventHandlers[event].push(callback);
  }
  
  socket.on(event, callback);
}

// Remover listener específico
function off(event, callback) {
  if (!socket) return;
  
  socket.off(event, callback);
  
  // Remover da lista de handlers
  if (eventHandlers[event]) {
    const index = eventHandlers[event].findIndex(
      h => h.toString() === callback.toString()
    );
    if (index !== -1) {
      eventHandlers[event].splice(index, 1);
    }
  }
}

// Verificar se está conectado
function isSocketConnected() {
  return isConnected;
}

// Desconectar (usar apenas quando realmente necessário)
function disconnect() {
  if (socket) {
    socket.disconnect();
    socket = null;
    isConnected = false;
    eventHandlers = {};
    
    if (reconnectInterval) {
      clearInterval(reconnectInterval);
      reconnectInterval = null;
    }
  }
}

module.exports = {
  connect,
  on,
  off,
  isSocketConnected,
  disconnect
};