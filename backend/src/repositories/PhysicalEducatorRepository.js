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

    findByAuthId: async (auth_id) => {
        const query = 'SELECT * FROM physical_educator WHERE auth_id = $1;';
        const { rows } = await pool.query(query, [auth_id]);
        return rows[0];
    },

    findAll: async () => {
        const query = 'SELECT * FROM physical_educator;';
        const { rows } = await pool.query(query);
        return rows;
    },

    update: async (id, data) => {
        // Monta query dinâmica para atualizar apenas os campos enviados
        const fields = [];
        const values = [];
        let idx = 1;
        for (const key of Object.keys(data)) {
            fields.push(`${key} = $${idx}`);
            values.push(data[key]);
            idx++;
        }
        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        const query = `UPDATE physical_educator SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *;`;
        values.push(id);
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