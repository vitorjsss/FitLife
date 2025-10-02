import { pool } from "../config/db.js";

const LogRepository = {
    create: async (data) => {
        const query = `
            INSERT INTO logs (action, log_type, description, ip, old_value, new_value, status, user_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
        `;
        const values = [
            data.action,
            data.logType,
            data.description,
            data.ip,
            data.oldValue,
            data.newValue,
            data.status,
            data.userId,
        ];
        const { rows } = await pool.query(query, values);
        return rows[0];
    },

    findById: async (id) => {
        const query = 'SELECT * FROM logs WHERE id = $1;';
        const { rows } = await pool.query(query, [id]);
        return rows[0];
    },

    findAll: async (limit = 100) => {
        const query = 'SELECT * FROM logs ORDER BY created_at DESC LIMIT $1;';
        const { rows } = await pool.query(query, [limit]);
        return rows;
    },

    findByUserId: async (userId) => {
        const query = 'SELECT * FROM logs WHERE user_id = $1 ORDER BY created_at DESC;';
        const { rows } = await pool.query(query, [userId]);
        return rows;
    },

    findByAction: async (action) => {
        const query = 'SELECT * FROM logs WHERE action = $1 ORDER BY created_at DESC;';
        const { rows } = await pool.query(query, [action]);
        return rows;
    },

    findByDateRange: async (startDate, endDate) => {
        const query = 'SELECT * FROM logs WHERE created_at BETWEEN $1 AND $2 ORDER BY created_at DESC;';
        const { rows } = await pool.query(query, [startDate, endDate]);
        return rows;
    },

    delete: async (id) => {
        const query = 'DELETE FROM logs WHERE id = $1;';
        await pool.query(query, [id]);
        return true;
    }
};

export { LogRepository };
export default LogRepository;