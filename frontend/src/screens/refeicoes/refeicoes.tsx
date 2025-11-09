import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import Header from '../../components/Header';
import MealRecordService, { MealRecord } from '../../services/MealRecordService';
import { useUser } from '../../context/UserContext';

const { width } = Dimensions.get('window');

interface RefeicoesProps {
    route?: any;
    navigation?: any;
}

const Refeicoes: React.FC<RefeicoesProps> = ({ route, navigation }) => {
    const [meals, setMeals] = useState<MealRecord[]>([]);
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

    const handleCriarRefeicao = () => {
        navigation?.navigate('GerenciarRefeicoes', {
            date: dateString,
            patientId,
        });
    };

    const handleGoBack = () => navigation?.goBack();

    useEffect(() => {
        const fetchMeals = async () => {
            setLoading(true);
            try {
                if (!patientId) {
                    setMeals([]);
                    setLoading(false);
                    return;
                }
                const data = await MealRecordService.getByDate(dateString, patientId);
                setMeals(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Erro ao carregar refeições:', err);
                setMeals([]);
            } finally {
                setLoading(false);
            }
        };
        const unsubscribe = navigation?.addListener('focus', fetchMeals);
        fetchMeals();
        return unsubscribe;
    }, [navigation, dateString, patientId]);

    return (
        <View style={styles.container}>
            <Header title="Refeições" />
            {/* CONTROLES DE DATA (NAVEGAÇÃO DE DIAS) */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => changeDay(-1)} style={{ marginRight: 12 }}>
                        <Icon name="chevron-left" size={20} color="#1976D2" />
                    </TouchableOpacity>
                    <Text style={{ color: '#1976D2', fontWeight: '700' }}>{date.getDate().toString().padStart(2, '0')}/{(date.getMonth() + 1).toString().padStart(2, '0')}/{date.getFullYear()}</Text>
                    <TouchableOpacity onPress={() => changeDay(1)} style={{ marginLeft: 12 }}>
                        <Icon name="chevron-right" size={20} color="#1976D2" />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    onPress={() => navigation?.navigate('CalendarioRefeicoes', { patientId })}
                    style={{ padding: 8, backgroundColor: '#E3F2FD', borderRadius: 8 }}
                >
                    <Icon name="calendar" size={20} color="#1976D2" />
                </TouchableOpacity>
            </View>

            {/* CONTEÚDO */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <Text>Carregando refeições...</Text>
                ) : meals.length === 0 ? (
                    <>
                        {/* ILUSTRAÇÃO INICIAL */}
                        <View style={styles.illustrationContainer}>
                            <View style={styles.iconCircle}>
                                <Icon name="cutlery" size={60} color="#40C4FF" />
                            </View>
                            <Text style={styles.illustrationText}>
                                Organize suas refeições diárias
                            </Text>
                        </View>

                        {/* BOTÃO PRINCIPAL */}
                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={handleCriarRefeicao}
                            activeOpacity={0.8}
                        >
                            <Icon name="plus" size={20} color="#FFFFFF" />
                            <Text style={styles.createButtonText}>Criar Nova Refeição</Text>
                        </TouchableOpacity>

                        <View style={styles.infoContainer}>
                            <Text style={styles.infoText}>
                                Comece criando sua primeira refeição para acompanhar sua alimentação diária
                            </Text>
                        </View>
                    </>
                ) : (
                    <>
                        {meals.map((meal) => (
                            <TouchableOpacity
                                key={meal.id}
                                style={{
                                    backgroundColor: '#FFF',
                                    borderRadius: 8,
                                    padding: 16,
                                    marginBottom: 12,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}
                                onPress={() =>
                                    navigation.navigate('GerenciarRefeicoes', {
                                        mealId: meal.id,
                                        mealName: meal.name,
                                        date: dateString,
                                        patientId,
                                    })
                                }
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Icon
                                        name={meal.checked ? "check-circle" : "circle-o"}
                                        size={22}
                                        color={meal.checked ? "#4CAF50" : "#40C4FF"}
                                    />
                                    <Text style={[styles.mealName, meal.checked && { textDecorationLine: 'line-through', color: '#999' }]}>
                                        {meal.name}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}

                        {/* ➕ NOVA REFEIÇÃO (DEPOIS DA LISTA) */}
                        <TouchableOpacity
                            style={[styles.createButton, { marginTop: 20, marginBottom: 50 }]}
                            onPress={handleCriarRefeicao}
                            activeOpacity={0.8}
                        >
                            <Icon name="plus" size={20} color="#FFFFFF" />
                            <Text style={styles.createButtonText}>Nova Refeição</Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E0E0E0',
        marginTop: 0,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    illustrationContainer: {
        alignItems: 'center',
        marginBottom: 60,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    illustrationText: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: width * 0.8,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#40C4FF',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 12,
        justifyContent: 'center',
        elevation: 8,
        minWidth: width * 0.7,
        alignSelf: 'center',
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    infoContainer: {
        paddingHorizontal: 20,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 25,
    },
    listTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1976D2',
        marginBottom: 16,
        top: -10,

    },
    mealCard: {
        backgroundColor: '#FFF',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderLeftWidth: 4,
        borderLeftColor: '#40C4FF',
    },
    mealName: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 12,
    },
    mealInfo: {
        color: '#888',
    },
});

export default Refeicoes;
