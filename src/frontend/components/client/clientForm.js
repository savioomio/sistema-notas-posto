// src/frontend/components/client/clientForm.js
// Formulário de cadastro/edição de cliente

// Validar formulário de cliente
function validateClientForm() {
   const type = document.getElementById('client-type').value;
   const name = document.getElementById('client-name').value;
   const document = document.getElementById('client-document').value;
   const phone = document.getElementById('client-phone').value;
 
   // Validar campos obrigatórios
   if (!name || !document || !phone) {
     return { 
       valid: false, 
       message: 'Preencha todos os campos obrigatórios' 
     };
   }
 
   if (!type || (type !== 'PF' && type !== 'PJ')) {
     return { 
       valid: false, 
       message: 'Selecione um tipo válido (PF ou PJ)' 
     };
   }
 
   return { valid: true };
 }
 
 // Obter dados do formulário
 function getClientFormData() {
   const clientId = document.getElementById('client-id').value;
   const type = document.getElementById('client-type').value;
   const name = document.getElementById('client-name').value;
   const document = document.getElementById('client-document').value;
   const address = document.getElementById('client-address').value;
   const phone = document.getElementById('client-phone').value;
 
   return {
     id: clientId || null,
     type,
     name,
     document,
     address,
     phone
   };
 }
 
 // Preencher formulário com dados do cliente
 function fillClientForm(client) {
   document.getElementById('client-id').value = client.id;
   document.getElementById('client-type').value = client.type;
   document.getElementById('client-name').value = client.name;
   document.getElementById('client-document').value = client.document;
   document.getElementById('client-address').value = client.address || '';
   document.getElementById('client-phone').value = client.phone;
 }
 
 // Limpar formulário
 function clearClientForm() {
   document.getElementById('client-form').reset();
   document.getElementById('client-id').value = '';
 }
 
 module.exports = {
   validateClientForm,
   getClientFormData,
   fillClientForm,
   clearClientForm
 };