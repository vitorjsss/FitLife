import AsyncStorage from '@react-native-async-storage/async-storage';

const MEAL_RECORDS_KEY = '@fitlife_meal_records';

export async function saveMealRecordLocal(dailyMealRegistryId: string, mealRecords: any[]) {
  try {
    const stored = await AsyncStorage.getItem(MEAL_RECORDS_KEY);
    const allData = stored ? JSON.parse(stored) : {};

    allData[dailyMealRegistryId] = mealRecords;
    await AsyncStorage.setItem(MEAL_RECORDS_KEY, JSON.stringify(allData));
  } catch (error) {
    console.error('Erro ao salvar refeições locais:', error);
  }
}

export async function loadMealRecordsLocal(dailyMealRegistryId: string) {
  try {
    const stored = await AsyncStorage.getItem(MEAL_RECORDS_KEY);
    const allData = stored ? JSON.parse(stored) : {};
    return allData[dailyMealRegistryId] || [];
  } catch (error) {
    console.error('Erro ao carregar refeições locais:', error);
    return [];
  }
}
