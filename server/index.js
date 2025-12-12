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

// server/index.js -> добавляем этот код

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your-super-secret-key-that-should-be-in-env-file'; // В реальном проекте это должно быть в .env!

// server/index.js (обновленный роут регистрации)

// POST /api/auth/register - Регистрация с автоматическим входом
app.post('/api/auth/register', async (req, res) => {
    try {
        const { first_name, last_name, email, password, phone } = req.body;

        // 1. Проверка на существующего пользователя
        const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'Пользователь с таким email уже существует' });
        }

        // 2. Хеширование пароля
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        
        // 3. Получение ID роли 'client'
        const [clientRole] = await db.query("SELECT id FROM roles WHERE name = 'client'");
        if (!clientRole.length) throw new Error("Role 'client' not found");
        const role_id = clientRole[0].id;

        // 4. Сохранение пользователя в БД
        const [result] = await db.query(
            'INSERT INTO users (first_name, last_name, email, password_hash, phone, role_id) VALUES (?, ?, ?, ?, ?, ?)',
            [first_name, last_name, email, password_hash, phone, role_id]
        );
        const newUserId = result.insertId;

        // 5. Создание записи в client_details
        await db.query('INSERT INTO client_details (user_id) VALUES (?)', [newUserId]);

        // --- ЛОГИКА АВТО-ЛОГИНА ---
        // 6. Создаем JWT токен, как при логине
        const payload = { user: { id: newUserId, role: 'client' } };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

        // 7. Отправляем токен и данные нового пользователя на фронтенд
        res.status(201).json({
            token,
            user: {
                id: newUserId,
                first_name,
                last_name,
                email,
                role: 'client'
            }
        });

    } catch (err) {
        console.error("Ошибка регистрации:", err);
        res.status(500).json({ message: "Внутренняя ошибка сервера" });
    }
});

// POST /api/auth/login - Вход пользователя
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const [users] = await db.query('SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Неверный email или пароль' });
        }
        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Неверный email или пароль' });
        }

        const payload = {
            user: {
                id: user.id,
                role: user.role_name
            }
        };

        jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ 
                token,
                user: {
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    role: user.role_name
                }
            });
        });

    } catch (err) {
        console.error("Ошибка входа:", err);
        res.status(500).json({ message: "Внутренняя ошибка сервера" });
    }
});

// --- КОМАНДА, КОТОРАЯ ЗАСТАВЛЯЕТ СЕРВЕР ЖДАТЬ ---
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен и слушает порт http://localhost:${PORT}`);
});