const express = require('express'); 
const cors = require('cors'); 
const db = require('./db'); 
const userRoutes = require('./routes/user'); // 1. Import the routes first
require('dotenv').config(); 

const app = express(); // 2. Initialize the app

// 3. Middlewares
app.use(cors()); 
app.use(express.json()); 

// 4. Use the routes AFTER 'app' is initialized
app.use('/api/users', userRoutes); 

// Test route to verify the DB connection is still working
app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    res.json({ status: 'success', data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));