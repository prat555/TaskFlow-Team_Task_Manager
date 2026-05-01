const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required for Neon
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin','member')),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS project_members (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin','member')),
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(project_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_by INTEGER NOT NULL REFERENCES users(id),
        status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','in_progress','done')),
        priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low','medium','high')),
        due_date DATE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Neon DB initialized');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
