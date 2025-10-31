import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { workoutSessionService, WorkoutSession } from '../../services/WorkoutSessionService';
import { useUser } from '../../context/UserContext';

interface VisualizarTreinosProps {
  navigation: any;
}

const VisualizarTreinos: React.FC<VisualizarTreinosProps> = ({ navigation }) => {
  const { user } = useUser();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadSessions();
    }

    const unsubscribe = navigation?.addListener('focus', () => {
      if (user?.id) {
        loadSessions();
      }
    });

    return unsubscribe;
  }, [navigation, user?.id]);

  const loadSessions = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await workoutSessionService.getPatientSessions(user.id, 100);
      setSessions(data);
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
      Alert.alert('Erro', 'Não foi possível carregar o histórico de treinos.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  };

  const handleViewChecklist = (session: WorkoutSession) => {
    navigation.navigate('ChecklistTreino', { session });
  };

  const handleDeleteSession = async (sessionId: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Deseja realmente excluir esta sessão de treino?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await workoutSessionService.deleteSession(sessionId);
              Alert.alert('Sucesso', 'Sessão excluída com sucesso!');
              loadSessions();
            } catch (error) {
              console.error('Erro ao excluir sessão:', error);
              Alert.alert('Erro', 'Não foi possível excluir a sessão.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '--:--';
    return timeString.substring(0, 5);
  };

  const renderSessionItem = ({ item }: { item: WorkoutSession }) => (
    <View style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <View style={styles.sessionTitleContainer}>
          <MaterialCommunityIcons
            name={item.completed ? 'check-circle' : 'clock-outline'}
            size={24}
            color={item.completed ? '#4CAF50' : '#FFA500'}
          />
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionTitle}>{item.workout_name || 'Treino'}</Text>
            <Text style={styles.sessionDate}>{formatDate(item.session_date)}</Text>
          </View>
        </View>
        <View style={styles.sessionActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleViewChecklist(item)}
          >
            <MaterialCommunityIcons name="checkbox-marked-outline" size={24} color="#4A90E2" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteSession(item.id)}
          >
            <Icon name="trash" size={20} color="#E74C3C" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sessionDetails}>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="clock-start" size={16} color="#666" />
          <Text style={styles.detailText}>
            Início: {formatTime(item.start_time)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="clock-end" size={16} color="#666" />
          <Text style={styles.detailText}>
            Fim: {formatTime(item.end_time)}
          </Text>
        </View>
      </View>

      {item.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Observações:</Text>
          <Text style={styles.notesText}>{item.notes}</Text>
        </View>
      )}

      <View style={styles.statusContainer}>
        <Text style={[
          styles.statusBadge,
          item.completed ? styles.completedBadge : styles.pendingBadge
        ]}>
          {item.completed ? '✓ Concluído' : '⏳ Em Andamento'}
        </Text>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Carregando histórico...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Histórico de Treinos</Text>
        <View style={styles.headerRight} />
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="dumbbell" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Nenhum treino realizado ainda</Text>
          <Text style={styles.emptySubtext}>
            Inicie uma sessão de treino para vê-la aqui
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={renderSessionItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
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
  listContainer: {
    padding: 16,
  },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sessionInfo: {
    marginLeft: 12,
    flex: 1,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  sessionDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  sessionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  notesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  statusContainer: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 12,
    fontWeight: 'bold',
  },
  completedBadge: {
    backgroundColor: '#E8F5E9',
    color: '#4CAF50',
  },
  pendingBadge: {
    backgroundColor: '#FFF3E0',
    color: '#FFA500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
  },
});

export default VisualizarTreinos;
