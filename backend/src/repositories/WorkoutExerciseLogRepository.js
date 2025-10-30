import { pool } from '../config/db.js';

class WorkoutExerciseLogRepository {
    // Criar log de exercício
    async create(logData) {
        const { 
            workout_session_id, 
            workout_exercise_id, 
            series_completed, 
            repeticoes_completed, 
            carga_used,
            checked,
            completed,
            notes 
        } = logData;
        
        const query = `
            INSERT INTO workout_exercise_log 
            (workout_session_id, workout_exercise_id, series_completed, repeticoes_completed, carga_used, checked, completed, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        const values = [
            workout_session_id, 
            workout_exercise_id, 
            series_completed || 0, 
            repeticoes_completed || 0, 
            carga_used || 0,
            checked || false,
            completed || false,
            notes
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    // Buscar log por ID
    async findById(id) {
        const query = `
            SELECT wel.*, 
                   we.name as exercise_name,
                   we.exercise_type,
                   we.series as series_target,
                   we.repeticoes as repeticoes_target,
                   we.carga as carga_target
            FROM workout_exercise_log wel
            LEFT JOIN workout_exercise we ON wel.workout_exercise_id = we.id
            WHERE wel.id = $1
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    // Buscar logs por sessão
    async findBySessionId(session_id) {
        const query = `
            SELECT wel.*, 
                   we.name as exercise_name,
                   we.exercise_type,
                   we.series as series_target,
                   we.repeticoes as repeticoes_target,
                   we.carga as carga_target,
                   we.order_index
            FROM workout_exercise_log wel
            LEFT JOIN workout_exercise we ON wel.workout_exercise_id = we.id
            WHERE wel.workout_session_id = $1
            ORDER BY we.order_index ASC, we.created_at ASC
        `;
        const result = await pool.query(query, [session_id]);
        return result.rows;
    }

    // Atualizar log de exercício
    async update(id, logData) {
        const { series_completed, repeticoes_completed, carga_used, checked, completed, notes } = logData;
        const query = `
            UPDATE workout_exercise_log 
            SET series_completed = $1, 
                repeticoes_completed = $2, 
                carga_used = $3,
                checked = $4,
                completed = $5,
                notes = $6,
                updated_at = NOW()
            WHERE id = $7
            RETURNING *
        `;
        const values = [series_completed, repeticoes_completed, carga_used, checked, completed, notes, id];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    // Marcar exercício como checked/unchecked (toggle)
    async toggleChecked(id) {
        const query = `
            UPDATE workout_exercise_log 
            SET checked = NOT checked, updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    // Marcar exercício como completo
    async markAsCompleted(id) {
        const query = `
            UPDATE workout_exercise_log 
            SET completed = TRUE, updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    // Deletar log
    async delete(id) {
        const query = `DELETE FROM workout_exercise_log WHERE id = $1 RETURNING *`;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    // Criar logs para todos os exercícios de um treino
    async createLogsForWorkout(session_id, workout_id) {
        const query = `
            INSERT INTO workout_exercise_log (workout_session_id, workout_exercise_id)
            SELECT $1, we.id
            FROM workout_exercise we
            WHERE we.workout_id = $2
            ORDER BY we.order_index ASC, we.created_at ASC
            RETURNING *
        `;
        const result = await pool.query(query, [session_id, workout_id]);
        return result.rows;
    }

    // Verificar se todos os exercícios foram completados
    async checkAllCompleted(session_id) {
        const query = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN completed = TRUE THEN 1 END) as completed
            FROM workout_exercise_log
            WHERE workout_session_id = $1
        `;
        const result = await pool.query(query, [session_id]);
        const { total, completed } = result.rows[0];
        return parseInt(total) === parseInt(completed) && parseInt(total) > 0;
    }

    // Progresso da sessão
    async getSessionProgress(session_id) {
        const query = `
            SELECT 
                COUNT(*) as total_exercises,
                COUNT(CASE WHEN completed = TRUE THEN 1 END) as completed_exercises,
                ROUND(COUNT(CASE WHEN completed = TRUE THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as completion_percentage
            FROM workout_exercise_log
            WHERE workout_session_id = $1
        `;
        const result = await pool.query(query, [session_id]);
        return result.rows[0];
    }
}

export default new WorkoutExerciseLogRepository();