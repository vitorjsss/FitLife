import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import Header from '../../components/Header';
import WorkoutRecordService, { WorkoutRecord } from '../../services/WorkoutRecordService';
import { useUser } from '../../context/UserContext';

const { width } = Dimensions.get('window');

interface TreinosProps {
  route?: any;
  navigation?: any;
}

const Treinos: React.FC<TreinosProps> = ({ route, navigation }) => {
  const [workouts, setWorkouts] = useState<WorkoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const patientId = route?.params?.patientId || user?.id || '';
  const [date, setDate] = useState<Date>(new Date());
  const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const changeDay = (delta: number) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setDate(d.getDate() + delta);
    setDate(d);
  };

  const handleCriarTreino = () => {
    navigation?.navigate('GerenciarTreinos', { date: dateString, patientId });
  };

  useEffect(() => {
    const fetchWorkouts = async () => {
      setLoading(true);
      try {
        if (!patientId) {
          setWorkouts([]);
          setLoading(false);
          return;
        }

        const data = await WorkoutRecordService.getByDate(dateString, patientId);

        if (Array.isArray(data)) {
          setWorkouts(data);
        } else {
          setWorkouts([]);
        }
      } catch (err) {
        console.error('Erro ao buscar treinos:', err);
        setWorkouts([]);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = navigation?.addListener('focus', fetchWorkouts);
    fetchWorkouts();
    return unsubscribe;
  }, [navigation, dateString, patientId]);

  return (
    <View style={styles.container}>
      <Header title="Treinos" />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => changeDay(-1)} style={{ marginRight: 12 }}>
            <Icon name="chevron-left" size={20} color="#FF6B6B" />
          </TouchableOpacity>
          <Text style={{ color: '#FF6B6B', fontWeight: '700' }}>
            {date.getDate().toString().padStart(2, '0')}/{(date.getMonth() + 1).toString().padStart(2, '0')}/{date.getFullYear()}
          </Text>
          <TouchableOpacity onPress={() => changeDay(1)} style={{ marginLeft: 12 }}>
            <Icon name="chevron-right" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => navigation?.navigate('CalendarioTreinos', { patientId })}
          style={{ padding: 8, backgroundColor: '#FFE5E5', borderRadius: 8 }}
        >
          <Icon name="calendar" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <Text>Carregando treinos...</Text>
        ) : workouts.length === 0 ? (
          <>
            <View style={styles.illustrationContainer}>
              <View style={styles.iconCircle}>
                <Icon name="heartbeat" size={60} color="#FF6B6B" />
              </View>
              <Text style={styles.illustrationText}>Organize seus treinos diários</Text>
            </View>
            <TouchableOpacity style={styles.createButton} onPress={handleCriarTreino} activeOpacity={0.8}>
              <Icon name="plus" size={20} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Criar Novo Treino</Text>
            </TouchableOpacity>
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                Comece criando seu primeiro treino para acompanhar sua atividade física diária
              </Text>
            </View>
          </>
        ) : (
          <>
            {workouts.map((workout) => (
              <TouchableOpacity
                key={workout.id}
                style={{ backgroundColor: '#FFF', borderRadius: 8, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                onPress={() => navigation.navigate('GerenciarTreinos', {
                  workoutId: workout.id,
                  workoutName: workout.name,
                  date: dateString,
                  patientId,
                })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name={workout.checked ? "check-circle" : "circle-o"} size={22} color={workout.checked ? "#4CAF50" : "#FF6B6B"} />
                  <Text style={[styles.workoutName, workout.checked && { textDecorationLine: 'line-through', color: '#999' }]}>
                    {workout.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.createButton, { marginTop: 20, marginBottom: 50 }]} onPress={handleCriarTreino} activeOpacity={0.8}>
              <Icon name="plus" size={20} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Novo Treino</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E0E0E0', marginTop: 0 },
  content: { flex: 1, padding: 20 },
  illustrationContainer: { alignItems: 'center', marginBottom: 60 },
  iconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  illustrationText: { fontSize: 16, color: '#555', textAlign: 'center', lineHeight: 22, maxWidth: width * 0.8 },
  createButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF6B6B', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12, justifyContent: 'center', elevation: 8, minWidth: width * 0.7, alignSelf: 'center' },
  createButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  infoContainer: { paddingHorizontal: 20 },
  infoText: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 25 },
  workoutName: { fontSize: 16, fontWeight: '600', marginLeft: 12 },
});

export default Treinos;
