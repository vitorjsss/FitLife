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
import { saveMeal, loadMeal } from '../../utils/mealStorage';


interface MealItem {
    id: string;
    food_name: string;
    quantity: string;
    calories: number;
    proteins: number;
    carbs: number;
    fats: number;
}

interface AdicionarAlimentosProps {
    navigation?: any;
    route?: any;
}

const AdicionarAlimentos: React.FC<AdicionarAlimentosProps> = ({ navigation, route }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [foodName, setFoodName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [calories, setCalories] = useState('');
    const [proteins, setProteins] = useState('');
    const [carbs, setCarbs] = useState('');
    const [fats, setFats] = useState('');
    const [loading, setLoading] = useState(false);
    const [mealItems, setMealItems] = useState<MealItem[]>([]);

    // Parâmetros da navegação
    const { mealRecordId, mealName, dailyMealRegistryId } = route?.params || {};

    const handleGoBack = () => {
        navigation?.goBack();
    };

    const clearForm = () => {
        setFoodName('');
        setQuantity('');
        setCalories('');
        setProteins('');
        setCarbs('');
        setFats('');
    };

    useEffect(() => {
        const loadLocalData = async () => {
            const items = await loadMeal(mealRecordId);
            setMealItems(items);
        };
        loadLocalData();
    }, []);


    const handleAddMealItem = async () => {
        if (!foodName.trim() || !quantity.trim()) {
            Alert.alert('Atenção', 'Por favor, insira o nome do alimento');
            return;
        }

        if (!quantity.trim()) {
            Alert.alert('Atenção', 'Por favor, insira a quantidade');
            return;
        }

        try {
            setLoading(true);

            // Aqui você faria a chamada para a API
            // const response = await api.post('/meal-item', {
            //     food_name: foodName,
            //     quantity: quantity,
            //     calories: parseFloat(calories) || 0,
            //     proteins: parseFloat(proteins) || 0,
            //     carbs: parseFloat(carbs) || 0,
            //     fats: parseFloat(fats) || 0,
            //     food_id: 'food_uuid_here', // Seria obtido da seleção ou busca
            //     meal_id: mealRecordId
            // });

            const newMealItem: MealItem = {
                id: `item_${Date.now()}`,
                food_name: foodName,
                quantity: quantity,
                calories: parseFloat(calories) || 0,
                proteins: parseFloat(proteins) || 0,
                carbs: parseFloat(carbs) || 0,
                fats: parseFloat(fats) || 0,
            };

            const updatedList = [...mealItems, newMealItem];
            setMealItems(updatedList);
            await saveMeal(mealRecordId, updatedList); // 👈 salva localmente
            clearForm();

            Alert.alert('Sucesso!', 'Alimento adicionado com sucesso!');
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível adicionar o alimento');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMealItem = async (itemId: string) => {
        Alert.alert(
            'Confirmar Exclusão',
            'Deseja realmente remover este alimento?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Remover',
                    style: 'destructive',
                    onPress: () => {
                        setMealItems(mealItems.filter(item => item.id !== itemId));
                    }
                }
            ]
        );
    };

    const getTotalNutrients = () => {
        return mealItems.reduce(
            (totals, item) => ({
                calories: totals.calories + item.calories,
                proteins: totals.proteins + item.proteins,
                carbs: totals.carbs + item.carbs,
                fats: totals.fats + item.fats,
            }),
            { calories: 0, proteins: 0, carbs: 0, fats: 0 }
        );
    };

    const renderMealItem = ({ item }: { item: MealItem }) => (
        <View style={styles.itemCard}>
            <View style={styles.itemHeader}>
                <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.food_name}</Text>
                    <Text style={styles.itemQuantity}>{item.quantity}</Text>
                </View>
                <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveMealItem(item.id)}
                >
                    <Icon name="trash" size={16} color="#FF5252" />
                </TouchableOpacity>
            </View>

            <View style={styles.nutrientsRow}>
                <View style={styles.nutrientItem}>
                    <Text style={styles.nutrientValue}>{item.calories.toFixed(0)}</Text>
                    <Text style={styles.nutrientLabel}>kcal</Text>
                </View>
                <View style={styles.nutrientItem}>
                    <Text style={styles.nutrientValue}>{item.proteins.toFixed(1)}</Text>
                    <Text style={styles.nutrientLabel}>Prot.</Text>
                </View>
                <View style={styles.nutrientItem}>
                    <Text style={styles.nutrientValue}>{item.carbs.toFixed(1)}</Text>
                    <Text style={styles.nutrientLabel}>Carb.</Text>
                </View>
                <View style={styles.nutrientItem}>
                    <Text style={styles.nutrientValue}>{item.fats.toFixed(1)}</Text>
                    <Text style={styles.nutrientLabel}>Gord.</Text>
                </View>
            </View>
        </View>
    );

    const totals = getTotalNutrients();

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

                <Text style={styles.headerTitle}>ALIMENTOS</Text>

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
                {/* Meal Info */}
                <View style={styles.mealInfo}>
                    <Icon name="cutlery" size={20} color="#40C4FF" />
                    <Text style={styles.mealName}>{mealName || 'Refeição'}</Text>
                </View>

                {/* Formulário para adicionar alimento */}
                <View style={styles.formContainer}>
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
                    <Text style={styles.sectionTitle}>Informações Nutricionais (opcional)</Text>

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

                    {/* Botão Adicionar */}
                    <TouchableOpacity
                        style={[styles.addButton, loading && styles.addButtonDisabled]}
                        onPress={handleAddMealItem}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        <Icon
                            name={loading ? "spinner" : "plus"}
                            size={20}
                            color="#FFFFFF"
                        />
                        <Text style={styles.addButtonText}>
                            {loading ? 'Adicionando...' : 'Adicionar Alimento'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Lista de Alimentos */}
                {mealItems.length > 0 && (
                    <View style={styles.itemsList}>
                        <Text style={styles.itemsListTitle}>Alimentos Adicionados</Text>

                        <FlatList
                            data={mealItems}
                            keyExtractor={(item) => item.id}
                            renderItem={renderMealItem}
                            scrollEnabled={false}
                        />

                        {/* Resumo Nutricional */}
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryTitle}>Total da Refeição</Text>
                            <View style={styles.summaryRow}>
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryValue}>{totals.calories.toFixed(0)}</Text>
                                    <Text style={styles.summaryLabel}>kcal</Text>
                                </View>
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryValue}>{totals.proteins.toFixed(1)}</Text>
                                    <Text style={styles.summaryLabel}>Proteínas</Text>
                                </View>
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryValue}>{totals.carbs.toFixed(1)}</Text>
                                    <Text style={styles.summaryLabel}>Carboidratos</Text>
                                </View>
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryValue}>{totals.fats.toFixed(1)}</Text>
                                    <Text style={styles.summaryLabel}>Gorduras</Text>
                                </View>
                            </View>
                        </View>
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
    mealInfo: {
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
    mealName: {
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
        marginBottom: 16,
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
        borderRadius: 8,
        justifyContent: 'center',
        marginTop: 16,
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