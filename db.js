// db.js - MySQL connection pool
import 'dotenv/config'; // Loads variables immediately
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     process.env.DB_PORT     || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'excel_sanitizer',
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0,
    timezone: 'Z',       // store/retrieve dates as UTC
});

// Verify the connection is alive at startup
export async function testConnection() {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.ping();
        console.log('✅ MySQL connected successfully');
    } catch (err) {
        console.error('❌ MySQL connection failed:', err.message);
        process.exit(1);   // fail fast – app is unusable without DB
    } finally {
        if (conn) conn.release();
    }
}

export default pool;
