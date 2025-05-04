// src/backend/config/database.js
const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

// Determinar o caminho do banco de dados
let dbPath;
if (app) {
  // Se estamos no processo principal
  dbPath = path.join(app.getPath('userData'), 'database.sqlite');
} else {
  // Se estamos em um processo filho (como o servidor Express)
  try {
    const { remote } = require('electron');
    dbPath = path.join(remote.app.getPath('userData'), 'database.sqlite');
  } catch (error) {
    // Fallback para ambiente de desenvolvimento ou teste
    const userDataPath = process.env.APPDATA ||
      (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.local/share');
    dbPath = path.join(userDataPath, 'posto-system', 'database.sqlite');
  }
}

// Inicializar o banco de dados
const db = new Database(dbPath, {
  verbose: console.log
});

// Configurar para modo WAL para melhor performance
db.pragma('journal_mode = WAL');

// Criar as tabelas se não existirem
function initDatabase() {
  // Tabela de configuração (senha única)
  db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Verificar se já existe uma senha, caso contrário criar a padrão (123456)
  const configCount = db.prepare('SELECT COUNT(*) as count FROM config').get();
  if (configCount.count === 0) {
    db.prepare('INSERT INTO config (id, password) VALUES (?, ?)').run(1, '123456');
  }

  // Tabela de clientes
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT CHECK(type IN ('PF', 'PJ')) NOT NULL,
      name TEXT NOT NULL,
      document TEXT NOT NULL UNIQUE,
      address TEXT,
      phone TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de notas de venda
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      due_date DATETIME NOT NULL,
      status TEXT CHECK(status IN ('paga', 'pendente')) NOT NULL,
      total_value REAL NOT NULL,
      FOREIGN KEY (client_id) REFERENCES clients (id)
    )
  `);

  // Tabela de produtos das notas
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoice_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      value REAL NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE
    )
  `);

  console.log('Banco de dados inicializado com sucesso!');

  // Adicionar índices para melhorar performance
  console.log('Criando índices para melhorar performance...');

  // Índices para a tabela clients
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(type);
    CREATE INDEX IF NOT EXISTS idx_clients_document ON clients(document);
    CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
  `);

  // Índices para a tabela invoices
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
    CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
    CREATE INDEX IF NOT EXISTS idx_invoices_purchase_date ON invoices(purchase_date);
    CREATE INDEX IF NOT EXISTS idx_invoices_status_due_date ON invoices(status, due_date);
  `);

  // Índices para a tabela invoice_products
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_invoice_products_invoice_id ON invoice_products(invoice_id);
  `);

  console.log('Banco de dados inicializado com sucesso!');
}

module.exports = {
  db,
  initDatabase
};