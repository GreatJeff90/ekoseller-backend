const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all products for the homepage
router.get('/products', async (req, res) => {
    try {
        const [products] = await db.query('SELECT * FROM products');
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;