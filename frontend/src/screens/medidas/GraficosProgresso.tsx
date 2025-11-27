import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import MeasurementsService, { MeasureRecord } from '../../services/MeasurementsService';
import Header from '../../components/Header';
import { useUser } from '../../context/UserContext';

const { width } = Dimensions.get('window');

type MeasureType = 
  | 'peso' 
  | 'altura' 
  | 'waist_circumference' 
  | 'hip_circumference'
  | 'arm_circumference'
  | 'thigh_circumference'
  | 'calf_circumference'
  | 'body_fat_percentage'
  | 'muscle_mass'
  | 'bone_mass';

interface ChartData {
  labels: string[];
  datasets: [{
    data: number[];
  }];
}

const measureConfig = {
  peso: { label: 'Peso (kg)', color: '#FF6384', icon: 'balance-scale' },
  altura: { label: 'Altura (cm)', color: '#36A2EB', icon: 'arrows-v' },
  waist_circumference: { label: 'Cintura (cm)', color: '#FFCE56', icon: 'circle' },
  hip_circumference: { label: 'Quadril (cm)', color: '#4BC0C0', icon: 'circle-o' },
  arm_circumference: { label: 'Braço (cm)', color: '#9966FF', icon: 'hand-paper-o' },
  thigh_circumference: { label: 'Coxa (cm)', color: '#FF9F40', icon: 'male' },
  calf_circumference: { label: 'Panturrilha (cm)', color: '#FF6384', icon: 'shoe-prints' },
  body_fat_percentage: { label: '% Gordura', color: '#f44336', icon: 'percent' },
  muscle_mass: { label: 'Massa Muscular (kg)', color: '#4caf50', icon: 'heartbeat' },
  bone_mass: { label: 'Massa Óssea (kg)', color: '#607D8B', icon: 'chain' },
};

