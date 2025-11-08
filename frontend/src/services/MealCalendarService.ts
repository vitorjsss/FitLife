import { apiClient } from './apiClient';

export interface DailyProgress {
    date: string;
    totalMeals: number;
    completedMeals: number;
    completionPercentage: number;
}

export interface MealDetail {
    id: string;
    name: string;
    iconPath: string | null;
    checked: boolean;
    foodItemsCount: number;
}

export interface DayDetails {
    date: string;
    registryId: string | null;
    meals: MealDetail[];
}

export const mealCalendarService = {
    getMonthlyProgress: async (patientId: string, year: number, month: number): Promise<DailyProgress[]> => {
        try {
            const response = await apiClient.get<DailyProgress[]>(
                `/meal-calendar/${patientId}/monthly?year=${year}&month=${month}`
            );
            return response;
        } catch (error) {
            console.error('Error fetching monthly progress:', error);
            throw error;
        }
    },

    getDayDetails: async (patientId: string, date: string): Promise<DayDetails> => {
        try {
            const response = await apiClient.get<DayDetails>(
                `/meal-calendar/${patientId}/day?date=${date}`
            );
            return response;
        } catch (error) {
            console.error('Error fetching day details:', error);
            throw error;
        }
    }
};
