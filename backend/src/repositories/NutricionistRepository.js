import { pool } from "../config/db.js";

const NutricionistRepository = {
    create: async (data) => {
        const query = `
            INSERT INTO nutricionist (name, birthdate, sex, contact, crn, avatar_path, auth_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;
        const values = [
            data.name,
            data.birthdate,
            data.sex,
            data.contact,
            data.crn,
            data.avatar_path,
            data.auth_id,
        ];
        const { rows } = await pool.query(query, values);
        return rows[0];
    },

    findById: async (id) => {
        const query = 'SELECT * FROM nutricionist WHERE id = $1;';
        const { rows } = await pool.query(query, [id]);
        return rows[0];
    },

    findAll: async () => {
        const query = 'SELECT * FROM nutricionist;';
        const { rows } = await pool.query(query);
        return rows;
    },

    update: async (id, data) => {
        const query = `
            UPDATE nutricionist
            SET name = $1, birthdate = $2, sex = $3, contact = $4, crn = $5, avatar_path = $6, auth_id = $7, updated_at = CURRENT_TIMESTAMP
            WHERE id = $8
            RETURNING *;
        `;
        const values = [
            data.name,
            data.birthdate,
            data.sex,
            data.contact,
            data.crn,
            data.avatar_path,
            data.auth_id,
            id,
        ];
        const { rows } = await pool.query(query, values);
        return rows[0];
    },

    delete: async (id) => {
        const query = 'DELETE FROM nutricionist WHERE id = $1;';
        await pool.query(query, [id]);
        return true;
    }
};

export default NutricionistRepository;