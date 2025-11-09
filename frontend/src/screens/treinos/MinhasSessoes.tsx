import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from '../../components/Header';
import { useUser } from '../../context/UserContext';
import {
  workoutSessionService,
  WorkoutSession,
} from '../../services/WorkoutSessionService';

interface MinhasSessoesProps {
  navigation: any;
}

const MinhasSessoes: React.FC<MinhasSessoesProps> = ({ navigation }) => {
  const { user } = useUser();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSessions();

    const unsubscribe = navigation?.addListener('focus', () => {
      loadSessions();
    });

    return unsubscribe;
  }, [navigation]);

  const loadSessions = async () => {
    if (!user?.id) {
      Alert.alert('Erro', 'Usuário não encontrado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await workoutSessionService.getPatientSessions(user.id, 50);
      
      // Ordena por data mais recente primeiro
      const sortedSessions = data.sort((a, b) => {
        const dateA = new Date(a.session_date).getTime();
        const dateB = new Date(b.session_date).getTime();
        return dateB - dateA;
      });

      setSessions(sortedSessions);
    } catch (error: any) {
      console.error('Erro ao carregar sessões:', error);
      Alert.alert('Erro', 'Não foi possível carregar as sessões de treino');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadSessions();
  };

  const handleViewChecklist = (session: WorkoutSession) => {
    navigation.navigate('ChecklistTreino', { session });
  };

  const handleDeleteSession = async (session: WorkoutSession) => {
    Alert.alert(
      'Excluir Sessão',
      `Deseja realmente excluir a sessão de ${formatDate(session.session_date)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await workoutSessionService.deleteSession(session.id);
              Alert.alert('Sucesso', 'Sessão excluída com sucesso!');
              loadSessions();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir a sessão');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '--:--';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const getStatusColor = (completed: boolean) => {
    return completed ? '#4CAF50' : '#FF9800';
  };

  const getStatusText = (completed: boolean) => {
    return completed ? 'Concluída' : 'Em andamento';
  };

  const getStatusIcon = (completed: boolean) => {
    return completed ? 'check-circle' : 'clock';
  };

  const renderSession = ({ item }: { item: WorkoutSession }) => (
    <TouchableOpacity
      style={styles.sessionCard}
      onPress={() => handleViewChecklist(item)}
      onLongPress={() => handleDeleteSession(item)}
    >
      <View style={styles.sessionHeader}>
        <View style={styles.sessionTitleContainer}>
          <MaterialCommunityIcons name="dumbbell" size={24} color="#1976D2" />
          <Text style={styles.sessionDate}>{formatDate(item.session_date)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.completed) }]}>
          <MaterialCommunityIcons
            name={getStatusIcon(item.completed)}
            size={14}
            color="#fff"
          />
          <Text style={styles.statusText}>{getStatusText(item.completed)}</Text>
        </View>
      </View>

      <View style={styles.sessionInfo}>
        <View style={styles.infoRow}>
          <Icon name="clock-o" size={14} color="#666" />
          <Text style={styles.infoText}>
            Início: {formatTime(item.start_time || null)}
          </Text>
        </View>
        {item.end_time && (
          <View style={styles.infoRow}>
            <Icon name="flag-checkered" size={14} color="#666" />
            <Text style={styles.infoText}>
              Fim: {formatTime(item.end_time || null)}
            </Text>
          </View>
        )}
      </View>

      {item.notes && (
        <View style={styles.notesContainer}>
          <Icon name="sticky-note-o" size={12} color="#999" />
          <Text style={styles.notesText} numberOfLines={2}>
            {item.notes}
          </Text>
        </View>
      )}

      <View style={styles.sessionFooter}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => handleViewChecklist(item)}
        >
          <MaterialCommunityIcons name="clipboard-check" size={18} color="#1976D2" />
          <Text style={styles.viewButtonText}>Ver Checklist</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteSession(item)}
        >
          <Icon name="trash" size={16} color="#FF5252" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="clipboard-text-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>Nenhuma sessão de treino</Text>
      <Text style={styles.emptySubText}>
        Inicie uma sessão de treino para criar seu checklist
      </Text>
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => navigation.navigate('Treinos')}
      >
        <MaterialCommunityIcons name="play-circle" size={24} color="#fff" />
        <Text style={styles.startButtonText}>Iniciar Treino</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <Header title="MINHAS SESSÕES" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.loadingText}>Carregando sessões...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="MINHAS SESSÕES" />

      <View style={styles.content}>
        <View style={styles.headerInfo}>
          <MaterialCommunityIcons name="clipboard-list" size={28} color="#1976D2" />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Histórico de Treinos</Text>
            <Text style={styles.headerSubtitle}>
              {sessions.length} sessão{sessions.length !== 1 ? 'ões' : ''} registrada{sessions.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={renderSession}
          ListEmptyComponent={renderEmptyState}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={sessions.length === 0 ? styles.emptyList : styles.list}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0E0E0',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  list: {
    paddingBottom: 20,
  },
  emptyList: {
    flexGrow: 1,
  },
  sessionCard: {
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
  sessionDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  sessionInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  notesText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginRight: 12,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976D2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
});

export default MinhasSessoes;
