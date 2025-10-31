import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from "react-native-vector-icons/FontAwesome";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Header from '../../components/Header';

const { width } = Dimensions.get('window');

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

interface InicioTreinosProps {
  navigation?: any;
}

const Treinos: React.FC<InicioTreinosProps> = ({ navigation }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTreinos();

    const unsubscribe = navigation?.addListener('focus', () => {
      loadTreinos();
    });

    return unsubscribe;
  }, [navigation]);

  const loadTreinos = async () => {
    try {
      const data = await AsyncStorage.getItem('@fitlife_treinos');
      const treinosLocal = data ? JSON.parse(data) : [];
      setTreinos(treinosLocal);
    } catch (error) {
      console.error('Erro ao carregar treinos:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTreino = async (treinoId: string) => {
    try {
      const treinosAtualizados = treinos.filter(t => t.id !== treinoId);
      await AsyncStorage.setItem('@fitlife_treinos', JSON.stringify(treinosAtualizados));
      setTreinos(treinosAtualizados);
      Alert.alert('Sucesso', 'Treino removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover treino:', error);
      Alert.alert('Erro', 'Não foi possível remover o treino.');
    }
  };

  const handleCriarTreino = () => {
    const novoTreinoId = `treino_${Date.now()}`;
    const hoje = new Date();
    const dataFormatada = hoje.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
    const nomeAutomatico = `Treino - ${dataFormatada}`;

    navigation?.navigate('GerenciarTreinos', {
      treinoNome: nomeAutomatico,
      treinoId: novoTreinoId
    });
  };

  const handleEditarTreino = (treino: Treino) => {
    navigation?.navigate('GerenciarTreinos', {
      treinoNome: treino.nome,
      treinoId: treino.id
    });
  };

  const handleRemoverTreino = (treino: Treino) => {
    Alert.alert(
      'Remover Treino',
      `Deseja realmente excluir o treino "${treino.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => deleteTreino(treino.id) },
      ]
    );
  };

  const renderTreino = ({ item }: { item: Treino }) => (
    <TouchableOpacity
      style={styles.treinoCard}
      onPress={() => handleEditarTreino(item)}
      onLongPress={() => handleRemoverTreino(item)}
    >
      <View style={styles.treinoHeader}>
        <MaterialCommunityIcons name="dumbbell" size={20} color="#1976D2" />
        <Text style={styles.treinoNome}>{item.nome}</Text>
        <TouchableOpacity
          onPress={() => handleRemoverTreino(item)}
          style={styles.deleteButton}
        >
          <Icon name="trash" size={16} color="#FF5252" />
        </TouchableOpacity>
      </View>
      <Text style={styles.treinoInfo}>
        {item.exercicios.length} exercício{item.exercicios.length !== 1 ? 's' : ''}
      </Text>
      <Text style={styles.treinoData}>
        Criado em: {new Date(item.createdAt).toLocaleDateString('pt-BR')}
      </Text>
    </TouchableOpacity>
  );

  const handleGoBack = () => {
    navigation?.goBack();
  };

  return (
    <View style={styles.container}>
      <Header title="TREINOS" />

      <View style={styles.content}>
        {/* Botões de Ação */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton]} 
            onPress={() => navigation?.navigate('IniciarSessao')}
          >
            <MaterialCommunityIcons name="play-circle" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Iniciar Treino</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]} 
            onPress={() => navigation?.navigate('VisualizarTreinos')}
          >
            <MaterialCommunityIcons name="history" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Histórico</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.criarButton} onPress={handleCriarTreino}>
          <Icon name="plus" size={20} color="#fff" />
          <Text style={styles.criarButtonText}>Criar Novo Treino</Text>
        </TouchableOpacity>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando treinos...</Text>
          </View>
        ) : treinos.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Meus Treinos</Text>
            <FlatList
              data={treinos}
              keyExtractor={(item) => item.id}
              renderItem={renderTreino}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="weight-lifter" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Nenhum treino criado ainda</Text>
            <Text style={styles.emptySubText}>Toque em "Criar Novo Treino" para começar</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E0E0E0" },
  content: { flex: 1, padding: 20 },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButton: {
    backgroundColor: '#4A90E2',
  },
  secondaryButton: {
    backgroundColor: '#FF9800',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  criarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  criarButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  treinoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  treinoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  treinoNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginLeft: 10,
  },
  deleteButton: {
    padding: 4,
  },
  treinoInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  treinoData: {
    fontSize: 12,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default Treinos;
