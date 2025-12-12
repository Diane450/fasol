require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db'); // Импортируем наше подключение
const authMiddleware = require('./auth.middleware');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const multer = require('multer'); // Библиотека для загрузки файлов
const upload = multer({ storage: multer.memoryStorage() }); // Храним файл в памяти перед записью в BLOB
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

// server/index.js (обновленный роут входа)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Ищем пользователя и его роль
        const [users] = await db.query('SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Неверный email или пароль' });
        }
        const user = users[0];

        // 2. Сравниваем пароль
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Неверный email или пароль' });
        }

        // --- ГЛАВНОЕ ИЗМЕНЕНИЕ ---
        let storeId = null;
        // 3. Если это менеджер, находим его магазин
        if (user.role_name === 'manager') {
            const [employeeData] = await db.query('SELECT store_id FROM employees WHERE user_id = ?', [user.id]);
            if (employeeData.length > 0) {
                storeId = employeeData[0].store_id;
            }
        }

        // 4. Создаем JWT токен с дополнительной информацией
        const payload = {
            user: {
                id: user.id,
                role: user.role_name,
                store_id: storeId // Добавляем ID магазина в токен!
            }
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
        
        // 5. Отправляем все данные на фронтенд
        res.json({
            token,
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role_name,
                store_id: storeId // И в информацию о пользователе тоже
            }
        });

    } catch (err) {
        console.error("Ошибка входа:", err);
        res.status(500).json({ message: "Внутренняя ошибка сервера" });
    }
});

// GET /api/profile - Получить данные своего профиля
app.get('/api/profile', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const [userData] = await db.query(`
            SELECT u.id, u.first_name, u.last_name, u.email, u.phone, cd.delivery_address
            FROM users u
            LEFT JOIN client_details cd ON u.id = cd.user_id
            WHERE u.id = ?
        `, [userId]);
        res.json(userData[0]);
    } catch (err) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// PUT /api/profile - Обновить данные своего профиля
app.put('/api/profile', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { first_name, last_name, phone, delivery_address } = req.body;

        await db.query('UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?', [first_name, last_name, phone, userId]);
        await db.query('UPDATE client_details SET delivery_address = ? WHERE user_id = ?', [delivery_address, userId]);
        
        res.json({ message: 'Профиль успешно обновлен' });
    } catch (err) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// GET /api/orders/my - Получить историю своих заказов
app.get('/api/orders/my', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const [orders] = await db.query(`
            SELECT o.id, o.total_price, o.created_at, os.label as status
            FROM orders o
            JOIN order_statuses os ON o.status_id = os.id
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC
        `, [userId]);
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});


// --- РОУТЫ ДЛЯ АДМИНКИ ---

