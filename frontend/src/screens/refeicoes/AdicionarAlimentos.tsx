import React, { useEffect, useState } from 'react';
import {
    Text,
    View,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    FlatList,
    Modal,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import Icon from "react-native-vector-icons/FontAwesome";
import MealRecordService, { MealItem } from '../../services/MealRecordService';
import Header from '../../components/Header';

interface AdicionarAlimentosProps {
    navigation?: any;
    route?: any;
}

const AdicionarAlimentos: React.FC<AdicionarAlimentosProps> = ({ navigation, route }) => {
    // Clear form fields
    const clearForm = () => {
        setFoodName('');
        setQuantity('');
        setCalories('');
        setProteins('');
        setCarbs('');
        setFats('');
    };

    // Add meal item handler
    const handleAddMealItem = async () => {
        if (!foodName.trim() || !quantity.trim()) {
            Alert.alert('Atenção', 'Por favor, insira o nome do alimento e a quantidade');
            return;
        }
        if (!mealRecord.id) {
            Alert.alert('Erro', 'ID da refeição não encontrado.');
            return;
        }
        setLoading(true);
        try {
            const newMealItem: MealItem = {
                food_name: foodName,
                quantity: quantity,
                calories: parseFloat(calories) || 0,
                proteins: parseFloat(proteins) || 0,
                carbs: parseFloat(carbs) || 0,
                fats: parseFloat(fats) || 0,
            };
            await MealRecordService.addItem(mealRecord.id, newMealItem);
            clearForm();
            // Refresh list
            const updatedMeal = await MealRecordService.getById(mealRecord.id);
            setMealItems(updatedMeal.items || []);
            Alert.alert('Sucesso!', 'Alimento adicionado com sucesso!');
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível adicionar o alimento');
        } finally {
            setLoading(false);
        }
    };

    // Remove meal item handler
    const handleRemoveMealItem = async (itemId: string) => {
        Alert.alert(
            'Confirmar Exclusão',
            'Deseja realmente remover este alimento?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Remover',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await MealRecordService.deleteItem(mealRecord.id!, itemId);
                            if (mealRecord.id) {
                                const updatedMeal = await MealRecordService.getById(mealRecord.id);
                                setMealItems(updatedMeal.items || []);
                            }
                        } catch (error) {
                            Alert.alert('Erro', 'Não foi possível remover o alimento');
                        }
                    }
                }
            ]
        );
    };

    const toggleMealItem = async () => {
        if (!mealRecord.id) {
            Alert.alert("Erro", "ID da refeição não fornecido.");
            return;
        }

        try {
            await MealRecordService.update(mealRecord.id, { ...mealRecord, checked: !mealRecord.checked });

            setChecked(!checked);
        } catch (err) {
            console.error("Erro ao atualizar refeição:", err);
            Alert.alert("Erro", "Não foi possível atualizar o status da refeição.");
        }
    };

    // Calculate total nutrients
    const getTotalNutrients = () => {
        return mealItems.reduce(
            (totals, item) => ({
                calories: totals.calories + (item.calories || 0),
                proteins: totals.proteins + (item.proteins || 0),
                carbs: totals.carbs + (item.carbs || 0),
                fats: totals.fats + (item.fats || 0),
            }),
            { calories: 0, proteins: 0, carbs: 0, fats: 0 }
        );
    };

    // Render meal item
    const renderMealItem = ({ item }: { item: MealItem }) => (
        <View style={styles.itemCard}>
            <View style={styles.itemHeader}>
                <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.food_name}</Text>
                    <Text style={styles.itemQuantity}>{item.quantity}</Text>
                </View>
                <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => item.id && handleRemoveMealItem(item.id)}
                >
                    <Icon name="trash" size={16} color="#FF5252" />
                </TouchableOpacity>
            </View>
            <View style={styles.nutrientsRow}>
                <View style={styles.nutrientItem}>
                    <Text style={styles.nutrientValue}>{(item.calories || 0).toFixed(0)}</Text>
                    <Text style={styles.nutrientLabel}>kcal</Text>
                </View>
                <View style={styles.nutrientItem}>
                    <Text style={styles.nutrientValue}>{(item.proteins || 0).toFixed(1)}</Text>
                    <Text style={styles.nutrientLabel}>Prot.</Text>
                </View>
                <View style={styles.nutrientItem}>
                    <Text style={styles.nutrientValue}>{(item.carbs || 0).toFixed(1)}</Text>
                    <Text style={styles.nutrientLabel}>Carb.</Text>
                </View>
                <View style={styles.nutrientItem}>
                    <Text style={styles.nutrientValue}>{(item.fats || 0).toFixed(1)}</Text>
                    <Text style={styles.nutrientLabel}>Gord.</Text>
                </View>
            </View>
        </View>
    );

    const [checked, setChecked] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [foodName, setFoodName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [calories, setCalories] = useState('');
    const [proteins, setProteins] = useState('');
    const [carbs, setCarbs] = useState('');
    const [fats, setFats] = useState('');
    const [loading, setLoading] = useState(false);
    const [mealItems, setMealItems] = useState<MealItem[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);

    // Parâmetros da navegação: recebe apenas o mealRecord.id e mealName da tela anterior
    const { mealRecord } = route?.params || {};
    // Função para extrair o nome do ícone FontAwesome
    const getFontAwesomeIconName = (iconPath?: string) => {
        if (!iconPath) return 'cutlery';
        // Remove prefixos e sufixos
        return iconPath.replace(/^.*\//, '').replace(/\.png$/, '');
    };

    const handleGoBack = () => {
        navigation?.goBack();
    };

    useEffect(() => {
        setChecked(mealRecord.checked);

        const fetchMealItems = async () => {
            if (!mealRecord.id) return;
            setLoading(true);
            try {
                const meal = await MealRecordService.getById(mealRecord.id);
                setMealItems(meal.items || []);
            } catch (err) {
                setMealItems([]);
            } finally {
                setLoading(false);
            }
        };
        fetchMealItems();
    }, [mealRecord.id]);

    // All UI and logic should be inside the return block below
    // The following is the correct return block for your component:
    return (
        <>
            <Modal
                visible={showAddModal}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    setShowAddModal(false);
                    clearForm();
                }}
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 60}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.modalOverlay}>
                            <ScrollView
                                contentContainerStyle={styles.modalContent}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                            >
                                <Text style={styles.formTitle}>Adicionar Alimento</Text>
                                {/* Nome do Alimento */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Nome do Alimento</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="Ex: Arroz integral, Frango grelhado..."
                                        value={foodName}
                                        onChangeText={setFoodName}
                                        placeholderTextColor="#999"
                                    />
                                </View>
                                {/* Quantidade */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Quantidade</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="Ex: 100g, 1 xícara, 200ml..."
                                        value={quantity}
                                        onChangeText={setQuantity}
                                        placeholderTextColor="#999"
                                    />
                                </View>
                                {/* Informações Nutricionais */}
                                <Text style={styles.sectionTitle}>Informações Nutricionais</Text>
                                <View style={styles.nutrientInputsRow}>
                                    <View style={styles.nutrientInputGroup}>
                                        <Text style={styles.label}>Calorias</Text>
                                        <TextInput
                                            style={styles.nutrientInput}
                                            placeholder="0"
                                            value={calories}
                                            onChangeText={setCalories}
                                            keyboardType="numeric"
                                            placeholderTextColor="#999"
                                        />
                                    </View>
                                    <View style={styles.nutrientInputGroup}>
                                        <Text style={styles.label}>Proteínas (g)</Text>
                                        <TextInput
                                            style={styles.nutrientInput}
                                            placeholder="0"
                                            value={proteins}
                                            onChangeText={setProteins}
                                            keyboardType="numeric"
                                            placeholderTextColor="#999"
                                        />
                                    </View>
                                </View>
                                <View style={styles.nutrientInputsRow}>
                                    <View style={styles.nutrientInputGroup}>
                                        <Text style={styles.label}>Carboidratos (g)</Text>
                                        <TextInput
                                            style={styles.nutrientInput}
                                            placeholder="0"
                                            value={carbs}
                                            onChangeText={setCarbs}
                                            keyboardType="numeric"
                                            placeholderTextColor="#999"
                                        />
                                    </View>
                                    <View style={styles.nutrientInputGroup}>
                                        <Text style={styles.label}>Gorduras (g)</Text>
                                        <TextInput
                                            style={styles.nutrientInput}
                                            placeholder="0"
                                            value={fats}
                                            onChangeText={setFats}
                                            keyboardType="numeric"
                                            placeholderTextColor="#999"
                                        />
                                    </View>
                                </View>
                                {/* Botões do Modal */}
                                <View style={styles.modalButtonsRow}>
                                    <TouchableOpacity
                                        style={[styles.addButton, loading && styles.addButtonDisabled]}
                                        onPress={async () => {
                                            await handleAddMealItem();
                                            setShowAddModal(false);
                                        }}
                                        disabled={loading}
                                        activeOpacity={0.8}
                                    >
                                        <Icon
                                            name={loading ? "spinner" : "plus"}
                                            size={20}
                                            color="#FFFFFF"
                                        />
                                        <Text style={styles.addButtonText}>
                                            {loading ? 'Adicionando...' : 'Adicionar'}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={() => {
                                            setShowAddModal(false);
                                            clearForm();
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </Modal>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <Header title="Alimentos" />
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    {/* Meal Info */}
                    <View style={[styles.mealInfo, { backgroundColor: checked ? '#E8F5E9' : '#fff' }]}>
                        <Icon name={getFontAwesomeIconName(mealRecord.icon_path)} size={20} color={mealRecord.checked ? '#4caf50' : '#40C4FF'} />
                        <Text style={[styles.mealName, { color: mealRecord.checked ? '#4caf50' : '#333' }]}>{mealRecord.name || 'Refeição'}</Text>
                        <View style={{ flex: 1 }} />
                        <TouchableOpacity
                            style={styles.checkButton}
                            onPress={toggleMealItem}
                            activeOpacity={0.7}
                        >
                            <Icon
                                name={checked ? 'check-square' : 'square-o'}
                                size={24}
                                color={checked ? '#4caf50' : '#bbb'}
                            />
                        </TouchableOpacity>
                    </View>
                    {/* Botão Novo Alimento */}
                    <TouchableOpacity
                        style={styles.newFoodButton}
                        onPress={() => setShowAddModal(true)}
                        activeOpacity={0.8}
                    >
                        <Icon name="plus" size={18} color="#fff" />
                        <Text style={styles.newFoodButtonText}>Novo Alimento</Text>
                    </TouchableOpacity>
                    {/* Lista de Alimentos */}
                    {mealItems.length > 0 && (
                        <View style={styles.itemsList}>
                            <Text style={styles.itemsListTitle}>Alimentos Adicionados</Text>
                            <FlatList
                                data={mealItems}
                                keyExtractor={(item) => item.id ?? item.food_name}
                                renderItem={renderMealItem}
                                scrollEnabled={false}
                            />
                            {/* Resumo Nutricional */}
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryTitle}>Total da Refeição</Text>
                                <View style={styles.summaryRow}>
                                    <View style={styles.summaryItem}>
                                        <Text style={styles.summaryValue}>{getTotalNutrients().calories.toFixed(0)}</Text>
                                        <Text style={styles.summaryLabel}>kcal</Text>
                                    </View>
                                    <View style={styles.summaryItem}>
                                        <Text style={styles.summaryValue}>{getTotalNutrients().proteins.toFixed(1)}</Text>
                                        <Text style={styles.summaryLabel}>Proteínas</Text>
                                    </View>
                                    <View style={styles.summaryItem}>
                                        <Text style={styles.summaryValue}>{getTotalNutrients().carbs.toFixed(1)}</Text>
                                        <Text style={styles.summaryLabel}>Carboidratos</Text>
                                    </View>
                                    <View style={styles.summaryItem}>
                                        <Text style={styles.summaryValue}>{getTotalNutrients().fats.toFixed(1)}</Text>
                                        <Text style={styles.summaryLabel}>Gorduras</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
};

const styles = StyleSheet.create({
    checkButton: {
        marginLeft: 0,
        padding: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    container: {
        flex: 1,
        backgroundColor: "#E0E0E0",
    },
    newFoodButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1976D2',
        paddingVertical: 12,
        borderRadius: 8,
        justifyContent: 'center',
        marginBottom: 20,
        shadowColor: '#1976D2',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    newFoodButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    modalOverlay: {
        position: 'absolute',
        top: 90,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(177, 177, 177, 0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        width: '100%',
        height: '100%',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 32,
        width: '80%',
        maxWidth: 350,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 20,
    },
    modalButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 18,
    },
    cancelButton: {
        backgroundColor: '#B0BEC5',
        borderRadius: 8,
        paddingVertical: 14,
        paddingHorizontal: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
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
    content: {
        flex: 1,
        padding: 20,
    },
    mealInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        // backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    mealName: {
        fontSize: 16,
        fontWeight: '600',
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
        marginBottom: 16,
        width: '100%',
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 6,

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
        width: 270,
        minHeight: 48,
        maxHeight: 48,
        textAlignVertical: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1976D2',
        marginTop: 16,
        marginBottom: 12,
    },
    nutrientInputsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    nutrientInputGroup: {
        flex: 1,
        marginHorizontal: 4,
    },
    nutrientInput: {
        backgroundColor: '#F8F9FA',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#333',
        textAlign: 'center',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#40C4FF',
        paddingVertical: 14,
        paddingHorizontal: 15,
        borderRadius: 8,
        justifyContent: 'center',
        shadowColor: '#40C4FF',
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
    itemsList: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    itemsListTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1976D2',
        marginBottom: 16,
    },
    itemCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#40C4FF',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    itemQuantity: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    removeButton: {
        padding: 8,
    },
    nutrientsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    nutrientItem: {
        alignItems: 'center',
    },
    nutrientValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#40C4FF',
    },
    nutrientLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    summaryCard: {
        backgroundColor: '#40C4FF',
        borderRadius: 8,
        padding: 16,
        marginTop: 16,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    summaryItem: {
        alignItems: 'center',
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    summaryLabel: {
        fontSize: 12,
        color: '#fff',
        marginTop: 2,
        opacity: 0.9,
    },
});

export default AdicionarAlimentos;