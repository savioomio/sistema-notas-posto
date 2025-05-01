// src/backend/models/product.js
const { db } = require('../config/database');

// Obter produtos de uma nota
function getProductsByInvoiceId(invoiceId) {
  return db.prepare('SELECT * FROM invoice_products WHERE invoice_id = ?').all(invoiceId);
}

// Adicionar produtos a uma nota
function addProductsToInvoice(invoiceId, products) {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return;
  }
  
  const insertProduct = db.prepare(`
    INSERT INTO invoice_products (invoice_id, name, value)
    VALUES (?, ?, ?)
  `);
  
  products.forEach(product => {
    insertProduct.run(invoiceId, product.name, product.value);
  });
}

// Remover todos os produtos de uma nota
function removeAllProductsFromInvoice(invoiceId) {
  return db.prepare('DELETE FROM invoice_products WHERE invoice_id = ?').run(invoiceId);
}

module.exports = {
  getProductsByInvoiceId,
  addProductsToInvoice,
  removeAllProductsFromInvoice
};