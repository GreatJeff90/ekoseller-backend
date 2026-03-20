const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken');

router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        // 1. Generate a salt and hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 2. Store the HASHED password, not the plain one
        const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
        const [result] = await db.query(query, [username, email, hashedPassword]);

        res.status(201).json({ 
            status: "success", 
            userId: result.insertId 
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "Email or Username already exists" });
        }
        res.status(500).json({ error: err.message });
    }
});

// Login Route with JWT
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // --- NEW: Generate JWT Token ---
        const token = jwt.sign(
            { id: user.id, email: user.email }, // Data to hide in the token
            process.env.JWT_SECRET,             // Your secret key from Railway
            { expiresIn: '1d' }                 // Token expires in 1 day
        );

        res.json({
            status: "success",
            message: "Login successful",
            token: token, // Send this back to your React Native app!
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;