export default function GraficosProgresso() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [records, setRecords] = useState<MeasureRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeasure, setSelectedMeasure] = useState<MeasureType>('peso');

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      if (user?.id) {
        const list = await MeasurementsService.list(user.id);
        console.log('[GraficosProgresso] Dados recebidos:', list);
        console.log('[GraficosProgresso] Tipo de dados:', typeof list, Array.isArray(list));
        
        // Garantir que list é um array
        let measuresArray: MeasureRecord[] = [];
        
        if (Array.isArray(list)) {
          measuresArray = list;
        } else if (list && typeof list === 'object') {
          // Se vier como objeto, tentar extrair o array de uma propriedade comum
          measuresArray = (list as any).data || (list as any).measures || (list as any).records || [];
          console.log('[GraficosProgresso] Dados extraídos de objeto:', measuresArray);
        } else {
          console.warn('[GraficosProgresso] Formato de dados inesperado, usando array vazio');
          measuresArray = [];
        }
        
        // Ordenar por data (mais antigo primeiro para o gráfico)
        const sorted = measuresArray.sort((a, b) => {
          const dateA = a.data ? new Date(a.data).getTime() : 0;
          const dateB = b.data ? new Date(b.data).getTime() : 0;
          return dateA - dateB;
        });
        setRecords(sorted);
      }
    } catch (err) {
      console.error('Erro ao carregar medidas:', err);
      setRecords([]); // Garantir que records seja sempre um array
    } finally {
      setLoading(false);
    }
  };

  const formatDateBR = (isoDate?: string) => {
    if (!isoDate) return '';
    try {
      const date = new Date(isoDate);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return '';
    }
  };

  const getChartData = (measureType: MeasureType): ChartData => {
    // Filtrar registros que têm a medida selecionada
    const validRecords = records.filter(r => r[measureType] != null);
    
    if (validRecords.length === 0) {
      return {
        labels: ['Sem dados'],
        datasets: [{ data: [0] }],
      };
    }

    // Limitar a 10 pontos mais recentes para melhor visualização
    const recentRecords = validRecords.slice(-10);

    return {
      labels: recentRecords.map(r => {
        if (!r.data) return '';
        try {
          const dateStr = r.data.includes('T') ? r.data.split('T')[0] : r.data;
          const [year, month, day] = dateStr.split('-');
          return `${day}/${month}`;
        } catch {
          return '';
        }
      }),
      datasets: [{
        data: recentRecords.map(r => Number(r[measureType]) || 0),
      }],
    };
  };

  const getStats = (measureType: MeasureType) => {
    const validRecords = records.filter(r => r[measureType] != null);
    
    if (validRecords.length === 0) {
      return { current: 0, min: 0, max: 0, trend: 0 };
    }

    const values = validRecords.map(r => Number(r[measureType]) || 0);
    const current = values[values.length - 1];
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Calcular tendência (diferença entre primeiro e último valor)
    const first = values[0];
    const trend = current - first;

    return { current, min, max, trend };
  };

  const chartConfig = {
    backgroundColor: '#fff',
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 1,
    color: (opacity = 1) => measureConfig[selectedMeasure].color,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: measureConfig[selectedMeasure].color,
    },
  };

  const stats = getStats(selectedMeasure);
  const chartData = getChartData(selectedMeasure);

  if (loading) {
    return (
      <View style={styles.container}>
        <Header 
          title="Gráficos de Progresso" 
          showBackArrow={true} 
          showUserIcon={false} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976D2" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        title="Gráficos de Progresso" 
        showBackArrow={true} 
        showUserIcon={false} 
      />
      <TouchableOpacity 
        style={styles.addButton2}
        onPress={() => navigation.navigate('GerenciarMedidas')}
      >
        <Icon name="plus" size={20} color="#fff" />
      </TouchableOpacity>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Seletor de Medida */}
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorTitle}>Selecione a medida:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(Object.keys(measureConfig) as MeasureType[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.measureButton,
                  selectedMeasure === type && {
                    backgroundColor: measureConfig[type].color,
                    borderColor: measureConfig[type].color,
                  },
                ]}
                onPress={() => setSelectedMeasure(type)}
              >
                <Icon
                  name={measureConfig[type].icon}
                  size={16}
                  color={selectedMeasure === type ? '#fff' : '#666'}
                />
                <Text
                  style={[
                    styles.measureButtonText,
                    selectedMeasure === type && styles.measureButtonTextActive,
                  ]}
                >
                  {measureConfig[type].label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Estatísticas */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Atual</Text>
            <Text style={[styles.statValue, { color: measureConfig[selectedMeasure].color }]}>
              {stats.current.toFixed(1)}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Mínimo</Text>
            <Text style={styles.statValue}>{stats.min.toFixed(1)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Máximo</Text>
            <Text style={styles.statValue}>{stats.max.toFixed(1)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Tendência</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon
                name={stats.trend > 0 ? 'arrow-up' : stats.trend < 0 ? 'arrow-down' : 'minus'}
                size={16}
                color={stats.trend > 0 ? '#4caf50' : stats.trend < 0 ? '#f44336' : '#666'}
              />
              <Text
                style={[
                  styles.statValue,
                  {
                    color: stats.trend > 0 ? '#4caf50' : stats.trend < 0 ? '#f44336' : '#666',
                    marginLeft: 4,
                  },
                ]}
              >
                {Math.abs(stats.trend).toFixed(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Gráfico */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>{measureConfig[selectedMeasure].label}</Text>
          {chartData.datasets[0].data.length > 0 && chartData.datasets[0].data[0] !== 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart
                data={chartData}
                width={Math.max(width - 40, chartData.labels.length * 50)}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withInnerLines={true}
                withOuterLines={true}
                withVerticalLines={true}
                withHorizontalLines={true}
                withDots={true}
                withShadow={false}
                fromZero={false}
              />
            </ScrollView>
          ) : (
            <View style={styles.emptyChart}>
              <Icon name="line-chart" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Nenhuma medida registrada ainda</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('GerenciarMedidas')}
              >
                <Text style={styles.addButtonText}>Adicionar Medida</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Lista de Registros Recentes */}
        <View style={styles.recentContainer}>
          <Text style={styles.recentTitle}>Registros Recentes</Text>
          {records.slice(-5).reverse().map((record) => {
            const recordData = record as any;
            return (
              <View key={record.id} style={styles.recordCard}>
                <Text style={styles.recordDate}>{formatDateBR(record.data)}</Text>
                <View style={styles.recordValues}>
                  {record.peso && (
                    <Text style={styles.recordValue}>Peso: {record.peso}kg</Text>
                  )}
                  {record.altura && (
                    <Text style={styles.recordValue}>Altura: {record.altura}m</Text>
                  )}
                  {record.imc && (
                    <Text style={styles.recordValue}>IMC: {record.imc.toFixed(1)}</Text>
                  )}
                </View>
                
                {/* Circunferências */}
                {(recordData.waist_circumference || recordData.hip_circumference || 
                  recordData.arm_circumference || recordData.thigh_circumference || 
                  recordData.calf_circumference) && (
                  <View style={styles.recordSection}>
                    <Text style={styles.recordSectionTitle}>📐 Circunferências:</Text>
                    <View style={styles.recordValues}>
                      {recordData.waist_circumference && (
                        <Text style={styles.recordValue}>Cintura: {recordData.waist_circumference}cm</Text>
                      )}
                      {recordData.hip_circumference && (
                        <Text style={styles.recordValue}>Quadril: {recordData.hip_circumference}cm</Text>
                      )}
                      {recordData.arm_circumference && (
                        <Text style={styles.recordValue}>Braço: {recordData.arm_circumference}cm</Text>
                      )}
                      {recordData.thigh_circumference && (
                        <Text style={styles.recordValue}>Coxa: {recordData.thigh_circumference}cm</Text>
                      )}
                      {recordData.calf_circumference && (
                        <Text style={styles.recordValue}>Panturrilha: {recordData.calf_circumference}cm</Text>
                      )}
                    </View>
                  </View>
                )}
                
                {/* Composição Corporal */}
                {(recordData.body_fat_percentage || recordData.muscle_mass || recordData.bone_mass) && (
                  <View style={styles.recordSection}>
                    <Text style={styles.recordSectionTitle}>💪 Composição:</Text>
                    <View style={styles.recordValues}>
                      {recordData.body_fat_percentage && (
                        <Text style={styles.recordValue}>Gordura: {recordData.body_fat_percentage}%</Text>
                      )}
                      {recordData.muscle_mass && (
                        <Text style={styles.recordValue}>Músculo: {recordData.muscle_mass}kg</Text>
                      )}
                      {recordData.bone_mass && (
                        <Text style={styles.recordValue}>Osso: {recordData.bone_mass}kg</Text>
                      )}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, padding: 16 },
  
  addButton2: {
    position: 'absolute',
    top: 40,
    right: 16,
    backgroundColor: '#40C4FF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 999,
  },
  
  selectorContainer: { marginBottom: 16 },
  selectorTitle: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8 },
  measureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  measureButtonText: { marginLeft: 8, fontSize: 12, color: '#666' },
  measureButtonTextActive: { color: '#fff', fontWeight: '600' },
  
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 2,
  },
  statLabel: { fontSize: 11, color: '#666', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#1976D2' },
  
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1976D2',
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  emptyChart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: { color: '#999', marginTop: 12, marginBottom: 16 },
  addButton: {
    backgroundColor: '#40C4FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: { color: '#fff', fontWeight: '600' },
  
  recentContainer: { marginBottom: 24 },
  recentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1976D2',
    marginBottom: 12,
  },
  recordCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
  },
  recordDate: { fontSize: 14, fontWeight: '600', color: '#1976D2', marginBottom: 4 },
  recordValues: { flexDirection: 'row', flexWrap: 'wrap' },
  recordValue: { fontSize: 12, color: '#666', marginRight: 12 },
  recordSection: { marginTop: 8 },
  recordSectionTitle: { fontSize: 11, fontWeight: '600', color: '#1976D2', marginBottom: 4 },
});
