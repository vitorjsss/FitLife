import pool from '../config/db.js';

class WorkoutRecordRepository {
    // Buscar treinos por data e paciente
    async findByDateAndPatient(date, patientId) {
        const query = `
      SELECT wr.*, 
        COALESCE(
          json_agg(
            json_build_object(
              'id', wi.id,
              'exercise_name', wi.exercise_name,
              'series', wi.series,
              'repeticoes', wi.repeticoes,
              'carga', wi.carga
            ) ORDER BY wi.created_at
          ) FILTER (WHERE wi.id IS NOT NULL),
          '[]'
        ) as items
      FROM WorkoutRecord wr
      LEFT JOIN WorkoutItem wi ON wi.workout_record_id = wr.id
      WHERE wr.date = $1 AND wr.patient_id = $2
      GROUP BY wr.id
      ORDER BY wr.created_at
    `;
        const result = await pool.query(query, [date, patientId]);
        return result.rows;
    }

    // Criar novo treino
    async create(data) {
        const { name, date, patient_id, checked = false } = data;
        const query = `
      INSERT INTO WorkoutRecord (name, date, patient_id, checked)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
        const result = await pool.query(query, [name, date, patient_id, checked]);
        return result.rows[0];
    }

    // Buscar por ID
    async findById(id) {
        const query = `
      SELECT wr.*, 
        COALESCE(
          json_agg(
            json_build_object(
              'id', wi.id,
              'exercise_name', wi.exercise_name,
              'series', wi.series,
              'repeticoes', wi.repeticoes,
              'carga', wi.carga
            ) ORDER BY wi.created_at
          ) FILTER (WHERE wi.id IS NOT NULL),
          '[]'
        ) as items
      FROM WorkoutRecord wr
      LEFT JOIN WorkoutItem wi ON wi.workout_record_id = wr.id
      WHERE wr.id = $1
      GROUP BY wr.id
    `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    // Atualizar treino
    async update(id, data) {
        const { name, checked } = data;
        const query = `
      UPDATE WorkoutRecord
      SET name = COALESCE($1, name),
          checked = COALESCE($2, checked),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
        const result = await pool.query(query, [name, checked, id]);
        return result.rows[0];
    }

    // Deletar treino
    async delete(id) {
        const query = 'DELETE FROM WorkoutRecord WHERE id = $1 RETURNING *';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }
}

export default new WorkoutRecordRepository();
