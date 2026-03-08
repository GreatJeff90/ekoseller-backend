const express = require('express');
const router = express.Router();
const db = require('../db');

// LOGIN Route (This one is working!)
router.post('/login', async (req, res) => {
  /* ... your login code ... */
});

// REGISTER Route (Add this carefully)
router.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)',
      [name, email, phone, password]
    );
    res.status(201).json({ status: 'success', userId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; // Ensure this is at the very bottom!