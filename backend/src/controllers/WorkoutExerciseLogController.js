import WorkoutExerciseLogService from '../services/WorkoutExerciseLogService.js';

class WorkoutExerciseLogController {
    // Atualizar log de exercício (checklist)
    async updateExerciseLog(req, res) {
        try {
            const { log_id } = req.params;
            const { series_completed, repeticoes_completed, carga_used, completed, notes } = req.body;
            const userId = req.user.id;

            const log = await WorkoutExerciseLogService.updateExerciseLog(log_id, {
                series_completed,
                repeticoes_completed,
                carga_used,
                completed,
                notes
            }, userId);

            return res.status(200).json({
                success: true,
                message: 'Exercício atualizado com sucesso',
                data: log
            });
        } catch (error) {
            console.error('Erro no controller updateExerciseLog:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Erro ao atualizar exercício'
            });
        }
    }

    // Toggle checked do exercício (marcar/desmarcar como feito)
    async toggleChecked(req, res) {
        try {
            const { log_id } = req.params;
            const userId = req.user.id;

            const log = await WorkoutExerciseLogService.toggleChecked(log_id, userId);

            return res.status(200).json({
                success: true,
                message: `Exercício marcado como ${log.checked ? 'feito' : 'não feito'}`,
                data: log
            });
        } catch (error) {
            console.error('Erro no controller toggleChecked:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Erro ao alternar checked'
            });
        }
    }

    // Marcar exercício como completo
    async markExerciseComplete(req, res) {
        try {
            const { log_id } = req.params;
            const userId = req.user.id;

            const log = await WorkoutExerciseLogService.markExerciseComplete(log_id, userId);

            return res.status(200).json({
                success: true,
                message: 'Exercício marcado como completo',
                data: log
            });
        } catch (error) {
            console.error('Erro no controller markExerciseComplete:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Erro ao marcar exercício'
            });
        }
    }

    // Buscar logs de uma sessão (checklist completo)
    async getSessionLogs(req, res) {
        try {
            const { session_id } = req.params;

            const logs = await WorkoutExerciseLogService.getSessionLogs(session_id);

            return res.status(200).json({
                success: true,
                data: logs
            });
        } catch (error) {
            console.error('Erro no controller getSessionLogs:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar checklist'
            });
        }
    }

    // Buscar log específico
    async getLogById(req, res) {
        try {
            const { log_id } = req.params;

            const log = await WorkoutExerciseLogService.getLogById(log_id);

            return res.status(200).json({
                success: true,
                data: log
            });
        } catch (error) {
            console.error('Erro no controller getLogById:', error);
            return res.status(404).json({
                success: false,
                message: error.message || 'Log não encontrado'
            });
        }
    }
}

export default new WorkoutExerciseLogController();