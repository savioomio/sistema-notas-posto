// scripts/createTestClientAPI.js
const fetch = require('node-fetch');

// Configuração da API
const API_URL = 'http://localhost:3000';
let token = null;

// Função para fazer login
async function login() {
  const response = await fetch(`${API_URL}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ password: '123456' })
  });
  
  const data = await response.json();
  token = data.token;
  console.log('Login realizado com sucesso!');
}

// Função para criar cliente
async function createClient() {
  const response = await fetch(`${API_URL}/api/clients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      type: 'PF',
      name: 'Cliente Teste com 45 Notas',
      document: '000.000.000-00',
      address: 'Rua Teste, 123, Bairro Teste, Cidade Teste',
      phone: '(11) 98765-4321'
    })
  });
  
  const client = await response.json();
  console.log(`Cliente criado com ID: ${client.id}`);
  return client.id;
}

// Função para criar nota
async function createInvoice(clientId, invoiceData) {
  const response = await fetch(`${API_URL}/api/invoices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(invoiceData)
  });
  
  return response.json();
}

// Função principal
async function createTestData() {
  try {
    // Login
    await login();
    
    // Criar cliente
    const clientId = await createClient();
    
    // Criar 45 notas
    const today = new Date();
    
    for (let i = 1; i <= 45; i++) {
      // Calcular datas
      const purchaseDate = new Date(today);
      purchaseDate.setDate(today.getDate() - (45 - i));
      
      const dueDate = new Date(purchaseDate);
      dueDate.setDate(purchaseDate.getDate() + 30);
      
      // Status (pendente para as primeiras 20, paga para as últimas 25)
      const status = i <= 20 ? 'pendente' : 'paga';
      
      // Valor aleatório entre 50 e 500
      const totalValue = Math.floor(Math.random() * 450) + 50;
      
      // Dados da nota
      const invoiceData = {
        client_id: clientId,
        purchase_date: purchaseDate.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        status: status,
        total_value: totalValue,
        products: []
      };
      
      // Adicionar produtos
      const numProducts = Math.floor(Math.random() * 3) + 1;
      let remainingValue = totalValue;
      
      for (let j = 1; j <= numProducts; j++) {
        const productValue = j === numProducts 
          ? remainingValue 
          : Math.floor(remainingValue / (numProducts - j + 1));
        
        invoiceData.products.push({
          name: `Produto ${j} da Nota ${i}`,
          value: productValue
        });
        
        remainingValue -= productValue;
      }
      
      // Criar nota
      const invoice = await createInvoice(clientId, invoiceData);
      console.log(`Nota ${i} criada: ID ${invoice.id}, Status: ${status}, Valor: ${totalValue}`);
    }
    
    console.log('\n✅ Cliente e 45 notas criados com sucesso!');
    console.log(`Cliente ID: ${clientId}`);
    console.log(`Notas pendentes: 20`);
    console.log(`Notas pagas: 25`);
    
  } catch (error) {
    console.error('Erro ao criar dados de teste:', error);
  }
}

// Executar script
createTestData();