import React, { useEffect, useState, useMemo } from "react";
import {
  SafeAreaView,
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
import DailyMealService from "../../services/DailyMealService";
import MealRecordService, { MealRecordData } from "../../services/MealRecordService";
import { useNavigation, useRoute } from "@react-navigation/native";

const TRAININGS_KEY = "@fitlife_treinos";
const { width } = Dimensions.get("window");

function formatDateKey(d: Date) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}
function formatDateBR(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// helpers to check training scheduling
function normalizeISO(d?: string) {
  if (!d) return null;
  // accepts YYYY-MM-DD or DD/MM/YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
    const [dd, mm, yyyy] = d.split("/");
    return `${yyyy}-${mm}-${dd}`;
  }
  const parsed = new Date(d);
  if (!isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, "0");
    const dd = String(parsed.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
}

function isPlannedForDate(item: any, targetDate: Date) {
  // If item explicitly has a date (one-off)
  const iso = normalizeISO(item.date || item.scheduledDate || item.day);
  const targetIso = targetDate.toISOString().slice(0, 10);
  if (iso) return iso === targetIso;

  // If item has daysOfWeek like [1,3,5] (0=Sun)
  if (Array.isArray(item.daysOfWeek) && item.daysOfWeek.length > 0) {
    const dow = targetDate.getDay();
    return item.daysOfWeek.includes(dow);
  }

  // If item has a `recurring` flag assume it applies every day
  if (item.recurring === true) return true;

  // If no scheduling info, include as planned so user sees it
  return true;
}

export default function ChecklistScreen() {
  const [date, setDate] = useState<Date>(new Date());
  const [trainings, setTrainings] = useState<any[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [completed, setCompleted] = useState<{
    trainings: Record<string, boolean>;
    meals: Record<string, boolean>;
  }>({ trainings: {}, meals: {} });
  const navigation = useNavigation();
  const route = useRoute();
  // patientId pode vir das params ou do AsyncStorage
  const paramPatientId = (route.params as any)?.patientId ?? null;
  const [patientId, setPatientId] = useState<string | null>(paramPatientId);

  // Se não veio via params, busca do AsyncStorage
  useEffect(() => {
    if (!patientId) {
      const fetchPatientId = async () => {
        const pid = await AsyncStorage.getItem("@fitlife:user_id");
        setPatientId(pid);
      };
      fetchPatientId();
    }
  }, [patientId]);

  useEffect(() => {
    loadAll();
  }, [date]);

  // compute trainings planned for the selected date
  const todaysTrainings = useMemo(() => {
    return (trainings || []).filter((t) => isPlannedForDate(t, date));
  }, [trainings, date]);

  const loadAll = async () => {
    await Promise.all([loadTrainings(), loadMeals(), loadCompleted()]);
  };

  const loadTrainings = async () => {
    try {
      const raw = await AsyncStorage.getItem(TRAININGS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      setTrainings(arr);
    } catch (err) {
      console.error("Erro ao carregar treinos:", err);
      setTrainings([]);
    }
  };

  const loadMeals = async () => {
    try {
      if (!patientId) {
        setMeals([]);
        return;
      }
      const dateStr = formatDateKey(date);
      const registries = await DailyMealService.getByDate(dateStr, patientId);
      if (Array.isArray(registries) && registries.length > 0) {
        const registryId = registries[0].id;
        const records = await MealRecordService.getByRegistry(registryId);
        setMeals(Array.isArray(records) ? records : []);
      } else {
        setMeals([]);
      }
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

  const toggleItem = async (type: "trainings" | "meals", id: string) => {
    const next = {
      ...completed,
      [type]: { ...(completed as any)[type], [id]: !((completed as any)[type]?.[id]) },
    };
    setCompleted(next);
    await saveCompleted(next);
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

  const changeDay = (delta: number) => {
    // Garante que a data seja atualizada corretamente sem problemas de fuso/horário
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setDate(d.getDate() + delta);
    setDate(new Date(d));
  };

  const renderTraining = ({ item }: { item: any }) => {
    const done = !!completed.trainings[item.id];
    return (
      <View style={[styles.card, done && styles.cardDone]}>
        <TouchableOpacity
          style={styles.cardLeft}
          activeOpacity={0.8}
          onPress={() => {
            // navigate to training details screen (passes training id)
            // adapt param name if your GerenciarTreinos expects another prop
            navigation.navigate("Treinos", { trainingId: item.id });
          }}
        >
          <View style={[styles.iconCircle, { backgroundColor: "#E3F2FD" }]}>
            <Icon name="heartbeat" size={18} color="#1976D2" />
          </View>
          <View style={styles.cardText}>
            <Text style={[styles.cardTitle, done && styles.cardTitleDone]}>
              {item.nome || item.name || "Treino sem nome"}
            </Text>
            <Text style={styles.cardSubtitle}>
              {item.exercicios ? `${item.exercicios.length} exercícios` : "Sem exercícios"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* completion toggle separated from navigation */}
        <TouchableOpacity
          style={styles.cardRight}
          onPress={() => toggleItem("trainings", item.id)}
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

  const renderMeal = ({ item }: { item: MealRecordData, }) => {
    return (
      <View style={[styles.card, item.checked && styles.cardDone]}>
        <TouchableOpacity
          style={styles.cardLeft}
          activeOpacity={0.8}
          onPress={() => {
            // optional: navigate to meal details if you have a screen
            navigation.navigate("AdicionarAlimentos", { item });
          }}
        >
          <View style={[styles.iconCircle, { backgroundColor: "#FFF3E0" }]}>
            <Icon name="cutlery" size={18} color="#FB8C00" />
          </View>
          <View style={styles.cardText}>
            <Text style={[styles.cardTitle, item.checked && styles.cardTitleDone]}>
              {item.name || item.name || "Refeição"}
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack}>
          <Icon name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Checklist diário</Text>
          <Text style={styles.headerSubtitle}>Marque treinos e refeições concluídas</Text>
        </View>
        <View style={{ width: 20 }} />
      </View>

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
          keyExtractor={(i) => i.id}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FB" },
  header: {
    backgroundColor: "#1976D2",
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerCenter: { alignItems: "center" },
  headerTitle: { color: "#fff", fontWeight: "700", fontSize: 16 },
  headerSubtitle: { color: "#E3F2FD", fontSize: 12, marginTop: 2 },

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