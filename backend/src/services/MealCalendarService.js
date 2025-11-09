import { pool } from "../config/db.js";

export const MealCalendarService = {
    getMonthlyProgress: async (patientId, year, month) => {
        try {
            // Get daily meal completion stats for the entire month
            // Agora agrupa diretamente por date do MealRecord
            const query = `
                SELECT 
                    mr.date,
                    COUNT(mr.id) AS total_meals,
                    COUNT(CASE WHEN mr.checked = true THEN 1 END) AS completed_meals,
                    ROUND(
                        (COUNT(CASE WHEN mr.checked = true THEN 1 END)::decimal / 
                        NULLIF(COUNT(mr.id), 0) * 100), 2
                    ) AS completion_percentage
                FROM MealRecord mr
                WHERE mr.patient_id = $1
                    AND EXTRACT(YEAR FROM mr.date) = $2
                    AND EXTRACT(MONTH FROM mr.date) = $3
                GROUP BY mr.date
                ORDER BY mr.date ASC;
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
            // Agora busca diretamente do MealRecord com seus items
            const query = `
                SELECT 
                    mr.id AS meal_id,
                    mr.name AS meal_name,
                    mr.icon_path,
                    mr.checked,
                    mr.date,
                    COUNT(mi.id) AS food_items_count
                FROM MealRecord mr
                LEFT JOIN MealItem mi ON mi.meal_record_id = mr.id
                WHERE mr.patient_id = $1 AND mr.date = $2
                GROUP BY mr.id, mr.name, mr.icon_path, mr.checked, mr.date
                ORDER BY mr.created_at ASC;
            `;

            const { rows } = await pool.query(query, [patientId, date]);

            // Format date to avoid timezone issues
            const dateFormatted = rows.length > 0 && rows[0].date instanceof Date
                ? rows[0].date.toISOString().split('T')[0]
                : date;

            return {
                date: dateFormatted,
                meals: rows.map(row => ({
                    id: row.meal_id,
                    name: row.meal_name,
                    iconPath: row.icon_path,
                    checked: row.checked,
                    foodItemsCount: parseInt(row.food_items_count)
                }))
            };
        } catch (err) {
            console.error("Error in MealCalendarService.getDayDetails:", err);
            throw err;
        }
    }
};
