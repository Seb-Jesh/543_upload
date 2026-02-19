// models/UserModel.js - all user-related DB queries
import pool from '../db.js';
import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10;

const UserModel = {

    // ── Reads ────────────────────────────────────────────────────────────────

    /** Return full user row by username, or null if not found */
    async findByUsername(username) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE username = ? LIMIT 1',
            [username]
        );
        return rows[0] ?? null;
    },

    /** Return full user row by email, or null if not found */
    async findByEmail(email) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ? LIMIT 1',
            [email]
        );
        return rows[0] ?? null;
    },

    /** Return safe (no password) user row by id, or null */
    async findById(id) {
        const [rows] = await pool.execute(
            'SELECT id, username, email, role, created_at FROM users WHERE id = ? LIMIT 1',
            [id]
        );
        return rows[0] ?? null;
    },

    /** Return all users (safe columns only) */
    async findAll() {
        const [rows] = await pool.execute(
            'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
        );
        return rows;
    },

    // ── Writes ───────────────────────────────────────────────────────────────

    /**
     * Create a new user.
     * Throws if username or email already exists (MySQL duplicate key error).
     */
    async create({ username, password, email, role = 'user' }) {
        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

        const [result] = await pool.execute(
            `INSERT INTO users (username, password, email, role)
             VALUES (?, ?, ?, ?)`,
            [username, hashedPassword, email, role]
        );

        return { id: result.insertId, username, email, role };
    },

    /** Update user role */
    async updateRole(id, role) {
        const [result] = await pool.execute(
            'UPDATE users SET role = ? WHERE id = ?',
            [role, id]
        );
        return result.affectedRows > 0;
    },

    /** Update user password (accepts plain-text; hashes internally) */
    async updatePassword(id, newPassword) {
        const hashed = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
        const [result] = await pool.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashed, id]
        );
        return result.affectedRows > 0;
    },

    /** Soft-delete or hard-delete a user */
    async deleteById(id) {
        const [result] = await pool.execute(
            'DELETE FROM users WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    },

    // ── Auth helpers ─────────────────────────────────────────────────────────

    /**
     * Verify a plain-text password against the stored hash.
     * Returns the safe user object on success, null on failure.
     */
    async verifyPassword(username, plainPassword) {
        const user = await UserModel.findByUsername(username);
        if (!user) return null;

        const match = await bcrypt.compare(plainPassword, user.password);
        if (!match) return null;

        // Strip password before returning
        const { password: _pw, ...safeUser } = user;
        return safeUser;
    },

    // ── Existence checks (fast, no full row load) ─────────────────────────────

    async usernameExists(username) {
        const [rows] = await pool.execute(
            'SELECT 1 FROM users WHERE username = ? LIMIT 1',
            [username]
        );
        return rows.length > 0;
    },

    async emailExists(email) {
        const [rows] = await pool.execute(
            'SELECT 1 FROM users WHERE email = ? LIMIT 1',
            [email]
        );
        return rows.length > 0;
    },
};

export default UserModel;
