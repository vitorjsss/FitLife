import { pool } from "../config/db.js";
import { v4 as uuidv4 } from 'uuid';

const DailyMealRegistryRepository = {
    create: async (data) => {
        const id = uuidv4();
        const query = `
            INSERT INTO DailyMealRegistry (id, date, patient_id)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const values = [id, data.date, data.patient_id];
        const { rows } = await pool.query(query, values);
        return rows[0];
    },

    findById: async (id) => {
        const query = 'SELECT * FROM DailyMealRegistry WHERE id = $1;';
        const { rows } = await pool.query(query, [id]);
        return rows[0];
    },

    findAll: async () => {
        const query = 'SELECT * FROM DailyMealRegistry ORDER BY date DESC;';
        const { rows } = await pool.query(query);
        return rows;
    },

    findByPatientId: async (patientId) => {
        const query = 'SELECT * FROM DailyMealRegistry WHERE patient_id = $1 ORDER BY date DESC;';
        const { rows } = await pool.query(query, [patientId]);
        return rows;
    },

    findByDate: async (date, patientId) => {
        const query = 'SELECT * FROM DailyMealRegistry WHERE date = $1 AND patient_id = $2 ORDER BY created_at DESC;';
        const { rows } = await pool.query(query, [date, patientId]);
        return rows;
    },

    update: async (id, data) => {
        const query = `
            UPDATE DailyMealRegistry 
            SET date = $2, patient_id = $3, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *;
        `;
        const values = [id, data.date, data.patient_id];
        const { rows } = await pool.query(query, values);
        return rows[0];
    },

    delete: async (id) => {
        const query = 'DELETE FROM DailyMealRegistry WHERE id = $1;';
        await pool.query(query, [id]);
        return true;
    }
};

export { DailyMealRegistryRepository };
export default DailyMealRegistryRepository;