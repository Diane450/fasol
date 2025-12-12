// server/auth.middleware.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your-super-secret-key-that-should-be-in-env-file'; // Тот же ключ, что и при создании токена

module.exports = function (req, res, next) {
    // Получаем токен из заголовка
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({ message: 'Нет токена, авторизация отклонена' });
    }

    try {
        // Убираем "Bearer " из начала строки
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Некорректный формат токена' });
        }
        
        // Расшифровываем токен
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Прикрепляем данные пользователя к запросу
        req.user = decoded.user;
        next(); // Пропускаем дальше
    } catch (e) {
        res.status(401).json({ message: 'Токен недействителен' });
    }
};