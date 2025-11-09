import { MealCalendarService } from '../services/MealCalendarService.js';

class MealCalendarController {
    // GET /meal-calendar/monthly/:patientId/:year/:month
    async getMonthlyProgress(req, res) {
        try {
            const { patientId, year, month } = req.params;
            const data = await MealCalendarService.getMonthlyProgress(
                patientId,
                parseInt(year),
                parseInt(month)
            );
            res.json(data);
        } catch (error) {
            console.error('Erro ao buscar progresso mensal:', error);
            res.status(500).json({ error: 'Erro ao buscar progresso mensal' });
        }
    }

    // GET /meal-calendar/day/:patientId/:date
    async getDayDetails(req, res) {
        try {
            const { patientId, date } = req.params;
            const data = await MealCalendarService.getDayDetails(patientId, date);
            res.json(data);
        } catch (error) {
            console.error('Erro ao buscar detalhes do dia:', error);
            res.status(500).json({ error: 'Erro ao buscar detalhes do dia' });
        }
    }
}

export default new MealCalendarController();
