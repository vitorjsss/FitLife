import { pool } from "../config/db.js";

const PhysicalEducatorRepository = {
    create: async (data) => {
        const query = `
            INSERT INTO physical_educator (name, birthdate, sex, contact, cref, avatar_path, auth_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;
        const values = [
            data.name,
            data.birthdate,
            data.sex,
            data.contact,
            data.cref,
            data.avatar_path,
            data.auth_id,
        ];
        const { rows } = await pool.query(query, values);
        return rows[0];
    },

    findById: async (id) => {
        const query = 'SELECT * FROM physical_educator WHERE id = $1;';
        const { rows } = await pool.query(query, [id]);
        return rows[0];
    },

    findAll: async () => {
        const query = 'SELECT * FROM physical_educator;';
        const { rows } = await pool.query(query);
        return rows;
    },

    update: async (id, data) => {
        const query = `
            UPDATE physical_educator
            SET name = $1, birthdate = $2, sex = $3, contact = $4, cref = $5, avatar_path = $6, auth_id = $7, updated_at = CURRENT_TIMESTAMP
            WHERE id = $8
            RETURNING *;
        `;
        const values = [
            data.name,
            data.birthdate,
            data.sex,
            data.contact,
            data.cref,
            data.avatar_path,
            data.auth_id,
            id,
        ];
        const { rows } = await pool.query(query, values);
        return rows[0];
    },

    delete: async (id) => {
        const query = 'DELETE FROM physical_educator WHERE id = $1;';
        await pool.query(query, [id]);
        return true;
    }
};

export default PhysicalEducatorRepository;