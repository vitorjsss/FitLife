import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform, FlatList, Modal, Dimensions } from 'react-native';
import WorkoutRecordService, { WorkoutRecord, WorkoutItem } from '../../services/WorkoutRecordService';
import Icon from "react-native-vector-icons/FontAwesome";
import Header from '../../components/Header';
import { useUser } from '../../context/UserContext';

const { width } = Dimensions.get('window');

interface GerenciarTreinosProps {
    navigation?: any;
    route?: any;
}

const GerenciarTreinos: React.FC<GerenciarTreinosProps> = ({ navigation, route }) => {
    const [workoutName, setWorkoutName] = useState('');
    const [loading, setLoading] = useState(false);
    const [workoutRecords, setWorkoutRecords] = useState<WorkoutRecord[]>([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingWorkout, setEditingWorkout] = useState<WorkoutRecord | null>(null);
    const [editWorkoutName, setEditWorkoutName] = useState('');
    const { user } = useUser();

    const { date, patientId: routePatientId, workoutId } = route?.params || {};
    const patientId = routePatientId || user?.id || '';

    useEffect(() => {
        const fetchWorkouts = async () => {
            setLoading(true);
            try {
                if (workoutId) {
                    // Carregar treino específico
                    const workout = await WorkoutRecordService.getById(workoutId);
                    setWorkoutRecords(workout ? [workout] : []);
                } else if (date && patientId) {
                    // Carregar todos os treinos da data
                    const workouts = await WorkoutRecordService.getByDate(date, patientId);
                    setWorkoutRecords(Array.isArray(workouts) ? workouts : []);
                }
            } catch (err) {
                console.error('Erro ao carregar treinos:', err);
                setWorkoutRecords([]);
            } finally {
                setLoading(false);
            }
        };
        fetchWorkouts();
    }, [date, patientId, workoutId]);

    const handleAddWorkoutRecord = async () => {
        if (!workoutName.trim()) {
            Alert.alert('Atenção', 'Por favor, insira o nome do treino');
            return;
        }
        if (!date || !patientId) {
            Alert.alert('Erro', 'Data ou ID do paciente não encontrado');
            return;
        }
        try {
            setLoading(true);
            // Criar treino diretamente com data e patient_id
            const newWorkout: WorkoutRecord = {
                name: workoutName,
                date: date,
                patient_id: patientId,
                checked: false,
            };
            await WorkoutRecordService.create(newWorkout);
            setWorkoutName('');
            Alert.alert('Sucesso!', 'Treino adicionado com sucesso!');

            // Recarregar treinos da data
            const workouts = await WorkoutRecordService.getByDate(date, patientId);
            setWorkoutRecords(Array.isArray(workouts) ? workouts : []);
        } catch (error) {
            console.error('Erro ao adicionar treino:', error);
            Alert.alert('Erro', 'Não foi possível adicionar o treino');
        } finally {
            setLoading(false);
        }
    };

    const handleEditWorkout = (workout: WorkoutRecord) => {
        navigation?.navigate('AdicionarExercicios', { workoutRecord: workout });
    };

    const handleLongPressWorkout = (workout: WorkoutRecord) => {
        Alert.alert(
            'Opções do Treino',
            `O que deseja fazer com "${workout.name}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Editar', onPress: () => openEditModal(workout) },
                { text: 'Excluir', style: 'destructive', onPress: () => confirmDeleteWorkout(workout) }
            ]
        );
    };

    const openEditModal = (workout: WorkoutRecord) => {
        setEditingWorkout(workout);
        setEditWorkoutName(workout.name);
        setShowEditModal(true);
    };

    const confirmDeleteWorkout = (workout: WorkoutRecord) => {
        if (!workout.id) return;
        Alert.alert(
            'Confirmar Exclusão',
            `Tem certeza que deseja excluir o treino "${workout.name}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Excluir', style: 'destructive', onPress: () => deleteWorkout(workout.id!) }
            ]
        );
    };

    const deleteWorkout = async (workoutId: string) => {
        try {
            setLoading(true);
            await WorkoutRecordService.delete(workoutId);
            setWorkoutRecords((prev) => prev.filter(w => w.id !== workoutId));
            Alert.alert('Sucesso!', 'Treino excluído com sucesso!');
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível excluir o treino');
        } finally {
            setLoading(false);
        }
    };

    const saveEditedWorkout = async () => {
        if (!editWorkoutName.trim() || !editingWorkout || !editingWorkout.id) {
            Alert.alert('Atenção', 'Por favor, insira o nome do treino');
            return;
        }
        try {
            await WorkoutRecordService.update(editingWorkout.id, { name: editWorkoutName });
            setShowEditModal(false);
            setEditingWorkout(null);

            // Recarregar treinos
            if (date && patientId) {
                const workouts = await WorkoutRecordService.getByDate(date, patientId);
                setWorkoutRecords(Array.isArray(workouts) ? workouts : []);
            }
            Alert.alert('Sucesso!', 'Treino atualizado com sucesso!');
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível atualizar o treino');
        }
    };

    const renderWorkoutRecord = ({ item }: { item: WorkoutRecord }) => (
        <TouchableOpacity
            style={[styles.workoutCard, item.checked && { backgroundColor: '#E8F5E9', borderLeftColor: '#4caf50' }]}
            onPress={() => handleEditWorkout(item)}
            onLongPress={() => handleLongPressWorkout(item)}
            delayLongPress={500}
        >
            <View style={styles.workoutCardHeader}>
                <Icon name="heartbeat" size={24} color={item.checked ? '#388e3c' : '#FF6B6B'} />
                <View style={styles.workoutCardInfo}>
                    <Text style={[styles.workoutCardTitle, item.checked && { color: '#388e3c' }]}>{item.name}</Text>
                </View>
                <Icon name="chevron-right" size={16} color="#666" />
            </View>
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Header title="TREINOS" />
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.dateInfo}>
                    <Icon name="calendar" size={20} color="#FF6B6B" />
                    <Text style={styles.dateText}>
                        Treinos de {date ? (() => {
                            const [year, month, day] = date.split('T')[0].split('-');
                            return `${day}/${month}/${year}`;
                        })() : 'hoje'}
                    </Text>
                </View>
                <View style={styles.formContainer}>
                    <Text style={styles.formTitle}>Adicionar Treino</Text>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nome do Treino</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Ex: Treino A, Peito e Tríceps..."
                            value={workoutName}
                            onChangeText={setWorkoutName}
                            placeholderTextColor="#999"
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.addButton, loading && styles.addButtonDisabled]}
                        onPress={handleAddWorkoutRecord}
                        disabled={loading}
                    >
                        <Icon name={loading ? "spinner" : "plus"} size={20} color="#FFFFFF" />
                        <Text style={styles.addButtonText}>{loading ? 'Adicionando...' : 'Adicionar Treino'}</Text>
                    </TouchableOpacity>
                </View>
                {workoutRecords.length > 0 && (
                    <View style={styles.workoutsList}>
                        <Text style={styles.workoutsListTitle}>Treinos do Dia</Text>
                        <Text style={styles.helpText}>💡 Toque para adicionar exercícios ou segure para editar</Text>
                        <FlatList
                            data={workoutRecords}
                            keyExtractor={(item) => item.id || ''}
                            renderItem={renderWorkoutRecord}
                            scrollEnabled={false}
                        />
                    </View>
                )}
            </ScrollView>
            <Modal visible={showEditModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Editar Treino</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={editWorkoutName}
                            onChangeText={setEditWorkoutName}
                            placeholder="Nome do treino"
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalButtonCancel} onPress={() => setShowEditModal(false)}>
                                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalButtonSave} onPress={saveEditedWorkout}>
                                <Text style={styles.modalButtonTextSave}>Salvar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#E0E0E0' },
    content: { flex: 1, padding: 20 },
    dateInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 8, marginBottom: 20 },
    dateText: { fontSize: 16, color: '#333', marginLeft: 12, fontWeight: '600' },
    formContainer: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, marginBottom: 20 },
    formTitle: { fontSize: 18, fontWeight: 'bold', color: '#FF6B6B', marginBottom: 16 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 14, color: '#666', marginBottom: 8, fontWeight: '600' },
    textInput: { backgroundColor: '#F5F5F5', borderRadius: 8, padding: 12, fontSize: 16, borderWidth: 1, borderColor: '#DDD' },
    addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF6B6B', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 8, justifyContent: 'center' },
    addButtonDisabled: { backgroundColor: '#CCC' },
    addButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
    workoutsList: { marginBottom: 40 },
    workoutsListTitle: { fontSize: 18, fontWeight: 'bold', color: '#FF6B6B', marginBottom: 8 },
    helpText: { fontSize: 13, color: '#888', marginBottom: 12 },
    workoutCard: { backgroundColor: '#FFF', borderRadius: 8, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#FF6B6B' },
    workoutCardHeader: { flexDirection: 'row', alignItems: 'center' },
    workoutCardInfo: { flex: 1, marginLeft: 12 },
    workoutCardTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#FFF', borderRadius: 12, padding: 24, width: width * 0.85 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#FF6B6B', marginBottom: 16 },
    modalInput: { backgroundColor: '#F5F5F5', borderRadius: 8, padding: 12, fontSize: 16, borderWidth: 1, borderColor: '#DDD', marginBottom: 20 },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
    modalButtonCancel: { flex: 1, backgroundColor: '#E0E0E0', padding: 14, borderRadius: 8, marginRight: 8, alignItems: 'center' },
    modalButtonSave: { flex: 1, backgroundColor: '#FF6B6B', padding: 14, borderRadius: 8, marginLeft: 8, alignItems: 'center' },
    modalButtonTextCancel: { color: '#666', fontWeight: 'bold' },
    modalButtonTextSave: { color: '#FFF', fontWeight: 'bold' },
});

export default GerenciarTreinos;
