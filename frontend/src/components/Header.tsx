import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { authService } from "../services/authService";
import { useUser } from "../context/UserContext";
import { API_CONFIG } from "../config/api";

interface HeaderProps {
    title?: string;
    showBackArrow?: boolean;
    showUserIcon?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title = '', showBackArrow = true, showUserIcon = false }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [avatarError, setAvatarError] = useState(false);
    const navigation = useNavigation();
    const { user, loading } = useUser();

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
            <View style={styles.header}>
                <ActivityIndicator size="small" color="#fff" />
            </View>
        );
    }

    const avatarUrl = user?.avatar_path
        ? `${API_CONFIG.BASE_URL}/uploads/avatars/${user.avatar_path.split('/').pop()}`
        : null;

    return (
        <View style={styles.header}>
            <View style={styles.sideContainer}>
                {showBackArrow ? (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrow}>
                        <Icon name="arrow-left" size={20} color="#fff" style={{ marginTop: 30 }} />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 25 }} />
                )}
            </View>
            <View style={styles.centerContainer}>
                <Text style={styles.headerTitle}>{title}</Text>
            </View>
            <View style={styles.sideContainer}>
                {showUserIcon ? (
                    <TouchableOpacity onPress={() => setShowMenu(!showMenu)} style={styles.avatarContainer}>
                        {avatarUrl && !avatarError ? (
                            <Image
                                source={{ uri: avatarUrl }}
                                style={styles.avatarImage}
                                onError={() => setAvatarError(true)}
                            />
                        ) : (
                            <View style={styles.iconPlaceholder}>
                                <Icon name="user-circle" size={36} color="#fff" />
                            </View>
                        )}
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 25 }} />
                )}
            </View>
            {showMenu && (
                <View style={styles.menu}>
                    <Text style={styles.menuTitle}>
                        {user?.name ? user.name.split(' ')[0] : "NOME DO USUÁRIO"}
                    </Text>
                    {user?.role && (
                        <Text
                            style={
                                [
                                    styles.roleText,
                                    user.role === 'Patient' ? { color: '#1976D2' } :
                                        user.role === 'Nutricionist' ? { color: '#43A047' } :
                                            user.role === 'Physical_educator' ? { color: '#FF9800' } :
                                                { color: '#888' }
                                ]
                            }
                        >
                            {user.role === 'Patient' && 'Paciente'}
                            {user.role === 'Nutricionist' && 'Nutricionista'}
                            {user.role === 'Physical_educator' && 'Educador Físico'}
                        </Text>
                    )}
                    <TouchableOpacity style={styles.menuItem} onPress={() => {
                        setShowMenu(false);
                        navigation.navigate('ContaUsuario', {
                            userRole: user?.role,
                            userId: user?.id
                        });
                    }}>
                        <Icon name="cog" size={16} color="#1976D2" />
                        <Text style={styles.menuText}>Minha Conta</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                        <Icon name="sign-out" size={16} color="#1976D2" />
                        <Text style={styles.menuText}>Sair</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: "#1976D2",
        height: 90,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
    },
    sideContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
    },
    headerTitle: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "bold",
        paddingTop: 35,
        textAlign: 'center',
    },
    backArrow: {
        width: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarContainer: {
        marginTop: 30,
        width: 36,
        height: 36,
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1976D2',
    },
    avatarImage: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    iconPlaceholder: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
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
});

export default Header;
