import WorkoutRepository from '../repositories/WorkoutRepository.js';
import { LogService } from './LogService.js';

class WorkoutService {
    async createWorkout(workoutData, userId) {
        try {
            const { name, description, patient_id, physical_educator_id } = workoutData;

            // Validações
            if (!name || !name.trim()) {
                throw new Error('Nome do treino é obrigatório');
            }

            if (!patient_id) {
                throw new Error('ID do paciente é obrigatório');
            }

            const workout = await WorkoutRepository.create({
                name: name.trim(),
                description: description?.trim() || null,
                patient_id,
                physical_educator_id
            });

            // Log da ação
            await LogService.createLog({
                action: 'CREATE_WORKOUT',
                log_type: 'WORKOUT',
                description: `Treino '${workout.name}' criado`,
                user_id: userId,
                new_value: JSON.stringify(workout)
            });

            return workout;
        } catch (error) {
            console.error('Erro ao criar treino:', error);
            throw new Error(error.message || 'Erro interno do servidor');
        }
    }

    async getWorkoutById(id, userId) {
        try {
            const workout = await WorkoutRepository.getWorkoutWithExercises(id);
            
            if (!workout) {
                throw new Error('Treino não encontrado');
            }

            return workout;
        } catch (error) {
            console.error('Erro ao buscar treino:', error);
            throw new Error(error.message || 'Erro interno do servidor');
        }
    }

    async getWorkoutsByPatient(patient_id, userId) {
        try {
            const workouts = await WorkoutRepository.findByPatientId(patient_id);
            return workouts;
        } catch (error) {
            console.error('Erro ao buscar treinos do paciente:', error);
            throw new Error('Erro interno do servidor');
        }
    }

    async getWorkoutsByEducator(educator_id, userId) {
        try {
            const workouts = await WorkoutRepository.findByEducatorId(educator_id);
            return workouts;
        } catch (error) {
            console.error('Erro ao buscar treinos do educador físico:', error);
            throw new Error('Erro interno do servidor');
        }
    }

    async updateWorkout(id, workoutData, userId) {
        try {
            const existingWorkout = await WorkoutRepository.findById(id);
            
            if (!existingWorkout) {
                throw new Error('Treino não encontrado');
            }

            const { name, description } = workoutData;

            if (!name || !name.trim()) {
                throw new Error('Nome do treino é obrigatório');
            }

            const updatedWorkout = await WorkoutRepository.update(id, {
                name: name.trim(),
                description: description?.trim() || null
            });

            // Log da ação
            await LogService.createLog({
                action: 'UPDATE_WORKOUT',
                log_type: 'WORKOUT',
                description: `Treino '${updatedWorkout.name}' atualizado`,
                user_id: userId,
                old_value: JSON.stringify(existingWorkout),
                new_value: JSON.stringify(updatedWorkout)
            });

            return updatedWorkout;
        } catch (error) {
            console.error('Erro ao atualizar treino:', error);
            throw new Error(error.message || 'Erro interno do servidor');
        }
    }

    async deleteWorkout(id, userId) {
        try {
            const workout = await WorkoutRepository.findById(id);
            
            if (!workout) {
                throw new Error('Treino não encontrado');
            }

            const deletedWorkout = await WorkoutRepository.delete(id);

            // Log da ação
            await LogService.createLog({
                action: 'DELETE_WORKOUT',
                log_type: 'WORKOUT',
                description: `Treino '${workout.name}' excluído`,
                user_id: userId,
                old_value: JSON.stringify(workout)
            });

            return deletedWorkout;
        } catch (error) {
            console.error('Erro ao deletar treino:', error);
            throw new Error(error.message || 'Erro interno do servidor');
        }
    }

