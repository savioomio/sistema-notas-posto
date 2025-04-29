// src/backend/config/jwt.js
// Configuração do JWT

// Chave secreta para JWT (em produção, deveria estar em variável de ambiente)
const JWT_SECRET = 'posto-system-secret-key';
const JWT_EXPIRES_IN = '24h';

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN
};