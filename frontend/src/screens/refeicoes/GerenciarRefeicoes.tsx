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
} from 'react-native';
import Icon from "react-native-vector-icons/FontAwesome";
import { saveMealRecordLocal, loadMealRecordsLocal } from '../../utils/mealRecordStorage';
import { apiClient } from '../../service/apiClient';

interface MealRecord {
    id: string;
    name: string;
    icon_path?: string;
    itemCount?: number;
}

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

    // Parâmetros da navegação
    const { dailyMealRegistryId, date } = route?.params || {};

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

    useEffect(() => {
        const loadLocalRecords = async () => {
            const localRecords = await loadMealRecordsLocal(dailyMealRegistryId);
            setMealRecords(localRecords);
        };
        loadLocalRecords();
    }, [dailyMealRegistryId]);


    const handleAddMealRecord = async () => {
        if (!mealName.trim()) {
            Alert.alert('Atenção', 'Por favor, insira o nome da refeição');
            return;
        }

        try {
            setLoading(true);

            // Aqui você faria a chamada para a API
            //const response = await apiClient.post('/meal-record', {
                // name: mealName,
                // icon_path: `/icons/${selectedIcon}.png`,
                 //daily_meal_registry_id: dailyMealRegistryId
             //});

            const newMealRecord: MealRecord = {
                id: `meal_${Date.now()}`,
                name: mealName,
                icon_path: `/icons/${selectedIcon}.png`,
                itemCount: 0
            };

            
            const updatedRecords = [...mealRecords, newMealRecord];
            setMealRecords(updatedRecords);

            // salva localmente
            await saveMealRecordLocal(dailyMealRegistryId, updatedRecords);

            setMealName('');

            Alert.alert('Sucesso!', 'Refeição adicionada com sucesso!');
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível adicionar a refeição');
        } finally {
            setLoading(false);
        }
    };

    const handleEditMealRecord = (mealRecord: MealRecord) => {
        navigation?.navigate('AdicionarAlimentos', {
            mealRecordId: mealRecord.id,
            mealName: mealRecord.name,
            dailyMealRegistryId
        });
    };

    const renderMealRecord = ({ item }: { item: MealRecord }) => (
        <TouchableOpacity
            style={styles.mealCard}
            onPress={() => handleEditMealRecord(item)}
        >
            <View style={styles.mealCardHeader}>
                <Icon name={selectedIcon} size={24} color="#40C4FF" />
                <View style={styles.mealCardInfo}>
                    <Text style={styles.mealCardTitle}>{item.name}</Text>
                    <Text style={styles.mealCardSubtitle}>
                        {item.itemCount || 0} alimentos adicionados
                    </Text>
                </View>
                <Icon name="chevron-right" size={16} color="#666" />
            </View>
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Header */}
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

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Data Info */}
                <View style={styles.dateInfo}>
                    <Icon name="calendar" size={20} color="#40C4FF" />
                    <Text style={styles.dateText}>
                        Refeições de {date ? new Date(date).toLocaleDateString('pt-BR') : 'hoje'}
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
                        <FlatList
                            data={mealRecords}
                            keyExtractor={(item) => item.id}
                            renderItem={renderMealRecord}
                            scrollEnabled={false}
                        />
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        marginBottom: 16,
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
});

export default GerenciarRefeicoes;