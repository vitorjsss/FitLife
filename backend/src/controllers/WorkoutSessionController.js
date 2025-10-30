import WorkoutSessionService from '../services/WorkoutSessionService.js';

class WorkoutSessionController {
    // Criar sessão de treino
    async createSession(req, res) {
        try {
            const { workout_id, patient_id, session_date, start_time, notes } = req.body;
            const userId = req.user.id;

            const session = await WorkoutSessionService.createSession({
                workout_id,
                patient_id,
                session_date,
                start_time,
                notes
            }, userId);

            return res.status(201).json({
                success: true,
                message: 'Sessão de treino criada com sucesso',
                data: session
            });
        } catch (error) {
            console.error('Erro no controller createSession:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Erro ao criar sessão de treino'
            });
        }
    }

    // Buscar sessão por ID
    async getSessionById(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const session = await WorkoutSessionService.getSessionById(id, userId);

            return res.status(200).json({
                success: true,
                data: session
            });
        } catch (error) {
            console.error('Erro no controller getSessionById:', error);
            return res.status(404).json({
                success: false,
                message: error.message || 'Sessão não encontrada'
            });
        }
    }

    // Listar sessões do paciente
    async getPatientSessions(req, res) {
        try {
            const { patient_id } = req.params;
            const { limit } = req.query;

            const sessions = await WorkoutSessionService.getPatientSessions(
                patient_id, 
                limit ? parseInt(limit) : 50
            );

            return res.status(200).json({
                success: true,
                data: sessions
            });
        } catch (error) {
            console.error('Erro no controller getPatientSessions:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar sessões'
            });
        }
    }

    // Sessões de um treino
    async getWorkoutSessions(req, res) {
        try {
            const { workout_id } = req.params;

            const sessions = await WorkoutSessionService.getWorkoutSessions(workout_id);

            return res.status(200).json({
                success: true,
                data: sessions
            });
        } catch (error) {
            console.error('Erro no controller getWorkoutSessions:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar sessões'
            });
        }
    }

    // Sessões por data
    async getSessionsByDate(req, res) {
        try {
            const { patient_id, date } = req.params;

            const sessions = await WorkoutSessionService.getSessionsByDate(patient_id, date);

            return res.status(200).json({
                success: true,
                data: sessions
            });
        } catch (error) {
            console.error('Erro no controller getSessionsByDate:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar sessões'
            });
        }
    }

    // Atualizar sessão
    async updateSession(req, res) {
        try {
            const { id } = req.params;
            const { end_time, notes, completed } = req.body;
            const userId = req.user.id;

            const session = await WorkoutSessionService.updateSession(id, {
                end_time,
                notes,
                completed
            }, userId);

            return res.status(200).json({
                success: true,
                message: 'Sessão atualizada com sucesso',
                data: session
            });
        } catch (error) {
            console.error('Erro no controller updateSession:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Erro ao atualizar sessão'
            });
        }
    }

    // Completar sessão
    async completeSession(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const session = await WorkoutSessionService.completeSession(id, userId);

            return res.status(200).json({
                success: true,
                message: 'Sessão completada com sucesso',
                data: session
            });
        } catch (error) {
            console.error('Erro no controller completeSession:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Erro ao completar sessão'
            });
        }
    }

    // Deletar sessão
    async deleteSession(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            await WorkoutSessionService.deleteSession(id, userId);

            return res.status(200).json({
                success: true,
                message: 'Sessão excluída com sucesso'
            });
        } catch (error) {
            console.error('Erro no controller deleteSession:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Erro ao excluir sessão'
            });
        }
    }

    // Estatísticas
    async getWorkoutStats(req, res) {
        try {
            const { patient_id, workout_id } = req.params;
            const { days } = req.query;

            const stats = await WorkoutSessionService.getWorkoutStats(
                patient_id, 
                workout_id,
                days ? parseInt(days) : 30
            );

            return res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Erro no controller getWorkoutStats:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar estatísticas'
            });
        }
    }

    // Progresso da sessão
    async getSessionProgress(req, res) {
        try {
            const { id } = req.params;

            const progress = await WorkoutSessionService.getSessionProgress(id);

            return res.status(200).json({
                success: true,
                data: progress
            });
        } catch (error) {
            console.error('Erro no controller getSessionProgress:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar progresso'
            });
        }
    }
}

export default new WorkoutSessionController();