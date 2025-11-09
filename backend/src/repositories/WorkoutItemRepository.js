import pool from '../config/db.js';

class WorkoutItemRepository {
    // Criar item
    async create(data) {
        const { exercise_name, series, repeticoes, carga, workout_record_id } = data;
        const query = `
      INSERT INTO WorkoutItem (exercise_name, series, repeticoes, carga, workout_record_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
        const result = await pool.query(query, [exercise_name, series, repeticoes, carga, workout_record_id]);
        return result.rows[0];
    }

    // Buscar por ID
    async findById(id) {
        const query = 'SELECT * FROM WorkoutItem WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    // Buscar por workout_record_id
    async findByWorkoutRecordId(workoutRecordId) {
        const query = 'SELECT * FROM WorkoutItem WHERE workout_record_id = $1 ORDER BY created_at';
        const result = await pool.query(query, [workoutRecordId]);
        return result.rows;
    }

    // Atualizar item
    async update(id, data) {
        const { exercise_name, series, repeticoes, carga } = data;
        const query = `
      UPDATE WorkoutItem
      SET exercise_name = COALESCE($1, exercise_name),
          series = COALESCE($2, series),
          repeticoes = COALESCE($3, repeticoes),
          carga = COALESCE($4, carga),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;
        const result = await pool.query(query, [exercise_name, series, repeticoes, carga, id]);
        return result.rows[0];
    }

    // Deletar item
    async delete(id) {
        const query = 'DELETE FROM WorkoutItem WHERE id = $1 RETURNING *';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }
}

export default new WorkoutItemRepository();
