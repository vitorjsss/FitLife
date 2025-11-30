import MealRecordRepository from '../repositories/MealRecordRepository.js';
import MealItemRepository from '../repositories/MealItemRepository.js';

class MealRecordController {
  // GET /meal-record/date/:date/patient/:patientId
  async getByDateAndPatient(req, res) {
    try {
      const { date, patientId } = req.params;
      const meals = await MealRecordRepository.findByDateAndPatient(date, patientId);
      res.json(meals);
    } catch (error) {
      console.error('Erro ao buscar refeições:', error);
      res.status(500).json({ error: 'Erro ao buscar refeições' });
    }
  }

  // GET /meal-record/:id
  async getById(req, res) {
    try {
      const { id } = req.params;
      const meal = await MealRecordRepository.findById(id);
      if (!meal) {
        return res.status(404).json({ error: 'Refeição não encontrada' });
      }
      res.json(meal);
    } catch (error) {
      console.error('Erro ao buscar refeição:', error);
      res.status(500).json({ error: 'Erro ao buscar refeição' });
    }
  }

  // POST /meal-record
  async create(req, res) {
    try {
      const { name, date, patient_id, icon_path } = req.body;
      if (!name || !date || !patient_id) {
        return res.status(400).json({ error: 'Nome, data e patient_id são obrigatórios' });
      }
      const meal = await MealRecordRepository.create(req.body);
      res.status(201).json(meal);
    } catch (error) {
      console.error('Erro ao criar refeição:', error);
      res.status(500).json({ error: 'Erro ao criar refeição' });
    }
  }

  // PUT /meal-record/:id
  async update(req, res) {
    try {
      const { id } = req.params;
      const meal = await MealRecordRepository.update(id, req.body);
      if (!meal) {
        return res.status(404).json({ error: 'Refeição não encontrada' });
      }
      res.json(meal);
    } catch (error) {
      console.error('Erro ao atualizar refeição:', error);
      res.status(500).json({ error: 'Erro ao atualizar refeição' });
    }
  }

  // DELETE /meal-record/:id
  async delete(req, res) {
    try {
      const { id } = req.params;
      const meal = await MealRecordRepository.delete(id);
      if (!meal) {
        return res.status(404).json({ error: 'Refeição não encontrada' });
      }
      res.json({ message: 'Refeição deletada com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar refeição:', error);
      res.status(500).json({ error: 'Erro ao deletar refeição' });
    }
  }

  // POST /meal-record/:id/items
  async addItem(req, res) {
    try {
      const { id } = req.params;
      const item = await MealItemRepository.create({ ...req.body, meal_record_id: id });
      res.status(201).json(item);
    } catch (error) {
      console.error('Erro ao adicionar item:', error);

      // Se for erro de validação de calorias do banco
      if (error.code === 'P0001' && error.message.includes('Calorias inconsistentes')) {
        return res.status(400).json({
          error: 'Validação de calorias falhou',
          message: error.message
        });
      }

      res.status(500).json({ error: 'Erro ao adicionar item' });
    }
  }

  // PUT /meal-record/:mealId/items/:itemId
  async updateItem(req, res) {
    try {
      const { itemId } = req.params;
      const item = await MealItemRepository.update(itemId, req.body);
      if (!item) {
        return res.status(404).json({ error: 'Item não encontrado' });
      }
      res.json(item);
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      res.status(500).json({ error: 'Erro ao atualizar item' });
    }
  }

  // DELETE /meal-record/:mealId/items/:itemId
  async deleteItem(req, res) {
    try {
      const { itemId } = req.params;
      const item = await MealItemRepository.delete(itemId);
      if (!item) {
        return res.status(404).json({ error: 'Item não encontrado' });
      }
      res.json({ message: 'Item deletado com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar item:', error);
      res.status(500).json({ error: 'Erro ao deletar item' });
    }
  }
}

export default new MealRecordController();