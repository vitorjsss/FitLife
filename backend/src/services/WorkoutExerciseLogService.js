import WorkoutExerciseLogRepository from '../repositories/WorkoutExerciseLogRepository.js';
import WorkoutSessionRepository from '../repositories/WorkoutSessionRepository.js';
import { LogService } from './LogService.js';

class WorkoutExerciseLogService {
    // Atualizar log de exercício (marcar progresso)
    async updateExerciseLog(logId, logData, userId) {
        try {
            const existingLog = await WorkoutExerciseLogRepository.findById(logId);
            
            if (!existingLog) {
                throw new Error('Log de exercício não encontrado');
            }

            const { series_completed, repeticoes_completed, carga_used, checked, completed, notes } = logData;

            const updatedLog = await WorkoutExerciseLogRepository.update(logId, {
                series_completed: series_completed !== undefined ? series_completed : existingLog.series_completed,
                repeticoes_completed: repeticoes_completed !== undefined ? repeticoes_completed : existingLog.repeticoes_completed,
                carga_used: carga_used !== undefined ? carga_used : existingLog.carga_used,
                checked: checked !== undefined ? checked : existingLog.checked,
                completed: completed !== undefined ? completed : existingLog.completed,
                notes: notes !== undefined ? notes : existingLog.notes
            });

            // Verificar se todos os exercícios foram completados
            const allCompleted = await WorkoutExerciseLogRepository.checkAllCompleted(
                existingLog.workout_session_id
            );

            // Se todos completados, marcar sessão como completa
            if (allCompleted) {
                await WorkoutSessionRepository.completeSession(existingLog.workout_session_id);
            }

            // Log da ação
            await LogService.createLog({
                action: 'UPDATE_EXERCISE_LOG',
                log_type: 'WORKOUT',
                description: `Progresso do exercício '${existingLog.exercise_name}' atualizado`,
                user_id: userId,
                old_value: JSON.stringify(existingLog),
                new_value: JSON.stringify(updatedLog)
            });

            return updatedLog;
        } catch (error) {
            console.error('Erro ao atualizar log de exercício:', error);
            throw new Error(error.message || 'Erro interno do servidor');
        }
    }

    // Marcar exercício como completo
    async markExerciseComplete(logId, userId) {
        try {
            const log = await WorkoutExerciseLogRepository.findById(logId);
            
            if (!log) {
                throw new Error('Log de exercício não encontrado');
            }

            const completedLog = await WorkoutExerciseLogRepository.markAsCompleted(logId);

            // Verificar se todos os exercícios foram completados
            const allCompleted = await WorkoutExerciseLogRepository.checkAllCompleted(
                log.workout_session_id
            );

            // Se todos completados, marcar sessão como completa
            if (allCompleted) {
                await WorkoutSessionRepository.completeSession(log.workout_session_id);
            }

            // Log da ação
            await LogService.createLog({
                action: 'COMPLETE_EXERCISE',
                log_type: 'WORKOUT',
                description: `Exercício '${log.exercise_name}' marcado como completo`,
                user_id: userId,
                new_value: JSON.stringify(completedLog)
            });

            return completedLog;
        } catch (error) {
            console.error('Erro ao marcar exercício como completo:', error);
            throw new Error(error.message || 'Erro interno do servidor');
        }
    }

    // Toggle checked do exercício (marcar/desmarcar como feito)
    async toggleChecked(logId, userId) {
        try {
            const log = await WorkoutExerciseLogRepository.findById(logId);
            
            if (!log) {
                throw new Error('Log de exercício não encontrado');
            }

            const toggledLog = await WorkoutExerciseLogRepository.toggleChecked(logId);

            // Log da ação
            await LogService.createLog({
                action: 'TOGGLE_EXERCISE_CHECKED',
                log_type: 'WORKOUT',
                description: `Exercício '${log.exercise_name}' marcado como ${toggledLog.checked ? 'feito' : 'não feito'}`,
                user_id: userId,
                old_value: JSON.stringify({ checked: log.checked }),
                new_value: JSON.stringify({ checked: toggledLog.checked })
            });

            return toggledLog;
        } catch (error) {
            console.error('Erro ao alternar checked do exercício:', error);
            throw new Error(error.message || 'Erro interno do servidor');
        }
    }

    // Buscar logs de uma sessão (checklist)
    async getSessionLogs(session_id) {
        try {
            const logs = await WorkoutExerciseLogRepository.findBySessionId(session_id);
            return logs;
        } catch (error) {
            console.error('Erro ao buscar logs da sessão:', error);
            throw new Error('Erro interno do servidor');
        }
    }

    // Buscar log específico
    async getLogById(logId) {
        try {
            const log = await WorkoutExerciseLogRepository.findById(logId);
            
            if (!log) {
                throw new Error('Log não encontrado');
            }

            return log;
        } catch (error) {
            console.error('Erro ao buscar log:', error);
            throw new Error(error.message || 'Erro interno do servidor');
        }
    }
}

export default new WorkoutExerciseLogService();