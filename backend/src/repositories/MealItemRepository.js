import { pool } from "../config/db.js";
import { v4 as uuidv4 } from 'uuid';

const MealItemRepository = {
    create: async (data) => {
        const id = uuidv4();
        const query = `
            INSERT INTO MealItem (id, food_name, quantity, calories, proteins, carbs, fats, food_id, meal_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *;
        `;
        const values = [
            id,
            data.food_name,
            data.quantity,
            data.calories,
            data.proteins,
            data.carbs,
            data.fats,
            data.food_id,
            data.meal_id
        ];
        const { rows } = await pool.query(query, values);
        return rows[0];
    },

    findById: async (id) => {
        const query = 'SELECT * FROM MealItem WHERE id = $1;';
        const { rows } = await pool.query(query, [id]);
        return rows[0];
    },

    findAll: async () => {
        const query = 'SELECT * FROM MealItem ORDER BY created_at DESC;';
        const { rows } = await pool.query(query);
        return rows;
    },

    findByMealId: async (mealId) => {
        const query = 'SELECT * FROM MealItem WHERE meal_id = $1 ORDER BY created_at ASC;';
        const { rows } = await pool.query(query, [mealId]);
        return rows;
    },

    findByFoodId: async (foodId) => {
        const query = 'SELECT * FROM MealItem WHERE food_id = $1 ORDER BY created_at DESC;';
        const { rows } = await pool.query(query, [foodId]);
        return rows;
    },

    findWithFoodDetails: async (id) => {
        const query = `
            SELECT mi.*, f.name as food_name_detail, f.descricao, f.image_path
            FROM MealItem mi
            LEFT JOIN Food f ON mi.food_id = f.id
            WHERE mi.id = $1;
        `;
        const { rows } = await pool.query(query, [id]);
        return rows[0];
    },

    update: async (id, data) => {
        const query = `
            UPDATE MealItem 
            SET food_name = $2, quantity = $3, calories = $4, proteins = $5, 
                carbs = $6, fats = $7, food_id = $8, meal_id = $9, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *;
        `;
        const values = [
            id,
            data.food_name,
            data.quantity,
            data.calories,
            data.proteins,
            data.carbs,
            data.fats,
            data.food_id,
            data.meal_id
        ];
        const { rows } = await pool.query(query, values);
        return rows[0];
    },

    delete: async (id) => {
        const query = 'DELETE FROM MealItem WHERE id = $1;';
        await pool.query(query, [id]);
        return true;
    }
};

export { MealItemRepository };
export default MealItemRepository;