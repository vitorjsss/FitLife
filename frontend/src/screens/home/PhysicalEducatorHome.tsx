import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    Alert,
    Image,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../../App";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Header from '../../components/Header';
import { useUser } from '../../context/UserContext';
import PatientProfessionalAssociationService, { PatientInfo } from '../../services/PatientProfessionalAssociationService';
import ConnectPatientModal from '../../components/ConnectPatientModal';
import { API_CONFIG } from '../../config/api';

type PhysicalEducatorHomeNavigationProp = NativeStackNavigationProp<RootStackParamList, "PhysicalEducatorHome">;

export default function PhysicalEducatorHomeScreen() {
    const [loading, setLoading] = useState(true);
    const [patients, setPatients] = useState<PatientInfo[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<PatientInfo | null>(null);
    const [showConnectModal, setShowConnectModal] = useState(false);
    const navigation = useNavigation<PhysicalEducatorHomeNavigationProp>();
    const { user, loading: userLoading } = useUser();

    useEffect(() => {
        loadPatients();
    }, [user]);

    const loadPatients = async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const patientsList = await PatientProfessionalAssociationService.getPatientsByPhysicalEducatorId(user.id);
            setPatients(patientsList);

            // Auto-seleciona o primeiro paciente se houver
            if (patientsList.length > 0 && !selectedPatient) {
                setSelectedPatient(patientsList[0]);
            }
        } catch (error) {
            console.error('[PhysicalEducatorHome] Erro ao carregar pacientes:', error);
            Alert.alert('Erro', 'Não foi possível carregar a lista de pacientes');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPatient = (patient: PatientInfo) => {
        setSelectedPatient(patient);
    };

    const renderPatientCard = ({ item }: { item: PatientInfo }) => {
        const isSelected = selectedPatient?.patient_id === item.patient_id;
        const avatarUrl = item.avatar_path
            ? `${API_CONFIG.BASE_URL}/uploads/avatars/${item.avatar_path.split('/').pop()}`
            : null;

        return (
            <TouchableOpacity
                style={[styles.patientCard, isSelected && styles.patientCardSelected]}
                onPress={() => handleSelectPatient(item)}
                activeOpacity={0.7}
            >
                <View style={styles.patientCardContent}>
                    {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={styles.patientAvatar} />
                    ) : (
                        <View style={styles.patientAvatarPlaceholder}>
                            <Icon name="user" size={24} color="#40C4FF" />
                        </View>
                    )}
                    <View style={styles.patientInfo}>
                        <Text style={styles.patientName}>{item.patient_name}</Text>
                        <Text style={styles.patientContact}>{item.contact || 'Sem contato'}</Text>
                    </View>
                    {isSelected && <Icon name="check-circle" size={24} color="#4caf50" />}
                </View>
            </TouchableOpacity>
        );
    };

    if (loading || userLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#40C4FF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Header title="Educador Físico - Início" showBackArrow={false} showUserIcon={true} />

            <View style={styles.content}>
                {/* Texto de boas-vindas */}
                <View style={styles.welcomeContainer}>
                    {user?.name ? (
                        <Text style={styles.welcomeText}>
                            Bem-vindo(a),{' '}
                            <Text style={styles.welcomeName}>
                                {user.name.split(' ')[0]}!
                            </Text>
                        </Text>
                    ) : (
                        <Text style={styles.welcomeText}>Bem-vindo(a)!</Text>
                    )}
                </View>

                {/* Lista de Pacientes */}
                <View style={styles.patientsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            <Icon name="users" size={20} color="#1976D2" /> Meus Alunos
                        </Text>
                        <TouchableOpacity
                            style={styles.connectButton}
                            onPress={() => setShowConnectModal(true)}
                        >
                            <Icon name="link" size={16} color="#fff" />
                            <Text style={styles.connectButtonText}>Conectar</Text>
                        </TouchableOpacity>
                    </View>

                    {patients.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Icon name="user-plus" size={48} color="#B0BEC5" />
                            <Text style={styles.emptyStateText}>Nenhum aluno associado</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={patients}
                            keyExtractor={(item) => item.patient_id}
                            renderItem={renderPatientCard}
                            showsVerticalScrollIndicator={false}
                            style={styles.patientsList}
                        />
                    )}
                </View>

                {/* Ações para o paciente selecionado */}
                {selectedPatient && (
                    <View style={styles.actionsSection}>
                        <Text style={styles.sectionTitle}>
                            Gerenciar: {selectedPatient.patient_name}
                        </Text>

                        <View style={styles.actionsGrid}>
                            <TouchableOpacity
                                style={styles.actionCard}
                                onPress={() => navigation.navigate('Treinos', { patientId: selectedPatient.patient_id })}
                            >
                                <Icon name="heartbeat" size={32} color="#fff" />
                                <Text style={styles.actionCardText}>Treinos</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionCard}
                                onPress={() => navigation.navigate('Checklist', { patientId: selectedPatient.patient_id })}
                            >
                                <Icon name="list" size={32} color="#fff" />
                                <Text style={styles.actionCardText}>Checklist</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>

            {/* Modal de Conexão */}
            <ConnectPatientModal
                visible={showConnectModal}
                onClose={() => setShowConnectModal(false)}
                onSuccess={() => {
                    setShowConnectModal(false);
                    loadPatients(); // Recarrega a lista de pacientes
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#E0E0E0",
    },
    content: {
        flex: 1,
        padding: 20,
    },
    welcomeContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    welcomeText: {
        fontSize: 20,
        color: '#1976D2',
    },
    welcomeName: {
        fontWeight: 'bold',
        color: '#40C4FF',
        fontSize: 22,
    },
    patientsSection: {
        flex: 1,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1976D2',
        marginBottom: 12,
    },
    patientsList: {
        flex: 1,
    },
    patientCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    patientCardSelected: {
        backgroundColor: '#E8F5E9',
        borderWidth: 2,
        borderColor: '#4caf50',
    },
    patientCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    patientAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    patientAvatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F0F0F0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    patientInfo: {
        flex: 1,
    },
    patientName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    patientContact: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#B0BEC5',
        marginTop: 12,
    },
    actionsSection: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    actionsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    actionCard: {
        flex: 1,
        backgroundColor: '#40C4FF',
        marginHorizontal: 5,
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
    },
    actionCardText: {
        color: '#fff',
        marginTop: 10,
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    connectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4caf50',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    connectButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});
