const express = require('express');
const router = express.Router();
const db = require('../db');

// POST a new product (Seller only)
router.post('/add-product', async (req, res) => {
    const { name, price, description, category, image_url, seller_id } = req.body;

    if (!name || !price || !seller_id) {
        return res.status(400).json({ error: "Name, price, and seller_id are required" });
    }

    try {
        const query = `
            INSERT INTO products (name, price, description, category, image_url, seller_id) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(query, [name, price, description, category, image_url, seller_id]);

        res.status(201).json({ 
            status: "success", 
            message: "Product added to your shop",
            productId: result.insertId 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET products by market
router.get('/market/:marketName', async (req, res) => {
    const market = req.params.marketName;

    try {
        const query = `
            SELECT p.* FROM products p
            JOIN users u ON p.seller_id = u.id
            WHERE u.market = ?
        `;
        const [products] = await db.query(query, [market]);
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET products by a specific seller
router.get('/seller/:sellerId', async (req, res) => {
    const sellerId = req.params.sellerId;
    try {
        const [products] = await db.query('SELECT * FROM products WHERE seller_id = ?', [sellerId]);
        const [sellerInfo] = await db.query('SELECT username, market, full_name FROM users WHERE id = ?', [sellerId]);
        
        res.json({
            seller: sellerInfo[0],
            products: products
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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