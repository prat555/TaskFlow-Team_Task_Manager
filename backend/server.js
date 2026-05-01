require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./db/database');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));

// Root route for browser checks
app.get('/', (req, res) => {
  res.send('TaskFlow API is running. Use /api/health or the /api routes.');
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}).catch(err => {
  console.error('Failed to init DB:', err);
  process.exit(1);
});
