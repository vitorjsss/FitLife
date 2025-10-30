import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { authService } from '../../services/authService';
import { apiClient } from '../../services/authService';
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
    const fetchUser = async () => {
      try {
        let data = null;
        if (userRole === 'Patient') {
          data = await patientService.getById(userId);
        } else if (userRole === 'Nutricionist') {
          data = await nutricionistService.getById(userId);
        } else if (userRole === 'Physical_educator') {
          data = await physicalEducatorService.getById(userId);
        }
        if (!data) throw new Error('Dados não encontrados');
        setUser(data);
        setBirthdate(data?.birthdate ? new Date(data.birthdate).toLocaleDateString('pt-BR') : '');
        setContact(data?.contact || '');
        setSex(data?.sex || '');
        setAvatarPath(data?.avatar_path || '');
      } catch (err) {
        Alert.alert('Erro', 'Não foi possível carregar os dados do usuário');
      }
    };
    if (userRole && userId) fetchUser();
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
    if (user && user.auth_id) fetchEmail(user.auth_id);
  }, [user]);

  const handleOpenEmailModal = () => {
    setNewEmail(email);
    setShowEmailModal(true);
  };

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

  const handleEditProfile = () => {
    // navigate to edit screen if exists (placeholder)
    navigation.navigate('EditarConta', { userRole, userId });
  };

  const handleLogout = async () => {
    try {
      await authService.logout?.();
    } catch (e) {
      // ignore
    } finally {
      // safe navigation to login (adjust route name if different)
      navigation.replace('Login');
    }
  };
  

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerLoading}>
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleGoBack} style={styles.headerLeft}>
              <Icon name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Minha Conta</Text>
            <View style={{ width: 36 }} />
          </View>

          <View style={styles.profileCard}>
            <View style={styles.avatarWrap}>
              {avatarPath ? (
                <Image source={{ uri: avatarPath }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Icon name="account" size={42} color="#1976D2" />
                </View>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.nameText}>{user.name}</Text>
              <View style={styles.roleRow}>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{userRole}</Text>
                </View>
                <Text style={styles.smallText}>{birthdate ? `• ${birthdate}` : ''}</Text>
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
                  <Text style={styles.rowValue}>{email}</Text>
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
                <Text style={styles.rowValue}>{contact || '—'}</Text>
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
                  {sex === 'M' ? 'Masculino' : sex === 'F' ? 'Feminino' : sex || '—'}
                </Text>
              </View>
            </View>

            <View style={styles.row}>
              <Icon name="calendar" size={18} color="#1976D2" style={styles.rowIcon} />
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Data de Nascimento</Text>
                <Text style={styles.rowValue}>{birthdate || '—'}</Text>
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
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, emailModalLoading && styles.buttonDisabled]}
                  onPress={handleSaveEmailModal}
                  disabled={emailModalLoading}
                >
                  <Text style={styles.modalButtonText}>{emailModalLoading ? 'Salvando...' : 'Salvar'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#B0BEC5' }]}
                  onPress={() => setShowEmailModal(false)}
                  disabled={emailModalLoading}
                >
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB' },
  scroll: { paddingBottom: 30 },

  header: {
    backgroundColor: '#1976D2',
    height: 88,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { width: 36, alignItems: 'flex-start' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },

  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -28,
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
  avatarWrap: { marginRight: 12 },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#EEE' },
  avatarFallback: {
    width: 84,
    height: 84,
    borderRadius: 42,
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
    width: '86%',
    elevation: 10,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: '#1976D2' },
  input: {
    borderWidth: 1,
    borderColor: '#E6EEF7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#FBFDFF',
    marginBottom: 12,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButton: {
    backgroundColor: '#1976D2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginRight: 8,
  },
  modalButtonText: { color: '#fff', fontWeight: '700' },

  buttonDisabled: { backgroundColor: '#B0BEC5' },

  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#666' },
});

export default ContaUsuario;