    // Métodos para exercícios
    async addExerciseToWorkout(workoutId, exerciseData, userId) {
        try {
            const workout = await WorkoutRepository.findById(workoutId);
            
            if (!workout) {
                throw new Error('Treino não encontrado');
            }

            const { name, exercise_type, carga, series, repeticoes, notes, order_index } = exerciseData;

            // Validações
            if (!name || !name.trim()) {
                throw new Error('Nome do exercício é obrigatório');
            }

            if (!series || series <= 0) {
                throw new Error('Número de séries deve ser maior que zero');
            }

            if (!repeticoes || repeticoes <= 0) {
                throw new Error('Número de repetições deve ser maior que zero');
            }

            const validTypes = ['forca', 'cardio', 'flexibilidade', 'esporte', 'funcional', 'outro'];
            if (exercise_type && !validTypes.includes(exercise_type)) {
                throw new Error('Tipo de exercício inválido');
            }

            const exercise = await WorkoutRepository.addExercise({
                name: name.trim(),
                exercise_type: exercise_type || 'outro',
                carga: parseFloat(carga) || 0,
                series: parseInt(series),
                repeticoes: parseInt(repeticoes),
                notes: notes?.trim() || null,
                order_index: parseInt(order_index) || 0,
                workout_id: workoutId
            });

            // Log da ação
            await LogService.createLog({
                action: 'ADD_EXERCISE',
                log_type: 'WORKOUT',
                description: `Exercício '${exercise.name}' adicionado ao treino '${workout.name}'`,
                user_id: userId,
                new_value: JSON.stringify(exercise)
            });

            return exercise;
        } catch (error) {
            console.error('Erro ao adicionar exercício:', error);
            throw new Error(error.message || 'Erro interno do servidor');
        }
    }

    async updateExercise(exerciseId, exerciseData, userId) {
        try {
            const existingExercise = await WorkoutRepository.findExerciseById(exerciseId);
            
            if (!existingExercise) {
                throw new Error('Exercício não encontrado');
            }

            const { name, exercise_type, carga, series, repeticoes, notes, order_index } = exerciseData;

            // Validações
            if (!name || !name.trim()) {
                throw new Error('Nome do exercício é obrigatório');
            }

            if (!series || series <= 0) {
                throw new Error('Número de séries deve ser maior que zero');
            }

            if (!repeticoes || repeticoes <= 0) {
                throw new Error('Número de repetições deve ser maior que zero');
            }

            const validTypes = ['forca', 'cardio', 'flexibilidade', 'esporte', 'funcional', 'outro'];
            if (exercise_type && !validTypes.includes(exercise_type)) {
                throw new Error('Tipo de exercício inválido');
            }

            const updatedExercise = await WorkoutRepository.updateExercise(exerciseId, {
                name: name.trim(),
                exercise_type: exercise_type || existingExercise.exercise_type || 'outro',
                carga: parseFloat(carga) || 0,
                series: parseInt(series),
                repeticoes: parseInt(repeticoes),
                notes: notes?.trim() || null,
                order_index: parseInt(order_index) || 0
            });

            // Log da ação
            await LogService.createLog({
                action: 'UPDATE_EXERCISE',
                log_type: 'WORKOUT',
                description: `Exercício '${updatedExercise.name}' atualizado`,
                user_id: userId,
                old_value: JSON.stringify(existingExercise),
                new_value: JSON.stringify(updatedExercise)
            });

            return updatedExercise;
        } catch (error) {
            console.error('Erro ao atualizar exercício:', error);
            throw new Error(error.message || 'Erro interno do servidor');
        }
    }

    async removeExercise(exerciseId, userId) {
        try {
            const exercise = await WorkoutRepository.findExerciseById(exerciseId);
            
            if (!exercise) {
                throw new Error('Exercício não encontrado');
            }

            const deletedExercise = await WorkoutRepository.removeExercise(exerciseId);

            // Log da ação
            await LogService.createLog({
                action: 'REMOVE_EXERCISE',
                log_type: 'WORKOUT',
                description: `Exercício '${exercise.name}' removido`,
                user_id: userId,
                old_value: JSON.stringify(exercise)
            });

            return deletedExercise;
        } catch (error) {
            console.error('Erro ao remover exercício:', error);
            throw new Error(error.message || 'Erro interno do servidor');
        }
    }

    async getExerciseById(exerciseId) {
        try {
            const exercise = await WorkoutRepository.findExerciseById(exerciseId);
            
            if (!exercise) {
                throw new Error('Exercício não encontrado');
            }

            return exercise;
        } catch (error) {
            console.error('Erro ao buscar exercício:', error);
            throw new Error(error.message || 'Erro interno do servidor');
        }
    }
}

export default new WorkoutService();