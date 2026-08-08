const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Databáze
const db = new sqlite3.Database('./hokej.db', (err) => {
  if (err) console.error('Chyba DB:', err.message);
  else console.log('✅ SQLite databáze připravena (hokej.db)');
});

// Vytvoření tabulek a výchozích účtů
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user'
    )
  `);

  // Účty: Admin + Hráči
  db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES ('admin', 'admin123', 'admin')`);
  db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES ('Pepa', 'pepa123', 'user')`);
  db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES ('Jirka', 'jirka123', 'user')`);

  db.run(`
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      stadium TEXT NOT NULL,
      blue_score INTEGER NOT NULL,
      yellow_score INTEGER NOT NULL,
      note TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id INTEGER NOT NULL,
      author TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (match_id) REFERENCES matches (id) ON DELETE CASCADE
    )
  `);
});

// Kontrola práv
const authUser = (req, res, next) => {
  const username = req.headers['x-user-name'];
  if (!username) return res.status(401).json({ error: 'Musíš být přihlášen!' });
  req.username = username;
  next();
};

const authAdmin = (req, res, next) => {
  const username = req.headers['x-user-name'];
  db.get('SELECT role FROM users WHERE username = ?', [username], (err, user) => {
    if (err || !user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Nemáš admin práva!' });
    }
    next();
  });
};

// API Endpointy
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT username, role FROM users WHERE username = ? AND password = ?', [username, password], (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Špatné jméno nebo heslo!' });
    res.json({ success: true, user });
  });
});

app.get('/api/matches', (req, res) => {
  db.all('SELECT * FROM matches ORDER BY date DESC, id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/stats', (req, res) => {
  const sql = `
    SELECT 
      SUM(CASE WHEN blue_score > yellow_score THEN 1 ELSE 0 END) AS blue_wins,
      SUM(CASE WHEN yellow_score > blue_score THEN 1 ELSE 0 END) AS yellow_wins
    FROM matches
  `;
  db.get(sql, [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      blue_wins: row ? (row.blue_wins || 0) : 0,
      yellow_wins: row ? (row.yellow_wins || 0) : 0
    });
  });
});

app.post('/api/matches', authAdmin, (req, res) => {
  const { date, stadium, blue_score, yellow_score, note } = req.body;
  const sql = `INSERT INTO matches (date, stadium, blue_score, yellow_score, note) VALUES (?, ?, ?, ?, ?)`;
  db.run(sql, [date, stadium, blue_score, yellow_score, note || ''], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Zápas uložen!' });
  });
});

app.delete('/api/matches/:id', authAdmin, (req, res) => {
  db.run('DELETE FROM matches WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Zápas smazán!' });
  });
});

app.get('/api/matches/:id/comments', (req, res) => {
  db.all('SELECT * FROM comments WHERE match_id = ? ORDER BY created_at ASC', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/matches/:id/comments', authUser, (req, res) => {
  const { text } = req.body;
  if (!text || text.trim() === '') return res.status(400).json({ error: 'Prázdný komentář!' });

  const sql = `INSERT INTO comments (match_id, author, text) VALUES (?, ?, ?)`;
  db.run(sql, [req.params.id, req.username, text.trim()], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Komentář uložen!' });
  });
});

app.listen(PORT, () => console.log(`🚀 Server běží na http://localhost:${PORT}`));
