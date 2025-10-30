import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { authService } from '../../services/authService';
import { apiClient } from '../../services/authService';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { patientService } from '../../services/PatientService';
import { nutricionistService } from '../../services/NutricionistService';
import { physicalEducatorService } from '../../services/PhysicalEducatorService';

const ContaUsuario: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
    const { userRole, userId } = route.params || {};
    const [user, setUser] = useState<any>(null);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    // New fields
    const [birthdate, setBirthdate] = useState('');
    const [contact, setContact] = useState('');
    const [sex, setSex] = useState('');
    const [avatarPath, setAvatarPath] = useState('');
    // Modal state for editing email
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [emailModalLoading, setEmailModalLoading] = useState(false);

    useEffect(() => {
        // Buscar dados pessoais do usuário conforme role e email pelo auth_id
        const fetchUser = async () => {
            try {
                let data = null;
                if (userRole === "Patient") {
                    data = await patientService.getById(userId);
                } else if (userRole === "Nutricionist") {
                    data = await nutricionistService.getById(userId);
                } else if (userRole === "Physical_educator") {
                    data = await physicalEducatorService.getById(userId);
                }
                if (!data) throw new Error('Dados não encontrados');
                setUser(data);
                setBirthdate(data?.birthdate ? new Date(data.birthdate).toLocaleDateString() : '');
                setContact(data?.contact || '');
                setSex(data?.sex || '');
                setAvatarPath(data?.avatar_path || '');
            } catch (err) {
                Alert.alert('Erro', 'Não foi possível carregar os dados do usuário');
            }
        };
        if (userRole && userId) {
            fetchUser();
        }
    }, [userRole, userId]);

    const fetchEmail = async (authId: string) => {
        try {
            const authData = await authService.getAuthById(authId);
            setEmail(authData?.email || '');
        } catch (err) {
            Alert.alert('Erro', 'Não foi possível carregar o email do usuário');
        }
    };

    useEffect(() => {
        // Fetch email when user data is loaded
        if (user && user.auth_id) {
            fetchEmail(user.auth_id);
        }
    }, [user]);

    // Open modal to edit email
    const handleOpenEmailModal = () => {
        setNewEmail(email);
        setShowEmailModal(true);
    };

    // Save new email from modal
    const handleSaveEmailModal = async () => {
        setEmailModalLoading(true);
        try {
            if (!user?.auth_id) throw new Error('auth_id não encontrado');
            await authService.updateEmail(user.auth_id, newEmail);
            setEmail(newEmail);
            setShowEmailModal(false);
            Alert.alert('Sucesso', 'Email atualizado com sucesso!');
        } catch (err) {
            Alert.alert('Erro', 'Não foi possível atualizar o email');
        } finally {
            setEmailModalLoading(false);
        }
    };

    const handleGoBack = () => navigation?.goBack();

    if (!user) return <View style={styles.container}><Text>Carregando...</Text></View>;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleGoBack}>
                    <Icon name="arrow-left" size={24} color="#fff" style={{ marginTop: 25 }} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>MINHA CONTA</Text>
                <View style={{ width: 25 }} />
            </View>
            <View style={styles.content}>
                {/* Avatar (if available) */}
                {avatarPath ? (
                    <View style={{ alignItems: 'center', marginTop: 16 }}>
                        <Icon name="account-circle" size={64} color="#1976D2" />
                        {/* You can use Image if avatarPath is a valid URL */}
                    </View>
                ) : null}
                <Text style={styles.label}>Nome</Text>
                <Text style={styles.value}>{user.name}</Text>
                <Text style={styles.label}>Email</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.value}>{email}</Text>
                    <TouchableOpacity onPress={handleOpenEmailModal} style={{ marginLeft: 8 }}>
                        <Icon name="pencil" size={20} color="#1976D2" style={{ paddingBottom: 5 }} />
                    </TouchableOpacity>
                </View>
                <Text style={styles.label}>Data de Nascimento</Text>
                <Text style={styles.value}>{birthdate}</Text>
                <Text style={styles.label}>Contato</Text>
                <Text style={styles.value}>{contact}</Text>
                <Text style={styles.label}>Sexo</Text>
                <Text style={styles.value}>{sex === 'M' ? 'Masculino' : sex === 'F' ? 'Feminino' : sex}</Text>
            </View>
            {/* Modal for editing email */}
            {showEmailModal && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.label}>Alterar Email</Text>
                        <TextInput
                            style={styles.input}
                            value={newEmail}
                            onChangeText={setNewEmail}
                            editable={!emailModalLoading}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                            <TouchableOpacity
                                style={[styles.button, emailModalLoading && styles.buttonDisabled, { flex: 1, marginRight: 10 }]}
                                onPress={handleSaveEmailModal}
                                disabled={emailModalLoading}
                            >
                                <Text style={styles.buttonText}>{emailModalLoading ? 'Salvando...' : 'Salvar'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: '#B0BEC5', flex: 1, marginLeft: 10 }]}
                                onPress={() => setShowEmailModal(false)}
                                disabled={emailModalLoading}
                            >
                                <Text style={styles.buttonText}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        width: '100%',
        height: '100%',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        width: '85%',
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    container: {
        flex: 1,
        backgroundColor: '#E0E0E0',
        marginTop: 0,
    },
    content: {
        paddingHorizontal: 30,
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
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 4,
        color: '#333',
    },
    value: {
        fontSize: 16,
        color: '#555',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
        backgroundColor: '#F8F9FA',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#1976D2',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#B0BEC5',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ContaUsuario;
