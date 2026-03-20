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

// Search products by name or category
router.get('/search', async (req, res) => {
    const { query } = req.query; // Get search term from URL (e.g., ?query=watch)

    if (!query) {
        return res.status(400).json({ error: "Search query is required" });
    }

    try {
        const sql = `
            SELECT * FROM products 
            WHERE name LIKE ? OR category LIKE ? OR description LIKE ?
        `;
        const searchTerm = `%${query}%`;
        const [results] = await db.query(sql, [searchTerm, searchTerm, searchTerm]);
        
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET list of all active markets
router.get('/active-markets', async (req, res) => {
    try {
        const [markets] = await db.query('SELECT DISTINCT market FROM users WHERE role = "seller" AND market IS NOT NULL');
        res.json(markets.map(m => m.market));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET order details for tracking
router.get('/order/:orderId', async (req, res) => {
    try {
        const [order] = await db.query('SELECT * FROM orders WHERE id = ?', [req.params.orderId]);
        if (order.length === 0) return res.status(404).json({ error: "Order not found" });
        
        res.json(order[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;