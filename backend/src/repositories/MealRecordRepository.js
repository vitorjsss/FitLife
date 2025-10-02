import { pool } from "../config/db.js";
import { v4 as uuidv4 } from 'uuid';

const MealRecordRepository = {
    create: async (data) => {
        const id = uuidv4();
        const query = `
            INSERT INTO MealRecord (id, name, icon_path, daily_meal_registry_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const values = [id, data.name, data.icon_path, data.daily_meal_registry_id];
        const { rows } = await pool.query(query, values);
        return rows[0];
    },

    findById: async (id) => {
        const query = 'SELECT * FROM MealRecord WHERE id = $1;';
        const { rows } = await pool.query(query, [id]);
        return rows[0];
    },

    findAll: async () => {
        const query = 'SELECT * FROM MealRecord ORDER BY created_at DESC;';
        const { rows } = await pool.query(query);
        return rows;
    },

    findByDailyMealRegistryId: async (dailyMealRegistryId) => {
        const query = 'SELECT * FROM MealRecord WHERE daily_meal_registry_id = $1 ORDER BY created_at ASC;';
        const { rows } = await pool.query(query, [dailyMealRegistryId]);
        return rows;
    },

    findWithItems: async (id) => {
        const query = `
            SELECT mr.*, 
                   json_agg(
                       json_build_object(
                           'id', mi.id,
                           'food_name', mi.food_name,
                           'quantity', mi.quantity,
                           'calories', mi.calories,
                           'proteins', mi.proteins,
                           'carbs', mi.carbs,
                           'fats', mi.fats,
                           'food_id', mi.food_id
                       )
                   ) as meal_items
            FROM MealRecord mr
            LEFT JOIN MealItem mi ON mr.id = mi.meal_id
            WHERE mr.id = $1
            GROUP BY mr.id;
        `;
        const { rows } = await pool.query(query, [id]);
        return rows[0];
    },

    update: async (id, data) => {
        const query = `
            UPDATE MealRecord 
            SET name = $2, icon_path = $3, daily_meal_registry_id = $4, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *;
        `;
        const values = [id, data.name, data.icon_path, data.daily_meal_registry_id];
        const { rows } = await pool.query(query, values);
        return rows[0];
    },

    delete: async (id) => {
        const query = 'DELETE FROM MealRecord WHERE id = $1;';
        await pool.query(query, [id]);
        return true;
    }
};

export { MealRecordRepository };
export default MealRecordRepository;