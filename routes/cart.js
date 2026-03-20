const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/add', async (req, res) => {
    const { user_id, product_id, quantity } = req.body;

    try {
        // Check if item already in cart to increment quantity instead
        const [existing] = await db.query('SELECT * FROM cart WHERE user_id = ? AND product_id = ?', [user_id, product_id]);

        if (existing.length > 0) {
            await db.query('UPDATE cart SET quantity = quantity + ? WHERE id = ?', [quantity || 1, existing[0].id]);
        } else {
            await db.query('INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)', [user_id, product_id, quantity || 1]);
        }
        res.json({ status: "success", message: "Added to cart" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});