import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/FontAwesome";
import MealRecordService, { MealRecord } from "../../services/MealRecordService";
import WorkoutRecordService, { WorkoutRecord } from "../../services/WorkoutRecordService";
import { useNavigation } from "@react-navigation/native";
import { useUser } from "../../context/UserContext";
import Header from "../../components/Header";

const { width } = Dimensions.get("window");

function formatDateKey(d: Date) {
  // Ajuste manual para fuso horário de Brasília (-3h padrão)
  // Se quiser tratar horário de verão, pode ajustar para -2h conforme necessário
  const BR_OFFSET = -3; // horas
  const localDate = new Date(d.getTime() + BR_OFFSET * 60 * 60 * 1000);
  const yyyy = localDate.getUTCFullYear();
  const mm = String(localDate.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(localDate.getUTCDate()).padStart(2, "0");
  if (isNaN(yyyy) || isNaN(Number(mm)) || isNaN(Number(dd))) {
    // fallback: retorna data local do estado
    const yyyyLocal = d.getFullYear();
    const mmLocal = String(d.getMonth() + 1).padStart(2, "0");
    const ddLocal = String(d.getDate()).padStart(2, "0");
    return `${yyyyLocal}-${mmLocal}-${ddLocal}`;
  }
  return `${yyyy}-${mm}-${dd}`;
}
function formatDateBR(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function ChecklistScreen() {
  const [date, setDate] = useState<Date>(new Date());
  const [trainings, setTrainings] = useState<WorkoutRecord[]>([]);
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [completed, setCompleted] = useState<{
    trainings: Record<string, boolean>;
    meals: Record<string, boolean>;
  }>({ trainings: {}, meals: {} });
  const navigation = useNavigation();
  const { user } = useUser();

  useEffect(() => {
    loadTrainings();
    loadCompleted();
    loadMeals();
  }, [date, user?.id]);

  // compute trainings planned for the selected date
  const todaysTrainings = useMemo(() => {
    return trainings || [];
  }, [trainings, date]);

  const loadAll = async () => {
    await Promise.all([loadTrainings(), loadMeals(), loadCompleted()]);
  };

  const loadTrainings = async () => {
    try {
      if (!user?.id) {
        setTrainings([]);
        return;
      }
      const dateStr = formatDateKey(date);
      const records = await WorkoutRecordService.getByDate(dateStr, user.id);
      setTrainings(Array.isArray(records) ? records : []);
    } catch (err) {
      console.error("Erro ao carregar treinos:", err);
      setTrainings([]);
    }
  };

  const loadMeals = async () => {
    try {
      if (!user?.id) {
        setMeals([]);
        return;
      }
      const dateStr = formatDateKey(date);
      const records = await MealRecordService.getByDate(dateStr, user.id);
      setMeals(Array.isArray(records) ? records : []);
    } catch (err) {
      console.error("Erro ao carregar refeições:", err);
      setMeals([]);
    }
  };

  const loadCompleted = async () => {
    try {
      const key = `@fitlife_checklist:${formatDateKey(date)}`;
      const raw = await AsyncStorage.getItem(key);
      const data = raw ? JSON.parse(raw) : { trainings: {}, meals: {} };
      setCompleted(data);
    } catch (err) {
      console.error("Erro ao carregar checklist:", err);
      setCompleted({ trainings: {}, meals: {} });
    }
  };

  const saveCompleted = async (newState: any) => {
    try {
      const key = `@fitlife_checklist:${formatDateKey(date)}`;
      await AsyncStorage.setItem(key, JSON.stringify(newState));
    } catch (err) {
      console.error("Erro ao salvar checklist:", err);
    }
  };

  const toggleMealItem = async (id?: string) => {
    if (!id) {
      Alert.alert("Erro", "ID da refeição não fornecido.");
      return;
    }

    const meal = meals.find((m) => m.id === id);
    if (!meal) {
      Alert.alert("Erro", "Refeição não encontrada.");
      return;
    }

    const updatedMeal = { ...meal, checked: !meal.checked };
    try {
      await MealRecordService.update(id, updatedMeal);
      const updatedMeals = meals.map((m) => (m.id === id ? updatedMeal : m));
      setMeals(updatedMeals);

      // Also toggle in completed state
      const next = {
        ...completed,
        meals: { ...(completed as any).meals, [id]: updatedMeal.checked },
      };
      setCompleted(next);
      await saveCompleted(next);
    } catch (err) {
      console.error("Erro ao atualizar refeição:", err);
      Alert.alert("Erro", "Não foi possível atualizar o status da refeição.");
    }
  }

  const toggleWorkoutItem = async (id?: string) => {
    if (!id) {
      Alert.alert("Erro", "ID do treino não fornecido.");
      return;
    }

    const workout = trainings.find((w) => w.id === id);
    if (!workout) {
      Alert.alert("Erro", "Treino não encontrado.");
      return;
    }

    const updatedWorkout = { ...workout, checked: !workout.checked };
    try {
      await WorkoutRecordService.update(id, updatedWorkout);
      const updatedWorkouts = trainings.map((w) => (w.id === id ? updatedWorkout : w));
      setTrainings(updatedWorkouts);

      // Also toggle in completed state
      const next = {
        ...completed,
        trainings: { ...(completed as any).trainings, [id]: updatedWorkout.checked },
      };
      setCompleted(next);
      await saveCompleted(next);
    } catch (err) {
      console.error("Erro ao atualizar treino:", err);
      Alert.alert("Erro", "Não foi possível atualizar o status do treino.");
    }
  }

  const changeDay = (delta: number) => {
    // Garante que a data seja atualizada corretamente sem problemas de fuso/horário
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setDate(d.getDate() + delta);
    setDate(new Date(d));
  };

  const renderTraining = ({ item }: { item: WorkoutRecord }) => {
    const done = item.checked || false;
    const itemsCount = item.items?.length || 0;

    return (
      <View style={[styles.card, done && styles.cardDone]}>
        <TouchableOpacity
          style={styles.cardLeft}
          activeOpacity={0.8}
          onPress={() => {
            // Navigate to workout details
            navigation.navigate("GerenciarTreinos", {
              workoutId: item.id,
              workoutName: item.name,
              date: formatDateKey(date),
              patientId: user?.id
            });
          }}
        >
          <View style={[styles.iconCircle, { backgroundColor: "#E3F2FD" }]}>
            <Icon name="heartbeat" size={18} color="#1976D2" />
          </View>
          <View style={styles.cardText}>
            <Text style={[styles.cardTitle, done && styles.cardTitleDone]}>
              {item.name || "Treino sem nome"}
            </Text>
            <Text style={styles.cardSubtitle}>
              {itemsCount > 0 ? `${itemsCount} exercício${itemsCount > 1 ? 's' : ''}` : "Sem exercícios"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* completion toggle separated from navigation */}
        <TouchableOpacity
          style={styles.cardRight}
          onPress={() => toggleWorkoutItem(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {done ? (
            <Icon name="check-circle" size={22} color="#4caf50" />
          ) : (
            <Icon name="square-o" size={20} color="#bdbdbd" />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderMeal = ({ item }: { item: MealRecord }) => {
    return (
      <View style={[styles.card, item.checked && styles.cardDone]}>
        <TouchableOpacity
          style={styles.cardLeft}
          activeOpacity={0.8}
          onPress={() => {
            // optional: navigate to meal details if you have a screen
            navigation.navigate("AdicionarAlimentos", { mealRecord: item });
          }}
        >
          <View style={[styles.iconCircle, { backgroundColor: "#FFF3E0" }]}>
            <Icon name="cutlery" size={18} color="#FB8C00" />
          </View>
          <View style={styles.cardText}>
            <Text style={[styles.cardTitle, item.checked && styles.cardTitleDone]}>
              {item.name || "Refeição"}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cardRight}
          onPress={() => toggleMealItem(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {item.checked ? (
            <Icon name="check-circle" size={22} color="#4caf50" />
          ) : (
            <Icon name="square-o" size={20} color="#bdbdbd" />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const handleGoBack = () => navigation?.goBack();

  return (
    <View style={styles.container}>
      <Header title="Checklist diário" />

      <View style={styles.controlsRow}>
        <TouchableOpacity style={styles.dateBtn} onPress={() => changeDay(-1)}>
          <Icon name="chevron-left" size={16} color="#1976D2" />
        </TouchableOpacity>

        <View style={styles.datePill}>
          <Text style={styles.dateText}>{formatDateBR(date)}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{todaysTrainings.length + meals.length}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.dateBtn} onPress={() => changeDay(1)}>
          <Icon name="chevron-right" size={16} color="#1976D2" />
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Treinos</Text>
        <Text style={styles.sectionCount}>{todaysTrainings.length}</Text>
      </View>

      {todaysTrainings.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Nenhum treino planejado para este dia.</Text>
        </View>
      ) : (
        <FlatList
          data={todaysTrainings}
          keyExtractor={(i, index) => i.id || `workout-${index}`}
          renderItem={renderTraining}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 8 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}

      <View style={[styles.sectionHeader, { marginTop: 12 }]}>
        <Text style={styles.sectionTitle}>Refeições</Text>
        <Text style={styles.sectionCount}>{meals.length}</Text>
      </View>

      {meals.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Nenhuma refeição registrada para esta data.</Text>
        </View>
      ) : (
        <FlatList
          data={meals}
          keyExtractor={(item, index) => item.id ?? `meal-${index}`}
          renderItem={renderMeal}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FB" },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  dateBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
    elevation: 2,
  },
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 24,
    elevation: 2,
  },
  dateText: { fontWeight: "700", color: "#1976D2", marginRight: 8 },
  badge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#40C4FF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: { color: "#fff", fontWeight: "700" },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    marginTop: 6,
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1976D2" },
  sectionCount: { color: "#1976D2", fontWeight: "700" },

  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 12,
    marginHorizontal: 12,
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  cardDone: { opacity: 0.6, backgroundColor: "#E8F5E9" },
  cardLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#222" },
  cardTitleDone: { textDecorationLine: "line-through", color: "#4caf50" },
  cardSubtitle: { fontSize: 12, color: "#777", marginTop: 4 },
  cardRight: { width: 36, alignItems: "center", justifyContent: "center" },

  emptyCard: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    padding: 18,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
  },
  emptyText: { color: "#666" },

  smallText: { color: "#666", fontSize: 12 },
});