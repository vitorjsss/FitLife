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
    const dateString = new Date().toISOString().split('T')[0];

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
                const meals = await DailyMealService.getByDate(dateString);
                setDailyMeals(Array.isArray(meals) ? meals : []);
            } catch (err) {
                console.error('Erro ao carregar refeições do backend:', err);
                setDailyMeals([]);
            } finally {
                setLoading(false);
            }
        };
        const unsubscribe = navigation?.addListener('focus', fetchMeals);
        return unsubscribe;
    }, [navigation, dateString]);

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleGoBack}>
                    <Icon name="arrow-left" size={24} color="#fff" style={{ marginTop: 25 }} />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>REFEIÇÕES</Text>

                <TouchableOpacity onPress={() => setShowMenu(!showMenu)}>
                    <Icon name="user-circle" size={32} color="#fff" style={{ marginTop: 25 }} />
                </TouchableOpacity>
            </View>

            {/* MENU */}
            {showMenu && (
                <View style={styles.menu}>
                    <Text style={styles.menuTitle}>NOME DO USUÁRIO</Text>

                    <TouchableOpacity style={styles.menuItem}>
                        <Icon name="cog" size={16} color="#1976D2" />
                        <Text style={styles.menuText}>Minha Conta</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <Icon name="sign-out" size={16} color="#1976D2" />
                        <Text style={styles.menuText}>Sair</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* CONTEÚDO */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <Text>Carregando...</Text>
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
                        {/* LISTA DE REFEIÇÕES */}
                        <Text style={styles.listTitle}>
                            Refeições de {new Date().toLocaleDateString('pt-BR')}
                        </Text>

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
                                </View>
                                <Text style={styles.mealInfo}>
                                    {meal.itemCount || 0} alimentos
                                </Text>
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
    header: {
        backgroundColor: '#1976D2',
        height: 90,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 35,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        paddingTop: 30,
    },
    menu: {
        position: 'absolute',
        top: 90,
        right: 20,
        width: 200,
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 10,
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        zIndex: 999,
    },
    menuTitle: {
        fontWeight: 'bold',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingBottom: 5,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    menuText: {
        marginLeft: 8,
        color: '#1976D2',
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 20,
        marginTop: 150,
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
