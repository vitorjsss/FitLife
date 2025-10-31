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
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  workoutSessionService,
  WorkoutSession,
  WorkoutExerciseLog,
  SessionProgress,
} from '../../services/WorkoutSessionService';

interface ChecklistTreinoProps {
  navigation: any;
  route: any;
}

const ChecklistTreino: React.FC<ChecklistTreinoProps> = ({ navigation, route }) => {
  const { session } = route.params as { session: WorkoutSession };
  
  const [exerciseLogs, setExerciseLogs] = useState<WorkoutExerciseLog[]>([]);
  const [progress, setProgress] = useState<SessionProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingLog, setEditingLog] = useState<WorkoutExerciseLog | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Estados para edição
  const [seriesCompleted, setSeriesCompleted] = useState('');
  const [repeticoesCompleted, setRepeticoesCompleted] = useState('');
  const [cargaUsed, setCargaUsed] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadChecklistAndProgress();
  }, []);

  const loadChecklistAndProgress = async () => {
    try {
      setLoading(true);
      const [logs, prog] = await Promise.all([
        workoutSessionService.getSessionLogs(session.id),
        workoutSessionService.getSessionProgress(session.id),
      ]);
      setExerciseLogs(logs);
      setProgress(prog);
    } catch (error) {
      console.error('Erro ao carregar checklist:', error);
      Alert.alert('Erro', 'Não foi possível carregar o checklist.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleChecked = async (log: WorkoutExerciseLog) => {
    try {
      const updated = await workoutSessionService.toggleExerciseChecked(log.id);
      setExerciseLogs(exerciseLogs.map(l => l.id === log.id ? updated : l));
      // Recarregar progresso
      const prog = await workoutSessionService.getSessionProgress(session.id);
      setProgress(prog);
      
      if (updated.checked) {
        Alert.alert('✓', 'Exercício marcado como feito!');
      }
    } catch (error) {
      console.error('Erro ao marcar exercício:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o exercício.');
    }
  };

  const handleEditLog = (log: WorkoutExerciseLog) => {
    setEditingLog(log);
    setSeriesCompleted(log.series_completed.toString());
    setRepeticoesCompleted(log.repeticoes_completed.toString());
    setCargaUsed(log.carga_used.toString());
    setNotes(log.notes || '');
    setModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingLog) return;

    try {
      const updated = await workoutSessionService.updateExerciseLog(editingLog.id, {
        series_completed: parseInt(seriesCompleted) || 0,
        repeticoes_completed: parseInt(repeticoesCompleted) || 0,
        carga_used: parseFloat(cargaUsed) || 0,
        notes: notes,
      });
      
      setExerciseLogs(exerciseLogs.map(l => l.id === editingLog.id ? updated : l));
      setModalVisible(false);
      setEditingLog(null);
      Alert.alert('Sucesso', 'Exercício atualizado com sucesso!');
      
      // Recarregar progresso
      const prog = await workoutSessionService.getSessionProgress(session.id);
      setProgress(prog);
    } catch (error) {
      console.error('Erro ao atualizar exercício:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o exercício.');
    }
  };

  const handleCompleteSession = async () => {
    Alert.alert(
      'Concluir Treino',
      'Deseja marcar este treino como concluído?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Concluir',
          onPress: async () => {
            try {
              await workoutSessionService.completeSession(session.id);
              Alert.alert('Sucesso', 'Treino concluído com sucesso!');
              navigation.goBack();
            } catch (error) {
              console.error('Erro ao concluir sessão:', error);
              Alert.alert('Erro', 'Não foi possível concluir o treino.');
            }
          },
        },
      ]
    );
  };

  const renderExerciseLog = ({ item }: { item: WorkoutExerciseLog }) => (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <TouchableOpacity
          onPress={() => handleToggleChecked(item)}
          style={styles.checkboxContainer}
        >
          <MaterialCommunityIcons
            name={item.checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
            size={32}
            color={item.checked ? '#4CAF50' : '#999'}
          />
        </TouchableOpacity>
        
        <View style={styles.exerciseInfo}>
          <Text style={[
            styles.exerciseName,
            item.checked && styles.exerciseNameChecked
          ]}>
            {item.exercise_name}
          </Text>
          <Text style={styles.exerciseType}>
            {item.exercise_type?.toUpperCase() || 'EXERCÍCIO'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => handleEditLog(item)}
          style={styles.editButton}
        >
          <Icon name="edit" size={20} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      <View style={styles.exerciseDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Séries:</Text>
          <Text style={styles.detailValue}>
            {item.series_completed}/{item.series_target}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Reps:</Text>
          <Text style={styles.detailValue}>
            {item.repeticoes_completed}/{item.repeticoes_target}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Carga:</Text>
          <Text style={styles.detailValue}>
            {item.carga_used}kg
          </Text>
        </View>
      </View>

      {item.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesText}>💬 {item.notes}</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Carregando checklist...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checklist de Treino</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Progress Bar */}
      {progress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressLabel}>Progresso</Text>
            <Text style={styles.progressPercentage}>
              {Math.round(progress.progress_percentage)}%
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${progress.progress_percentage}%` }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {progress.completed_exercises} de {progress.total_exercises} exercícios
          </Text>
        </View>
      )}

      <FlatList
        data={exerciseLogs}
        keyExtractor={(item) => item.id}
        renderItem={renderExerciseLog}
        contentContainerStyle={styles.listContainer}
      />

      {!session.completed && (
        <TouchableOpacity
          style={styles.completeButton}
          onPress={handleCompleteSession}
        >
          <MaterialCommunityIcons name="check-circle" size={24} color="#fff" />
          <Text style={styles.completeButtonText}>Concluir Treino</Text>
        </TouchableOpacity>
      )}

      {/* Modal de Edição */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Exercício</Text>
            <Text style={styles.modalSubtitle}>{editingLog?.exercise_name}</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Séries Completadas:</Text>
              <TextInput
                style={styles.input}
                value={seriesCompleted}
                onChangeText={setSeriesCompleted}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Repetições Completadas:</Text>
              <TextInput
                style={styles.input}
                value={repeticoesCompleted}
                onChangeText={setRepeticoesCompleted}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Carga Utilizada (kg):</Text>
              <TextInput
                style={styles.input}
                value={cargaUsed}
                onChangeText={setCargaUsed}
                keyboardType="decimal-pad"
                placeholder="0.0"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Observações:</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Adicione observações..."
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  progressContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  exerciseCard: {
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
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  exerciseNameChecked: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  exerciseType: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  editButton: {
    padding: 8,
  },
  exerciseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: '#E0E0E0',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  notesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    gap: 8,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ChecklistTreino;
