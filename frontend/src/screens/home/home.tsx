import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";

export default function HomeScreen() {
    const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const accessToken = await AsyncStorage.getItem("accessToken");
        setToken(accessToken);
      } catch (err) {
        console.error("Erro ao buscar token:", err);
      } finally {
        setLoading(false);
      }
    };

    loadToken();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#40C4FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Icon name="user" size={24} color="#fff" />
        <Text style={styles.headerTitle}>INÍCIO</Text>
        <View style={{ width: 24 }} /> {/* espaçamento p/ alinhar */}
      </View>

      {/* Conteúdo */}
      <View style={styles.content}>
        <View style={styles.row}>
          <TouchableOpacity style={styles.card}>
            <Icon name="clipboard" size={32} color="#fff" />
            <Text style={styles.cardText}>Minhas Refeições</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card}>
            <Icon name="check-square" size={32} color="#fff" />
            <Text style={styles.cardText}>Meus Treinos</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bigCard}>
          {/* Aqui você pode colocar gráfico ou conteúdo */}
        </View>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Icon name="bar-chart-2" size={20} color="#fff" />
          <Text style={styles.navText}>Relatórios</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Icon name="plus-square" size={20} color="#fff" />
          <Text style={styles.navText}>Gerenciar Medidas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Icon name="home" size={20} color="#fff" />
          <Text style={styles.navText}>Início</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Icon name="list" size={20} color="#fff" />
          <Text style={styles.navText}>CheckList</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Icon name="calendar" size={20} color="#fff" />
          <Text style={styles.navText}>Calendário</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E0E0E0",
  },
  header: {
    backgroundColor: "#1976D2",
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  card: {
    flex: 1,
    backgroundColor: "#40C4FF",
    marginHorizontal: 5,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  cardText: {
    color: "#fff",
    marginTop: 10,
    fontWeight: "bold",
  },
  bigCard: {
    flex: 1,
    backgroundColor: "#40C4FF",
    borderRadius: 12,
    marginTop: 10,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#1976D2",
    paddingVertical: 10,
  },
  navItem: {
    alignItems: "center",
  },
  navText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 2,
  },
});
