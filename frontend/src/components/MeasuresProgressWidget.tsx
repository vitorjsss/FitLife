import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import MeasurementsService, { MeasureRecord } from '../services/MeasurementsService';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const USER_KEY = '@fitlife:user_id';

interface MeasuresProgressWidgetProps {
    userId: string;
}

const MeasuresProgressWidget: React.FC<MeasuresProgressWidgetProps> = ({ userId: propUserId }) => {
    const [records, setRecords] = useState<MeasureRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const navigation = useNavigation();

    useEffect(() => {
        loadUserId();
    }, []);

    useEffect(() => {
        if (userId) {
            loadMeasures();
        }
    }, [userId]);

    const loadUserId = async () => {
        try {
            // Buscar o userId do AsyncStorage (auth_id)
            const uid = await AsyncStorage.getItem(USER_KEY);
            console.log('[MeasuresProgressWidget] userId do AsyncStorage:', uid);
            setUserId(uid);
        } catch (err) {
            console.error('[MeasuresProgressWidget] Erro ao buscar userId:', err);
        }
    };

    const loadMeasures = async () => {
        if (!userId) {
            console.log('[MeasuresProgressWidget] userId não disponível ainda');
            setLoading(false);
            return;
        }
        
        try {
            setLoading(true);
            console.log('[MeasuresProgressWidget] Carregando medidas para userId:', userId);
            const data = await MeasurementsService.list(userId);
            console.log('[MeasuresProgressWidget] Dados recebidos:', data);
            console.log('[MeasuresProgressWidget] Total de registros:', data.length);
            
            // Ordena por data (mais antigo primeiro) e pega os últimos 7 registros
            const sorted = data.sort((a, b) => {
                const dateA = a.date ? new Date(a.date).getTime() : 0;
                const dateB = b.date ? new Date(b.date).getTime() : 0;
                return dateA - dateB;
            }).slice(-7);
            
            console.log('[MeasuresProgressWidget] Registros após filtro (últimos 7):', sorted);
            setRecords(sorted);
        } catch (err) {
            console.error('[MeasuresProgressWidget] Erro ao carregar medidas:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <TouchableOpacity 
                style={styles.card} 
                activeOpacity={0.7}
                onPress={() => navigation.navigate('GraficosProgresso')}
            >
                <ActivityIndicator size="small" color="#1976D2" />
            </TouchableOpacity>
        );
    }

    if (records.length === 0) {
        return (
            <TouchableOpacity 
                style={styles.card} 
                activeOpacity={0.7}
                onPress={() => navigation.navigate('GerenciarMedidas')}
            >
                <View style={styles.header}>
                    <Icon name="line-chart" size={20} color="#1976D2" />
                    <Text style={styles.title}>Progresso das Medidas</Text>
                </View>
                <View style={styles.emptyState}>
                    <Icon name="plus-circle" size={48} color="#E0E0E0" />
                    <Text style={styles.emptyText}>Nenhuma medida registrada ainda.</Text>
                    <Text style={styles.emptySubtext}>Toque aqui para adicionar sua primeira medida!</Text>
                </View>
            </TouchableOpacity>
        );
    }

    // Prepara dados para o gráfico (peso)
    const weightData = records.map(r => {
        console.log('[MeasuresProgressWidget] Record:', r);
        return r.weight || 0;
    });
    console.log('[MeasuresProgressWidget] weightData:', weightData);
    
    const labels = records.map(r => {
        if (!r.date) return '';
        const d = new Date(r.date);
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    });
    console.log('[MeasuresProgressWidget] labels:', labels);

    const chartData = {
        labels: labels,
        datasets: [
            {
                data: weightData.length > 0 ? weightData : [0],
                color: (opacity = 1) => `rgba(64, 196, 255, ${opacity})`,
                strokeWidth: 2
            }
        ]
    };

    const chartConfig = {
        backgroundColor: '#fff',
        backgroundGradientFrom: '#fff',
        backgroundGradientTo: '#fff',
        decimalPlaces: 1,
        color: (opacity = 1) => `rgba(25, 118, 210, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        style: {
            borderRadius: 16
        },
        propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: '#40C4FF'
        }
    };

    const latestWeight = weightData[weightData.length - 1];
    const previousWeight = weightData.length > 1 ? weightData[weightData.length - 2] : latestWeight;
    const weightDiff = latestWeight - previousWeight;
    
    console.log('[MeasuresProgressWidget] latestWeight:', latestWeight);
    console.log('[MeasuresProgressWidget] previousWeight:', previousWeight);
    console.log('[MeasuresProgressWidget] weightDiff:', weightDiff);
    
    // Verificar se há peso válido (diferente de 0)
    const hasValidWeight = weightData.some(w => w > 0);
    console.log('[MeasuresProgressWidget] hasValidWeight:', hasValidWeight);
    
    // Se não há pesos válidos, mostrar estado vazio
    if (!hasValidWeight) {
        return (
            <TouchableOpacity 
                style={styles.card} 
                activeOpacity={0.7}
                onPress={() => navigation.navigate('GerenciarMedidas')}
            >
                <View style={styles.header}>
                    <Icon name="line-chart" size={20} color="#1976D2" />
                    <Text style={styles.title}>Progresso das Medidas</Text>
                </View>
                <View style={styles.emptyState}>
                    <Icon name="plus-circle" size={48} color="#E0E0E0" />
                    <Text style={styles.emptyText}>Nenhum peso registrado ainda.</Text>
                    <Text style={styles.emptySubtext}>Adicione seu peso para ver o progresso!</Text>
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity 
            style={styles.card} 
            activeOpacity={0.7}
            onPress={() => navigation.navigate('GraficosProgresso')}
        >
            <View style={styles.header}>
                <Icon name="line-chart" size={20} color="#1976D2" />
                <Text style={styles.title}>Progresso das Medidas</Text>
                <Icon name="chevron-right" size={16} color="#999" style={{ marginLeft: 'auto' }} />
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Peso Atual</Text>
                    <Text style={styles.statValue}>{latestWeight.toFixed(1)} kg</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Variação</Text>
                    <Text style={[
                        styles.statValue,
                        { color: weightDiff > 0 ? '#FF6B6B' : weightDiff < 0 ? '#4CAF50' : '#666' }
                    ]}>
                        {weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(1)} kg
                    </Text>
                </View>
            </View>

            <LineChart
                data={chartData}
                width={width - 60}
                height={180}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withInnerLines={false}
                withOuterLines={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
                fromZero={false}
            />

            <Text style={styles.subtitle}>Evolução do peso nos últimos registros</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1976D2',
        marginLeft: 8,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
    },
    emptyText: {
        textAlign: 'center',
        color: '#666',
        fontSize: 14,
        paddingVertical: 8,
        fontWeight: '600',
    },
    emptySubtext: {
        textAlign: 'center',
        color: '#999',
        fontSize: 12,
        fontStyle: 'italic',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
        paddingVertical: 12,
        backgroundColor: '#F5F9FC',
        borderRadius: 8,
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1976D2',
    },
    chart: {
        marginVertical: 8,
        borderRadius: 8,
    },
    subtitle: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
    },
});

export default MeasuresProgressWidget;
