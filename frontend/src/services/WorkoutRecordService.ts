import { apiClient } from './apiClient';

export interface WorkoutItem {
    id?: string;
    exercise_name: string;
    series?: string;
    repeticoes?: string;
    carga?: string;
}

export interface WorkoutRecord {
    id?: string;
    name: string;
    date: string;
    patient_id: string;
    checked?: boolean;
    items?: WorkoutItem[];
    created_at?: string;
    updated_at?: string;
}

class WorkoutRecordService {
    // Buscar treinos por data e paciente
    async getByDate(date: string, patientId: string): Promise<WorkoutRecord[]> {
        return apiClient.get<WorkoutRecord[]>(`/workout-record/date/${date}/patient/${patientId}`);
    }

    // Buscar treino por ID
    async getById(id: string): Promise<WorkoutRecord> {
        return apiClient.get<WorkoutRecord>(`/workout-record/${id}`);
    }

    // Criar treino
    async create(data: WorkoutRecord): Promise<WorkoutRecord> {
        return apiClient.post<WorkoutRecord>('/workout-record', data);
    }

    // Atualizar treino
    async update(id: string, data: Partial<WorkoutRecord>): Promise<WorkoutRecord> {
        return apiClient.put<WorkoutRecord>(`/workout-record/${id}`, data);
    }

    // Deletar treino
    async delete(id: string): Promise<void> {
        return apiClient.delete<void>(`/workout-record/${id}`);
    }

    // Adicionar exercício ao treino
    async addItem(workoutId: string, item: WorkoutItem): Promise<WorkoutItem> {
        return apiClient.post<WorkoutItem>(`/workout-record/${workoutId}/items`, item);
    }

    // Atualizar exercício
    async updateItem(workoutId: string, itemId: string, item: Partial<WorkoutItem>): Promise<WorkoutItem> {
        return apiClient.put<WorkoutItem>(`/workout-record/${workoutId}/items/${itemId}`, item);
    }

    // Deletar exercício
    async deleteItem(workoutId: string, itemId: string): Promise<void> {
        return apiClient.delete<void>(`/workout-record/${workoutId}/items/${itemId}`);
    }
}

export default new WorkoutRecordService();
