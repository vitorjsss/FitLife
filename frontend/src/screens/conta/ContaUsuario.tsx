import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Image,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '../../context/UserContext';
import { authService } from '../../services/authService';
import Header from '../../components/Header';
import { API_CONFIG } from '../../config/api';
import { patientService } from '../../services/PatientService';

const ContaUsuario: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user, loading, refreshUser } = useUser();
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [newEmail, setNewEmail] = useState(user?.email || '');
    const [emailModalLoading, setEmailModalLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<any>(null);

    const handlePickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                alert('Permissão para acessar fotos foi negada.');
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });
            if (result.canceled) return;
            if (result.assets && result.assets.length > 0) {
                setSelectedImage({
                    uri: result.assets[0].uri,
                    type: 'image/jpeg',
                    name: 'avatar.jpg',
                });
            }
        } catch (err) {
            alert('Erro ao abrir seletor de imagem. Verifique permissões.');
        }
    };

    // Função para upload do avatar
    const handleUploadAvatar = async () => {
        if (!selectedImage || !user?.id) return;
        setAvatarLoading(true);
        try {
            await patientService.uploadAvatar(user.id, {
                uri: selectedImage.uri,
                type: selectedImage.type || 'image/jpeg',
                name: selectedImage.name || 'avatar.jpg',
            });
            setShowAvatarModal(false);
            setSelectedImage(null);
            if (refreshUser) await refreshUser();
            alert('Foto de perfil atualizada com sucesso!');
        } catch (err) {
            alert('Erro ao enviar foto de perfil. Tente novamente.');
        } finally {
            setAvatarLoading(false);
        }
    };

    const handleOpenEmailModal = () => {
        setNewEmail(user?.email || '');
        setShowEmailModal(true);
    };

    const handleSaveEmailModal = async () => {
        // Validação de formato de e-mail
        const emailRegex = /^[\w-.]+@[\w-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(newEmail)) {
            setEmailError('Formato de e-mail inválido.');
            return;
        }
        setEmailError(null);
        setEmailModalLoading(true);
        try {
            if (!user?.auth_id) throw new Error('auth_id não encontrado');
            await authService.updateEmail(user.auth_id, newEmail);
            if (refreshUser) await refreshUser();
            setShowEmailModal(false);
            setShowSuccessModal(true);
        } catch (err: any) {
            if (err?.response?.status === 400 && err?.response?.data?.message === "Email já existe") {
                setEmailError("Este e-mail já está em uso.");
            } else {
                setEmailError('Erro ao atualizar e-mail. Tente novamente.');
            }
        } finally {
            setEmailModalLoading(false);
        }
    };

    const handleEditProfile = () => {
        navigation.navigate('EditarConta');
    };

    const handleLogout = async () => {
        try {
            await authService.logout?.();
        } catch (e) {
            // ignore
        } finally {
            navigation.replace('Login');
        }
    };

    if (loading || !user) {
        return (
            <View style={styles.container}>
                <View style={styles.centerLoading}>
                    <Text style={styles.loadingText}>Carregando...</Text>
                </View>
            </View>
        );
    }
    return (
        <View style={styles.container}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <Header title="MINHA CONTA" />
                <ScrollView contentContainerStyle={styles.scroll}>
                    <View style={styles.profileCard}>
                        <View style={styles.avatarWrap}>
                            {user.avatar_path ? (
                                <View>
                                    <Image
                                        source={{ uri: `${API_CONFIG.BASE_URL}/${user.avatar_path}` }}
                                        style={styles.avatar}
                                    />
                                    <TouchableOpacity style={styles.avatarEditBtn} onPress={() => { setShowAvatarModal(true); setSelectedImage(null); }}>
                                        <Icon name="camera" size={24} color="#1976D2" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity style={styles.avatarFallback} onPress={() => { setShowAvatarModal(true); setSelectedImage(null); }}>
                                    <Icon name="account" size={42} color="#1976D2" />
                                    <View style={styles.avatarEditBtnFallback}>
                                        <Icon name="camera" size={20} color="#1976D2" />
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.nameText}>{user.name}</Text>
                            <View style={styles.roleRow}>
                                <View style={styles.roleBadge}>
                                    <Text style={styles.roleText}>{user.role}</Text>
                                </View>
                                <Text style={styles.smallText}>{user.birthdate ? `• ${new Date(user.birthdate).toLocaleDateString('pt-BR')}` : ''}</Text>
                            </View>
                            <View style={styles.actionRow}>
                                <TouchableOpacity style={styles.actionBtn} onPress={handleEditProfile}>
                                    <Icon name="pencil" size={16} color="#1976D2" />
                                    <Text style={styles.actionTxt}>Editar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.actionBtn, styles.logoutBtn]} onPress={handleLogout}>
                                    <Icon name="logout" size={16} color="#D32F2F" />
                                    <Text style={[styles.actionTxt, { color: '#D32F2F' }]}>Sair</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <View style={styles.infoSection}>
                        <Text style={styles.sectionTitle}>Contato</Text>
                        <View style={styles.row}>
                            <Icon name="email-outline" size={18} color="#1976D2" style={styles.rowIcon} />
                            <View style={styles.rowContent}>
                                <Text style={styles.rowLabel}>Email</Text>
                                <View style={styles.rowValueWrap}>
                                    <Text style={styles.rowValue}>{user.email}</Text>
                                    <TouchableOpacity onPress={handleOpenEmailModal} style={styles.editIcon}>
                                        <Icon name="pencil" size={16} color="#1976D2" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <View style={styles.row}>
                            <Icon name="phone" size={18} color="#1976D2" style={styles.rowIcon} />
                            <View style={styles.rowContent}>
                                <Text style={styles.rowLabel}>Telefone</Text>
                                <Text style={styles.rowValue}>{user.contact || '—'}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.infoSection}>
                        <Text style={styles.sectionTitle}>Dados Pessoais</Text>

                        <View style={styles.row}>
                            <Icon name="gender-male-female" size={18} color="#1976D2" style={styles.rowIcon} />
                            <View style={styles.rowContent}>
                                <Text style={styles.rowLabel}>Sexo</Text>
                                <Text style={styles.rowValue}>
                                    {user.sex === 'M' ? 'Masculino' : user.sex === 'F' ? 'Feminino' : user.sex || '—'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.row}>
                            <Icon name="calendar" size={18} color="#1976D2" style={styles.rowIcon} />
                            <View style={styles.rowContent}>
                                <Text style={styles.rowLabel}>Data de Nascimento</Text>
                                <Text style={styles.rowValue}>{user.birthdate ? new Date(user.birthdate).toLocaleDateString('pt-BR') : '—'}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={{ height: 24 }} />
                </ScrollView>

                {/* Modal for editing email */}
                {showEmailModal && (
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Alterar Email</Text>
                            <TextInput
                                style={styles.input}
                                value={newEmail}
                                onChangeText={setNewEmail}
                                editable={!emailModalLoading}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholder="novo@email.com"
                            />
                            {emailError && (
                                <Text style={{ color: '#D32F2F', marginBottom: 8 }}>{emailError}</Text>
                            )}
                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={[styles.modalButton,
                                    (emailModalLoading || !newEmail || emailError) && styles.buttonDisabled,
                                    (!newEmail || emailError) && { backgroundColor: '#B0BEC5' }
                                    ]}
                                    onPress={handleSaveEmailModal}
                                    disabled={emailModalLoading || !newEmail || !!emailError}
                                >
                                    <Text style={styles.modalButtonText}>{emailModalLoading ? 'Salvando...' : 'Salvar'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, { backgroundColor: '#D32F2F' }]}
                                    onPress={() => {
                                        setShowEmailModal(false);
                                        setNewEmail('');
                                        setEmailError('');
                                    }}
                                    disabled={emailModalLoading}
                                >
                                    <Text style={styles.modalButtonText}>Cancelar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                {/* Modal de sucesso ao salvar email */}
                {showSuccessModal && (
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Email salvo com sucesso!</Text>
                            <TouchableOpacity
                                style={[styles.modalButton, { marginTop: 15 }]}
                                onPress={() => setShowSuccessModal(false)}
                            >
                                <Text style={styles.modalButtonText}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </KeyboardAvoidingView>

            {/* Modal para upload de foto de perfil */}
            {showAvatarModal && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Foto de Perfil</Text>
                        {selectedImage ? (
                            <Image source={{ uri: selectedImage.uri }} style={[styles.avatarModal, { marginBottom: 12 }]} />
                        ) : (
                            <TouchableOpacity style={[styles.avatarModalFallback, { marginBottom: 12 }]} onPress={handlePickImage}>
                                <Icon name="camera" size={50} color="#1976D2" />
                                <Text style={{ textAlign: 'center', fontSize: 16, color: '#1976D2', marginTop: 5 }}>Selecionar Imagem</Text>
                            </TouchableOpacity>
                        )}
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, avatarLoading && styles.buttonDisabled]}
                                onPress={handleUploadAvatar}
                                disabled={avatarLoading || !selectedImage}
                            >
                                <Text style={styles.modalButtonText}>{avatarLoading ? 'Enviando...' : 'Salvar'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: '#D32F2F' }]}
                                onPress={() => { setShowAvatarModal(false); setSelectedImage(null); }}
                                disabled={avatarLoading}
                            >
                                <Text style={styles.modalButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F7FB', marginTop: 0 },
    scroll: { paddingBottom: 30 },
    profileCard: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 20,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    avatarWrap: { marginRight: 12, position: 'relative' },
    avatarEditBtn: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
    },
    avatarEditBtnFallback: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 2,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
    },
    avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#EEE' },
    avatarModal: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#EEE' },
    avatarFallback: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: '#EEF7FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarModalFallback: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#EEF7FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileInfo: { flex: 1 },
    nameText: { fontSize: 18, fontWeight: '700', color: '#222' },
    roleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    roleBadge: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 8,
    },
    roleText: { color: '#1976D2', fontWeight: '700', fontSize: 12 },
    smallText: { color: '#666', fontSize: 13 },

    actionRow: { flexDirection: 'row', marginTop: 12 },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#F1F8FF',
        marginRight: 8,
    },
    logoutBtn: { backgroundColor: '#FFF5F5' },
    actionTxt: { marginLeft: 8, color: '#1976D2', fontWeight: '700' },

    infoSection: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 12,
        padding: 12,
        borderRadius: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
    },
    sectionTitle: { color: '#1976D2', fontWeight: '700', marginBottom: 8 },

    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    rowIcon: { width: 36, textAlign: 'center' },
    rowContent: { flex: 1 },
    rowLabel: { color: '#666', fontSize: 13 },
    rowValueWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rowValue: { color: '#333', fontSize: 15, marginTop: 4 },
    editIcon: { marginLeft: 12 },

    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        elevation: 10,
        alignItems: 'center',
        width: '80%',
    },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10, color: '#1976D2' },
    input: {
        borderWidth: 1,
        borderColor: '#E6EEF7',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        backgroundColor: '#FBFDFF',
        marginBottom: 12,
        width: '100%',
    },
    modalActions: { flexDirection: 'row', alignItems: 'center' },
    modalButton: {
        backgroundColor: '#1976D2',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        margin: 10,
        minWidth: 100,
    },
    modalButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    buttonDisabled: { backgroundColor: '#B0BEC5' },

    centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: '#666' },
});

export default ContaUsuario;
