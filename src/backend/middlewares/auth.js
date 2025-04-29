// src/backend/middlewares/auth.js
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');

// Middleware para verificar token JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  console.log('Token recebido:', token ? `${token.substring(0, 15)}...` : 'nenhum');
  
  if (!token) {
    console.log('Acesso negado: Token não fornecido');
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Token inválido:', err.message);
      return res.status(403).json({ error: `Token inválido: ${err.message}` });
    }
    
    console.log('Token válido, usuário autorizado');
    req.user = user;
    next();
  });
}

module.exports = { authenticateToken };