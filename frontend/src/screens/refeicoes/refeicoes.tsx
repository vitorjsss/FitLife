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
import DailyMealService from '../../services/DailyMealService';

const { width } = Dimensions.get('window');

interface RefeicoesProps {
    route?: any;
    navigation?: any;
}

const STORAGE_KEY = '@fitlife_meal_records';

const Refeicoes: React.FC<RefeicoesProps> = ({ route, navigation }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [dailyMeals, setDailyMeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const patientId = route?.params?.patientId || '';
    // Data selecionada (reactiva) — permite navegar dias e filtrar corretamente
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
                // dateString e patientId devem estar definidos conforme sua lógica
                const meals = await DailyMealService.getByDate(dateString, patientId);
                // agora getByDate retorna já o array (r.data)
                setDailyMeals(Array.isArray(meals) ? meals : []);
                console.log('Refeições carregadas do backend:', meals);
            } catch (err) {
                console.error('Erro ao carregar refeições do backend:', err);
                setDailyMeals([]);
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
            <Header title="REFEIÇÕES" />
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
                    onPress={() => navigation?.navigate('CalendarioRefeicoes')}
                    style={{ padding: 8, backgroundColor: '#E3F2FD', borderRadius: 8 }}
                >
                    <Icon name="calendar" size={20} color="#1976D2" />
                </TouchableOpacity>
            </View>

            {/* CONTEÚDO */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <Text>Carregando refeições...</Text>
                ) : dailyMeals.length === 0 ? (
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
                        {dailyMeals.map((meal) => (
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
                                        dailyMealRegistryId: meal.id,
                                        mealName: meal.name,
                                        date: dateString,
                                        patientId,
                                    })
                                }
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Icon name="cutlery" size={22} color="#40C4FF" />
                                    <Text style={styles.mealName}>{meal.name}</Text>
                                    {meal.date && (
                                        <Text style={{ marginLeft: 8, color: '#888', fontSize: 13 }}>
                                            {(() => {
                                                // Ajusta para data local (corrige bug do dia anterior)
                                                const d = new Date(meal.date);
                                                const localDate = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
                                                return localDate instanceof Date && !isNaN(localDate.getTime())
                                                    ? `${localDate.getDate().toString().padStart(2, '0')}/${(localDate.getMonth() + 1).toString().padStart(2, '0')}/${localDate.getFullYear()}`
                                                    : '';
                                            })()}
                                        </Text>
                                    )}
                                </View>
                                {/* <Text style={styles.mealInfo}>
                                    {meal.itemCount || 0} alimentos
                                </Text> */}
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