// GET /api/orders - Получить ВСЕ заказы (только для админа/менеджера)
app.get('/api/orders', authMiddleware, async (req, res) => {
    // Здесь можно добавить проверку роли: if (req.user.role !== 'admin' && req.user.role !== 'manager') ...
    try {
        const [orders] = await db.query(`
            SELECT o.id, o.total_price, o.created_at, os.label as status, os.id as status_id, u.first_name, u.last_name
            FROM orders o
            JOIN order_statuses os ON o.status_id = os.id
            JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        `);
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// PATCH /api/orders/:id/status - Изменить статус заказа
app.patch('/api/orders/:id/status', authMiddleware, async (req, res) => {
    // Здесь можно добавить проверку роли, если нужно
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
        return res.status(403).json({ message: 'Доступ запрещен' });
    }

    try {
        const { id } = req.params; // <-- ИСПРАВЛЕНО
        const { statusId } = req.body;
        
        if (!id || !statusId) {
            return res.status(400).json({ message: 'Не предоставлен ID заказа или статус' });
        }

        const [result] = await db.query('UPDATE orders SET status_id = ? WHERE id = ?', [statusId, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Заказ с таким ID не найден' });
        }
        
        res.json({ message: 'Статус заказа обновлен' });

    } catch (err) {
        console.error("Ошибка при смене статуса:", err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// GET /api/order-statuses - Получить все возможные статусы (для выпадающего списка)
app.get('/api/order-statuses', authMiddleware, async (req, res) => {
    try {
        const [statuses] = await db.query('SELECT * FROM order_statuses');
        res.json(statuses);
    } catch (err) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// server/index.js -> добавляем этот код

// POST /api/orders - Создание нового заказа
app.post('/api/orders', authMiddleware, async (req, res) => {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const { store_id, items } = req.body;
        const user_id = req.user.id;

        if (!store_id || !items || items.length === 0) {
            return res.status(400).json({ message: 'Некорректные данные заказа' });
        }

        // --- ГЛАВНАЯ ПРОВЕРКА ОСТАТКОВ ---
        for (const item of items) {
            const [stockRows] = await connection.query(
                'SELECT p.name, sp.quantity FROM store_products sp JOIN products p ON sp.product_id = p.id WHERE sp.product_id = ? AND sp.store_id = ? FOR UPDATE',
                [item.product_id, store_id]
            );

            if (stockRows.length === 0 || stockRows[0].quantity < item.quantity) {
                await connection.rollback();
                const productName = stockRows.length > 0 ? stockRows[0].name : `Товар #${item.product_id}`;
                return res.status(409).json({ message: `Товара "${productName}" недостаточно на складе! В наличии: ${stockRows[0]?.quantity || 0} шт.` });
            }
        }

        // --- РАСЧЕТ СУММЫ НА СЕРВЕРЕ ---
        let calculatedTotalPrice = 0;
        for (const item of items) {
            const [productRows] = await connection.query('SELECT price FROM products WHERE id = ?', [item.product_id]);
            calculatedTotalPrice += productRows[0].price * item.quantity;
        }

        // --- СОЗДАНИЕ ЗАКАЗА ---
        const [orderResult] = await connection.query(
            'INSERT INTO orders (user_id, store_id, total_price, status_id) VALUES (?, ?, ?, ?)',
            [user_id, store_id, calculatedTotalPrice, 1]
        );
        const orderId = orderResult.insertId;

        // --- СОЗДАНИЕ ПОЗИЦИЙ ЗАКАЗА И ОБНОВЛЕНИЕ ОСТАТКОВ ---
        for (const item of items) {
            const [productRows] = await connection.query('SELECT price FROM products WHERE id = ?', [item.product_id]);
            await connection.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)',
                [orderId, item.product_id, item.quantity, productRows[0].price]
            );
            await connection.query(
                'UPDATE store_products SET quantity = quantity - ? WHERE product_id = ? AND store_id = ?',
                [item.quantity, item.product_id, store_id]
            );
        }

        await connection.commit();
        res.status(201).json({ message: 'Заказ успешно создан', orderId });

    } catch (error) {
        await connection.rollback();
        console.error("Ошибка при создании заказа:", error);
        res.status(500).json({ message: 'Ошибка сервера при создании заказа' });
    } finally {
        if (connection) connection.release();
    }
});

// Middleware для проверки ролей
const checkAdminRole = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
        return res.status(403).json({ message: 'Доступ запрещен. Требуются права администратора.' });
    }
    next();
};

// 1. READ: Получить ВСЕ товары для админки (с поиском и фильтрами)
app.get('/api/admin/products', authMiddleware, checkAdminRole, async (req, res) => {
    try {
        const { search = '', category_id } = req.query;
        let queryParams = [];
        let sql = `
            SELECT p.id, p.name, p.price, p.description, c.name as category_name, p.category_id
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE 1=1
        `;

        if (search) {
            sql += ' AND p.name LIKE ?';
            queryParams.push(`%${search}%`);
        }
        if (category_id) {
            sql += ' AND p.category_id = ?';
            queryParams.push(category_id);
        }
        sql += ' ORDER BY p.id DESC';
        const [products] = await db.query(sql, queryParams);
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: "Ошибка сервера" });
    }
});

// 2. CREATE: Добавить новый товар (с загрузкой картинки в BLOB)
app.post('/api/admin/products', authMiddleware, checkAdminRole, upload.single('image'), async (req, res) => {
    try {
        const { name, description, price, category_id, store_id, quantity } = req.body;
        const image = req.file ? req.file.buffer : null; // Картинка приходит как бинарный буфер

        const [result] = await db.query(
            'INSERT INTO products (name, description, price, category_id, image) VALUES (?, ?, ?, ?, ?)',
            [name, description, price, category_id, image]
        );
        const newProductId = result.insertId;

        // Добавляем информацию о наличии на склад
        await db.query(
            'INSERT INTO store_products (store_id, product_id, quantity) VALUES (?, ?, ?)',
            [store_id, newProductId, quantity]
        );

        res.status(201).json({ message: 'Товар успешно создан', productId: newProductId });
    } catch (err) {
        console.error("Ошибка при создании товара:", err);
        res.status(500).json({ message: "Ошибка сервера" });
    }
});

// 3. UPDATE: Обновить товар
app.put('/api/admin/products/:id', authMiddleware, checkAdminRole, upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, category_id } = req.body;
        const image = req.file ? req.file.buffer : null;

        let sql = 'UPDATE products SET name = ?, description = ?, price = ?, category_id = ?';
        let queryParams = [name, description, price, category_id];

        // Обновляем картинку, только если она была загружена
        if (image) {
            sql += ', image = ?';
            queryParams.push(image);
        }

        sql += ' WHERE id = ?';
        queryParams.push(id);

        await db.query(sql, queryParams);
        res.json({ message: 'Товар успешно обновлен' });
    } catch (err) {
        res.status(500).json({ message: "Ошибка сервера" });
    }
});

