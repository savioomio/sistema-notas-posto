// src/backend/server.js
const express = require('express');
const cors = require('cors');
const { requestLogger, bodyLogger, errorLogger } = require('./middlewares/logger');
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');

// Criar aplicação Express
const app = express();

// Middlewares
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Loggers
app.use(requestLogger);
app.use(bodyLogger);

// Rotas da API
app.use('/api', authRoutes);
app.use('/api', clientRoutes);
app.use('/api', invoiceRoutes);

// Middleware de erro
app.use(errorLogger);

// Iniciar o servidor
function startServer(port = 3000) {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor API rodando em http://0.0.0.0:${port}`);
  });
  
  return server;
}

module.exports = { startServer };