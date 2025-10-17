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
        console.log("Finding patient by auth_id:", id);
        const query = 'SELECT * FROM patient WHERE auth_id = $1;';
        const { rows } = await pool.query(query, [id]);
        return rows[0];
    },

    findAll: async () => {
        const query = 'SELECT * FROM patient;';
        const { rows } = await pool.query(query);
        return rows;
    },

    update: async (id, patient) => {
        const query = `
            UPDATE patient
            SET name = $1, birthdate = $2, sex = $3, contact = $4, avatar_path = $5, auth_id = $6, updated_at = CURRENT_TIMESTAMP
            WHERE id = $7
            RETURNING *;
        `;
        const values = [
            patient.name,
            patient.birthdate,
            patient.sex,
            patient.contact,
            patient.avatar_path,
            patient.auth_id,
            id,
        ];
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