const express = require('express');
const router = express.Router();
const db = require('../db'); // Import your promise-based pool

// 1. GET all categories for the top slider
router.get('/categories', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM categories');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. GET Hot Selling products
router.get('/products/hot-selling', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM products WHERE is_top_seller = 1');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. GET Recommended products
router.get('/products/recommended', async (req, res) => {
    try {
        const [rows] = await db.json('SELECT * FROM products WHERE is_recommended = 1');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. GET Deal of the Day (Joins products with deals table)
router.get('/deals', async (req, res) => {
    try {
        const query = `
            SELECT d.discount_label, d.ends_at, p.* FROM deals d 
            JOIN products p ON d.product_id = p.id
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;