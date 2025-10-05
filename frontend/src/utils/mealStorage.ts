import AsyncStorage from '@react-native-async-storage/async-storage';

const MEALS_KEY = '@fitlife_meals';

export async function saveMeal(mealId: string, items: any[]) {
  try {
    const stored = await AsyncStorage.getItem(MEALS_KEY);
    const allMeals = stored ? JSON.parse(stored) : {};

    allMeals[mealId] = items;
    await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(allMeals));
  } catch (error) {
    console.error('Erro ao salvar refeições locais:', error);
  }
}

export async function loadMeal(mealId: string) {
  try {
    const stored = await AsyncStorage.getItem(MEALS_KEY);
    const allMeals = stored ? JSON.parse(stored) : {};
    return allMeals[mealId] || [];
  } catch (error) {
    console.error('Erro ao carregar refeições locais:', error);
    return [];
  }
}
