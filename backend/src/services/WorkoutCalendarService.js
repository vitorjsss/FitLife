import { pool } from "../config/db.js";

export const WorkoutCalendarService = {
    getMonthlyProgress: async (patientId, year, month) => {
        try {
            // Get daily workout completion stats for the entire month
            const query = `
                SELECT 
                    wr.date,
                    COUNT(wr.id) AS total_workouts,
                    COUNT(CASE WHEN wr.checked = true THEN 1 END) AS completed_workouts,
                    ROUND(
                        (COUNT(CASE WHEN wr.checked = true THEN 1 END)::decimal / 
                        NULLIF(COUNT(wr.id), 0) * 100), 2
                    ) AS completion_percentage
                FROM WorkoutRecord wr
                WHERE wr.patient_id = $1
                    AND EXTRACT(YEAR FROM wr.date) = $2
                    AND EXTRACT(MONTH FROM wr.date) = $3
                GROUP BY wr.date
                ORDER BY wr.date ASC;
            `;

            const { rows } = await pool.query(query, [patientId, year, month]);

            // Transform results to include numeric values
            return rows.map(row => ({
                date: row.date instanceof Date
                    ? row.date.toISOString().split('T')[0]
                    : row.date,
                totalWorkouts: parseInt(row.total_workouts),
                completedWorkouts: parseInt(row.completed_workouts),
                completionPercentage: parseFloat(row.completion_percentage) || 0
            }));
        } catch (err) {
            console.error("Error in WorkoutCalendarService.getMonthlyProgress:", err);
            throw err;
        }
    },

    getDayDetails: async (patientId, date) => {
        try {
            // Get all workouts for a specific day
            const query = `
                SELECT 
                    wr.id AS workout_id,
                    wr.name AS workout_name,
                    wr.checked,
                    wr.date,
                    COUNT(wi.id) AS exercise_items_count
                FROM WorkoutRecord wr
                LEFT JOIN WorkoutItem wi ON wi.workout_record_id = wr.id
                WHERE wr.patient_id = $1 AND wr.date = $2
                GROUP BY wr.id, wr.name, wr.checked, wr.date
                ORDER BY wr.created_at ASC;
            `;

            const { rows } = await pool.query(query, [patientId, date]);

            // Format date to avoid timezone issues
            const dateFormatted = rows.length > 0 && rows[0].date instanceof Date
                ? rows[0].date.toISOString().split('T')[0]
                : date;

            return {
                date: dateFormatted,
                workouts: rows.map(row => ({
                    id: row.workout_id,
                    name: row.workout_name,
                    checked: row.checked,
                    exerciseItemsCount: parseInt(row.exercise_items_count)
                }))
            };
        } catch (err) {
            console.error("Error in WorkoutCalendarService.getDayDetails:", err);
            throw err;
        }
    }
};
