import { pool } from "../config/db.js";

export const MealCalendarService = {
    getMonthlyProgress: async (patientId, year, month) => {
        try {
            // Get daily meal completion stats for the entire month
            const query = `
                SELECT 
                    dmr.date,
                    COUNT(mr.id) AS total_meals,
                    COUNT(CASE WHEN mr.checked = true THEN 1 END) AS completed_meals,
                    ROUND(
                        (COUNT(CASE WHEN mr.checked = true THEN 1 END)::decimal / 
                        NULLIF(COUNT(mr.id), 0) * 100), 2
                    ) AS completion_percentage
                FROM DailyMealRegistry dmr
                LEFT JOIN MealRecord mr ON mr.daily_meal_registry_id = dmr.id
                WHERE dmr.patient_id = $1
                    AND EXTRACT(YEAR FROM dmr.date) = $2
                    AND EXTRACT(MONTH FROM dmr.date) = $3
                GROUP BY dmr.date
                ORDER BY dmr.date ASC;
            `;

            const { rows } = await pool.query(query, [patientId, year, month]);

            // Transform results to include numeric values
            return rows.map(row => ({
                date: row.date instanceof Date
                    ? row.date.toISOString().split('T')[0]
                    : row.date,
                totalMeals: parseInt(row.total_meals),
                completedMeals: parseInt(row.completed_meals),
                completionPercentage: parseFloat(row.completion_percentage) || 0
            }));
        } catch (err) {
            console.error("Error in MealCalendarService.getMonthlyProgress:", err);
            throw err;
        }
    },

    getDayDetails: async (patientId, date) => {
        try {
            // Get all meals for a specific day
            const query = `
                SELECT 
                    dmr.id AS registry_id,
                    dmr.date,
                    mr.id AS meal_id,
                    mr.name AS meal_name,
                    mr.icon_path,
                    mr.checked,
                    COUNT(mi.id) AS food_items_count
                FROM DailyMealRegistry dmr
                LEFT JOIN MealRecord mr ON mr.daily_meal_registry_id = dmr.id
                LEFT JOIN MealItem mi ON mi.meal_id = mr.id
                WHERE dmr.patient_id = $1 AND dmr.date = $2
                GROUP BY dmr.id, dmr.date, mr.id, mr.name, mr.icon_path, mr.checked
                ORDER BY mr.created_at ASC;
            `;

            const { rows } = await pool.query(query, [patientId, date]);

            if (rows.length === 0) {
                return {
                    date,
                    registryId: null,
                    meals: []
                };
            }

            // Format date to avoid timezone issues
            const dateFormatted = rows[0].date instanceof Date
                ? rows[0].date.toISOString().split('T')[0]
                : rows[0].date;

            return {
                date: dateFormatted,
                registryId: rows[0].registry_id,
                meals: rows.map(row => ({
                    id: row.meal_id,
                    name: row.meal_name,
                    iconPath: row.icon_path,
                    checked: row.checked,
                    foodItemsCount: parseInt(row.food_items_count)
                })).filter(meal => meal.id !== null)
            };
        } catch (err) {
            console.error("Error in MealCalendarService.getDayDetails:", err);
            throw err;
        }
    }
};
