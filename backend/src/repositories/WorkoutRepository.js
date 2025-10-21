import { pool } from '../config/db.js';

class WorkoutRepository {
    async create(workoutData) {
        const { name, description, patient_id, physical_educator_id } = workoutData;
        const query = `
            INSERT INTO workout (name, description, patient_id, physical_educator_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const values = [name, description, patient_id, physical_educator_id];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    async findById(id) {
        const query = `
            SELECT w.*, 
                   p.name as patient_name,
                   pe.name as educator_name
            FROM workout w
            LEFT JOIN patient p ON w.patient_id = p.id
            LEFT JOIN physical_educator pe ON w.physical_educator_id = pe.id
            WHERE w.id = $1
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    async findByPatientId(patient_id) {
        const query = `
            SELECT w.*, 
                   p.name as patient_name,
                   pe.name as educator_name
            FROM workout w
            LEFT JOIN patient p ON w.patient_id = p.id
            LEFT JOIN physical_educator pe ON w.physical_educator_id = pe.id
            WHERE w.patient_id = $1
            ORDER BY w.created_at DESC
        `;
        const result = await pool.query(query, [patient_id]);
        return result.rows;
    }

    async findByEducatorId(educator_id) {
        const query = `
            SELECT w.*, 
                   p.name as patient_name,
                   pe.name as educator_name
            FROM workout w
            LEFT JOIN patient p ON w.patient_id = p.id
            LEFT JOIN physical_educator pe ON w.physical_educator_id = pe.id
            WHERE w.physical_educator_id = $1
            ORDER BY w.created_at DESC
        `;
        const result = await pool.query(query, [educator_id]);
        return result.rows;
    }

    async update(id, workoutData) {
        const { name, description } = workoutData;
        const query = `
            UPDATE workout 
            SET name = $1, description = $2, updated_at = NOW()
            WHERE id = $3
            RETURNING *
        `;
        const values = [name, description, id];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    async delete(id) {
        const query = `DELETE FROM workout WHERE id = $1 RETURNING *`;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    async getWorkoutWithExercises(workoutId) {
        const workoutQuery = `
            SELECT w.*, 
                   p.name as patient_name,
                   pe.name as educator_name
            FROM workout w
            LEFT JOIN patient p ON w.patient_id = p.id
            LEFT JOIN physical_educator pe ON w.physical_educator_id = pe.id
            WHERE w.id = $1
        `;
        
        const exercisesQuery = `
            SELECT * FROM workout_exercise 
            WHERE workout_id = $1 
            ORDER BY order_index ASC, created_at ASC
        `;

        const [workoutResult, exercisesResult] = await Promise.all([
            pool.query(workoutQuery, [workoutId]),
            pool.query(exercisesQuery, [workoutId])
        ]);

        if (workoutResult.rows.length === 0) {
            return null;
        }

        const workout = workoutResult.rows[0];
        workout.exercicios = exercisesResult.rows;
        
        return workout;
    }

    // Métodos para exercícios
    async addExercise(exerciseData) {
        const { name, exercise_type, carga, series, repeticoes, notes, order_index, workout_id } = exerciseData;
        const query = `
            INSERT INTO workout_exercise (name, exercise_type, carga, series, repeticoes, notes, order_index, workout_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        const values = [name, exercise_type || 'outro', carga || 0, series, repeticoes, notes, order_index || 0, workout_id];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    async updateExercise(exerciseId, exerciseData) {
        const { name, exercise_type, carga, series, repeticoes, notes, order_index } = exerciseData;
        const query = `
            UPDATE workout_exercise 
            SET name = $1, exercise_type = $2, carga = $3, series = $4, repeticoes = $5, 
                notes = $6, order_index = $7, updated_at = NOW()
            WHERE id = $8
            RETURNING *
        `;
        const values = [name, exercise_type || 'outro', carga || 0, series, repeticoes, notes, order_index || 0, exerciseId];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    async removeExercise(exerciseId) {
        const query = `DELETE FROM workout_exercise WHERE id = $1 RETURNING *`;
        const result = await pool.query(query, [exerciseId]);
        return result.rows[0];
    }

    async findExerciseById(exerciseId) {
        const query = `SELECT * FROM workout_exercise WHERE id = $1`;
        const result = await pool.query(query, [exerciseId]);
        return result.rows[0];
    }
}

export default new WorkoutRepository();