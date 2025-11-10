import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import Icon from "react-native-vector-icons/FontAwesome";
import PatientConnectionCodeService from '../services/PatientConnectionCodeService';

interface ConnectPatientModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ConnectPatientModal({ visible, onClose, onSuccess }: ConnectPatientModalProps) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleConnect = async () => {
        if (!code.trim()) {
            Alert.alert('Atenção', 'Por favor, insira o código do paciente');
            return;
        }

        if (code.length !== 6) {
            Alert.alert('Atenção', 'O código deve ter 6 dígitos');
            return;
        }

        try {
            setLoading(true);
            const result = await PatientConnectionCodeService.connectWithCode(code);

            Alert.alert(
                'Sucesso!',
                `Você está conectado com ${result.patient_name}!`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setCode('');
                            onSuccess();
                            onClose();
                        }
                    }
                ]
            );
        } catch (error: any) {
            console.error('[ConnectPatientModal] Erro ao conectar:', error);

            let errorTitle = 'Erro';
            let errorMessage = 'Não foi possível conectar com o paciente. Tente novamente.';

            // Trata mensagens de erro específicas
            if (error.message) {
                if (error.message.includes('inválido') || error.message.includes('expirado')) {
                    errorTitle = 'Código Inválido';
                    errorMessage = 'Este código não existe ou já expirou. Peça ao paciente para gerar um novo código.';
                } else if (error.message.includes('já possui um nutricionista')) {
                    errorTitle = 'Paciente Já Conectado';
                    errorMessage = 'Este paciente já possui um nutricionista associado.';
                } else if (error.message.includes('já possui um educador físico')) {
                    errorTitle = 'Paciente Já Conectado';
                    errorMessage = 'Este paciente já possui um educador físico associado. Não é possível ter mais de um educador físico por paciente.';
                } else {
                    errorMessage = error.message;
                }
            }

            Alert.alert(errorTitle, errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setCode('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Conectar Paciente</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Icon name="times" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.modalBody}>
                        <View style={styles.infoBox}>
                            <Icon name="info-circle" size={20} color="#40C4FF" />
                            <Text style={styles.infoText}>
                                Solicite ao paciente que gere um código de conexão e insira-o abaixo.
                            </Text>
                        </View>

                        <Text style={styles.label}>Código do Paciente (6 dígitos)</Text>
                        <TextInput
                            style={styles.codeInput}
                            value={code}
                            onChangeText={(text) => setCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
                            placeholder="000000"
                            keyboardType="number-pad"
                            maxLength={6}
                            placeholderTextColor="#999"
                            editable={!loading}
                        />
                    </View>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleClose}
                            disabled={loading}
                        >
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.connectButton, loading && styles.connectButtonDisabled]}
                            onPress={handleConnect}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Icon name="link" size={16} color="#fff" />
                                    <Text style={styles.connectButtonText}>Conectar</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1976D2',
    },
    modalBody: {
        padding: 20,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#E3F2FD',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
    },
    infoText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: '#1976D2',
        lineHeight: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    codeInput: {
        backgroundColor: '#F8F9FA',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 32,
        color: '#333',
        textAlign: 'center',
        letterSpacing: 8,
        fontWeight: 'bold',
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#E0E0E0',
        paddingVertical: 14,
        borderRadius: 8,
        marginRight: 10,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    connectButton: {
        flex: 1,
        backgroundColor: '#40C4FF',
        paddingVertical: 14,
        borderRadius: 8,
        marginLeft: 10,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    connectButtonDisabled: {
        backgroundColor: '#B0BEC5',
    },
    connectButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});
