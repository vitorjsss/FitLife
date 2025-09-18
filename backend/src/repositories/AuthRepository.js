import { pool } from "../config/db.js";

export const AuthRepository = {
    create: async (userData) => {
        try {
            const query = `
                INSERT INTO auth (username, email, user_type, password)
                VALUES ($1, $2, $3, $4)
                RETURNING id, username, email, user_type, password, refresh_token, last_login, created_at, updated_at
            `;
            const values = [userData.username, userData.email, userData.user_type, userData.password];
            const res = await pool.query(query, values);
            return res.rows[0];
        } catch (err) {
            console.error("Erro no create AuthRepository:", err);
            throw err;
        }
    },

    findByEmail: async (email) => {
        try {
            const res = await pool.query("SELECT * FROM auth WHERE email = $1", [email]);
            return res.rows[0] || null;
        } catch (err) {
            console.error("Erro no findByEmail AuthRepository:", err);
            throw err;
        }
    },

    getAll: async () => {
        try {
            const res = await pool.query("SELECT * FROM auth");
            return res.rows;
        } catch (err) {
            console.error("Erro no getAll AuthRepository:", err);
            throw err;
        }
    },

    updateRefreshToken: async (email, refreshToken) => {
        try {
            await pool.query("UPDATE auth SET refresh_token = $1 WHERE email = $2", [refreshToken, email]);
        } catch (err) {
            console.error("Erro no updateRefreshToken AuthRepository:", err);
            throw err;
        }
    },

    updateLastLogin: async (email) => {
        try {
            await pool.query("UPDATE auth SET last_login = NOW() WHERE email = $1", [email]);
        } catch (err) {
            console.error("Erro no updateLastLogin AuthRepository:", err);
            throw err;
        }
    }
};
