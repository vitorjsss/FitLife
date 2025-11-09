import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, FlatList, Modal, Dimensions } from 'react-native';
import WorkoutRecordService, { WorkoutItem } from '../../services/WorkoutRecordService';
import Icon from "react-native-vector-icons/FontAwesome";
import Header from '../../components/Header';

const { width } = Dimensions.get('window');

const AdicionarExercicios: React.FC<any> = ({ navigation, route }) => {
    const { workoutRecord } = route?.params || {};
    const [exerciseName, setExerciseName] = useState('');
    const [series, setSeries] = useState('');
    const [repeticoes, setRepeticoes] = useState('');
    const [carga, setCarga] = useState('');
    const [exercises, setExercises] = useState<WorkoutItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (workoutRecord) {
            loadExercises();
        }
    }, []);

    const loadExercises = async () => {
        try {
            const workout: any = await WorkoutRecordService.getById(workoutRecord.id);
            if (workout && workout.items) {
                setExercises(workout.items);
            }
        } catch (error) {
            console.error('Erro ao carregar exercícios:', error);
        }
    };

    const handleAddExercise = async () => {
        if (!exerciseName.trim()) {
            Alert.alert('Atenção', 'Digite o nome do exercício');
            return;
        }
        try {
            setLoading(true);
            const newExercise: WorkoutItem = {
                exercise_name: exerciseName,
                series,
                repeticoes,
                carga,
            };
            await WorkoutRecordService.addItem(workoutRecord.id, newExercise);
            setExerciseName('');
            setSeries('');
            setRepeticoes('');
            setCarga('');
            Alert.alert('Sucesso!', 'Exercício adicionado!');
            await loadExercises();
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível adicionar o exercício');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteExercise = async (itemId: string) => {
        Alert.alert(
            'Confirmar Exclusão',
            'Deseja excluir este exercício?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await WorkoutRecordService.deleteItem(workoutRecord.id, itemId);
                            Alert.alert('Sucesso!', 'Exercício excluído!');
                            await loadExercises();
                        } catch (error) {
                            Alert.alert('Erro', 'Não foi possível excluir');
                        }
                    }
                }
            ]
        );
    };

    const renderExercise = ({ item }: { item: WorkoutItem }) => (
        <View style={styles.exerciseCard}>
            <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{item.exercise_name}</Text>
                <Text style={styles.exerciseDetails}>
                    {item.series && `${item.series} séries`}
                    {item.repeticoes && ` • ${item.repeticoes} reps`}
                    {item.carga && ` • ${item.carga}kg`}
                </Text>
            </View>
            <TouchableOpacity onPress={() => item.id && handleDeleteExercise(item.id)}>
                <Icon name="trash" size={20} color="#FF6B6B" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <Header title={workoutRecord?.name || 'EXERCÍCIOS'} />
            <ScrollView style={styles.content}>
                <View style={styles.formContainer}>
                    <Text style={styles.formTitle}>Adicionar Exercício</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Nome do exercício"
                        value={exerciseName}
                        onChangeText={setExerciseName}
                        placeholderTextColor="#999"
                    />
                    <View style={styles.row}>
                        <TextInput
                            style={[styles.input, { flex: 1, marginRight: 8 }]}
                            placeholder="Séries"
                            value={series}
                            onChangeText={setSeries}
                            keyboardType="numeric"
                            placeholderTextColor="#999"
                        />
                        <TextInput
                            style={[styles.input, { flex: 1, marginRight: 8 }]}
                            placeholder="Reps"
                            value={repeticoes}
                            onChangeText={setRepeticoes}
                            keyboardType="numeric"
                            placeholderTextColor="#999"
                        />
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            placeholder="Carga (kg)"
                            value={carga}
                            onChangeText={setCarga}
                            keyboardType="numeric"
                            placeholderTextColor="#999"
                        />
                    </View>
                    <TouchableOpacity style={styles.addButton} onPress={handleAddExercise} disabled={loading}>
                        <Icon name="plus" size={20} color="#FFF" />
                        <Text style={styles.addButtonText}>{loading ? 'Adicionando...' : 'Adicionar'}</Text>
                    </TouchableOpacity>
                </View>
                {exercises.length > 0 && (
                    <View style={styles.exercisesList}>
                        <Text style={styles.listTitle}>Exercícios ({exercises.length})</Text>
                        <FlatList
                            data={exercises}
                            keyExtractor={(item, index) => item.id || index.toString()}
                            renderItem={renderExercise}
                            scrollEnabled={false}
                        />
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#E0E0E0' },
    content: { flex: 1, padding: 20 },
    formContainer: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, marginBottom: 20 },
    formTitle: { fontSize: 18, fontWeight: 'bold', color: '#FF6B6B', marginBottom: 16 },
    input: { backgroundColor: '#F5F5F5', borderRadius: 8, padding: 12, fontSize: 16, borderWidth: 1, borderColor: '#DDD', marginBottom: 12 },
    row: { flexDirection: 'row', marginBottom: 12 },
    addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF6B6B', paddingVertical: 14, justifyContent: 'center', borderRadius: 8 },
    addButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
    exercisesList: { marginBottom: 40 },
    listTitle: { fontSize: 18, fontWeight: 'bold', color: '#FF6B6B', marginBottom: 12 },
    exerciseCard: { backgroundColor: '#FFF', borderRadius: 8, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderLeftWidth: 4, borderLeftColor: '#FF6B6B' },
    exerciseInfo: { flex: 1 },
    exerciseName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
    exerciseDetails: { fontSize: 14, color: '#666' },
});

export default AdicionarExercicios;
