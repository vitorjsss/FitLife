import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  FlatList,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from "react-native-vector-icons/FontAwesome";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { Ionicons } from '@expo/vector-icons';

/* 
🏋️ ÍCONES DE TREINO DISPONÍVEIS:

📱 MaterialCommunityIcons (react-native-vector-icons):
  - "dumbbell" - Halteres (atual)
  - "weight-lifter" - Levantador de peso  
  - "barbell" - Barra de exercício
  - "arm-flex" - Braço flexionado
  - "run" - Pessoa correndo
  - "bike" - Bicicleta para cardio
  - "tennis" - Esportes
  - "heart-pulse" - Batimento cardíaco

📱 MaterialIcons (react-native-vector-icons):
  - "fitness-center" - Centro de fitness
  - "sports-gymnastics" - Ginástica
  - "sports-handball" - Esportes

📱 Ionicons (@expo/vector-icons):
  - "barbell" - Barra
  - "fitness" - Fitness
  - "walk" - Caminhada

🔄 Para trocar um ícone, substitua:
   <MaterialCommunityIcons name="dumbbell" size={20} color="#40C4FF" />
*/

interface Exercicio {
  id: string;
  nome: string;
  carga: string;
  series: string;
  repeticoes: string;
}

interface Treino {
  id: string;
  nome: string;
  exercicios: Exercicio[];
  createdAt: string;
  updatedAt: string;
}

interface GerenciarTreinoProps {
  navigation?: any;
  route?: any;
}

// Funções de AsyncStorage para treinos
const saveTreinoLocal = async (treino: Treino) => {
  try {
    const treinos = await loadTreinosLocal();
    const index = treinos.findIndex(t => t.id === treino.id);

    if (index >= 0) {
      treinos[index] = { ...treino, updatedAt: new Date().toISOString() };
    } else {
      treinos.push(treino);
    }

    await AsyncStorage.setItem('@fitlife_treinos', JSON.stringify(treinos));
    console.log('Treino salvo localmente:', treino.nome);
  } catch (error) {
    console.error('Erro ao salvar treino:', error);
    Alert.alert('Erro', 'Não foi possível salvar o treino.');
  }
};

const loadTreinosLocal = async (): Promise<Treino[]> => {
  try {
    const data = await AsyncStorage.getItem('@fitlife_treinos');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Erro ao carregar treinos:', error);
    return [];
  }
};

const deleteTreinoLocal = async (treinoId: string) => {
  try {
    const treinos = await loadTreinosLocal();
    const filteredTreinos = treinos.filter(t => t.id !== treinoId);
    await AsyncStorage.setItem('@fitlife_treinos', JSON.stringify(filteredTreinos));
    console.log('Treino removido localmente:', treinoId);
  } catch (error) {
    console.error('Erro ao remover treino:', error);
    Alert.alert('Erro', 'Não foi possível remover o treino.');
  }
};

