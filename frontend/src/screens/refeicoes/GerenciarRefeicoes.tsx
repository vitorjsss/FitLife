import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    FlatList,
    Modal,
} from 'react-native';
import MealRecordService, { MealRecord } from '../../services/MealRecordService';
import Icon from "react-native-vector-icons/FontAwesome";
import Header from '../../components/Header';
import { useUser } from '../../context/UserContext';

interface GerenciarRefeicoesProps {
    navigation?: any;
    route?: any;
}

const GerenciarRefeicoes: React.FC<GerenciarRefeicoesProps> = ({ navigation, route }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [mealName, setMealName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('cutlery');
    const [loading, setLoading] = useState(false);
    const [mealRecords, setMealRecords] = useState<MealRecord[]>([]);
    const { user } = useUser();

    // Estados para edição
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingMeal, setEditingMeal] = useState<MealRecord | null>(null);
    const [editMealName, setEditMealName] = useState('');
    const [editSelectedIcon, setEditSelectedIcon] = useState('cutlery');

    // Parâmetros da navegação
    const { date, patientId: routePatientId, mealId } = route?.params || {};
    const patientId = routePatientId || user?.id || '';

    const mealIcons = [
        { name: 'cutlery', label: 'Geral' },
        { name: 'coffee', label: 'Café' },
        { name: 'sun-o', label: 'Manhã' },
        { name: 'clock-o', label: 'Almoço' },
        { name: 'moon-o', label: 'Jantar' },
        { name: 'apple', label: 'Lanche' },
    ];

    const handleGoBack = () => {
        navigation?.goBack();
    };


    // Carrega refeições do backend ao abrir a tela
    useEffect(() => {
        const fetchMeals = async () => {
            setLoading(true);
            try {
                if (mealId) {
                    // Carregar refeição específica
                    const meal = await MealRecordService.getById(mealId);
                    setMealRecords(meal ? [meal] : []);
                } else if (date && patientId) {
                    // Carregar todas as refeições da data
                    const meals = await MealRecordService.getByDate(date, patientId);
                    setMealRecords(Array.isArray(meals) ? meals : []);
                }
            } catch (err) {
                console.error('Erro ao carregar refeições:', err);
                setMealRecords([]);
            } finally {
                setLoading(false);
            }
        };
        fetchMeals();
    }, [date, patientId, mealId]);

    const handleAddMealRecord = async () => {
        if (!mealName.trim()) {
            Alert.alert('Atenção', 'Por favor, insira o nome da refeição');
            return;
        }
        if (!date || !patientId) {
            Alert.alert('Erro', 'Data ou ID do paciente não encontrado');
            return;
        }
        try {
            setLoading(true);
            // Criar refeição diretamente com data e patient_id
            const newMeal: MealRecord = {
                name: mealName,
                date: date,
                patient_id: patientId,
                icon_path: `/icons/${selectedIcon}.png`,
                checked: false,
            };
            await MealRecordService.create(newMeal);
            setMealName('');
            Alert.alert('Sucesso!', 'Refeição adicionada com sucesso!');

            // Recarregar refeições da data
            const meals = await MealRecordService.getByDate(date, patientId);
            setMealRecords(Array.isArray(meals) ? meals : []);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível adicionar a refeição');
        } finally {
            setLoading(false);
        }
    };

    const handleEditMealRecord = (mealRecord: MealRecord) => {
        navigation?.navigate('AdicionarAlimentos', {
            mealRecord: mealRecord
        });
    };

    // Nova função para long press
    const handleLongPressMeal = (mealRecord: MealRecord) => {
        Alert.alert(
            'Opções da Refeição',
            `O que deseja fazer com "${mealRecord.name}"?`,
            [
                {
                    text: 'Cancelar',
                    style: 'cancel'
                },
                {
                    text: 'Editar',
                    onPress: () => openEditModal(mealRecord)
                },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: () => confirmDeleteMeal(mealRecord)
                }
            ]
        );
    };

    const openEditModal = (mealRecord: MealRecord) => {
        setEditingMeal(mealRecord);
        setEditMealName(mealRecord.name);

        // Extrair ícone do icon_path
        const iconMatch = mealRecord.icon_path?.match(/\/icons\/(.+)\.png/);
        const currentIcon = iconMatch ? iconMatch[1] : 'cutlery';
        setEditSelectedIcon(currentIcon);

        setShowEditModal(true);
    };

    const confirmDeleteMeal = (mealRecord: MealRecord) => {
        if (!mealRecord.id) return;
        Alert.alert(
            'Confirmar Exclusão',
            `Tem certeza que deseja excluir a refeição "${mealRecord.name}"? Esta ação não pode ser desfeita.`,
            [
                {
                    text: 'Cancelar',
                    style: 'cancel'
                },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: () => deleteMeal(mealRecord.id!)
                }
            ]
        );
    };

    const deleteMeal = async (mealId: string) => {
        try {
            setLoading(true);
            await MealRecordService.delete(mealId);
            setMealRecords((prev) => prev.filter(meal => meal.id !== mealId));
            Alert.alert('Sucesso!', 'Refeição excluída com sucesso!');
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível excluir a refeição');
        } finally {
            setLoading(false);
        }
    };

    const saveEditedMeal = async () => {
        if (!editMealName.trim() || !editingMeal || !editingMeal.id) {
            Alert.alert('Atenção', 'Por favor, insira o nome da refeição');
            return;
        }
        try {
            await MealRecordService.update(editingMeal.id, {
                name: editMealName,
                icon_path: `/icons/${editSelectedIcon}.png`,
            });
            setShowEditModal(false);
            setEditingMeal(null);
            setEditMealName('');
            setEditSelectedIcon('cutlery');

            // Recarregar refeições
            if (date && patientId) {
                const meals = await MealRecordService.getByDate(date, patientId);
                setMealRecords(Array.isArray(meals) ? meals : []);
            }
            Alert.alert('Sucesso!', 'Refeição atualizada com sucesso!');
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível atualizar a refeição');
        } finally {
            setLoading(false);
        }
    };

    const cancelEdit = () => {
        setShowEditModal(false);
        setEditingMeal(null);
        setEditMealName('');
        setEditSelectedIcon('cutlery');
    };

    const renderMealRecord = ({ item }: { item: MealRecord }) => {
        // Extrair ícone do icon_path
        const iconMatch = item.icon_path?.match(/\/icons\/(.+)\.png/);
        const iconName = iconMatch ? iconMatch[1] : 'cutlery';

        // Estilos dinâmicos para refeição marcada
        const cardStyle = [
            styles.mealCard,
            item.checked && { backgroundColor: '#E8F5E9', borderLeftColor: '#4caf50' }
        ];
        const titleStyle = [
            styles.mealCardTitle,
            item.checked && { color: '#388e3c' }
        ];
        const subtitleStyle = [
            styles.mealCardSubtitle,
            item.checked && { color: '#388e3c' }
        ];

        return (
            <TouchableOpacity
                style={cardStyle}
                onPress={() => handleEditMealRecord(item)}
                onLongPress={() => handleLongPressMeal(item)}
                delayLongPress={500}
                activeOpacity={0.7}
            >
                <View style={styles.mealCardHeader}>
                    <Icon name={iconName} size={24} color={item.checked ? '#388e3c' : '#40C4FF'} />
                    <View style={styles.mealCardInfo}>
                        <Text style={titleStyle}>{item.name}</Text>
                    </View>
                    <Icon name="chevron-right" size={16} color="#666" />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <Header title="REFEIÇÕES" />
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Data Info */}
                <View style={styles.dateInfo}>
                    <Icon name="calendar" size={20} color="#40C4FF" />
                    <Text style={styles.dateText}>
                        Refeições de {date ? (() => {
                            const [year, month, day] = date.split('T')[0].split('-');
                            return `${day}/${month}/${year}`;
                        })() : 'hoje'}
                    </Text>
                </View>

                {/* Formulário para adicionar refeição */}
                <View style={styles.formContainer}>
                    <Text style={styles.formTitle}>Adicionar Refeição</Text>

                    {/* Nome da Refeição */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nome da Refeição</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Ex: Café da manhã, Almoço, Jantar..."
                            value={mealName}
                            onChangeText={setMealName}
                            placeholderTextColor="#999"
                        />
                    </View>

                    {/* Seleção de Ícone */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Ícone da Refeição</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.iconSelector}
                        >
                            {mealIcons.map((icon) => (
                                <TouchableOpacity
                                    key={icon.name}
                                    style={[
                                        styles.iconOption,
                                        selectedIcon === icon.name && styles.iconOptionSelected
                                    ]}
                                    onPress={() => setSelectedIcon(icon.name)}
                                >
                                    <Icon
                                        name={icon.name}
                                        size={24}
                                        color={selectedIcon === icon.name ? '#fff' : '#40C4FF'}
                                    />
                                    <Text style={[
                                        styles.iconLabel,
                                        selectedIcon === icon.name && styles.iconLabelSelected
                                    ]}>
                                        {icon.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Botão Adicionar */}
                    <TouchableOpacity
                        style={[styles.addButton, loading && styles.addButtonDisabled]}
                        onPress={handleAddMealRecord}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        <Icon
                            name={loading ? "spinner" : "plus"}
                            size={20}
                            color="#FFFFFF"
                        />
                        <Text style={styles.addButtonText}>
                            {loading ? 'Adicionando...' : 'Adicionar Refeição'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Lista de Refeições */}
                {mealRecords.length > 0 && (
                    <View style={styles.mealsList}>
                        <Text style={styles.mealsListTitle}>Refeições do Dia</Text>
                        <Text style={styles.helpText}>
                            💡 Toque para adicionar alimentos ou segure para editar
                        </Text>
                        <FlatList
                            data={mealRecords}
                            keyExtractor={(item) => item.id || ''}
                            renderItem={renderMealRecord}
                            scrollEnabled={false}
                        />
                    </View>
                )}
            </ScrollView>

            {/* Modal de Edição */}
            <Modal
                visible={showEditModal}
                animationType="slide"
                transparent={true}
                onRequestClose={cancelEdit}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Editar Refeição</Text>
                            <TouchableOpacity onPress={cancelEdit}>
                                <Icon name="times" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            {/* Nome da Refeição */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Nome da Refeição</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Ex: Café da manhã, Almoço, Jantar..."
                                    value={editMealName}
                                    onChangeText={setEditMealName}
                                    placeholderTextColor="#999"
                                />
                            </View>

                            {/* Seleção de Ícone */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Ícone da Refeição</Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    style={styles.iconSelector}
                                >
                                    {mealIcons.map((icon) => (
                                        <TouchableOpacity
                                            key={icon.name}
                                            style={[
                                                styles.iconOption,
                                                editSelectedIcon === icon.name && styles.iconOptionSelected
                                            ]}
                                            onPress={() => setEditSelectedIcon(icon.name)}
                                        >
                                            <Icon
                                                name={icon.name}
                                                size={24}
                                                color={editSelectedIcon === icon.name ? '#fff' : '#40C4FF'}
                                            />
                                            <Text style={[
                                                styles.iconLabel,
                                                editSelectedIcon === icon.name && styles.iconLabelSelected
                                            ]}>
                                                {icon.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={cancelEdit}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={saveEditedMeal}
                            >
                                <Icon name="check" size={16} color="#fff" />
                                <Text style={styles.saveButtonText}>Salvar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#E0E0E0",
    },
    content: {
        flex: 1,
        padding: 20,
    },
    dateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    dateText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginLeft: 12,
    },
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    formTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1976D2',
        marginBottom: 20,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: '#F8F9FA',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
    },
    iconSelector: {
        marginTop: 8,
    },
    iconOption: {
        alignItems: 'center',
        padding: 12,
        marginRight: 12,
        borderRadius: 8,
        backgroundColor: '#F8F9FA',
        borderWidth: 2,
        borderColor: '#E0E0E0',
        minWidth: 80,
    },
    iconOptionSelected: {
        backgroundColor: '#40C4FF',
        borderColor: '#40C4FF',
    },
    iconLabel: {
        fontSize: 12,
        color: '#40C4FF',
        marginTop: 4,
        fontWeight: '600',
    },
    iconLabelSelected: {
        color: '#fff',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#40C4FF',
        paddingVertical: 14,
        borderRadius: 8,
        justifyContent: 'center',
        shadowColor: '#40C4FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    addButtonDisabled: {
        backgroundColor: '#B0BEC5',
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    mealsList: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    mealsListTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1976D2',
        marginBottom: 8,
    },
    helpText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 16,
        fontStyle: 'italic',
    },
    mealCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#40C4FF',
    },
    mealCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mealCardInfo: {
        flex: 1,
        marginLeft: 12,
    },
    mealCardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    mealCardSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    // Estilos do Modal
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
        maxHeight: '80%',
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
        maxHeight: 300,
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
        paddingVertical: 12,
        borderRadius: 8,
        marginRight: 10,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        flex: 1,
        backgroundColor: '#40C4FF',
        paddingVertical: 12,
        borderRadius: 8,
        marginLeft: 10,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});

export default GerenciarRefeicoes;