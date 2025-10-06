import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import Icon from "react-native-vector-icons/FontAwesome";

interface Exercicio {
  id: string;
  nome: string;
  carga: number;
  series: number;
  repeticoes: number;
}

interface AdicionarExerciciosProps {
  navigation?: any;
  route?: any;
}

const AdicionarTreinos: React.FC<AdicionarExerciciosProps> = ({ navigation, route }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [nome, setNome] = useState('');
  const [carga, setCarga] = useState('');
  const [series, setSeries] = useState('');
  const [repeticoes, setRepeticoes] = useState('');
  const [loading, setLoading] = useState(false);
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);

  const { treinoId, treinoNome } = route?.params || {};

  const handleGoBack = () => navigation?.goBack();

  const limparCampos = () => {
    setNome('');
    setCarga('');
    setSeries('');
    setRepeticoes('');
  };

  const handleAdicionar = () => {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'Informe o nome do exercício.');
      return;
    }

    if (!series.trim() || !repeticoes.trim()) {
      Alert.alert('Atenção', 'Informe séries e repetições.');
      return;
    }

    const novoExercicio: Exercicio = {
      id: `ex_${Date.now()}`,
      nome,
      carga: parseFloat(carga) || 0,
      series: parseInt(series) || 0,
      repeticoes: parseInt(repeticoes) || 0,
    };

    setExercicios([...exercicios, novoExercicio]);
    limparCampos();
    Alert.alert('Sucesso!', 'Exercício adicionado ao treino.');
  };

  const handleRemover = (id: string) => {
    Alert.alert('Remover exercício', 'Deseja excluir este exercício?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => setExercicios(exercicios.filter(e => e.id !== id)) }
    ]);
  };

  const calcularVolumeTotal = () => {
    return exercicios.reduce(
      (total, ex) => total + ex.carga * ex.series * ex.repeticoes,
      0
    );
  };

  const renderExercicio = ({ item }: { item: Exercicio }) => (
    <View style={styles.exercicioCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.exercicioNome}>{item.nome}</Text>
          <Text style={styles.exercicioDetalhes}>
            {item.series}x{item.repeticoes} — {item.carga} kg
          </Text>
        </View>
        <TouchableOpacity onPress={() => handleRemover(item.id)}>
          <Icon name="trash" size={18} color="#FF5252" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const totalVolume = calcularVolumeTotal();

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
        <View style={styles.treinoInfo}>
          <Icon name="dumbbell" size={20} color="#40C4FF" />
          <Text style={styles.treinoNome}>{treinoNome || 'Treino'}</Text>
        </View>

        {/* Formulário */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Adicionar Exercício</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome do Exercício</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Supino, Agachamento..."
              value={nome}
              onChangeText={setNome}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.inputMini}>
              <Text style={styles.label}>Carga (kg)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={carga}
                onChangeText={setCarga}
                placeholder="0"
              />
            </View>

            <View style={styles.inputMini}>
              <Text style={styles.label}>Séries</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={series}
                onChangeText={setSeries}
                placeholder="0"
              />
            </View>

            <View style={styles.inputMini}>
              <Text style={styles.label}>Repetições</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={repeticoes}
                onChangeText={setRepeticoes}
                placeholder="0"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.addButton, loading && styles.addButtonDisabled]}
            onPress={handleAdicionar}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Icon name="plus" size={18} color="#FFFFFF" />
            <Text style={styles.addButtonText}>
              {loading ? 'Adicionando...' : 'Adicionar Exercício'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista de exercícios */}
        {exercicios.length > 0 && (
          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>Exercícios do Treino</Text>

            <FlatList
              data={exercicios}
              keyExtractor={(item) => item.id}
              renderItem={renderExercicio}
              scrollEnabled={false}
            />

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Resumo</Text>
              <Text style={styles.summaryText}>
                {exercicios.length} exercícios adicionados
              </Text>
              <Text style={styles.summaryText}>
                Volume total: {totalVolume.toFixed(0)} kg
              </Text>
            </View>
          </View>
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
  content: { flex: 1, padding: 20 },
  treinoInfo: {
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
  formTitle: { fontSize: 20, fontWeight: 'bold', color: '#1976D2', textAlign: 'center', marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  inputMini: { flex: 1, marginHorizontal: 4 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#40C4FF',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 12,
  },
  addButtonDisabled: { backgroundColor: '#B0BEC5' },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  listContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  listTitle: { fontSize: 18, fontWeight: 'bold', color: '#1976D2', marginBottom: 16 },
  exercicioCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#40C4FF',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exercicioNome: { fontSize: 16, fontWeight: '600', color: '#333' },
  exercicioDetalhes: { fontSize: 14, color: '#666' },
  summaryCard: {
    backgroundColor: '#40C4FF',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  summaryText: { color: '#fff', fontSize: 14, textAlign: 'center' },
});

export default AdicionarTreinos;
