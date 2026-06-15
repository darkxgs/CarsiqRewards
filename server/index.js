import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

dotenv.config();

const { Pool } = pg;
const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_rewards_key_123';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_9EUemFjJtaD5@ep-broad-grass-a2gu2qzm-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

const initDB = async () => {
  try {
    // Tables will be created if they don't exist

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS branches (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) DEFAULT 'mixed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        value VARCHAR(50) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Delete old admin user if it exists
    await pool.query('DELETE FROM users WHERE username = $1', ['admin']);

    // Create default abbas user if not exists
    const adminCheck = await pool.query('SELECT * FROM users WHERE username = $1', ['abbas']);
    if (adminCheck.rows.length === 0) {
      const hashedPw = await bcrypt.hash('abbas123', 10);
      await pool.query('INSERT INTO users (username, password_hash) VALUES ($1, $2)', ['abbas', hashedPw]);
    }

    // Create default branches
    const branchesCheck = await pool.query('SELECT * FROM branches');
    if (branchesCheck.rows.length === 0) {
      await pool.query('INSERT INTO branches (name, type) VALUES ($1, $2)', ['القطاع', 'hours']);
      await pool.query('INSERT INTO branches (name, type) VALUES ($1, $2)', ['الصناعية', 'money']);
    }

    console.log("Database initialized successfully with auth and branches");
  } catch (err) {
    console.error("Error initializing database:", err);
  }
};

initDB();

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- AUTH API ---
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'المستخدم غير موجود' });

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(400).json({ error: 'كلمة المرور غير صحيحة' });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- BRANCHES API ---
app.get('/api/branches', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM branches ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/branches', authenticateToken, async (req, res) => {
  try {
    const { name, type } = req.body;
    const result = await pool.query('INSERT INTO branches (name, type) VALUES ($1, $2) RETURNING *', [name, type || 'mixed']);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/branches/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM branches WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- EMPLOYEES API ---
app.get('/api/employees/:branchId', authenticateToken, async (req, res) => {
  try {
    const { branchId } = req.params;
    const result = await pool.query('SELECT * FROM employees WHERE branch_id = $1 ORDER BY created_at ASC', [branchId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/employees/:branchId', authenticateToken, async (req, res) => {
  try {
    const { branchId } = req.params;
    const { name } = req.body;
    const result = await pool.query(
      'INSERT INTO employees (name, branch_id) VALUES ($1, $2) RETURNING *',
      [name, branchId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- TRANSACTIONS API ---
app.get('/api/transactions/:branchId', authenticateToken, async (req, res) => {
  try {
    const { branchId } = req.params;
    const result = await pool.query(
      'SELECT id, employee_id AS "employeeId", branch_id AS "branchId", type, value, notes, created_at FROM transactions WHERE branch_id = $1 ORDER BY created_at DESC',
      [branchId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/transactions/:branchId', authenticateToken, async (req, res) => {
  try {
    const { branchId } = req.params;
    const { employeeId, type, value, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO transactions (employee_id, branch_id, type, value, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id, employee_id AS "employeeId", branch_id AS "branchId", type, value, notes, created_at',
      [employeeId, branchId, type, value, notes]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId, type, value, notes } = req.body;
    const result = await pool.query(
      'UPDATE transactions SET employee_id = $1, type = $2, value = $3, notes = $4 WHERE id = $5 RETURNING id, employee_id AS "employeeId", branch_id AS "branchId", type, value, notes, created_at',
      [employeeId, type, value, notes, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM transactions WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
