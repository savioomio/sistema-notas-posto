// src/backend/utils/stringUtils.js

// Remover acentos e normalizá-la
function removeAccents(str) {
   if (!str) return '';
   
   // Normaliza a string para decompor caracteres com acentos
   // Depois remove os marcas de acentuação
   return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
 }
 
 // Escapar caracteres especiais para LIKE
 function escapeLikePattern(str) {
   return str.replace(/[_%\\]/g, '\\$&');
 }
 
 module.exports = {
   removeAccents,
   escapeLikePattern
 };