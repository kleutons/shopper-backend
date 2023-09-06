import mysql from 'mysql2';
import { Response } from 'express';

const pool = mysql.createPool({
    "user": "root",
    "password": "123",
    "database": "shopper",
    "host": "localhost",
    "port": 3306
})

export function handleDatabaseError(err: NodeJS.ErrnoException | null, res: Response) {
    if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao obter conexão do pool.' });
    }
}

export { pool };