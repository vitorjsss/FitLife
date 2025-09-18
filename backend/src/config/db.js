// db.js
import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5433,
    user: process.env.DB_USER || 'fitlife',
    password: process.env.DB_PASSWORD || 'fitlife',
    database: process.env.DB_NAME || 'fitlife'
});