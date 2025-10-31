import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { workoutSessionService } from '../../services/WorkoutSessionService';
import { useUser } from '../../context/UserContext';
import workoutService from '../../services/WorkoutService';

interface Workout {
  id: string;
  name: string;
  description?: string;
}

interface IniciarSessaoProps {
  navigation: any;
}

const IniciarSessao: React.FC<IniciarSessaoProps> = ({ navigation }) => {
  const { user } = useUser();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Buscar treinos do backend
      const treinos = await workoutService.getWorkoutsByPatient(user.id);
      setWorkouts(treinos.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description || `${t.exercicios?.length || 0} exercícios`,
      })));
    } catch (error) {
      console.error('Erro ao carregar treinos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os treinos do servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async (workout: Workout) => {
    if (!user?.id) {
      Alert.alert('Erro', 'Usuário não encontrado. Faça login novamente.');
      return;
    }

    Alert.alert(
      'Iniciar Treino',
      `Deseja iniciar o treino "${workout.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Iniciar',
          onPress: async () => {
            try {
              const today = new Date().toISOString().split('T')[0];
              const now = new Date().toTimeString().split(' ')[0];

              const session = await workoutSessionService.createSession({
                workout_id: workout.id,
                patient_id: user.id,
                session_date: today,
                start_time: now,
                notes: notes,
              });

              Alert.alert('Sucesso', 'Sessão de treino iniciada!', [
                {
                  text: 'OK',
                  onPress: () => {
                    navigation.navigate('ChecklistTreino', { session });
                  },
                },
              ]);
            } catch (error) {
              console.error('Erro ao iniciar sessão:', error);
              Alert.alert('Erro', 'Não foi possível iniciar a sessão.');
            }
          },
        },
      ]
    );
  };

  const renderWorkoutItem = ({ item }: { item: Workout }) => (
    <TouchableOpacity
      style={styles.workoutCard}
      onPress={() => handleStartSession(item)}
    >
      <View style={styles.workoutIcon}>
        <MaterialCommunityIcons name="dumbbell" size={40} color="#4A90E2" />
      </View>
      <View style={styles.workoutInfo}>
        <Text style={styles.workoutName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.workoutDescription}>{item.description}</Text>
        )}
      </View>
      <Icon name="chevron-right" size={20} color="#999" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Carregando treinos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Iniciar Treino</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Observações (opcional):</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Como você está se sentindo hoje?"
            multiline
            numberOfLines={3}
          />
        </View>

        <Text style={styles.sectionTitle}>Selecione um treino:</Text>

        {workouts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="dumbbell" size={80} color="#ccc" />
            <Text style={styles.emptyText}>Nenhum treino cadastrado</Text>
            <Text style={styles.emptySubtext}>
              Crie um treino primeiro para poder iniciar uma sessão
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('GerenciarTreinos')}
            >
              <Text style={styles.createButtonText}>Criar Treino</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={workouts}
            keyExtractor={(item) => item.id}
            renderItem={renderWorkoutItem}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 40,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  notesContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 16,
  },
  workoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workoutIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  workoutDescription: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  createButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default IniciarSessao;
