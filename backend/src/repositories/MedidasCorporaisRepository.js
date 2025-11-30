import { pool } from '../config/db.js';

class MedidasCorporaisRepository {
    /**
     * Criar nova medida corporal
     */
    async create(medidasData) {
        const {
            patient_id, data, peso, altura, imc,
            waist_circumference, hip_circumference, arm_circumference,
            thigh_circumference, calf_circumference,
            body_fat_percentage, muscle_mass, bone_mass
        } = medidasData;

        const query = `
            INSERT INTO medidas_corporais 
            (patient_id, data, peso, altura, imc,
             waist_circumference, hip_circumference, arm_circumference,
             thigh_circumference, calf_circumference,
             body_fat_percentage, muscle_mass, bone_mass)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `;

        const values = [
            patient_id, data, peso, altura, imc,
            waist_circumference, hip_circumference, arm_circumference,
            thigh_circumference, calf_circumference,
            body_fat_percentage, muscle_mass, bone_mass
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Buscar todas as medidas de um paciente
     */
    async findByPatientId(patientId) {
        const query = `
            SELECT * FROM medidas_corporais
            WHERE patient_id = $1
            ORDER BY data DESC
        `;

        const result = await pool.query(query, [patientId]);
        return result.rows;
    }

    /**
     * Buscar medida por ID
     */
    async findById(id) {
        const query = 'SELECT * FROM medidas_corporais WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Buscar medidas por período
     */
    async findByDateRange(patientId, dataInicio, dataFim) {
        const query = `
            SELECT * FROM medidas_corporais
            WHERE patient_id = $1 
            AND data BETWEEN $2 AND $3
            ORDER BY data DESC
        `;

        const result = await pool.query(query, [patientId, dataInicio, dataFim]);
        return result.rows;
    }

    /**
     * Buscar última medida do paciente
     */
    async findLatestByPatientId(patientId) {
        const query = `
            SELECT * FROM medidas_corporais
            WHERE patient_id = $1
            ORDER BY data DESC
            LIMIT 1
        `;

        const result = await pool.query(query, [patientId]);
        return result.rows[0];
    }

    /**
     * Atualizar medida corporal
     */
    async update(id, medidasData) {
        const {
            data, peso, altura, imc,
            waist_circumference, hip_circumference, arm_circumference,
            thigh_circumference, calf_circumference,
            body_fat_percentage, muscle_mass, bone_mass
        } = medidasData;

        const query = `
            UPDATE medidas_corporais
            SET data = $1, peso = $2, altura = $3, imc = $4,
                waist_circumference = $5, hip_circumference = $6,
                arm_circumference = $7, thigh_circumference = $8,
                calf_circumference = $9, body_fat_percentage = $10,
                muscle_mass = $11, bone_mass = $12,
                updated_at = NOW()
            WHERE id = $13
            RETURNING *
        `;

        const values = [
            data, peso, altura, imc,
            waist_circumference, hip_circumference, arm_circumference,
            thigh_circumference, calf_circumference,
            body_fat_percentage, muscle_mass, bone_mass,
            id
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Deletar medida corporal
     */
    async delete(id) {
        const query = 'DELETE FROM medidas_corporais WHERE id = $1 RETURNING *';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Calcular evolução de peso
     */
    async getEvolutionData(patientId, limit = 10) {
        const query = `
            SELECT data, peso, altura, imc, created_at
            FROM medidas_corporais
            WHERE patient_id = $1
            ORDER BY data DESC
            LIMIT $2
        `;

        const result = await pool.query(query, [patientId, limit]);
        return result.rows;
    }
}

export default new MedidasCorporaisRepository();
