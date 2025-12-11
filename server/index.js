// server/index.js (ПОЛНАЯ ПРАВИЛЬНАЯ ВЕРСИЯ)
const express = require('express');
const cors = require('cors');
const db = require('./db'); // Импортируем наше подключение

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(cors());

// --- НАШИ API РОУТЫ ---

// Роут для проверки базы данных - Получить все роли
app.get('/api/roles', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM roles');
        res.json(rows);
    } catch (err) {
        console.error("Ошибка в /api/roles:", err);
        res.status(500).json({ error: "Ошибка базы данных" });
    }
});

// GET /api/products - Умный роут для получения товаров
app.get('/api/products', async (req, res) => {
    try {
        const { store_id, category_id, sortBy, order = 'asc' } = req.query;

        if (!store_id) {
            return res.status(400).json({ message: 'Параметр store_id является обязательным' });
        }

        let queryParams = [store_id];
        let sql = `
            SELECT 
                p.id, p.name, p.description, p.price, p.image,
                c.name as category_name,
                sp.quantity
            FROM products p
            JOIN store_products sp ON p.id = sp.product_id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE sp.store_id = ? AND sp.quantity > 0
        `;

        if (category_id) {
            sql += ' AND p.category_id = ?';
            queryParams.push(category_id);
        }

        const allowedSortBy = ['price', 'name'];
        const allowedOrder = ['asc', 'desc'];

        if (sortBy && allowedSortBy.includes(sortBy)) {
            const sortOrder = allowedOrder.includes(order.toLowerCase()) ? order : 'asc';
            sql += ` ORDER BY p.${sortBy} ${sortOrder}`;
        }

        const [products] = await db.query(sql, queryParams);
        res.json(products);

    } catch (err) {
        console.error("Ошибка при получении товаров:", err);
        res.status(500).json({ message: "Внутренняя ошибка сервера" });
    }
});

// GET /api/stores - Получить все магазины
app.get('/api/stores', async (req, res) => {
    try {
        const [stores] = await db.query('SELECT id, address, city FROM stores');
        res.json(stores);
    } catch (err) {
        console.error("Ошибка при получении магазинов:", err);
        res.status(500).json({ message: "Внутренняя ошибка сервера" });
    }
});

// GET /api/categories - Получить все категории
app.get('/api/categories', async (req, res) => {
    try {
        const [categories] = await db.query('SELECT id, name FROM categories');
        res.json(categories);
    } catch (err) {
        console.error("Ошибка при получении категорий:", err);
        res.status(500).json({ message: "Внутренняя ошибка сервера" });
    }
});

// --- КОМАНДА, КОТОРАЯ ЗАСТАВЛЯЕТ СЕРВЕР ЖДАТЬ ---
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен и слушает порт http://localhost:${PORT}`);
});