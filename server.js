// server.js - Servidor Express para API
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { db, clientHasOverdueInvoices } = require('./database');

// Chave secreta para JWT (em produção, deveria estar em variável de ambiente)
const JWT_SECRET = 'posto-system-secret-key';

// Criar aplicação Express
const app = express();
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


// Logger para requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Logger para erros
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERRO: ${err.message}`);
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

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



// Rota de autenticação
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: 'Senha é obrigatória' });
  }
  
  const config = db.prepare('SELECT * FROM config WHERE id = 1').get();
  
  if (password === config.password) {
    // Gerar token JWT (expira em 24 horas)
    const token = jwt.sign({ authorized: true }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Senha incorreta' });
  }
});
// Logger para requisições com body (POST/PUT)
app.use((req, res, next) => {
  if (['POST', 'PUT'].includes(req.method)) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Corpo da requisição:', JSON.stringify(req.body, null, 2));
  }
  next();
});
// Rota de teste de autenticação
app.get('/api/auth-test', authenticateToken, (req, res) => {
  res.json({ message: 'Autenticado com sucesso', user: req.user });
});

// Rota para alterar senha
app.put('/api/password', authenticateToken, (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: 'Nova senha é obrigatória' });
  }
  
  db.prepare('UPDATE config SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1').run(password);
  
  res.json({ message: 'Senha atualizada com sucesso' });
});

// ROTAS PARA CLIENTES

// Listar todos os clientes com status de notas vencidas
app.get('/api/clients', authenticateToken, (req, res) => {
  try {
    const clients = db.prepare('SELECT * FROM clients ORDER BY name').all();
    
    // Adicionar flag de notas vencidas para cada cliente
    const clientsWithStatus = clients.map(client => {
      return {
        ...client,
        has_overdue: clientHasOverdueInvoices(client.id)
      };
    });
    
    res.json(clientsWithStatus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter um cliente específico
app.get('/api/clients/:id', authenticateToken, (req, res) => {
  try {
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
    
    if (!client) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    // Adicionar status de notas vencidas
    client.has_overdue = clientHasOverdueInvoices(client.id);
    
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar novo cliente
app.post('/api/clients', authenticateToken, (req, res) => {
  try {
    const { type, name, document, address, phone } = req.body;
    
    // Validação de campos obrigatórios
    if (!type || !name || !document || !phone) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: type, name, document, phone' 
      });
    }
    
    // Verificar se o documento já existe
    const existingClient = db.prepare('SELECT id FROM clients WHERE document = ?').get(document);
    if (existingClient) {
      return res.status(400).json({ 
        error: 'Já existe um cliente com este documento' 
      });
    }
    
    const result = db.prepare(
      'INSERT INTO clients (type, name, document, address, phone) VALUES (?, ?, ?, ?, ?)'
    ).run(type, name, document, address, phone);
    
    const newClient = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid);
    
    res.status(201).json(newClient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar cliente
app.put('/api/clients/:id', authenticateToken, (req, res) => {
  try {
    const { type, name, document, address, phone } = req.body;
    const clientId = req.params.id;
    
    // Validação de campos obrigatórios
    if (!type || !name || !document || !phone) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: type, name, document, phone' 
      });
    }
    
    // Verificar se o cliente existe
    const existingClient = db.prepare('SELECT id FROM clients WHERE id = ?').get(clientId);
    if (!existingClient) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    // Verificar se o documento já existe para outro cliente
    const docCheck = db.prepare('SELECT id FROM clients WHERE document = ? AND id != ?').get(document, clientId);
    if (docCheck) {
      return res.status(400).json({ error: 'Já existe outro cliente com este documento' });
    }
    
    db.prepare(`
      UPDATE clients 
      SET type = ?, name = ?, document = ?, address = ?, phone = ? 
      WHERE id = ?
    `).run(type, name, document, address, phone, clientId);
    
    const updatedClient = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
    
    res.json(updatedClient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Excluir cliente
app.delete('/api/clients/:id', authenticateToken, (req, res) => {
  try {
    const clientId = req.params.id;
    
    // Verificar se o cliente existe
    const existingClient = db.prepare('SELECT id FROM clients WHERE id = ?').get(clientId);
    if (!existingClient) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    // Verificar se cliente tem notas
    const hasInvoices = db.prepare('SELECT COUNT(*) as count FROM invoices WHERE client_id = ?').get(clientId);
    if (hasInvoices.count > 0) {
      return res.status(400).json({ 
        error: 'Não é possível excluir cliente que possui notas de venda' 
      });
    }
    
    db.prepare('DELETE FROM clients WHERE id = ?').run(clientId);
    
    res.json({ message: 'Cliente excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ROTAS PARA NOTAS DE VENDA

// Listar todas as notas
app.get('/api/invoices', authenticateToken, (req, res) => {
  try {
    const invoices = db.prepare(`
      SELECT i.*, c.name as client_name, c.document as client_document
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      ORDER BY i.purchase_date DESC
    `).all();
    
    // Para cada nota, buscar os produtos
    const invoicesWithProducts = invoices.map(invoice => {
      const products = db.prepare('SELECT * FROM invoice_products WHERE invoice_id = ?').all(invoice.id);
      return {
        ...invoice,
        products
      };
    });
    
    res.json(invoicesWithProducts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter uma nota específica
app.get('/api/invoices/:id', authenticateToken, (req, res) => {
  try {
    const invoice = db.prepare(`
      SELECT i.*, c.name as client_name, c.document as client_document
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      WHERE i.id = ?
    `).get(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Nota não encontrada' });
    }
    
    // Buscar produtos da nota
    invoice.products = db.prepare('SELECT * FROM invoice_products WHERE invoice_id = ?').all(invoice.id);
    
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar nova nota
app.post('/api/invoices', authenticateToken, (req, res) => {
  try {
    const { client_id, purchase_date, due_date, status, total_value, products } = req.body;
    
    // Validação de campos obrigatórios
    if (!client_id || !due_date || !status || !total_value) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: client_id, due_date, status, total_value' 
      });
    }
    
    // Verificar se o cliente existe
    const existingClient = db.prepare('SELECT id FROM clients WHERE id = ?').get(client_id);
    if (!existingClient) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    // Iniciar transação
    db.prepare('BEGIN TRANSACTION').run();
    
    try {
      // Inserir a nota
      const purchaseDate = purchase_date || new Date().toISOString();
      
      const result = db.prepare(`
        INSERT INTO invoices (client_id, purchase_date, due_date, status, total_value)
        VALUES (?, ?, ?, ?, ?)
      `).run(client_id, purchaseDate, due_date, status, total_value);
      
      const invoiceId = result.lastInsertRowid;
      
      // Inserir produtos (se houver)
      if (products && Array.isArray(products) && products.length > 0) {
        const insertProduct = db.prepare(`
          INSERT INTO invoice_products (invoice_id, name, value)
          VALUES (?, ?, ?)
        `);
        
        products.forEach(product => {
          insertProduct.run(invoiceId, product.name, product.value);
        });
      }
      
      // Finalizar transação
      db.prepare('COMMIT').run();
      
      // Buscar a nota completa
      const newInvoice = db.prepare(`
        SELECT i.*, c.name as client_name, c.document as client_document
        FROM invoices i
        JOIN clients c ON i.client_id = c.id
        WHERE i.id = ?
      `).get(invoiceId);
      
      newInvoice.products = db.prepare('SELECT * FROM invoice_products WHERE invoice_id = ?').all(invoiceId);
      
      res.status(201).json(newInvoice);
    } catch (error) {
      // Reverter transação em caso de erro
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar nota
app.put('/api/invoices/:id', authenticateToken, (req, res) => {
  try {
    const { client_id, purchase_date, due_date, status, total_value, products } = req.body;
    const invoiceId = req.params.id;
    
    // Validação de campos obrigatórios
    if (!client_id || !purchase_date || !due_date || !status || !total_value) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: client_id, purchase_date, due_date, status, total_value' 
      });
    }
    
    // Verificar se a nota existe
    const existingInvoice = db.prepare('SELECT id FROM invoices WHERE id = ?').get(invoiceId);
    if (!existingInvoice) {
      return res.status(404).json({ error: 'Nota não encontrada' });
    }
    
    // Verificar se o cliente existe
    const existingClient = db.prepare('SELECT id FROM clients WHERE id = ?').get(client_id);
    if (!existingClient) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    // Iniciar transação
    db.prepare('BEGIN TRANSACTION').run();
    
    try {
      // Atualizar a nota
      db.prepare(`
        UPDATE invoices 
        SET client_id = ?, purchase_date = ?, due_date = ?, status = ?, total_value = ?
        WHERE id = ?
      `).run(client_id, purchase_date, due_date, status, total_value, invoiceId);
      
      // Remover produtos antigos
      db.prepare('DELETE FROM invoice_products WHERE invoice_id = ?').run(invoiceId);
      
      // Inserir novos produtos (se houver)
      if (products && Array.isArray(products) && products.length > 0) {
        const insertProduct = db.prepare(`
          INSERT INTO invoice_products (invoice_id, name, value)
          VALUES (?, ?, ?)
        `);
        
        products.forEach(product => {
          insertProduct.run(invoiceId, product.name, product.value);
        });
      }
      
      // Finalizar transação
      db.prepare('COMMIT').run();
      
      // Buscar a nota atualizada
      const updatedInvoice = db.prepare(`
        SELECT i.*, c.name as client_name, c.document as client_document
        FROM invoices i
        JOIN clients c ON i.client_id = c.id
        WHERE i.id = ?
      `).get(invoiceId);
      
      updatedInvoice.products = db.prepare('SELECT * FROM invoice_products WHERE invoice_id = ?').all(invoiceId);
      
      res.json(updatedInvoice);
    } catch (error) {
      // Reverter transação em caso de erro
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Excluir nota
app.delete('/api/invoices/:id', authenticateToken, (req, res) => {
  try {
    const invoiceId = req.params.id;
    
    // Verificar se a nota existe
    const existingInvoice = db.prepare('SELECT id FROM invoices WHERE id = ?').get(invoiceId);
    if (!existingInvoice) {
      return res.status(404).json({ error: 'Nota não encontrada' });
    }
    
    // Iniciar transação
    db.prepare('BEGIN TRANSACTION').run();
    
    try {
      // Remover produtos
      db.prepare('DELETE FROM invoice_products WHERE invoice_id = ?').run(invoiceId);
      
      // Remover nota
      db.prepare('DELETE FROM invoices WHERE id = ?').run(invoiceId);
      
      // Finalizar transação
      db.prepare('COMMIT').run();
      
      res.json({ message: 'Nota excluída com sucesso' });
    } catch (error) {
      // Reverter transação em caso de erro
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Iniciar o servidor
function startServer(port = 3000) {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor API rodando em http://0.0.0.0:${port}`);
  });
  
  return server;
}

module.exports = { startServer };