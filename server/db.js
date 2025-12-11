const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'cfif31.ru',
    user: 'ISPr24-38_IbragimovaDM',        
    password: 'ISPr24-38_IbragimovaDM',        
    database: 'ISPr24-38_IbragimovaDM_Fasol', 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

console.log("Попытка подключения к базе данных...");

module.exports = promisePool;