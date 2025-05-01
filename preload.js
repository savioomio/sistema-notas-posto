// preload.js
// Este arquivo é executado antes da renderização da interface do usuário

window.addEventListener('DOMContentLoaded', () => {
   // Expor APIs específicas do Node.js ao contexto do navegador
   window.nodeRequire = require;
   
   // Você pode adicionar funcionalidades globais, como formatadores
   window.formatters = {
     // Formatar data
     formatDate: (dateString) => {
       const date = new Date(dateString);
       return date.toLocaleDateString('pt-BR');
     },
     
     // Formatar moeda
     formatCurrency: (value) => {
       return new Intl.NumberFormat('pt-BR', {
         style: 'currency',
         currency: 'BRL'
       }).format(value);
     }
   };
   
   console.log('Preload executado com sucesso!');
 });