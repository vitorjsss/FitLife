import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect, useState } from 'react';

import Login from './src/screens/login/login';
import RegisterScreen from './src/screens/cadastro/register';
import HomeScreen from './src/screens/home/home';
import Refeicoes from './src/screens/refeicoes/Refeicoes';
import GerenciarRefeicoes from './src/screens/refeicoes/GerenciarRefeicoes';
import AdicionarAlimentos from './src/screens/refeicoes/AdicionarAlimentos';
import GerenciarTreinos from './src/screens/treinos/GerenciarTreinos';
import Treinos from './src/screens/treinos/Treinos';
import AdicionarTreinos from './src/screens/treinos/AdicionarTreinos';

import { authService } from './src/services/authService';

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
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLogin = async () => {
      const loggedIn = await authService.ensureLoggedIn();
      setInitialRoute(loggedIn ? 'Home' : 'Login');
      setLoading(false);
    };
    checkLogin();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute || 'Login'}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Refeicoes" component={Refeicoes} />
        <Stack.Screen name="GerenciarRefeicoes" component={GerenciarRefeicoes} />
        <Stack.Screen name="AdicionarAlimentos" component={AdicionarAlimentos} />
        <Stack.Screen name="Treinos" component={Treinos} />
        <Stack.Screen name="GerenciarTreinos" component={GerenciarTreinos} />
        <Stack.Screen name="AdicionarTreinos" component={AdicionarTreinos} />
      </Stack.Navigator>
      <StatusBar style="auto" />
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