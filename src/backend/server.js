// src/backend/server.js
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { requestLogger, bodyLogger, errorLogger } = require('./middlewares/logger');
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Criar aplicação Express
const app = express();
const server = http.createServer(app);

// Configurar Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middlewares
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Adicionar io ao req para usar nos controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Loggers
app.use(requestLogger);
app.use(bodyLogger);

// Rotas da API
app.use('/api', authRoutes);
app.use('/api', clientRoutes);
app.use('/api', invoiceRoutes);
app.use('/api', dashboardRoutes);

// Middleware de erro
app.use(errorLogger);

// Configurar eventos Socket.IO
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Iniciar o servidor
function startServer(port = 3000) {
  server.listen(port, '0.0.0.0', () => {
    console.log(`Servidor API e WebSocket rodando em http://0.0.0.0:${port}`);
  });
  
  return server;
}

module.exports = { startServer, io };