import { WorkoutCalendarService } from '../services/WorkoutCalendarService.js';

class WorkoutCalendarController {
    // GET /workout-calendar/monthly/:patientId/:year/:month
    async getMonthlyProgress(req, res) {
        try {
            const { patientId, year, month } = req.params;
            const data = await WorkoutCalendarService.getMonthlyProgress(
                patientId,
                parseInt(year),
                parseInt(month)
            );
            res.json(data);
        } catch (error) {
            console.error('Erro ao buscar progresso mensal de treinos:', error);
            res.status(500).json({ error: 'Erro ao buscar progresso mensal de treinos' });
        }
    }

    // GET /workout-calendar/day/:patientId/:date
    async getDayDetails(req, res) {
        try {
            const { patientId, date } = req.params;
            const data = await WorkoutCalendarService.getDayDetails(patientId, date);
            res.json(data);
        } catch (error) {
            console.error('Erro ao buscar detalhes do dia de treinos:', error);
            res.status(500).json({ error: 'Erro ao buscar detalhes do dia de treinos' });
        }
    }
}

export default new WorkoutCalendarController();
