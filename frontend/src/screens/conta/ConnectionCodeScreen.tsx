import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import Icon from "react-native-vector-icons/FontAwesome";
import Header from '../../components/Header';
import { useUser } from '../../context/UserContext';
import PatientConnectionCodeService, { ConnectionCode } from '../../services/PatientConnectionCodeService';

export default function ConnectionCodeScreen() {
    const [loading, setLoading] = useState(false);
    const [code, setCode] = useState<ConnectionCode | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const { user } = useUser();

    useEffect(() => {
        loadActiveCode();
    }, []);

    useEffect(() => {
        if (code && timeLeft > 0) {
            const timer = setInterval(() => {
                const now = new Date().getTime();
                const expiresAt = new Date(code.expires_at).getTime();
                const diff = Math.floor((expiresAt - now) / 1000);

                if (diff <= 0) {
                    setTimeLeft(0);
                    setCode(null);
                } else {
                    setTimeLeft(diff);
                }
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [code, timeLeft]);

    const loadActiveCode = async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const activeCode = await PatientConnectionCodeService.getActiveCode(user.id);

            if (activeCode && activeCode.code) {
                setCode(activeCode);
                const now = new Date().getTime();
                const expiresAt = new Date(activeCode.expires_at).getTime();
                const diff = Math.floor((expiresAt - now) / 1000);
                setTimeLeft(diff > 0 ? diff : 0);
            } else {
                setCode(null);
                setTimeLeft(0);
            }
        } catch (error) {
            console.error('[ConnectionCode] Erro ao carregar código:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateCode = async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const newCode = await PatientConnectionCodeService.generateCode(user.id);
            setCode(newCode);

            const now = new Date().getTime();
            const expiresAt = new Date(newCode.expires_at).getTime();
            const diff = Math.floor((expiresAt - now) / 1000);
            setTimeLeft(diff);

            Alert.alert(
                'Código Gerado!',
                `Compartilhe este código com seu nutricionista ou educador físico.\nO código expira em 5 minutos.`
            );
        } catch (error) {
            console.error('[ConnectionCode] Erro ao gerar código:', error);
            Alert.alert('Erro', 'Não foi possível gerar o código. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.container}>
            <Header title="Código de Conexão" />

            <View style={styles.content}>
                <View style={styles.infoCard}>
                    <Icon name="info-circle" size={24} color="#40C4FF" />
                    <Text style={styles.infoText}>
                        Gere um código temporário para conectar-se com um nutricionista ou educador físico.
                        O código é válido por 5 minutos.
                    </Text>
                </View>

                {code && timeLeft > 0 ? (
                    <View style={styles.codeCard}>
                        <Text style={styles.codeLabel}>Seu Código:</Text>
                        <View style={styles.codeDisplay}>
                            <Text style={styles.codeText}>{code.code}</Text>
                        </View>

                        <View style={styles.timerContainer}>
                            <Icon name="clock-o" size={20} color="#666" />
                            <Text style={styles.timerText}>
                                Expira em: {formatTime(timeLeft)}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.refreshButton}
                            onPress={handleGenerateCode}
                            disabled={loading}
                        >
                            <Icon name="refresh" size={20} color="#40C4FF" />
                            <Text style={styles.refreshButtonText}>Gerar Novo Código</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <Icon name="key" size={64} color="#B0BEC5" />
                        <Text style={styles.emptyStateText}>
                            Nenhum código ativo
                        </Text>

                        <TouchableOpacity
                            style={styles.generateButton}
                            onPress={handleGenerateCode}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Icon name="plus" size={20} color="#fff" />
                                    <Text style={styles.generateButtonText}>Gerar Código</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.instructionsCard}>
                    <Text style={styles.instructionsTitle}>Como usar:</Text>
                    <View style={styles.instructionItem}>
                        <Text style={styles.instructionNumber}>1.</Text>
                        <Text style={styles.instructionText}>Gere um código clicando no botão acima</Text>
                    </View>
                    <View style={styles.instructionItem}>
                        <Text style={styles.instructionNumber}>2.</Text>
                        <Text style={styles.instructionText}>Compartilhe o código com seu profissional</Text>
                    </View>
                    <View style={styles.instructionItem}>
                        <Text style={styles.instructionNumber}>3.</Text>
                        <Text style={styles.instructionText}>Aguarde a conexão ser estabelecida</Text>
                    </View>
                </View>
            </View>
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
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#E3F2FD',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        alignItems: 'center',
    },
    infoText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: '#1976D2',
        lineHeight: 20,
    },
    codeCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    codeLabel: {
        fontSize: 16,
        color: '#666',
        marginBottom: 12,
    },
    codeDisplay: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        paddingVertical: 20,
        paddingHorizontal: 40,
        marginBottom: 16,
    },
    codeText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#40C4FF',
        letterSpacing: 8,
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    timerText: {
        fontSize: 16,
        color: '#666',
        marginLeft: 8,
        fontWeight: '600',
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#40C4FF',
    },
    refreshButtonText: {
        color: '#40C4FF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    emptyState: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 40,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    emptyStateText: {
        fontSize: 18,
        color: '#B0BEC5',
        marginTop: 16,
        marginBottom: 24,
    },
    generateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#40C4FF',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 8,
        shadowColor: '#40C4FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    generateButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    instructionsCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    instructionsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1976D2',
        marginBottom: 16,
    },
    instructionItem: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    instructionNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#40C4FF',
        marginRight: 12,
        width: 24,
    },
    instructionText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        lineHeight: 22,
    },
});
