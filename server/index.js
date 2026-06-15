import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const app = express();
app.use(cors());
app.use(express.json());

// Set up PostgreSQL connection pool using Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_9EUemFjJtaD5@ep-broad-grass-a2gu2qzm-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

// Initialize database tables
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        branch VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        branch VARCHAR(50) NOT NULL,
        type VARCHAR(50) NOT NULL,
        value VARCHAR(50) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Database initialized successfully");
  } catch (err) {
    console.error("Error initializing database:", err);
  }
};

initDB();

// API Endpoints

// Get all employees for a branch
app.get('/api/employees/:branch', async (req, res) => {
  try {
    const { branch } = req.params;
    const result = await pool.query(
      'SELECT * FROM employees WHERE branch = $1 ORDER BY created_at ASC',
      [branch]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add an employee
app.post('/api/employees/:branch', async (req, res) => {
  try {
    const { branch } = req.params;
    const { name } = req.body;
    const result = await pool.query(
      'INSERT INTO employees (name, branch) VALUES ($1, $2) RETURNING *',
      [name, branch]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all transactions for a branch
app.get('/api/transactions/:branch', async (req, res) => {
  try {
    const { branch } = req.params;
    const result = await pool.query(
      'SELECT * FROM transactions WHERE branch = $1 ORDER BY created_at DESC',
      [branch]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a transaction
app.post('/api/transactions/:branch', async (req, res) => {
  try {
    const { branch } = req.params;
    const { employeeId, type, value, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO transactions (employee_id, branch, type, value, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [employeeId, branch, type, value, notes]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
