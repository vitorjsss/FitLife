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
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

        // Remove código anterior se existir
        await pool.query('DELETE FROM patient_connection_code WHERE patient_id = $1', [patientId]);

        const id = uuidv4();
        const query = `
            INSERT INTO patient_connection_code (id, patient_id, code, expires_at)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const values = [id, patientId, code, expiresAt];
        const { rows } = await pool.query(query, values);
        return rows[0];
    },

    // Busca código válido pelo código
    findValidByCode: async (code) => {
        console.log('[PatientConnectionCodeRepository] findValidByCode - code:', code);

        // Primeiro busca o código sem validação para debug
        const debugQuery = `
            SELECT pcc.*, p.name as patient_name, 
                   pcc.expires_at,
                   NOW() as current_time,
                   (pcc.expires_at > NOW()) as is_not_expired,
                   pcc.used
            FROM patient_connection_code pcc
            INNER JOIN patient p ON pcc.patient_id = p.id
            WHERE pcc.code = $1;
        `;
        const debugResult = await pool.query(debugQuery, [code]);
        console.log('[PatientConnectionCodeRepository] Debug - código encontrado:', debugResult.rows[0]);

        const query = `
            SELECT pcc.*, p.name as patient_name
            FROM patient_connection_code pcc
            INNER JOIN patient p ON pcc.patient_id = p.id
            WHERE pcc.code = $1 
              AND pcc.expires_at > NOW() 
              AND pcc.used = false;
        `;
        const { rows } = await pool.query(query, [code]);
        console.log('[PatientConnectionCodeRepository] Código válido?', rows[0] ? 'SIM' : 'NÃO');
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
