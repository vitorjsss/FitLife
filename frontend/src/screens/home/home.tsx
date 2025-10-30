import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../../App";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { authService } from "../../services/authService";
import { patientService } from "../../services/PatientService";
import { nutricionistService } from "../../services/NutricionistService";
import { physicalEducatorService } from "../../services/PhysicalEducatorService";


type HomeScreenNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    "Home"
>;

export default function HomeScreen() {
    const [userId, setUserId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    const [personalData, setPersonalData] = useState<any>(null);

    const navigation = useNavigation<HomeScreenNavigationProp>();

    useEffect(() => {
        const loadUserData = async () => {
            try {
                const userId = await AsyncStorage.getItem("@fitlife:user_id");
                setUserId(userId);
                const userRole = await AsyncStorage.getItem("@fitlife:role");
                setUserRole(userRole);
            } catch (err) {
                console.error("Erro ao buscar token:", err);
            } finally {
                setLoading(false);
            }
        };

        loadUserData();
    }, []);

    useEffect(() => {
        const fetchPersonalData = async () => {
            if (!userId || !userRole) return;
            try {
                let data = null;
                if (userRole === "Patient") {
                    data = await patientService.getById(userId);
                } else if (userRole === "Nutricionist") {
                    data = await nutricionistService.getById(userId);
                } else if (userRole === "Physical_educator") {
                    data = await physicalEducatorService.getById(userId);
                }

                // Agora data já é o objeto do usuário
                setPersonalData(data || null);
            } catch (err) {
                console.error("Erro ao buscar dados pessoais:", err);
                setPersonalData(null);
            }
        };

        fetchPersonalData();
    }, [userId, userRole]);

    const handleLogout = async () => {
        await authService.logout();
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: "Login" }],
            })
        );
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#40C4FF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ width: 25 }} />

                <Text style={styles.headerTitle}>INÍCIO</Text>

                <TouchableOpacity onPress={() => setShowMenu(!showMenu)}>
                    <Icon name="user-circle" size={32} color="#fff" style={{ marginTop: 25 }} />
                </TouchableOpacity>
            </View>

            {/* Dropdown Menu */}
            {showMenu && (
                <View style={styles.menu}>
                    <Text style={styles.menuTitle}>
                        {personalData?.name ? personalData.name.split(' ')[0] : "NOME DO USUÁRIO"}
                    </Text>
                    {userRole && (
                        <Text
                            style={
                                [
                                    styles.roleText,
                                    userRole === 'Patient' ? { color: '#1976D2' } :
                                        userRole === 'Nutricionist' ? { color: '#43A047' } :
                                            userRole === 'Physical_educator' ? { color: '#FF9800' } :
                                                { color: '#888' }
                                ]
                            }
                        >
                            {userRole === 'Patient' && 'Paciente'}
                            {userRole === 'Nutricionist' && 'Nutricionista'}
                            {userRole === 'Physical_educator' && 'Educador Físico'}
                        </Text>
                    )}

                    <TouchableOpacity style={styles.menuItem}>
                        <Icon name="cog" size={16} color="#1976D2" />
                        <Text style={styles.menuText}>Minha Conta</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                        <Icon name="sign-out" size={16} color="#1976D2" />
                        <Text style={styles.menuText}>Sair</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Conteúdo */}
            <View style={styles.content}>
                {/* Texto de boas-vindas */}
                <View style={{ alignItems: 'center', marginBottom: 18 }}>
                    {personalData?.name ? (
                        <Text style={{ fontSize: 20, color: '#1976D2' }}>
                            Bem-vindo,{' '}
                            <Text style={{ fontWeight: 'bold', color: '#40C4FF', fontSize: 22 }}>
                                {personalData.name.split(' ')[0]}!
                            </Text>
                        </Text>
                    ) : (
                        <Text style={{ fontSize: 20, color: '#1976D2' }}>Bem-vindo!</Text>
                    )}
                </View>

                <View style={styles.row}>
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => navigation.navigate('Refeicoes', { patientId: personalData.id })}
                    >
                        <Icon name="cutlery" size={32} color="#fff" />
                        <Text style={styles.cardText}>Minhas Refeições</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Treinos')}>
                        <Icon name="heartbeat" size={32} color="#fff" />
                        <Text style={styles.cardText}>Meus Treinos</Text>
                    </TouchableOpacity>
                </View>

                {/* <View style={styles.bigCard}>
                </View> */}
            </View>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem}>
                    <Icon name="bar-chart" size={20} color="#fff" />
                    <Text style={styles.navText}>Relatórios</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem}
                    onPress={() => navigation.navigate('GerenciarMedidas')}
                >
                    <Icon name="plus-square" size={20} color="#fff" />
                    <Text style={styles.navText}>Gerenciar Medidas</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.navItem}
                >
                    <Icon name="home" size={20} color="#fff" />
                    <Text style={styles.navText}>Início</Text>
                </TouchableOpacity>


                <TouchableOpacity style={styles.navItem}
                    onPress={() => navigation.navigate('Checklist', personalData?.id ? { patientId: personalData.id } : {})}
                >
                    <Icon name="list" size={20} color="#fff" />
                    <Text style={styles.navText}>CheckList</Text>
                </TouchableOpacity>


                <TouchableOpacity style={styles.navItem}>
                    <Icon name="calendar" size={20} color="#fff" />
                    <Text style={styles.navText}>Calendário</Text>
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
    header: {
        backgroundColor: "#1976D2",
        height: 90,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 35,

    },
    headerTitle: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
        paddingTop: 30,
    },
    menu: {
        position: "absolute",
        top: 80,
        right: 20,
        width: 200,
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: 10,
        elevation: 10,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        zIndex: 999,
    },
    menuTitle: {
        fontWeight: "bold",
        marginBottom: 0,
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
        paddingBottom: 5,
        fontSize: 18,
        textAlign: 'center',
    },
    roleText: {
        fontWeight: '600',
        fontSize: 15,
        marginBottom: 10,
        textAlign: 'center',
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
    },
    menuText: {
        marginLeft: 8,
        color: "#1976D2",
        fontWeight: "600",
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
    bigCard: {
        flex: 1,
        backgroundColor: "#40C4FF",
        borderRadius: 12,
        marginTop: 20,
        marginBottom: 150,
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