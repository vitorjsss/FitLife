import { pool } from '../config/db.js';

class MedidasNutricionaisRepository {
    /**
     * Criar nova medida nutricional
     */
    async create(medidasData) {
        const { patient_id, data, calorias, proteina, carboidrato, gordura } = medidasData;
        
        const query = `
            INSERT INTO medidas_nutricionais 
            (patient_id, data, calorias, proteina, carboidrato, gordura)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        
        const values = [patient_id, data, calorias, proteina, carboidrato, gordura];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Buscar todas as medidas de um paciente
     */
    async findByPatientId(patientId) {
        const query = `
            SELECT * FROM medidas_nutricionais
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
        const query = 'SELECT * FROM medidas_nutricionais WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Buscar medidas por período
     */
    async findByDateRange(patientId, dataInicio, dataFim) {
        const query = `
            SELECT * FROM medidas_nutricionais
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
            SELECT * FROM medidas_nutricionais
            WHERE patient_id = $1
            ORDER BY data DESC
            LIMIT 1
        `;
        
        const result = await pool.query(query, [patientId]);
        return result.rows[0];
    }

    /**
     * Atualizar medida nutricional
     */
    async update(id, medidasData) {
        const { data, calorias, proteina, carboidrato, gordura } = medidasData;
        
        const query = `
            UPDATE medidas_nutricionais
            SET data = $1, calorias = $2, proteina = $3, 
                carboidrato = $4, gordura = $5, updated_at = NOW()
            WHERE id = $6
            RETURNING *
        `;
        
        const values = [data, calorias, proteina, carboidrato, gordura, id];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Deletar medida nutricional
     */
    async delete(id) {
        const query = 'DELETE FROM medidas_nutricionais WHERE id = $1 RETURNING *';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Calcular média de macros no período
     */
    async getAverageData(patientId, dataInicio, dataFim) {
        const query = `
            SELECT 
                AVG(calorias) as media_calorias,
                AVG(proteina) as media_proteina,
                AVG(carboidrato) as media_carboidrato,
                AVG(gordura) as media_gordura,
                COUNT(*) as total_registros
            FROM medidas_nutricionais
            WHERE patient_id = $1 
            AND data BETWEEN $2 AND $3
        `;
        
        const result = await pool.query(query, [patientId, dataInicio, dataFim]);
        return result.rows[0];
    }

    /**
     * Obter evolução nutricional
     */
    async getEvolutionData(patientId, limit = 10) {
        const query = `
            SELECT data, calorias, proteina, carboidrato, gordura, created_at
            FROM medidas_nutricionais
            WHERE patient_id = $1
            ORDER BY data DESC
            LIMIT $2
        `;
        
        const result = await pool.query(query, [patientId, limit]);
        return result.rows;
    }
}

export default new MedidasNutricionaisRepository();
