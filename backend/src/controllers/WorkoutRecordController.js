import WorkoutRecordRepository from '../repositories/WorkoutRecordRepository.js';
import WorkoutItemRepository from '../repositories/WorkoutItemRepository.js';

class WorkoutRecordController {
    // GET /workout-record/date/:date/patient/:patientId
    async getByDateAndPatient(req, res) {
        try {
            const { date, patientId } = req.params;
            const workouts = await WorkoutRecordRepository.findByDateAndPatient(date, patientId);
            res.json(workouts);
        } catch (error) {
            console.error('Erro ao buscar treinos:', error);
            res.status(500).json({ error: 'Erro ao buscar treinos' });
        }
    }

    // GET /workout-record/:id
    async getById(req, res) {
        try {
            const { id } = req.params;
            const workout = await WorkoutRecordRepository.findById(id);
            if (!workout) {
                return res.status(404).json({ error: 'Treino não encontrado' });
            }
            res.json(workout);
        } catch (error) {
            console.error('Erro ao buscar treino:', error);
            res.status(500).json({ error: 'Erro ao buscar treino' });
        }
    }

    // POST /workout-record
    async create(req, res) {
        try {
            const { name, date, patient_id } = req.body;
            if (!name || !date || !patient_id) {
                return res.status(400).json({ error: 'Nome, data e patient_id são obrigatórios' });
            }
            const workout = await WorkoutRecordRepository.create(req.body);
            res.status(201).json(workout);
        } catch (error) {
            console.error('Erro ao criar treino:', error);
            res.status(500).json({ error: 'Erro ao criar treino' });
        }
    }

    // PUT /workout-record/:id
    async update(req, res) {
        try {
            const { id } = req.params;
            const workout = await WorkoutRecordRepository.update(id, req.body);
            if (!workout) {
                return res.status(404).json({ error: 'Treino não encontrado' });
            }
            res.json(workout);
        } catch (error) {
            console.error('Erro ao atualizar treino:', error);
            res.status(500).json({ error: 'Erro ao atualizar treino' });
        }
    }

    // DELETE /workout-record/:id
    async delete(req, res) {
        try {
            const { id } = req.params;
            const workout = await WorkoutRecordRepository.delete(id);
            if (!workout) {
                return res.status(404).json({ error: 'Treino não encontrado' });
            }
            res.json({ message: 'Treino deletado com sucesso' });
        } catch (error) {
            console.error('Erro ao deletar treino:', error);
            res.status(500).json({ error: 'Erro ao deletar treino' });
        }
    }

    // POST /workout-record/:id/items
    async addItem(req, res) {
        try {
            const { id } = req.params;
            const item = await WorkoutItemRepository.create({ ...req.body, workout_record_id: id });
            res.status(201).json(item);
        } catch (error) {
            console.error('Erro ao adicionar exercício:', error);
            res.status(500).json({ error: 'Erro ao adicionar exercício' });
        }
    }

    // PUT /workout-record/:workoutId/items/:itemId
    async updateItem(req, res) {
        try {
            const { itemId } = req.params;
            const item = await WorkoutItemRepository.update(itemId, req.body);
            if (!item) {
                return res.status(404).json({ error: 'Exercício não encontrado' });
            }
            res.json(item);
        } catch (error) {
            console.error('Erro ao atualizar exercício:', error);
            res.status(500).json({ error: 'Erro ao atualizar exercício' });
        }
    }

    // DELETE /workout-record/:workoutId/items/:itemId
    async deleteItem(req, res) {
        try {
            const { itemId } = req.params;
            const item = await WorkoutItemRepository.delete(itemId);
            if (!item) {
                return res.status(404).json({ error: 'Exercício não encontrado' });
            }
            res.json({ message: 'Exercício deletado com sucesso' });
        } catch (error) {
            console.error('Erro ao deletar exercício:', error);
            res.status(500).json({ error: 'Erro ao deletar exercício' });
        }
    }
}

export default new WorkoutRecordController();