// 4. DELETE: Удалить товар
app.delete('/api/admin/products/:id', authMiddleware, checkAdminRole, async (req, res) => {
    try {
        const { id } = req.params;
        // ON DELETE CASCADE в базе данных автоматически удалит записи из store_products и order_items
        await db.query('DELETE FROM products WHERE id = ?', [id]);
        res.json({ message: 'Товар успешно удален' });
    } catch (err) {
        res.status(500).json({ message: "Ошибка сервера" });
    }
});

// GET /api/admin/stock - Получить все остатки на складах
app.get('/api/admin/stock', authMiddleware, checkAdminRole, async (req, res) => {
    try {
        const { search = '' } = req.query;
        const { role, store_id } = req.user; // Получаем данные пользователя из токена

        let queryParams = [];
        let sql = `
            SELECT 
                sp.id, 
                p.name as product_name, 
                s.address as store_name, 
                sp.quantity
            FROM store_products sp
            JOIN products p ON sp.product_id = p.id
            JOIN stores s ON sp.store_id = s.id
            WHERE 1=1
        `;
        
        // --- ГЛАВНОЕ ИЗМЕНЕНИЕ ---
        // Если это менеджер, жестко фильтруем по его магазину
        if (role === 'manager') {
            sql += ' AND sp.store_id = ?';
            queryParams.push(store_id);
        }

        if (search) {
            sql += ' AND (p.name LIKE ?' + (role === 'admin' ? ' OR s.address LIKE ?' : '') + ')';
            queryParams.push(`%${search}%`);
            if (role === 'admin') {
                queryParams.push(`%${search}%`); // Админ может искать и по магазину
            }
        }
        
        sql += ' ORDER BY s.address, p.name';
        const [stockItems] = await db.query(sql, queryParams);
        res.json(stockItems);
    } catch (err) {
        console.error("Ошибка при получении остатков:", err);
        res.status(500).json({ message: "Ошибка сервера" });
    }
});

// PUT /api/admin/stock/:id - Обновить количество товара на складе
app.put('/api/admin/stock/:id', authMiddleware, checkAdminRole, async (req, res) => {
    try {
        const { id } = req.params; // ID из таблицы store_products
        const { quantity } = req.body;

        if (quantity === undefined || quantity < 0) {
            return res.status(400).json({ message: 'Некорректное количество' });
        }

        await db.query('UPDATE store_products SET quantity = ? WHERE id = ?', [quantity, id]);
        res.json({ message: 'Количество товара обновлено' });
    } catch (err) {
        console.error("Ошибка при обновлении остатков:", err);
        res.status(500).json({ message: "Ошибка сервера" });
    }
});

// GET /api/orders/:id - Получить детали конкретного заказа
app.get('/api/orders/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { role, id: userId } = req.user; // Получаем роль и ID пользователя из токена

        // 1. Получаем "шапку" заказа
        const [orderRows] = await db.query(
            `SELECT o.*, s.address as store_name, u.first_name, u.last_name 
             FROM orders o 
             JOIN stores s ON o.store_id = s.id
             JOIN users u ON o.user_id = u.id
             WHERE o.id = ?`, [id]
        );
        
        if (orderRows.length === 0) {
            return res.status(404).json({ message: 'Заказ не найден' });
        }

        const order = orderRows[0];
        
        // 2. Проверка прав: Админ/менеджер может видеть любой заказ. Клиент - только свой.
        if (role === 'client' && order.user_id !== userId) {
            return res.status(403).json({ message: 'Доступ запрещен' });
        }

        // 3. Получаем список товаров в этом заказе
        const [orderItems] = await db.query(
            `SELECT oi.quantity, oi.price_at_purchase, p.name as product_name 
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = ?`, [id]
        );

        // 4. Собираем и отправляем полный ответ
        res.json({ ...order, items: orderItems });

    } catch (err) {
        console.error("Ошибка при получении деталей заказа:", err);
        res.status(500).json({ message: "Ошибка сервера" });
    }
});

// --- КОМАНДА, КОТОРАЯ ЗАСТАВЛЯЕТ СЕРВЕР ЖДАТЬ ---
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен и слушает порт http://localhost:${PORT}`);
});