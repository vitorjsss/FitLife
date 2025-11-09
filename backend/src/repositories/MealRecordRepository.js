import pool from '../config/db.js';

class MealRecordRepository {
  // Buscar refeições por data e paciente
  async findByDateAndPatient(date, patientId) {
    const query = `
      SELECT mr.*, 
        COALESCE(
          json_agg(
            json_build_object(
              'id', mi.id,
              'food_name', mi.food_name,
              'quantity', mi.quantity,
              'calories', mi.calories,
              'proteins', mi.proteins,
              'carbs', mi.carbs,
              'fats', mi.fats
            ) ORDER BY mi.created_at
          ) FILTER (WHERE mi.id IS NOT NULL),
          '[]'
        ) as items
      FROM MealRecord mr
      LEFT JOIN MealItem mi ON mi.meal_record_id = mr.id
      WHERE mr.date = $1 AND mr.patient_id = $2
      GROUP BY mr.id
      ORDER BY mr.created_at
    `;
    const result = await pool.query(query, [date, patientId]);
    return result.rows;
  }

  // Criar nova refeição
  async create(data) {
    const { name, date, patient_id, icon_path, checked = false } = data;
    const query = `
      INSERT INTO MealRecord (name, date, patient_id, icon_path, checked)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await pool.query(query, [name, date, patient_id, icon_path, checked]);
    return result.rows[0];
  }

  // Buscar por ID
  async findById(id) {
    const query = `
      SELECT mr.*, 
        COALESCE(
          json_agg(
            json_build_object(
              'id', mi.id,
              'food_name', mi.food_name,
              'quantity', mi.quantity,
              'calories', mi.calories,
              'proteins', mi.proteins,
              'carbs', mi.carbs,
              'fats', mi.fats
            ) ORDER BY mi.created_at
          ) FILTER (WHERE mi.id IS NOT NULL),
          '[]'
        ) as items
      FROM MealRecord mr
      LEFT JOIN MealItem mi ON mi.meal_record_id = mr.id
      WHERE mr.id = $1
      GROUP BY mr.id
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Atualizar refeição
  async update(id, data) {
    const { name, icon_path, checked } = data;
    const query = `
      UPDATE MealRecord
      SET name = COALESCE($1, name),
          icon_path = COALESCE($2, icon_path),
          checked = COALESCE($3, checked),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;
    const result = await pool.query(query, [name, icon_path, checked, id]);
    return result.rows[0];
  }

  // Deletar refeição
  async delete(id) {
    const query = 'DELETE FROM MealRecord WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

export default new MealRecordRepository();
