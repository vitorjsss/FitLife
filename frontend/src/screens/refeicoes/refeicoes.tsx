import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
} from 'react-native';
import Icon from "react-native-vector-icons/FontAwesome";
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

interface RefeicoesProps {
    navigation?: any;
}

const Refeicoes: React.FC<RefeicoesProps> = ({ navigation }) => {
    const [showMenu, setShowMenu] = useState(false);

    const handleCriarRefeicao = () => {
        const dateString = new Date().toISOString().split('T')[0];
        navigation?.navigate('GerenciarRefeicoes', {
            dailyMealRegistryId: 'mock_id_123',
            date: dateString
        });
    };

    const handleGoBack = () => {
        navigation?.goBack();
    };

    return (
        <View style={styles.container}>
            {/* Header igual ao da Home */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleGoBack}>
                    <Icon name="arrow-left" size={24} color="#fff" style={{ marginTop: 25 }} />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>REFEIÇÕES</Text>

                <TouchableOpacity onPress={() => setShowMenu(!showMenu)}>
                    <Icon name="user-circle" size={32} color="#fff" style={{ marginTop: 25 }} />
                </TouchableOpacity>
            </View>

            {/* Dropdown Menu */}
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

            {/* Conteúdo */}
            <View style={styles.content}>
                {/* Ilustração Central */}
                <View style={styles.illustrationContainer}>
                    <View style={styles.iconCircle}>
                        <Icon name="cutlery" size={60} color="#40C4FF" />
                    </View>
                    <Text style={styles.illustrationText}>
                        Organize suas refeições diárias
                    </Text>
                </View>

                {/* Botão Principal */}
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={handleCriarRefeicao}
                    activeOpacity={0.8}
                >
                    <Icon name="plus" size={20} color="#FFFFFF" />
                    <Text style={styles.createButtonText}>Criar Nova Refeição</Text>
                </TouchableOpacity>

                {/* Informação adicional */}
                <View style={styles.infoContainer}>
                    <Text style={styles.infoText}>
                        Comece criando sua primeira refeição para acompanhar sua alimentação diária
                    </Text>
                </View>
            </View>
        </View>
    );
};

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
        top: 90,
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
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
        paddingBottom: 5,
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
        justifyContent: 'center',
        alignItems: 'center',
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
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
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
        shadowColor: '#40C4FF',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        marginBottom: 30,
        minWidth: width * 0.7,
        justifyContent: 'center',
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
        lineHeight: 20,
        maxWidth: width * 0.8,
    },
});

export default Refeicoes;