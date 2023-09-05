import mysql from 'mysql';

const pool = mysql.createPool({
    "user": "root",
    "password": "123",
    "database": "shopper",
    "host": "localhost",
    "port": 3306
})

export { pool };