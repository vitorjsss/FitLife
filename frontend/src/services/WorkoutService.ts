import apiClient from './apiClient';

interface Exercicio {
  id: string;
  name: string;
  exercise_type: 'forca' | 'cardio' | 'flexibilidade' | 'esporte' | 'funcional' | 'outro';
  carga: number;
  series: number;
  repeticoes: number;
  notes?: string;
  order_index?: number;
}

interface Treino {
  id: string;
  name: string;
  description?: string;
  patient_id: string;
  physical_educator_id?: string;
  exercicios?: Exercicio[];
  created_at: string;
  updated_at: string;
}

interface CreateWorkoutData {
  name: string;
  description?: string;
  patient_id: string;
  physical_educator_id?: string;
}

interface CreateExerciseData {
  name: string;
  exercise_type?: 'forca' | 'cardio' | 'flexibilidade' | 'esporte' | 'funcional' | 'outro';
  carga?: number;
  series: number;
  repeticoes: number;
  notes?: string;
  order_index?: number;
}

class WorkoutService {
  // Treinos
  async createWorkout(data: CreateWorkoutData): Promise<Treino> {
    const response = await apiClient.post('/workout', data);
    return response.data.data;
  }

  async getWorkoutById(id: string): Promise<Treino> {
    const response = await apiClient.get(`/workout/${id}`);
    return response.data.data;
  }

  async getWorkoutsByPatient(patientId: string): Promise<Treino[]> {
    const response = await apiClient.get(`/workout/patient/${patientId}`);
    return response.data.data;
  }

  async getWorkoutsByEducator(educatorId: string): Promise<Treino[]> {
    const response = await apiClient.get(`/workout/educator/${educatorId}`);
    return response.data.data;
  }

  async updateWorkout(id: string, data: Partial<CreateWorkoutData>): Promise<Treino> {
    const response = await apiClient.put(`/workout/${id}`, data);
    return response.data.data;
  }

  async deleteWorkout(id: string): Promise<void> {
    await apiClient.delete(`/workout/${id}`);
  }

  // Exercícios
  async addExercise(workoutId: string, data: CreateExerciseData): Promise<Exercicio> {
    const response = await apiClient.post(`/workout/${workoutId}/exercises`, data);
    return response.data.data;
  }

  async updateExercise(exerciseId: string, data: Partial<CreateExerciseData>): Promise<Exercicio> {
    const response = await apiClient.put(`/workout/exercises/${exerciseId}`, data);
    return response.data.data;
  }

  async removeExercise(exerciseId: string): Promise<void> {
    await apiClient.delete(`/workout/exercises/${exerciseId}`);
  }

  async getExerciseById(exerciseId: string): Promise<Exercicio> {
    const response = await apiClient.get(`/workout/exercises/${exerciseId}`);
    return response.data.data;
  }
}

export default new WorkoutService();