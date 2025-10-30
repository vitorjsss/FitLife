import { pool } from '../config/db.js';

class WorkoutSessionRepository {
    // Criar uma sessão de treino
    async create(sessionData) {
        const { workout_id, patient_id, session_date, start_time, notes } = sessionData;
        const query = `
            INSERT INTO workout_session (workout_id, patient_id, session_date, start_time, notes)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const values = [workout_id, patient_id, session_date || new Date(), start_time, notes];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    // Buscar sessão por ID
    async findById(id) {
        const query = `
            SELECT ws.*, 
                   w.name as workout_name,
                   p.name as patient_name
            FROM workout_session ws
            LEFT JOIN workout w ON ws.workout_id = w.id
            LEFT JOIN patient p ON ws.patient_id = p.id
            WHERE ws.id = $1
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    // Buscar sessões por paciente
    async findByPatientId(patient_id, limit = 50) {
        const query = `
            SELECT ws.*, 
                   w.name as workout_name,
                   w.description as workout_description
            FROM workout_session ws
            LEFT JOIN workout w ON ws.workout_id = w.id
            WHERE ws.patient_id = $1
            ORDER BY ws.session_date DESC, ws.created_at DESC
            LIMIT $2
        `;
        const result = await pool.query(query, [patient_id, limit]);
        return result.rows;
    }

    // Buscar sessões por treino
    async findByWorkoutId(workout_id) {
        const query = `
            SELECT ws.*, 
                   p.name as patient_name
            FROM workout_session ws
            LEFT JOIN patient p ON ws.patient_id = p.id
            WHERE ws.workout_id = $1
            ORDER BY ws.session_date DESC
        `;
        const result = await pool.query(query, [workout_id]);
        return result.rows;
    }

    // Buscar sessões por data
    async findByDate(patient_id, date) {
        const query = `
            SELECT ws.*, 
                   w.name as workout_name,
                   w.description as workout_description
            FROM workout_session ws
            LEFT JOIN workout w ON ws.workout_id = w.id
            WHERE ws.patient_id = $1 AND ws.session_date = $2
            ORDER BY ws.created_at DESC
        `;
        const result = await pool.query(query, [patient_id, date]);
        return result.rows;
    }

    // Atualizar sessão
    async update(id, sessionData) {
        const { end_time, notes, completed } = sessionData;
        const query = `
            UPDATE workout_session 
            SET end_time = $1, notes = $2, completed = $3, updated_at = NOW()
            WHERE id = $4
            RETURNING *
        `;
        const values = [end_time, notes, completed];
        const result = await pool.query(query, [...values, id]);
        return result.rows[0];
    }

    // Completar sessão
    async completeSession(id) {
        const query = `
            UPDATE workout_session 
            SET completed = TRUE, end_time = NOW(), updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    // Deletar sessão
    async delete(id) {
        const query = `DELETE FROM workout_session WHERE id = $1 RETURNING *`;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    // Buscar sessão completa com logs de exercícios
    async getSessionWithLogs(sessionId) {
        const sessionQuery = `
            SELECT ws.*, 
                   w.name as workout_name,
                   w.description as workout_description,
                   p.name as patient_name
            FROM workout_session ws
            LEFT JOIN workout w ON ws.workout_id = w.id
            LEFT JOIN patient p ON ws.patient_id = p.id
            WHERE ws.id = $1
        `;
        
        const logsQuery = `
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

        const [sessionResult, logsResult] = await Promise.all([
            pool.query(sessionQuery, [sessionId]),
            pool.query(logsQuery, [sessionId])
        ]);

        if (sessionResult.rows.length === 0) {
            return null;
        }

        const session = sessionResult.rows[0];
        session.exercise_logs = logsResult.rows;
        
        return session;
    }

    // Estatísticas de treinos
    async getWorkoutStats(patient_id, workout_id, days = 30) {
        const query = `
            SELECT 
                COUNT(*) as total_sessions,
                COUNT(CASE WHEN completed = TRUE THEN 1 END) as completed_sessions,
                MAX(session_date) as last_session_date,
                AVG(EXTRACT(EPOCH FROM (end_time - start_time))/60) as avg_duration_minutes
            FROM workout_session
            WHERE patient_id = $1 
                AND workout_id = $2
                AND session_date >= CURRENT_DATE - INTERVAL '${days} days'
        `;
        const result = await pool.query(query, [patient_id, workout_id]);
        return result.rows[0];
    }
}

export default new WorkoutSessionRepository();