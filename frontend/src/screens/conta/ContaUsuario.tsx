import React, { useState, useEffect } from 'react';
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
import { authService, requestReauth, verifyReauth, updateEmailWithReauth } from '../../services/authService';
import { changePassword } from '../../services/passwordResetService';
import Header from '../../components/Header';
import { API_CONFIG } from '../../config/api';
import { patientService } from '../../services/PatientService';
import { validatePassword } from '../../utils/validationRules';
import { nutricionistService } from '../../services/NutricionistService';
import { physicalEducatorService } from '../../services/PhysicalEducatorService';
import PatientProfessionalAssociationService, { PatientProfessionalAssociation } from '../../services/PatientProfessionalAssociationService';

// Componente auxiliar para exibir requisitos de senha
const PasswordRequirement: React.FC<{ met: boolean; text: string }> = ({ met, text }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <Icon name={met ? 'check-circle' : 'circle-outline'} size={16} color={met ? '#4CAF50' : '#CCC'} />
        <Text style={{ marginLeft: 8, fontSize: 13, color: met ? '#4CAF50' : '#666' }}>{text}</Text>
    </View>
);

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
    const [professionals, setProfessionals] = useState<PatientProfessionalAssociation | null>(null);

    // estados para reauth flow (email)
    const [reauthAuthId, setReauthAuthId] = useState<string | null>(null);
    const [reauthStep, setReauthStep] = useState<"idle" | "sent" | "verify">("idle");
    const [currentPassword, setCurrentPassword] = useState(''); // para solicitar senha atual
    const [reauthCode, setReauthCode] = useState('');
    const [reauthLoading, setReauthLoading] = useState(false);

    // estados para alteração de senha
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [hideOldPassword, setHideOldPassword] = useState(true);
    const [hideNewPassword, setHideNewPassword] = useState(true);
    const [hideConfirmPassword, setHideConfirmPassword] = useState(true);
    const [successMessage, setSuccessMessage] = useState<string>('');

    // Buscar profissionais associados ao paciente
    useEffect(() => {
        const fetchProfessionals = async () => {
            if (user?.role === 'Patient' && user?.id) {
                try {
                    const response: any = await PatientProfessionalAssociationService.getByPatientId(user.id);
                    console.log('Profissionais carregados:', response);
                    setProfessionals(response);
                } catch (error) {
                    console.error('Erro ao buscar profissionais:', error);
                }
            }
        };
        fetchProfessionals();
    }, [user]);

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
            const fileData = {
                uri: selectedImage.uri,
                type: selectedImage.type || 'image/jpeg',
                name: selectedImage.name || 'avatar.jpg',
            };

            // Usa o serviço correto baseado no tipo de usuário
            if (user.role === 'Patient') {
                await patientService.uploadAvatar(user.id, fileData);
            } else if (user.role === 'Nutricionist') {
                await nutricionistService.uploadAvatar(user.id, fileData);
            } else if (user.role === 'Physical_educator') {
                await physicalEducatorService.uploadAvatar(user.id, fileData);
            } else {
                throw new Error('Tipo de usuário não suportado');
            }

            setShowAvatarModal(false);
            setSelectedImage(null);
            if (refreshUser) await refreshUser();
            alert('Foto de perfil atualizada com sucesso!');
        } catch (err) {
            console.error('Erro ao enviar avatar:', err);
            alert('Erro ao enviar foto de perfil. Tente novamente.');
        } finally {
            setAvatarLoading(false);
        }
    };

    // ajuste handleOpenEmailModal para iniciar reauth step 1 (ask for current password)
    const handleOpenEmailModal = () => {
        setNewEmail(user?.email || '');
        setEmailError(null);
        setCurrentPassword('');
        setReauthStep("idle");
        setShowEmailModal(true);
    };

    // função para verificar o código e obter reauthToken
    const handleVerifyReauthAndUpdateEmail = async () => {
        if (!reauthAuthId) return;
        setReauthLoading(true);
        try {
            const v = await verifyReauth(reauthAuthId, reauthCode);
            const reauthToken = v.reauthToken;
            // now call updateEmailWithReauth
            const accessToken = await authService.getAccessToken?.();
            await updateEmailWithReauth(reauthAuthId, newEmail, reauthToken, accessToken || undefined);
            if (refreshUser) await refreshUser();
            setShowEmailModal(false);

            // Mostra mensagem de sucesso
            setSuccessMessage('Email alterado com sucesso!');
            setShowSuccessModal(true);
            // log already handled server-side
        } catch (err: any) {
            const msg = err?.response?.data?.message || err.message || 'Falha na verificação';
            setEmailError(msg);
        } finally {
            setReauthLoading(false);
        }
    };

    const handleRequestReauth = async () => {
        // valida formato do novo email antes de iniciar reauth
        const emailRegex = /^[\w-.]+@[\w-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(newEmail)) {
            setEmailError('Formato de e-mail inválido.');
            return;
        }

        if (!user?.email) {
            setEmailError('Usuário inválido.');
            return;
        }
        setEmailError(null);
        setReauthLoading(true);
        try {
            // solicita reauth: backend valida senha atual e gera código 2FA
            const res = await requestReauth(user.email, currentPassword);
            setReauthAuthId(String(res.authId));
            setReauthStep('sent');
        } catch (err: any) {
            console.error('requestReauth error:', err);
            const msg = err?.response?.data?.message || err.message || 'Falha ao solicitar reautenticação';
            setEmailError(msg);
        } finally {
            setReauthLoading(false);
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

    // Funções para alteração de senha
    const handleOpenPasswordModal = () => {
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setPasswordError(null);
        setShowPasswordModal(true);
    };

    const handleChangePassword = async () => {
        // Validações
        if (!oldPassword) {
            setPasswordError('Digite sua senha atual');
            return;
        }

        const validation = validatePassword(newPassword);
        if (!validation.valid) {
            setPasswordError(validation.error || 'A nova senha não atende aos requisitos de segurança');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setPasswordError('As senhas não coincidem');
            return;
        }

        if (oldPassword === newPassword) {
            setPasswordError('A nova senha deve ser diferente da senha atual');
            return;
        }

        setPasswordLoading(true);
        setPasswordError(null);

        try {
            const accessToken = await authService.getAccessToken?.();
            if (!accessToken) {
                throw new Error('Token de acesso não encontrado');
            }

            await changePassword(oldPassword, newPassword, accessToken);

            setShowPasswordModal(false);

            // Limpa os campos
            setOldPassword('');
            setNewPassword('');
            setConfirmNewPassword('');

            // Mostra mensagem de sucesso
            setSuccessMessage('Senha alterada com sucesso!');
            setShowSuccessModal(true);
        } catch (err: any) {
            const message = err?.response?.data?.message || err.message || 'Erro ao alterar senha';
            setPasswordError(message);
        } finally {
            setPasswordLoading(false);
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

                    {/* Seção de Segurança */}
                    <View style={styles.infoSection}>
                        <Text style={styles.sectionTitle}>Segurança</Text>

                        <TouchableOpacity style={styles.passwordButton} onPress={handleOpenPasswordModal}>
                            <View style={styles.row}>
                                <Icon name="lock-outline" size={18} color="#1976D2" style={styles.rowIcon} />
                                <View style={styles.rowContent}>
                                    <Text style={styles.rowLabel}>Senha</Text>
                                    <Text style={styles.rowValue}>••••••••</Text>
                                </View>
                                <Icon name="chevron-right" size={20} color="#1976D2" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Seção de Profissionais - Apenas para Pacientes */}
                    {user.role === 'Patient' && (
                        <View style={styles.infoSection}>
                            <Text style={styles.sectionTitle}>Meus Profissionais</Text>

                            {professionals && professionals.nutricionist_id && (
                                <View style={styles.professionalCard}>
                                    <View style={styles.professionalHeader}>
                                        {professionals.nutricionist_avatar ? (
                                            <Image
                                                source={{ uri: `${API_CONFIG.BASE_URL}/${professionals.nutricionist_avatar}` }}
                                                style={styles.professionalAvatar}
                                            />
                                        ) : (
                                            <View style={styles.professionalAvatarFallback}>
                                                <Icon name="account" size={24} color="#1976D2" />
                                            </View>
                                        )}
                                        <View style={styles.professionalInfo}>
                                            <Text style={styles.professionalName}>{professionals.nutricionist_name || '—'}</Text>
                                            <View style={styles.professionalBadge}>
                                                <Icon name="food-apple" size={14} color="#4CAF50" />
                                                <Text style={styles.professionalRole}>Nutricionista</Text>
                                            </View>
                                            {professionals.nutricionist_crn && (
                                                <Text style={styles.professionalCrn}>CRN: {professionals.nutricionist_crn}</Text>
                                            )}
                                        </View>
                                    </View>
                                    {professionals.nutricionist_contact && (
                                        <View style={styles.professionalContact}>
                                            <Icon name="phone" size={16} color="#666" />
                                            <Text style={styles.professionalContactText}>{professionals.nutricionist_contact}</Text>
                                        </View>
                                    )}
                                </View>
                            )}

                            {professionals && professionals.physical_educator_id && (
                                <View style={styles.professionalCard}>
                                    <View style={styles.professionalHeader}>
                                        {professionals.physical_educator_avatar ? (
                                            <Image
                                                source={{ uri: `${API_CONFIG.BASE_URL}/${professionals.physical_educator_avatar}` }}
                                                style={styles.professionalAvatar}
                                            />
                                        ) : (
                                            <View style={styles.professionalAvatarFallback}>
                                                <Icon name="account" size={24} color="#1976D2" />
                                            </View>
                                        )}
                                        <View style={styles.professionalInfo}>
                                            <Text style={styles.professionalName}>{professionals.physical_educator_name || '—'}</Text>
                                            <View style={[styles.professionalBadge, { backgroundColor: '#FFF3E0' }]}>
                                                <Icon name="run" size={14} color="#FF9800" />
                                                <Text style={[styles.professionalRole, { color: '#FF9800' }]}>Educador Físico</Text>
                                            </View>
                                            {professionals.physical_educator_cref && (
                                                <Text style={styles.professionalCrn}>CREF: {professionals.physical_educator_cref}</Text>
                                            )}
                                        </View>
                                    </View>
                                    {professionals.physical_educator_contact && (
                                        <View style={styles.professionalContact}>
                                            <Icon name="phone" size={16} color="#666" />
                                            <Text style={styles.professionalContactText}>{professionals.physical_educator_contact}</Text>
                                        </View>
                                    )}
                                </View>
                            )}

                            {(!professionals || (!professionals.nutricionist_id && !professionals.physical_educator_id)) && (
                                <View style={styles.emptyState}>
                                    <Icon name="account-multiple-outline" size={48} color="#CCC" />
                                    <Text style={styles.emptyText}>Nenhum profissional vinculado</Text>
                                </View>
                            )}
                        </View>
                    )}

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
                            {reauthStep === "idle" && (
                                <>
                                    <TextInput
                                        style={styles.input}
                                        value={currentPassword}
                                        onChangeText={setCurrentPassword}
                                        editable={!reauthLoading}
                                        secureTextEntry
                                        placeholder="Senha atual (necessária para confirmar)"
                                        placeholderTextColor="#999"
                                    />
                                    <TouchableOpacity
                                        style={[
                                            styles.modalButton,
                                            (reauthLoading || !currentPassword) && styles.buttonDisabled,
                                            (!currentPassword) && { backgroundColor: '#B0BEC5' }
                                        ]}
                                        onPress={handleRequestReauth}
                                        disabled={reauthLoading || !currentPassword}
                                    >
                                        <Text style={styles.modalButtonText}>{reauthLoading ? 'Enviando código...' : 'Solicitar código'}</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                            {reauthStep === "sent" && (
                                <View style={{ width: '100%', alignItems: 'center', marginTop: 12 }}>
                                    <Text style={{ color: '#666', fontSize: 14, textAlign: 'center', marginBottom: 8 }}>
                                        Um código de verificação foi enviado para o seu e-mail. Verifique sua caixa de entrada e spam.
                                    </Text>
                                    <TextInput
                                        style={styles.input}
                                        value={reauthCode}
                                        onChangeText={setReauthCode}
                                        editable={!reauthLoading}
                                        placeholder="Código de verificação"
                                        keyboardType="numeric"
                                        maxLength={6}
                                    />
                                    <TouchableOpacity
                                        style={[styles.modalButton, reauthLoading && styles.buttonDisabled]}
                                        onPress={handleVerifyReauthAndUpdateEmail}
                                        disabled={reauthLoading || !reauthCode}
                                    >
                                        <Text style={styles.modalButtonText}>{reauthLoading ? 'Verificando...' : 'Verificar e Salvar'}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            <View style={styles.modalActions}>
                                {reauthStep === "idle" && (
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
                                )}
                                {reauthStep === "sent" && (
                                    <TouchableOpacity
                                        style={[styles.modalButton, { backgroundColor: '#D32F2F' }]}
                                        onPress={() => {
                                            setReauthStep("idle");
                                            setReauthAuthId(null);
                                            setReauthCode('');
                                            setEmailError('');
                                        }}
                                        disabled={reauthLoading}
                                    >
                                        <Text style={styles.modalButtonText}>Cancelar</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>
                )}

                {/* Modal de sucesso */}
                {showSuccessModal && (
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Icon name="check-circle" size={64} color="#4CAF50" style={{ marginBottom: 16 }} />
                            <Text style={styles.modalTitle}>
                                {successMessage}
                            </Text>
                            <TouchableOpacity
                                style={[styles.modalButton, { marginTop: 15 }]}
                                onPress={() => {
                                    setShowSuccessModal(false);
                                    setSuccessMessage('');
                                }}
                            >
                                <Text style={styles.modalButtonText}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Modal para alteração de senha */}
                {showPasswordModal && (
                    <View style={styles.modalOverlay}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }}
                        >
                            <ScrollView
                                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 }}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                                style={{ width: '100%' }}
                            >
                                <View style={styles.modalContent}>
                                    <Text style={styles.modalTitle}>Alterar Senha</Text>

                                    {/* Senha Atual */}
                                    <View style={styles.passwordInputContainer}>
                                        <TextInput
                                            style={styles.passwordInput}
                                            value={oldPassword}
                                            onChangeText={setOldPassword}
                                            editable={!passwordLoading}
                                            secureTextEntry={hideOldPassword}
                                            placeholder="Senha atual"
                                            placeholderTextColor="#999"
                                        />
                                        <TouchableOpacity onPress={() => setHideOldPassword(!hideOldPassword)}>
                                            <Icon name={hideOldPassword ? 'eye-off' : 'eye'} size={20} color="#666" />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Nova Senha */}
                                    <View style={styles.passwordInputContainer}>
                                        <TextInput
                                            style={styles.passwordInput}
                                            value={newPassword}
                                            onChangeText={setNewPassword}
                                            editable={!passwordLoading}
                                            secureTextEntry={hideNewPassword}
                                            placeholder="Nova senha"
                                            placeholderTextColor="#999"
                                        />
                                        <TouchableOpacity onPress={() => setHideNewPassword(!hideNewPassword)}>
                                            <Icon name={hideNewPassword ? 'eye-off' : 'eye'} size={20} color="#666" />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Requisitos da senha */}
                                    {newPassword.length > 0 && (
                                        <View style={styles.requirementsBox}>
                                            <Text style={styles.requirementsTitle}>Requisitos da senha:</Text>
                                            <PasswordRequirement
                                                met={newPassword.length >= 8}
                                                text="Mínimo de 8 caracteres"
                                            />
                                            <PasswordRequirement
                                                met={/[A-Z]/.test(newPassword)}
                                                text="Pelo menos 1 letra maiúscula"
                                            />
                                            <PasswordRequirement
                                                met={/[a-z]/.test(newPassword)}
                                                text="Pelo menos 1 letra minúscula"
                                            />
                                            <PasswordRequirement
                                                met={/\d/.test(newPassword)}
                                                text="Pelo menos 1 número"
                                            />
                                            <PasswordRequirement
                                                met={/[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]/.test(newPassword)}
                                                text="Pelo menos 1 caractere especial"
                                            />
                                        </View>
                                    )}

                                    {/* Confirmar Nova Senha */}
                                    <View style={styles.passwordInputContainer}>
                                        <TextInput
                                            style={styles.passwordInput}
                                            value={confirmNewPassword}
                                            onChangeText={setConfirmNewPassword}
                                            editable={!passwordLoading}
                                            secureTextEntry={hideConfirmPassword}
                                            placeholder="Confirmar nova senha"
                                            placeholderTextColor="#999"
                                        />
                                        <TouchableOpacity onPress={() => setHideConfirmPassword(!hideConfirmPassword)}>
                                            <Icon name={hideConfirmPassword ? 'eye-off' : 'eye'} size={20} color="#666" />
                                        </TouchableOpacity>
                                    </View>

                                    {passwordError && (
                                        <Text style={{ color: '#D32F2F', marginBottom: 8, fontSize: 13 }}>
                                            {passwordError}
                                        </Text>
                                    )}

                                    <View style={styles.modalActions}>
                                        <TouchableOpacity
                                            style={[styles.modalButton, passwordLoading && styles.buttonDisabled]}
                                            onPress={handleChangePassword}
                                            disabled={passwordLoading}
                                        >
                                            <Text style={styles.modalButtonText}>
                                                {passwordLoading ? 'Alterando...' : 'Alterar Senha'}
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.modalButton, { backgroundColor: '#D32F2F' }]}
                                            onPress={() => {
                                                setShowPasswordModal(false);
                                                setOldPassword('');
                                                setNewPassword('');
                                                setConfirmNewPassword('');
                                                setPasswordError(null);
                                            }}
                                            disabled={passwordLoading}
                                        >
                                            <Text style={styles.modalButtonText}>Cancelar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </ScrollView>
                        </KeyboardAvoidingView>
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
        width: '90%',
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

    // Estilos para seção de profissionais
    professionalCard: {
        backgroundColor: '#F9FBFD',
        padding: 12,
        borderRadius: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E3F2FD',
    },
    professionalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    professionalAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
        backgroundColor: '#EEE',
    },
    professionalAvatarFallback: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
        backgroundColor: '#EEF7FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    professionalInfo: {
        flex: 1,
    },
    professionalName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#222',
        marginBottom: 4,
    },
    professionalBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        alignSelf: 'flex-start',
        marginBottom: 4,
    },
    professionalRole: {
        color: '#4CAF50',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    professionalCrn: {
        fontSize: 12,
        color: '#666',
    },
    professionalContact: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#E3F2FD',
    },
    professionalContactText: {
        marginLeft: 8,
        color: '#555',
        fontSize: 14,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyText: {
        marginTop: 12,
        color: '#999',
        fontSize: 15,
    },
    passwordButton: {
        borderRadius: 8,
    },
    passwordInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E6EEF7',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#FBFDFF',
        marginBottom: 12,
        width: '100%',
    },
    passwordInput: {
        flex: 1,
        fontSize: 15,
        color: '#333',
    },
    requirementsBox: {
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        width: '100%',
    },
    requirementsTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
});

export default ContaUsuario;
