import pool from '../config/db.js';

class MealItemRepository {
  // Criar item
  async create(data) {
    const { food_name, quantity, calories, proteins, carbs, fats, meal_record_id } = data;
    const query = `
      INSERT INTO MealItem (food_name, quantity, calories, proteins, carbs, fats, meal_record_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await pool.query(query, [food_name, quantity, calories, proteins, carbs, fats, meal_record_id]);
    return result.rows[0];
  }

  // Buscar por ID
  async findById(id) {
    const query = 'SELECT * FROM MealItem WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Buscar por meal_record_id
  async findByMealRecordId(mealRecordId) {
    const query = 'SELECT * FROM MealItem WHERE meal_record_id = $1 ORDER BY created_at';
    const result = await pool.query(query, [mealRecordId]);
    return result.rows;
  }

  // Atualizar item
  async update(id, data) {
    const { food_name, quantity, calories, proteins, carbs, fats } = data;
    const query = `
      UPDATE MealItem
      SET food_name = COALESCE($1, food_name),
          quantity = COALESCE($2, quantity),
          calories = COALESCE($3, calories),
          proteins = COALESCE($4, proteins),
          carbs = COALESCE($5, carbs),
          fats = COALESCE($6, fats),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `;
    const result = await pool.query(query, [food_name, quantity, calories, proteins, carbs, fats, id]);
    return result.rows[0];
  }

  // Deletar item
  async delete(id) {
    const query = 'DELETE FROM MealItem WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

export default new MealItemRepository();
