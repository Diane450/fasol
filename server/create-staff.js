// server/create-staff.js
const bcrypt = require('bcryptjs');
const db = require('./db'); // Используем наше готовое подключение к БД

async function createStaffUsers() {
    console.log('--- Начинаем создание административных пользователей ---');

    try {
        // --- 1. Создаем АДМИНИСТРАТОРА ---
        const adminEmail = 'admin@shop.com';
        const adminPassword = 'admin'; // Придумай надежный пароль

        // Хешируем пароль
        let salt = await bcrypt.genSalt(10);
        let password_hash = await bcrypt.hash(adminPassword, salt);
        
        // Вставляем данные в таблицу users
        await db.query(
            `INSERT INTO users (role_id, email, password_hash, first_name, last_name, phone)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [3, adminEmail, password_hash, 'Главный', 'Администратор', '11111111111'] // role_id = 3 для админа
        );
        console.log(`✅ Пользователь АДМИН (email: ${adminEmail}, pass: ${adminPassword}) успешно создан.`);


        // --- 2. Создаем МЕНЕДЖЕРА ---
        const managerEmail = 'manager@shop.com';
        const managerPassword = 'manager'; // Придумай надежный пароль

        // Хешируем пароль
        salt = await bcrypt.genSalt(10);
        password_hash = await bcrypt.hash(managerPassword, salt);

        // Вставляем данные в таблицу users
        const [result] = await db.query(
            `INSERT INTO users (role_id, email, password_hash, first_name, last_name, phone)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [2, managerEmail, password_hash, 'Иван', 'Менеджеров', '22222222222'] // role_id = 2 для менеджера
        );
        const newManagerId = result.insertId;

        // ВАЖНО: Привязываем менеджера к первому магазину и первой должности
        // Убедись, что в твоих таблицах stores и positions есть записи с id=1!
        await db.query(
            `INSERT INTO employees (user_id, store_id, position_id)
             VALUES (?, ?, ?)`,
            [newManagerId, 1, 1] // user_id, store_id=1, position_id=1
        );
        console.log(`✅ Пользователь МЕНЕДЖЕР (email: ${managerEmail}, pass: ${managerPassword}) успешно создан и привязан к магазину №1.`);


        console.log('--- Все пользователи успешно созданы! ---');

    } catch (error) {
        // Если пользователь уже существует, INSERT выдаст ошибку, и мы ее увидим
        console.error('❌ ОШИБКА:', error.message);
    } finally {
        // Завершаем процесс, чтобы скрипт не "висел"
        process.exit();
    }
}

// Запускаем нашу функцию
createStaffUsers();