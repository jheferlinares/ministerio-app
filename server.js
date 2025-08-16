const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/ministerio_db',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Crear tablas si no existen
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hermanos (
        id BIGINT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        localidad VARCHAR(100),
        grupo_id BIGINT
      );
      
      CREATE TABLE IF NOT EXISTS familias (
        id BIGINT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        localidad VARCHAR(100),
        hermano_id BIGINT
      );
      
      CREATE TABLE IF NOT EXISTS grupos (
        id BIGINT PRIMARY KEY,
        hermanos TEXT
      );
    `);
  } catch (err) {
    console.error('Error creating tables:', err);
  }
}

// API Routes
app.get('/api/data', async (req, res) => {
  try {
    const hermanos = await pool.query('SELECT * FROM hermanos');
    const familias = await pool.query('SELECT * FROM familias');
    const grupos = await pool.query('SELECT * FROM grupos');
    
    res.json({
      hermanos: hermanos.rows,
      familias: familias.rows,
      grupos: grupos.rows.map(g => ({
        ...g,
        hermanos: JSON.parse(g.hermanos || '[]')
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/data', async (req, res) => {
  const { hermanos, familias, grupos } = req.body;
  
  try {
    await pool.query('BEGIN');
    
    await pool.query('DELETE FROM hermanos');
    await pool.query('DELETE FROM familias');
    await pool.query('DELETE FROM grupos');
    
    for (const h of hermanos || []) {
      await pool.query(
        'INSERT INTO hermanos (id, name, localidad, grupo_id) VALUES ($1, $2, $3, $4)',
        [h.id, h.name, h.localidad, h.grupoId]
      );
    }
    
    for (const f of familias || []) {
      await pool.query(
        'INSERT INTO familias (id, name, localidad, hermano_id) VALUES ($1, $2, $3, $4)',
        [f.id, f.name, f.localidad, f.hermanoId]
      );
    }
    
    for (const g of grupos || []) {
      await pool.query(
        'INSERT INTO grupos (id, hermanos) VALUES ($1, $2)',
        [g.id, JSON.stringify(g.hermanos)]
      );
    }
    
    await pool.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

initDB().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});