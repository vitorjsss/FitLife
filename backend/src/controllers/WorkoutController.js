import WorkoutService from '../services/WorkoutService.js';

class WorkoutController {
    async createWorkout(req, res) {
        try {
            const { name, description, patient_id, physical_educator_id } = req.body;
            const userId = req.user.id;

            const workout = await WorkoutService.createWorkout({
                name,
                description,
                patient_id,
                physical_educator_id
            }, userId);

            return res.status(201).json({
                success: true,
                message: 'Treino criado com sucesso',
                data: workout
            });
        } catch (error) {
            console.error('Erro no controller createWorkout:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Erro ao criar treino'
            });
        }
    }

    async getWorkoutById(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const workout = await WorkoutService.getWorkoutById(id, userId);

            return res.status(200).json({
                success: true,
                data: workout
            });
        } catch (error) {
            console.error('Erro no controller getWorkoutById:', error);
            return res.status(404).json({
                success: false,
                message: error.message || 'Treino não encontrado'
            });
        }
    }

    async getWorkoutsByPatient(req, res) {
        try {
            const { patient_id } = req.params;
            const userId = req.user.id;

            const workouts = await WorkoutService.getWorkoutsByPatient(patient_id, userId);

            return res.status(200).json({
                success: true,
                data: workouts
            });
        } catch (error) {
            console.error('Erro no controller getWorkoutsByPatient:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Erro ao buscar treinos'
            });
        }
    }

    async getWorkoutsByEducator(req, res) {
        try {
            const { educator_id } = req.params;
            const userId = req.user.id;

            const workouts = await WorkoutService.getWorkoutsByEducator(educator_id, userId);

            return res.status(200).json({
                success: true,
                data: workouts
            });
        } catch (error) {
            console.error('Erro no controller getWorkoutsByEducator:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Erro ao buscar treinos'
            });
        }
    }

    async updateWorkout(req, res) {
        try {
            const { id } = req.params;
            const { name, description } = req.body;
            const userId = req.user.id;

            const workout = await WorkoutService.updateWorkout(id, {
                name,
                description
            }, userId);

            return res.status(200).json({
                success: true,
                message: 'Treino atualizado com sucesso',
                data: workout
            });
        } catch (error) {
            console.error('Erro no controller updateWorkout:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Erro ao atualizar treino'
            });
        }
    }

    async deleteWorkout(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            await WorkoutService.deleteWorkout(id, userId);

            return res.status(200).json({
                success: true,
                message: 'Treino excluído com sucesso'
            });
        } catch (error) {
            console.error('Erro no controller deleteWorkout:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Erro ao excluir treino'
            });
        }
    }

    // Métodos para exercícios
    async addExercise(req, res) {
        try {
            const { workout_id } = req.params;
            const { name, exercise_type, carga, series, repeticoes, notes, order_index } = req.body;
            const userId = req.user.id;

            const exercise = await WorkoutService.addExerciseToWorkout(workout_id, {
                name,
                exercise_type,
                carga,
                series,
                repeticoes,
                notes,
                order_index
            }, userId);

            return res.status(201).json({
                success: true,
                message: 'Exercício adicionado com sucesso',
                data: exercise
            });
        } catch (error) {
            console.error('Erro no controller addExercise:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Erro ao adicionar exercício'
            });
        }
    }

    async updateExercise(req, res) {
        try {
            const { exercise_id } = req.params;
            const { name, exercise_type, carga, series, repeticoes, notes, order_index } = req.body;
            const userId = req.user.id;

            const exercise = await WorkoutService.updateExercise(exercise_id, {
                name,
                exercise_type,
                carga,
                series,
                repeticoes,
                notes,
                order_index
            }, userId);

            return res.status(200).json({
                success: true,
                message: 'Exercício atualizado com sucesso',
                data: exercise
            });
        } catch (error) {
            console.error('Erro no controller updateExercise:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Erro ao atualizar exercício'
            });
        }
    }

    async removeExercise(req, res) {
        try {
            const { exercise_id } = req.params;
            const userId = req.user.id;

            await WorkoutService.removeExercise(exercise_id, userId);

            return res.status(200).json({
                success: true,
                message: 'Exercício removido com sucesso'
            });
        } catch (error) {
            console.error('Erro no controller removeExercise:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Erro ao remover exercício'
            });
        }
    }

    async getExerciseById(req, res) {
        try {
            const { exercise_id } = req.params;

            const exercise = await WorkoutService.getExerciseById(exercise_id);

            return res.status(200).json({
                success: true,
                data: exercise
            });
        } catch (error) {
            console.error('Erro no controller getExerciseById:', error);
            return res.status(404).json({
                success: false,
                message: error.message || 'Exercício não encontrado'
            });
        }
    }
}

export default new WorkoutController();