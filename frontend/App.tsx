import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";


import Login from './src/screens/login/login';
import RegisterScreen from './src/screens/cadastro/register';
import HomeScreen from './src/screens/home/home';
import Refeicoes from './src/screens/refeicoes/Refeicoes';
import GerenciarRefeicoes from './src/screens/refeicoes/GerenciarRefeicoes';
import AdicionarAlimentos from './src/screens/refeicoes/AdicionarAlimentos';
import GerenciarTreinos from './src/screens/treinos/GerenciarTreinos';
import Treinos from './src/screens/treinos/Treinos';
import AdicionarTreinos from './src/screens/treinos/AdicionarTreinos';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Refeicoes: undefined;
  CriarDailyMealRegistry: undefined;
  GerenciarRefeicoes: {
    dailyMealRegistryId: string;
    date: string;
  };
  AdicionarAlimentos: {
    mealRecordId: string;
    mealName: string;
    dailyMealRegistryId: string;
  };
};
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Refeicoes"
          component={Refeicoes}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="GerenciarRefeicoes"
          component={GerenciarRefeicoes}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AdicionarAlimentos"
          component={AdicionarAlimentos}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Treinos" component={Treinos} />
        <Stack.Screen name="GerenciarTreinos" component={GerenciarTreinos} />
        <Stack.Screen name="AdicionarTreinos" component={AdicionarTreinos} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});