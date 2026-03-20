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

// GET items in a specific user's cart
router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const sql = `
            SELECT c.id AS cart_id, c.quantity, p.name, p.price, p.image_url, p.id AS product_id
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = ?
        `;
        const [cartItems] = await db.query(sql, [userId]);
        
        // Calculate total for the "Checkout" button in your Figma
        const total = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        res.json({
            items: cartItems,
            total_amount: total
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Place Order (Checkout)
router.post('/checkout', async (req, res) => {
    const { user_id, total_amount, delivery_method, address, phone_number } = req.body;

    try {
        // 1. Create the order
        const [order] = await db.query(
            `INSERT INTO orders (buyer_id, total_amount, delivery_method, address, phone_number, estimated_delivery) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, total_amount, delivery_method, address, phone_number, '11 hours'] // Matches your "Track Order" Figma
        );

        // 2. Clear the cart for this user
        await db.query('DELETE FROM cart WHERE user_id = ?', [user_id]);

        res.json({ 
            status: "success", 
            message: "Order placed successfully", 
            orderId: order.insertId 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;