const GerenciarTreinos: React.FC<GerenciarTreinoProps> = ({ navigation, route }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [nome, setNome] = useState('');
  const [carga, setCarga] = useState('');
  const [series, setSeries] = useState('');
  const [repeticoes, setRepeticoes] = useState('');
  const [loading, setLoading] = useState(false);
  const [treinoAtual, setTreinoAtual] = useState<Treino | null>(null);

  const { treinoNome, treinoId } = route?.params || {};

  useEffect(() => {
    loadTreinoExistente();
  }, [treinoId]);

  const loadTreinoExistente = async () => {
    if (treinoId) {
      try {
        const treinos = await loadTreinosLocal();
        const treino = treinos.find(t => t.id === treinoId);
        if (treino) {
          setTreinoAtual(treino);
          setExercicios(treino.exercicios);
        }
      } catch (error) {
        console.error('Erro ao carregar treino:', error);
      }
    }
  };

  const handleGoBack = () => navigation?.goBack();

  const clearForm = () => {
    setNome('');
    setCarga('');
    setSeries('');
    setRepeticoes('');
  };

  const handleAddExercicio = () => {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'Digite o nome do exercício.');
      return;
    }
    if (!series || !repeticoes) {
      Alert.alert('Atenção', 'Informe séries e repetições.');
      return;
    }

    const novo: Exercicio = {
      id: `ex_${Date.now()}`,
      nome,
      carga,
      series,
      repeticoes,
    };

    setExercicios([...exercicios, novo]);
    clearForm();
  };

  const handleRemoveExercicio = (id: string) => {
    Alert.alert('Remover exercício?', 'Deseja realmente excluir este exercício?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => setExercicios(exercicios.filter(e => e.id !== id)) },
    ]);
  };

  const handleSalvarTreino = async () => {
    if (exercicios.length === 0) {
      Alert.alert('Atenção', 'Adicione pelo menos um exercício ao treino.');
      return;
    }

    setLoading(true);
    try {
      const nomeDoTreino = treinoNome || `Treino - ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
      const treino: Treino = {
        id: treinoAtual?.id || `treino_${Date.now()}`,
        nome: nomeDoTreino,
        exercicios,
        createdAt: treinoAtual?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveTreinoLocal(treino);

      Alert.alert('Sucesso!', 'Treino salvo com sucesso!', [
        { text: 'OK', onPress: () => navigation?.goBack() }
      ]);
    } catch (error) {
      console.error('Erro ao salvar treino:', error);
      Alert.alert('Erro', 'Não foi possível salvar o treino.');
    } finally {
      setLoading(false);
    }
  };

  const renderExercicio = ({ item }: { item: Exercicio }) => (
    <View style={styles.exercicioCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.exercicioNome}>{item.nome}</Text>
        <Text style={styles.exercicioInfo}>
          {item.series}x{item.repeticoes} — {item.carga || 'sem carga'}
        </Text>
      </View>
      <TouchableOpacity onPress={() => handleRemoveExercicio(item.id)}>
        <Icon name="trash" size={18} color="#FF5252" />
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack}>
          <Icon name="arrow-left" size={24} color="#fff" style={{ marginTop: 25 }} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>EXERCÍCIOS</Text>

        <TouchableOpacity onPress={() => setShowMenu(!showMenu)}>
          <Icon name="user-circle" size={32} color="#fff" style={{ marginTop: 25 }} />
        </TouchableOpacity>
      </View>

      {/* Dropdown Menu */}
      {showMenu && (
        <View style={styles.menu}>
          <Text style={styles.menuTitle}>NOME DO USUÁRIO</Text>

          <TouchableOpacity style={styles.menuItem}>
            <Icon name="cog" size={16} color="#1976D2" />
            <Text style={styles.menuText}>Minha Conta</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Icon name="sign-out" size={16} color="#1976D2" />
            <Text style={styles.menuText}>Sair</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info do treino */}
        <View style={styles.treinoHeader}>
          <MaterialCommunityIcons name="dumbbell" size={20} color="#40C4FF" />
          <Text style={styles.treinoNome}>{treinoNome || 'Treino'}</Text>
        </View>

        {/* Formulário */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Adicionar Exercício</Text>

          <TextInput
            style={styles.input}
            placeholder="Nome do exercício"
            value={nome}
            onChangeText={setNome}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 6 }]}
              placeholder="Carga (kg)"
              keyboardType="numeric"
              value={carga}
              onChangeText={setCarga}
            />
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 6 }]}
              placeholder="Séries"
              keyboardType="numeric"
              value={series}
              onChangeText={setSeries}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Repetições"
              keyboardType="numeric"
              value={repeticoes}
              onChangeText={setRepeticoes}
            />
          </View>

          <TouchableOpacity
            style={[styles.addButton, loading && styles.addButtonDisabled]}
            onPress={handleAddExercicio}
            disabled={loading}
          >
            <Icon name="plus" size={18} color="#fff" />
            <Text style={styles.addButtonText}>Adicionar Exercício</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de exercícios */}
        {exercicios.length > 0 && (
          <View style={styles.listaContainer}>
            <Text style={styles.listaTitulo}>Exercícios do Treino</Text>

            <FlatList
              data={exercicios}
              keyExtractor={(item) => item.id}
              renderItem={renderExercicio}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Botão Salvar Treino */}
        {exercicios.length > 0 && (
          <TouchableOpacity
            style={[styles.salvarButton, loading && styles.addButtonDisabled]}
            onPress={handleSalvarTreino}
            disabled={loading}
          >
            <Icon name="save" size={18} color="#fff" />
            <Text style={styles.salvarButtonText}>
              {loading ? 'Salvando...' : 'Salvar Treino'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E0E0E0" },
  header: {
    backgroundColor: "#1976D2",
    height: 90,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 35,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold", paddingTop: 30 },
  menu: {
    position: "absolute",
    top: 90,
    right: 20,
    width: 200,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    elevation: 10,
  },
  menuTitle: { fontWeight: "bold", marginBottom: 10, borderBottomWidth: 1, borderBottomColor: "#ccc", paddingBottom: 5 },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  menuText: { marginLeft: 8, color: "#1976D2", fontWeight: "600" },
  content: { padding: 20 },
  treinoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  treinoNome: { fontSize: 16, fontWeight: '600', marginLeft: 10, color: '#333' },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
  },
  formTitle: { fontSize: 20, fontWeight: 'bold', color: '#1976D2', marginBottom: 20, textAlign: 'center' },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#40C4FF',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 10,
  },
  addButtonDisabled: { backgroundColor: '#B0BEC5' },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  listaContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  listaTitulo: { fontSize: 18, fontWeight: 'bold', color: '#1976D2', marginBottom: 16 },
  exercicioCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#40C4FF',
  },
  exercicioNome: { fontSize: 16, fontWeight: '600', color: '#333' },
  exercicioInfo: { fontSize: 14, color: '#666' },
  salvarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 20,
  },
  salvarButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});

export default GerenciarTreinos;
