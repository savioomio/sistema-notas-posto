// database.js - Configuração do banco de dados SQLite
const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

// Determinar o caminho do banco de dados (na pasta userdata do Electron)
let dbPath;
if (app) {
  // Se estamos no processo principal
  dbPath = path.join(app.getPath('userData'), 'database.sqlite');
} else {
  // Se estamos em um processo filho (como o servidor Express)
  const { remote } = require('electron');
  dbPath = path.join(remote.app.getPath('userData'), 'database.sqlite');
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
}

// Função para verificar se um cliente tem notas vencidas
function clientHasOverdueInvoices(clientId) {
  const today = new Date().toISOString().split('T')[0];
  
  const result = db.prepare(`
    SELECT COUNT(*) as count 
    FROM invoices 
    WHERE client_id = ? 
      AND status = 'pendente' 
      AND due_date < ?
  `).get(clientId, today);
  
  return result.count > 0;
}

module.exports = {
  db,
  initDatabase,
  clientHasOverdueInvoices
};