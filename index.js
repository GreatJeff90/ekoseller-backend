const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Loads your DB_HOST, DB_USER, etc. from the .env file

// Import the route files
const shopRoutes = require('./routes/shop'); 
const userRoutes = require('./routes/user');
const db = require('./db'); // Import database connection for testing logic

const app = express();

// Middlewares
app.use(cors()); 
app.use(express.json()); // Essential for reading JSON from Thunder Client/Mobile App

// Set up the base paths for your APIs
app.use('/api/users', userRoutes);
app.use('/api/shop', shopRoutes); 

// Test route to verify the server and DB connection are healthy
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    res.json({ 
      status: 'Server is running', 
      db_connection: 'Success',
      timestamp: new Date() 
    });
  } catch (err) {
    res.status(500).json({ status: 'Error', message: err.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Connected to MySQL database via db.js configuration');
});