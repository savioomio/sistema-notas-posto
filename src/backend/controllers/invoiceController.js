// src/backend/controllers/invoiceController.js
const InvoiceModel = require('../models/invoice');
const ProductModel = require('../models/product');
const ClientModel = require('../models/client');

// Listar todas as notas
function getAllInvoices(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    
    // Extrair filtros da query
    const filters = {
      status: req.query.status || 'all',
      value: req.query.value || 'all',
      due: req.query.due || 'all',
      purchase: req.query.purchase || 'all'
    };

    const invoices = InvoiceModel.getAllInvoices(page, limit, filters);
    const total = InvoiceModel.getInvoiceCount(filters);
    const totalPages = Math.ceil(total / limit);
    
    // Para cada nota, buscar os produtos
    const invoicesWithProducts = invoices.map(invoice => {
      const products = ProductModel.getProductsByInvoiceId(invoice.id);
      return {
        ...invoice,
        products
      };
    });
    
    res.json({
      data: invoicesWithProducts,
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


// Obter uma nota específica
function getInvoiceById(req, res) {
  try {
    const invoice = InvoiceModel.getInvoiceById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Nota não encontrada' });
    }
    
    // Buscar produtos da nota
    invoice.products = ProductModel.getProductsByInvoiceId(invoice.id);
    
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Criar nova nota
function createInvoice(req, res) {
  try {
    const { client_id, purchase_date, due_date, status, total_value, products } = req.body;
    
    // Validação de campos obrigatórios
    if (!client_id || !due_date || !status || !total_value) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: client_id, due_date, status, total_value' 
      });
    }
    
    // Verificar se o cliente existe
    const existingClient = ClientModel.getClientById(client_id);
    if (!existingClient) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    // Criar a nota
    const invoiceId = InvoiceModel.createInvoice({
      client_id, 
      purchase_date, 
      due_date, 
      status, 
      total_value
    });
    
    // Adicionar produtos
    ProductModel.addProductsToInvoice(invoiceId, products);
    
    // Buscar a nota completa
    const newInvoice = InvoiceModel.getInvoiceById(invoiceId);
    newInvoice.products = ProductModel.getProductsByInvoiceId(invoiceId);
    
    res.status(201).json(newInvoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Atualizar nota
function updateInvoice(req, res) {
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
    const existingInvoice = InvoiceModel.getInvoiceById(invoiceId);
    if (!existingInvoice) {
      return res.status(404).json({ error: 'Nota não encontrada' });
    }
    
    // Verificar se o cliente existe
    const existingClient = ClientModel.getClientById(client_id);
    if (!existingClient) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    // Atualizar a nota
    InvoiceModel.updateInvoice(invoiceId, {
      client_id, 
      purchase_date, 
      due_date, 
      status, 
      total_value
    });
    
    // Remover produtos antigos e adicionar novos
    ProductModel.removeAllProductsFromInvoice(invoiceId);
    ProductModel.addProductsToInvoice(invoiceId, products);
    
    // Buscar a nota atualizada
    const updatedInvoice = InvoiceModel.getInvoiceById(invoiceId);
    updatedInvoice.products = ProductModel.getProductsByInvoiceId(invoiceId);
    
    res.json(updatedInvoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Excluir nota
function deleteInvoice(req, res) {
  try {
    const invoiceId = req.params.id;
    
    // Verificar se a nota existe
    const existingInvoice = InvoiceModel.getInvoiceById(invoiceId);
    if (!existingInvoice) {
      return res.status(404).json({ error: 'Nota não encontrada' });
    }
    
    // Remover produtos
    ProductModel.removeAllProductsFromInvoice(invoiceId);
    
    // Remover nota
    InvoiceModel.deleteInvoice(invoiceId);
    
    res.json({ message: 'Nota excluída com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice
};