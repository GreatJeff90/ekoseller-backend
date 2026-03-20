const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/register', async (req, res) => {
    const { 
        username, 
        email, 
        password, 
        role, 
        full_name, 
        phone_number, 
        country, 
        market 
    } = req.body;

    // Basic validation
    if (!username || !email || !password || !role) {
        return res.status(400).json({ error: "Required fields are missing (username, email, password, role)" });
    }

    try {
        // 1. Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 2. Insert into the database with the new columns
        const query = `
            INSERT INTO users (username, email, password, role, full_name, phone_number, country, market) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(query, [
            username, 
            email, 
            hashedPassword, 
            role, 
            full_name || null, 
            phone_number || null, 
            country || 'Nigeria', 
            market || null
        ]);

        res.status(201).json({ 
            status: "success", 
            message: "User registered successfully",
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

// KYC Verification Route
router.put('/verify-kyc', async (req, res) => {
    const { userId, nin_number } = req.body;

    if (!userId || !nin_number) {
        return res.status(400).json({ error: "User ID and NIN number are required" });
    }

    try {
        const query = `UPDATE users SET nin_number = ?, is_verified = TRUE WHERE id = ?`;
        const [result] = await db.query(query, [nin_number, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ 
            status: "success", 
            message: "KYC verification submitted successfully" 
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 1. Request Reset (Generates the 6-digit code)
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6 digits

    try {
        const [result] = await db.query('UPDATE users SET reset_code = ? WHERE email = ?', [code, email]);

        // In a real app, you'd email the code here. For now, we'll return it in the response.
        res.json({ status: "success", message: "OTP sent", debug_code: code });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Reset Password (The final step in your Figma flow)
router.post('/reset-password', async (req, res) => {
    const { email, code, newPassword } = req.body;

    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ? AND reset_code = ?', [email, code]);

        if (users.length === 0) {
            return res.status(400).json({ error: "Invalid code or email" });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password = ?, reset_code = NULL WHERE email = ?', [hashed, email]);

        res.json({ status: "success", message: "Password updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;