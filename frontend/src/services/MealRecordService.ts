import { apiClient } from './apiClient';

export interface MealItem {
  id?: string;
  food_name: string;
  quantity?: string;
  calories?: number;
  proteins?: number;
  carbs?: number;
  fats?: number;
}

export interface MealRecord {
  id?: string;
  name: string;
  date: string;
  patient_id: string;
  icon_path?: string;
  checked?: boolean;
  items?: MealItem[];
  created_at?: string;
  updated_at?: string;
}

class MealRecordService {
  // Buscar refeições por data e paciente
  async getByDate(date: string, patientId: string): Promise<MealRecord[]> {
    return apiClient.get<MealRecord[]>(`/meal-record/date/${date}/patient/${patientId}`);
  }

  // Buscar refeição por ID
  async getById(id: string): Promise<MealRecord> {
    return apiClient.get<MealRecord>(`/meal-record/${id}`);
  }

  // Criar refeição
  async create(data: MealRecord): Promise<MealRecord> {
    return apiClient.post<MealRecord>('/meal-record', data);
  }

  // Atualizar refeição
  async update(id: string, data: Partial<MealRecord>): Promise<MealRecord> {
    return apiClient.put<MealRecord>(`/meal-record/${id}`, data);
  }

  // Deletar refeição
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/meal-record/${id}`);
  }

  // Adicionar item à refeição
  async addItem(mealId: string, item: MealItem): Promise<MealItem> {
    return apiClient.post<MealItem>(`/meal-record/${mealId}/items`, item);
  }

  // Atualizar item
  async updateItem(mealId: string, itemId: string, item: Partial<MealItem>): Promise<MealItem> {
    return apiClient.put<MealItem>(`/meal-record/${mealId}/items/${itemId}`, item);
  }

  // Deletar item
  async deleteItem(mealId: string, itemId: string): Promise<void> {
    return apiClient.delete<void>(`/meal-record/${mealId}/items/${itemId}`);
  }
}

export default new MealRecordService();
