// src/backend/middlewares/logger.js

// Logger para requisições
function requestLogger(req, res, next) {
   console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
   next();
 }
 
 // Logger para requisições com body (POST/PUT)
 function bodyLogger(req, res, next) {
   if (['POST', 'PUT'].includes(req.method)) {
     console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
     console.log('Corpo da requisição:', JSON.stringify(req.body, null, 2));
   }
   next();
 }
 
 // Logger para erros
 function errorLogger(err, req, res, next) {
   console.error(`[${new Date().toISOString()}] ERRO: ${err.message}`);
   console.error(err.stack);
   res.status(500).json({ error: 'Erro interno do servidor' });
 }
 
 module.exports = {
   requestLogger,
   bodyLogger,
   errorLogger
 };