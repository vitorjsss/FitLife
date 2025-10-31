import { apiClient } from './apiClient';

export interface WorkoutExerciseLog {
  id: string;
  workout_session_id: string;
  workout_exercise_id: string;
  series_completed: number;
  repeticoes_completed: number;
  carga_used: number;
  checked: boolean;
  completed: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Dados do exercício
  exercise_name?: string;
  exercise_type?: string;
  series_target?: number;
  repeticoes_target?: number;
  carga_target?: number;
}

export interface WorkoutSession {
  id: string;
  workout_id: string;
  patient_id: string;
  session_date: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
  // Dados do treino
  workout_name?: string;
  workout_description?: string;
  // Logs de exercícios
  exercise_logs?: WorkoutExerciseLog[];
}

export interface WorkoutStats {
  total_sessions: number;
  completed_sessions: number;
  completion_rate: number;
  avg_duration_minutes?: number;
  last_session_date?: string;
}

export interface SessionProgress {
  total_exercises: number;
  completed_exercises: number;
  progress_percentage: number;
}

class WorkoutSessionService {
  private baseUrl = '/workout-session';

  // ===== WORKOUT SESSIONS =====

  /**
   * Criar nova sessão de treino
   */
  async createSession(sessionData: {
    workout_id: string;
    patient_id: string;
    session_date: string;
    start_time?: string;
    notes?: string;
  }): Promise<WorkoutSession> {
    const response = await apiClient.post<{ data: WorkoutSession }>(
      `${this.baseUrl}/sessions`,
      sessionData
    );
    return response.data;
  }

  /**
   * Buscar sessão por ID (com logs de exercícios)
   */
  async getSessionById(sessionId: string): Promise<WorkoutSession> {
    const response = await apiClient.get<{ data: WorkoutSession }>(
      `${this.baseUrl}/sessions/${sessionId}`
    );
    return response.data;
  }

  /**
   * Listar sessões de um paciente (US5.0: Visualização de treinos)
   */
  async getPatientSessions(patientId: string, limit: number = 50): Promise<WorkoutSession[]> {
    const response = await apiClient.get<{ data: WorkoutSession[] }>(
      `${this.baseUrl}/sessions/patient/${patientId}?limit=${limit}`
    );
    return response.data;
  }

  /**
   * Buscar sessões de um treino específico
   */
  async getWorkoutSessions(workoutId: string): Promise<WorkoutSession[]> {
    const response = await apiClient.get<{ data: WorkoutSession[] }>(
      `${this.baseUrl}/sessions/workout/${workoutId}`
    );
    return response.data;
  }

  /**
   * Buscar sessões de um paciente em uma data específica
   */
  async getSessionsByDate(patientId: string, date: string): Promise<WorkoutSession[]> {
    const response = await apiClient.get<{ data: WorkoutSession[] }>(
      `${this.baseUrl}/sessions/patient/${patientId}/date/${date}`
    );
    return response.data;
  }

  /**
   * Atualizar sessão (US5.2: Atualização de treinos)
   */
  async updateSession(sessionId: string, updateData: {
    start_time?: string;
    end_time?: string;
    notes?: string;
    completed?: boolean;
  }): Promise<WorkoutSession> {
    const response = await apiClient.put<{ data: WorkoutSession }>(
      `${this.baseUrl}/sessions/${sessionId}`,
      updateData
    );
    return response.data;
  }

  /**
   * Completar sessão
   */
  async completeSession(sessionId: string): Promise<WorkoutSession> {
    const response = await apiClient.post<{ data: WorkoutSession }>(
      `${this.baseUrl}/sessions/${sessionId}/complete`,
      {}
    );
    return response.data;
  }

  /**
   * Deletar sessão
   */
  async deleteSession(sessionId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/sessions/${sessionId}`);
  }

  /**
   * Obter estatísticas de um treino
   */
  async getWorkoutStats(patientId: string, workoutId: string, days: number = 30): Promise<WorkoutStats> {
    const response = await apiClient.get<{ data: WorkoutStats }>(
      `${this.baseUrl}/stats/patient/${patientId}/workout/${workoutId}?days=${days}`
    );
    return response.data;
  }

  /**
   * Obter progresso da sessão
   */
  async getSessionProgress(sessionId: string): Promise<SessionProgress> {
    const response = await apiClient.get<{ data: SessionProgress }>(
      `${this.baseUrl}/sessions/${sessionId}/progress`
    );
    return response.data;
  }

  // ===== EXERCISE CHECKLIST (US7.1: Visualização de checklist de treinos) =====

  /**
   * Buscar checklist completo de uma sessão
   */
  async getSessionLogs(sessionId: string): Promise<WorkoutExerciseLog[]> {
    const response = await apiClient.get<{ data: WorkoutExerciseLog[] }>(
      `${this.baseUrl}/sessions/${sessionId}/logs`
    );
    return response.data;
  }

  /**
   * Buscar log específico de exercício
   */
  async getLogById(logId: string): Promise<WorkoutExerciseLog> {
    const response = await apiClient.get<{ data: WorkoutExerciseLog }>(
      `${this.baseUrl}/logs/${logId}`
    );
    return response.data;
  }

  /**
   * Atualizar log de exercício (marcar séries/reps completadas)
   */
  async updateExerciseLog(logId: string, updateData: {
    series_completed?: number;
    repeticoes_completed?: number;
    carga_used?: number;
    checked?: boolean;
    completed?: boolean;
    notes?: string;
  }): Promise<WorkoutExerciseLog> {
    const response = await apiClient.put<{ data: WorkoutExerciseLog }>(
      `${this.baseUrl}/logs/${logId}`,
      updateData
    );
    return response.data;
  }

  /**
   * Toggle checked do exercício (marcar/desmarcar como feito)
   */
  async toggleExerciseChecked(logId: string): Promise<WorkoutExerciseLog> {
    const response = await apiClient.patch<{ data: WorkoutExerciseLog }>(
      `${this.baseUrl}/logs/${logId}/checked`,
      {}
    );
    return response.data;
  }

  /**
   * Marcar exercício como completo
   */
  async markExerciseComplete(logId: string): Promise<WorkoutExerciseLog> {
    const response = await apiClient.post<{ data: WorkoutExerciseLog }>(
      `${this.baseUrl}/logs/${logId}/complete`,
      {}
    );
    return response.data;
  }
}

export const workoutSessionService = new WorkoutSessionService();
