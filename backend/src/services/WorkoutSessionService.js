import WorkoutSessionRepository from '../repositories/WorkoutSessionRepository.js';
import WorkoutExerciseLogRepository from '../repositories/WorkoutExerciseLogRepository.js';
import WorkoutRepository from '../repositories/WorkoutRepository.js';
import { LogService } from './LogService.js';

class WorkoutSessionService {
    // Criar sessão de treino
    async createSession(sessionData, userId) {
        try {
            const { workout_id, patient_id, session_date, start_time, notes } = sessionData;

            // Validar treino existe
            const workout = await WorkoutRepository.findById(workout_id);
            if (!workout) {
                throw new Error('Treino não encontrado');
            }

            // Criar sessão
            const session = await WorkoutSessionRepository.create({
                workout_id,
                patient_id,
                session_date,
                start_time: start_time || new Date(),
                notes
            });

            // Criar logs para todos os exercícios do treino
            await WorkoutExerciseLogRepository.createLogsForWorkout(session.id, workout_id);

            // Log da ação
            await LogService.createLog({
                action: 'CREATE_WORKOUT_SESSION',
                log_type: 'WORKOUT',
                description: `Sessão de treino '${workout.name}' iniciada`,
                user_id: userId,
                new_value: JSON.stringify(session)
            });

            return await WorkoutSessionRepository.getSessionWithLogs(session.id);
        } catch (error) {
            console.error('Erro ao criar sessão de treino:', error);
            throw new Error(error.message || 'Erro interno do servidor');
        }
    }

    // Buscar sessão por ID com logs
    async getSessionById(id, userId) {
        try {
            const session = await WorkoutSessionRepository.getSessionWithLogs(id);
            
            if (!session) {
                throw new Error('Sessão não encontrada');
            }

            return session;
        } catch (error) {
            console.error('Erro ao buscar sessão:', error);
            throw new Error(error.message || 'Erro interno do servidor');
        }
    }

    // Listar sessões do paciente
    async getPatientSessions(patient_id, limit = 50) {
        try {
            const sessions = await WorkoutSessionRepository.findByPatientId(patient_id, limit);
            return sessions;
        } catch (error) {
            console.error('Erro ao buscar sessões do paciente:', error);
            throw new Error('Erro interno do servidor');
        }
    }

    // Sessões de um treino específico
    async getWorkoutSessions(workout_id) {
        try {
            const sessions = await WorkoutSessionRepository.findByWorkoutId(workout_id);
            return sessions;
        } catch (error) {
            console.error('Erro ao buscar sessões do treino:', error);
            throw new Error('Erro interno do servidor');
        }
    }

    // Sessões por data
    async getSessionsByDate(patient_id, date) {
        try {
            const sessions = await WorkoutSessionRepository.findByDate(patient_id, date);
            return sessions;
        } catch (error) {
            console.error('Erro ao buscar sessões por data:', error);
            throw new Error('Erro interno do servidor');
        }
    }

    // Atualizar sessão
    async updateSession(id, sessionData, userId) {
        try {
            const existingSession = await WorkoutSessionRepository.findById(id);
            
            if (!existingSession) {
                throw new Error('Sessão não encontrada');
            }

            const updatedSession = await WorkoutSessionRepository.update(id, sessionData);

            // Log da ação
            await LogService.createLog({
                action: 'UPDATE_WORKOUT_SESSION',
                log_type: 'WORKOUT',
                description: `Sessão de treino atualizada`,
                user_id: userId,
                old_value: JSON.stringify(existingSession),
                new_value: JSON.stringify(updatedSession)
            });

            return await WorkoutSessionRepository.getSessionWithLogs(id);
        } catch (error) {
            console.error('Erro ao atualizar sessão:', error);
            throw new Error(error.message || 'Erro interno do servidor');
        }
    }

    // Completar sessão
    async completeSession(id, userId) {
        try {
            const session = await WorkoutSessionRepository.findById(id);
            
            if (!session) {
                throw new Error('Sessão não encontrada');
            }

            const completedSession = await WorkoutSessionRepository.completeSession(id);

            // Log da ação
            await LogService.createLog({
                action: 'COMPLETE_WORKOUT_SESSION',
                log_type: 'WORKOUT',
                description: `Sessão de treino '${session.workout_name}' concluída`,
                user_id: userId,
                new_value: JSON.stringify(completedSession)
            });

            return await WorkoutSessionRepository.getSessionWithLogs(id);
        } catch (error) {
            console.error('Erro ao completar sessão:', error);
            throw new Error(error.message || 'Erro interno do servidor');
        }
    }

    // Deletar sessão
    async deleteSession(id, userId) {
        try {
            const session = await WorkoutSessionRepository.findById(id);
            
            if (!session) {
                throw new Error('Sessão não encontrada');
            }

            await WorkoutSessionRepository.delete(id);

            // Log da ação
            await LogService.createLog({
                action: 'DELETE_WORKOUT_SESSION',
                log_type: 'WORKOUT',
                description: `Sessão de treino excluída`,
                user_id: userId,
                old_value: JSON.stringify(session)
            });

            return { message: 'Sessão excluída com sucesso' };
        } catch (error) {
            console.error('Erro ao deletar sessão:', error);
            throw new Error(error.message || 'Erro interno do servidor');
        }
    }

    // Estatísticas de treino
    async getWorkoutStats(patient_id, workout_id, days = 30) {
        try {
            const stats = await WorkoutSessionRepository.getWorkoutStats(patient_id, workout_id, days);
            return stats;
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            throw new Error('Erro interno do servidor');
        }
    }

    // Progresso da sessão
    async getSessionProgress(session_id) {
        try {
            const progress = await WorkoutExerciseLogRepository.getSessionProgress(session_id);
            return progress;
        } catch (error) {
            console.error('Erro ao buscar progresso:', error);
            throw new Error('Erro interno do servidor');
        }
    }
}

export default new WorkoutSessionService();