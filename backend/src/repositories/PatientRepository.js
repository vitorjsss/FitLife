import { pool } from "../config/db.js";

const PatientRepository = {
    create: async (patient) => {
        const query = `
            INSERT INTO patient (name, birthdate, sex, contact, avatar_path, auth_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const values = [
            patient.name,
            patient.birthdate,
            patient.sex,
            patient.contact,
            patient.avatar_path,
            patient.auth_id,
        ];
        const { rows } = await pool.query(query, values);
        return rows[0];
    },

    findById: async (id) => {
        console.log("Finding patient by id:", id);
        const query = 'SELECT * FROM patient WHERE id = $1;';
        const { rows } = await pool.query(query, [id]);
        return rows[0];
    },

    findAll: async () => {
        const query = 'SELECT * FROM patient;';
        const { rows } = await pool.query(query);
        return rows;
    },

    update: async (id, patient) => {
        // Monta query dinâmica para atualizar apenas os campos enviados
        const fields = [];
        const values = [];
        let idx = 1;
        for (const key of Object.keys(patient)) {
            fields.push(`${key} = $${idx}`);
            values.push(patient[key]);
            idx++;
        }
        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        const query = `UPDATE patient SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *;`;
        values.push(id);
        const { rows } = await pool.query(query, values);
        return rows[0];
    },

    delete: async (id) => {
        const query = 'DELETE FROM patient WHERE id = $1;';
        await pool.query(query, [id]);
        return true;
    },

    findByAuthId: async (auth_id) => {
        const query = 'SELECT * FROM patient WHERE auth_id = $1;';
        const { rows } = await pool.query(query, [auth_id]);
        return rows[0] || null;
    }
};

export default PatientRepository;