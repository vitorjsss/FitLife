import AsyncStorage from '@react-native-async-storage/async-storage';

const MEAL_RECORDS_KEY = '@fitlife_meal_records';

export async function loadDailyMeals(dailyMealRegistryId: string) {
  try {
    const stored = await AsyncStorage.getItem(MEAL_RECORDS_KEY);
    if (!stored) return [];
    const allData = JSON.parse(stored);
    return allData[dailyMealRegistryId] || [];
  } catch (error) {
    console.error('Erro ao carregar refeições diárias:', error);
    return [];
  }
}
