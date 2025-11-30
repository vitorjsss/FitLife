import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../../../App";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Header from '../../components/Header';
import { useUser } from '../../context/UserContext';
import WeeklyMealWidget from '../../components/WeeklyMealWidget';
import WeeklyWorkoutWidget from '../../components/WeeklyWorkoutWidget';
import MeasuresProgressWidget from '../../components/MeasuresProgressWidget';


type HomeScreenNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    "Home"
>;

export default function HomeScreen() {
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const { user, loading: userLoading } = useUser();

    useEffect(() => {
        // Simula carregamento inicial
        setTimeout(() => setLoading(false), 500);
    }, []);

    // Força re-render dos widgets quando a tela é focada
    const [refreshKey, setRefreshKey] = useState(0);
    useFocusEffect(
        useCallback(() => {
            // Incrementa a key para forçar re-render dos widgets sem loading visual
            setRefreshKey(prev => prev + 1);
        }, [])
    );

    if (loading || userLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#40C4FF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <Header title="Início" showBackArrow={false} showUserIcon={true} />

            {/* Conteúdo com ScrollView */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Texto de boas-vindas */}
                <View style={{ alignItems: 'center', marginBottom: 18 }}>
                    {user?.name ? (
                        <Text style={{ fontSize: 20, color: '#1976D2' }}>
                            Bem-vindo,{' '}
                            <Text style={{ fontWeight: 'bold', color: '#40C4FF', fontSize: 22 }}>
                                {user.name.split(' ')[0]}!
                            </Text>
                        </Text>
                    ) : (
                        <Text style={{ fontSize: 20, color: '#1976D2' }}>Bem-vindo!</Text>
                    )}
                </View>

                {/* Botão de Código de Conexão */}
                <TouchableOpacity
                    style={styles.connectionCard}
                    onPress={() => navigation.navigate('ConnectionCode')}
                >
                    <Icon name="key" size={24} color="#1976D2" />
                    <View style={styles.connectionInfo}>
                        <Text style={styles.connectionTitle}>Conectar com Profissional</Text>
                        <Text style={styles.connectionSubtitle}>Gere um código para se conectar</Text>
                    </View>
                    <Icon name="chevron-right" size={20} color="#1976D2" />
                </TouchableOpacity>

                {/* Widget de Progresso Semanal */}
                {user?.id && (
                    <WeeklyMealWidget
                        key={`meal-${refreshKey}`}
                        userId={user.id}
                        onPress={() => navigation.navigate('CalendarioRefeicoes')}
                    />
                )}

                {/* Widget de Progresso Semanal de Treinos */}
                {user?.id && (
                    <WeeklyWorkoutWidget
                        key={`workout-${refreshKey}`}
                        userId={user.id}
                        onPress={() => navigation.navigate('CalendarioTreinos')}
                    />
                )}

                {/* Widget de Progresso das Medidas */}
                {user?.id && (
                    <MeasuresProgressWidget key={`measures-${refreshKey}`} userId={user.id} />
                )}
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => navigation.navigate('Refeicoes', user?.id ? { patientId: user.id } : {})}
                >
                    <Icon name="cutlery" size={20} color="#fff" />
                    <Text style={styles.navText}>Refeições</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => navigation.navigate('Treinos')}
                >
                    <Icon name="heartbeat" size={20} color="#fff" />
                    <Text style={styles.navText}>Treinos</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem}
                    onPress={() => navigation.navigate('Checklist')}
                >
                    <Icon name="list" size={20} color="#fff" />
                    <Text style={styles.navText}>CheckList</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem}
                    onPress={() => navigation.navigate('GerenciarMedidas')}
                >
                    <Icon name="plus-square" size={20} color="#fff" />
                    <Text style={styles.navText}>Medidas</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => navigation.navigate('Relatorios')}
                >
                    <Icon name="file-text" size={20} color="#fff" />
                    <Text style={styles.navText}>Relatórios</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 0,
        backgroundColor: "#E0E0E0",
    },
    content: {
        flex: 1,
        padding: 20,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    card: {
        flex: 1,
        backgroundColor: "#40C4FF",
        marginHorizontal: 5,
        borderRadius: 12,
        padding: 30,
        alignItems: "center",
    },
    cardText: {
        color: "#fff",
        marginTop: 10,
        fontWeight: "bold",
        textAlign: "center",
        fontSize: 16,
        lineHeight: 20,
    },
    connectionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    connectionInfo: {
        flex: 1,
        marginLeft: 16,
    },
    connectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1976D2',
    },
    connectionSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    bottomNav: {
        flexDirection: "row",
        justifyContent: "space-around",
        backgroundColor: "#1976D2",
        paddingVertical: 25,
    },
    navItem: {
        alignItems: "center",
        marginTop: -5,
        flex: 1,

    },
    navText: {
        color: "#fff",
        fontSize: 12,
        marginTop: 10,
        textAlign: "center",
    },
});