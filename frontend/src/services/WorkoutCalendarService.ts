import { apiClient } from './apiClient';

export interface DailyProgress {
    date: string;
    totalWorkouts: number;
    completedWorkouts: number;
    completionPercentage: number;
}

export interface WorkoutDetail {
    id: string;
    name: string;
    checked: boolean;
    exerciseItemsCount: number;
}

export interface DayDetails {
    date: string;
    workouts: WorkoutDetail[];
}

class WorkoutCalendarService {
    /**
     * Busca o progresso mensal de treinos
     */
    async getMonthlyProgress(
        patientId: string,
        year: number,
        month: number
    ): Promise<DailyProgress[]> {
        return apiClient.get<DailyProgress[]>(
            `/workout-calendar/monthly/${patientId}/${year}/${month}`
        );
    }

    /**
     * Busca os detalhes de um dia específico
     */
    async getDayDetails(patientId: string, date: string): Promise<DayDetails> {
        return apiClient.get<DayDetails>(`/workout-calendar/day/${patientId}/${date}`);
    }
}

export const workoutCalendarService = new WorkoutCalendarService();
export default workoutCalendarService;
