import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../../App";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Header from '../../components/Header';
import { useUser } from '../../context/UserContext';


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

            {/* Conteúdo */}
            <View style={styles.content}>
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

                <View style={styles.row}>
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => navigation.navigate('Refeicoes', user?.id ? { patientId: user.id } : {})}
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
                    <Text style={styles.navText}>Medidas</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.navItem}
                >
                    <Icon name="home" size={20} color="#fff" />
                    <Text style={styles.navText}>Início</Text>
                </TouchableOpacity>


                <TouchableOpacity style={styles.navItem}
                    onPress={() => navigation.navigate('Checklist', user?.id ? { patientId: user.id } : {})}
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