import { pool } from "../config/db.js";
import { v4 as uuidv4 } from 'uuid';

const PatientConnectionCodeRepository = {
    // Gera um código de 6 dígitos aleatório
    generateCode: () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    },

    // Cria ou atualiza o código do paciente
    createOrUpdate: async (patientId) => {
        const code = PatientConnectionCodeRepository.generateCode();

        // Remove código anterior se existir
        await pool.query('DELETE FROM patient_connection_code WHERE patient_id = $1', [patientId]);

        const id = uuidv4();
        const query = `
            INSERT INTO patient_connection_code (id, patient_id, code, expires_at)
            VALUES ($1, $2, $3, NOW() + INTERVAL '5 minutes')
            RETURNING *;
        `;
        const values = [id, patientId, code];
        const { rows } = await pool.query(query, values);
        return rows[0];
    },

    // Busca código válido pelo código
    findValidByCode: async (code) => {
        const query = `
            SELECT pcc.*, p.name as patient_name
            FROM patient_connection_code pcc
            INNER JOIN patient p ON pcc.patient_id = p.id
            WHERE pcc.code = $1 
              AND pcc.expires_at > NOW() 
              AND pcc.used = false;
        `;
        const { rows } = await pool.query(query, [code]);
        return rows[0];
    },

    // Busca código ativo do paciente
    findActiveByPatientId: async (patientId) => {
        const query = `
            SELECT * FROM patient_connection_code 
            WHERE patient_id = $1 
              AND expires_at > NOW() 
              AND used = false
            ORDER BY created_at DESC
            LIMIT 1;
        `;
        const { rows } = await pool.query(query, [patientId]);
        return rows[0];
    },

    // Marca código como usado
    markAsUsed: async (codeId) => {
        const query = `
            UPDATE patient_connection_code 
            SET used = true 
            WHERE id = $1 
            RETURNING *;
        `;
        const { rows } = await pool.query(query, [codeId]);
        return rows[0];
    },

    // Deleta códigos expirados
    deleteExpired: async () => {
        const query = 'DELETE FROM patient_connection_code WHERE expires_at < NOW() RETURNING *;';
        const { rows } = await pool.query(query);
        return rows;
    },

    // Deleta código do paciente
    deleteByPatientId: async (patientId) => {
        const query = 'DELETE FROM patient_connection_code WHERE patient_id = $1 RETURNING *;';
        const { rows } = await pool.query(query, [patientId]);
        return rows[0];
    }
};

export default PatientConnectionCodeRepository;
