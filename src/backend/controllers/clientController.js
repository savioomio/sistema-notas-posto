// src/backend/controllers/clientController.js
const ClientModel = require('../models/client');

// Listar todos os clientes
function getAllClients(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    
    // Extrair filtros da query
    const filters = {
      type: req.query.type || 'all',
      status: req.query.status || 'all',
      name: req.query.name || 'none'
    };

    const clients = ClientModel.getAllClients(page, limit, filters);
    const total = ClientModel.getClientCount(filters);
    const totalPages = Math.ceil(total / limit);
    
    // Adicionar flag de notas vencidas para cada cliente
    const clientsWithStatus = clients.map(client => {
      return {
        ...client,
        has_overdue: ClientModel.clientHasOverdueInvoices(client.id)
      };
    });
    
    res.json({
      data: clientsWithStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Obter um cliente específico
function getClientById(req, res) {
  try {
    const client = ClientModel.getClientById(req.params.id);
    
    if (!client) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    // Adicionar status de notas vencidas
    client.has_overdue = ClientModel.clientHasOverdueInvoices(client.id);
    
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Criar novo cliente
function createClient(req, res) {
  try {
    const { type, name, document, address, phone } = req.body;
    
    // Validação de campos obrigatórios
    if (!type || !name || !document || !phone) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: type, name, document, phone' 
      });
    }
    
    // Verificar se o documento já existe
    const existingClient = ClientModel.getClientByDocument(document);
    if (existingClient) {
      return res.status(400).json({ 
        error: 'Já existe um cliente com este documento' 
      });
    }
    
    const newClient = ClientModel.createClient({ type, name, document, address, phone });
    
    res.status(201).json(newClient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Atualizar cliente
function updateClient(req, res) {
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
    const existingClient = ClientModel.getClientById(clientId);
    if (!existingClient) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    // Verificar se o documento já existe para outro cliente
    const docCheck = ClientModel.getOtherClientByDocument(document, clientId);
    if (docCheck) {
      return res.status(400).json({ error: 'Já existe outro cliente com este documento' });
    }
    
    const updatedClient = ClientModel.updateClient(clientId, { type, name, document, address, phone });
    
    res.json(updatedClient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Excluir cliente
function deleteClient(req, res) {
  try {
    const clientId = req.params.id;
    
    // Verificar se o cliente existe
    const existingClient = ClientModel.getClientById(clientId);
    if (!existingClient) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    // Verificar se cliente tem notas
    if (ClientModel.clientHasInvoices(clientId)) {
      return res.status(400).json({ 
        error: 'Não é possível excluir cliente que possui notas de venda' 
      });
    }
    
    ClientModel.deleteClient(clientId);
    
    res.json({ message: 'Cliente excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
};