import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    ActivityIndicator,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUser } from '../../context/UserContext';
import { mealCalendarService, DailyProgress, DayDetails } from '../../services/MealCalendarService';
import Header from '../../components/Header';

interface CalendarioRefeicoesProps {
    navigation: any;
    route?: any;
}

const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const CalendarioRefeicoes: React.FC<CalendarioRefeicoesProps> = ({ navigation, route }) => {
    const { user } = useUser();
    const patientId = route?.params?.patientId || user?.id; // Usa patientId se passado, senão usa o user.id
    const [currentDate, setCurrentDate] = useState(new Date());
    const [monthlyProgress, setMonthlyProgress] = useState<DailyProgress[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedDay, setSelectedDay] = useState<DayDetails | null>(null);
    const [showDayModal, setShowDayModal] = useState(false);
    const [dayModalLoading, setDayModalLoading] = useState(false);

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    useEffect(() => {
        if (patientId) {
            loadMonthlyProgress();
        }
    }, [patientId, currentDate]);

    const loadMonthlyProgress = async () => {
        if (!patientId) return;

        setLoading(true);
        try {
            const data = await mealCalendarService.getMonthlyProgress(
                patientId,
                currentYear,
                currentMonth + 1 // Month is 0-indexed, backend expects 1-indexed
            );
            setMonthlyProgress(data);
        } catch (error) {
            console.error('Error loading monthly progress:', error);
            Alert.alert('Erro', 'Não foi possível carregar o progresso mensal.');
        } finally {
            setLoading(false);
        }
    };

    const handlePreviousMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    };

    const handleNextMonth = () => {
        const today = new Date();
        const nextMonth = new Date(currentYear, currentMonth + 1, 1);

        // Não permitir navegar para meses futuros
        if (nextMonth <= today) {
            setCurrentDate(nextMonth);
        }
    };

    const handleDayPress = async (day: number) => {
        if (!patientId) return;

        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        setDayModalLoading(true);
        setShowDayModal(true);

        try {
            const details = await mealCalendarService.getDayDetails(patientId, dateStr);
            setSelectedDay(details);
        } catch (error) {
            console.error('Error loading day details:', error);
            Alert.alert('Erro', 'Não foi possível carregar os detalhes do dia.');
            setShowDayModal(false);
        } finally {
            setDayModalLoading(false);
        }
    };

    const getDaysInMonth = () => {
        return new Date(currentYear, currentMonth + 1, 0).getDate();
    };

    const getFirstDayOfMonth = () => {
        return new Date(currentYear, currentMonth, 1).getDay();
    };

    const getProgressForDay = (day: number): DailyProgress | undefined => {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return monthlyProgress.find(p => {
            // Compare date strings directly to avoid timezone issues
            const pDateStr = typeof p.date === 'string' ? p.date.split('T')[0] : p.date;
            return pDateStr === dateStr;
        });
    };

    const getColorForPercentage = (percentage: number): string => {
        if (percentage === 100) return '#4CAF50'; // Verde - completo
        if (percentage >= 75) return '#8BC34A'; // Verde claro
        if (percentage >= 50) return '#FFC107'; // Amarelo
        if (percentage >= 25) return '#FF9800'; // Laranja
        if (percentage > 0) return '#FF5722'; // Vermelho claro
        return '#E0E0E0'; // Cinza - sem refeições
    };

    const renderCalendarDays = () => {
        const daysInMonth = getDaysInMonth();
        const firstDayOfWeek = getFirstDayOfMonth();
        const days: React.ReactElement[] = [];

        // Empty cells for days before the first day of the month
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
        }

        // Actual days
        for (let day = 1; day <= daysInMonth; day++) {
            const progress = getProgressForDay(day);
            const percentage = progress?.completionPercentage || 0;
            const bgColor = progress ? getColorForPercentage(percentage) : '#F5F5F5';
            const isToday =
                day === new Date().getDate() &&
                currentMonth === new Date().getMonth() &&
                currentYear === new Date().getFullYear();

            days.push(
                <View key={`day-${day}`} style={styles.dayCell}>
                    <TouchableOpacity
                        style={[
                            styles.dayWithData,
                            { backgroundColor: bgColor },
                            isToday && styles.todayCell
                        ]}
                        onPress={() => handleDayPress(day)}
                        activeOpacity={0.7}
                    >
                        <Text style={[
                            styles.dayNumber,
                            percentage === 100 && styles.dayNumberComplete,
                            isToday && styles.todayText
                        ]}>
                            {day}
                        </Text>
                        {progress && progress.totalMeals > 0 && (
                            <Text style={styles.progressText}>
                                {progress.completedMeals}/{progress.totalMeals}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            );
        }

        return days;
    };

    const canGoNext = () => {
        const today = new Date();
        const nextMonth = new Date(currentYear, currentMonth + 1, 1);
        return nextMonth <= today;
    };

    return (
        <View style={styles.container}>
            <Header title="Calendário de Refeições" />

            <View style={styles.content}>
                {/* Month navigation */}
                <View style={styles.monthNav}>
                    <TouchableOpacity onPress={handlePreviousMonth} style={styles.navButton}>
                        <Icon name="chevron-left" size={32} color="#1976D2" />
                    </TouchableOpacity>

                    <Text style={styles.monthTitle}>
                        {MONTH_NAMES[currentMonth]} {currentYear}
                    </Text>

                    <TouchableOpacity
                        onPress={handleNextMonth}
                        style={styles.navButton}
                        disabled={!canGoNext()}
                    >
                        <Icon
                            name="chevron-right"
                            size={32}
                            color={canGoNext() ? "#1976D2" : "#CCC"}
                        />
                    </TouchableOpacity>
                </View>

                {/* Weekday headers */}
                <View style={styles.weekdayHeader}>
                    {WEEKDAY_NAMES.map(day => (
                        <View key={day} style={styles.weekdayCell}>
                            <Text style={styles.weekdayText}>{day}</Text>
                        </View>
                    ))}
                </View>

                {/* Calendar grid */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#1976D2" />
                        <Text style={styles.loadingText}>Carregando calendário...</Text>
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <View style={styles.calendarGrid}>
                            {renderCalendarDays()}
                        </View>
                    </ScrollView>
                )}
            </View>

            {/* Day details modal */}
            <Modal
                visible={showDayModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDayModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {dayModalLoading ? (
                            <ActivityIndicator size="large" color="#1976D2" />
                        ) : selectedDay ? (
                            <>
                                <Text style={styles.modalTitle}>
                                    {(() => {
                                        const [year, month, day] = selectedDay.date.split('T')[0].split('-');
                                        return `${day}/${month}/${year}`;
                                    })()}
                                </Text>

                                {selectedDay.meals.length === 0 ? (
                                    <Text style={styles.noMealsText}>
                                        Nenhuma refeição registrada neste dia.
                                    </Text>
                                ) : (
                                    <ScrollView style={styles.mealsList}>
                                        {selectedDay.meals.map((meal) => (
                                            <TouchableOpacity
                                                key={meal.id}
                                                style={styles.mealItem}
                                                onPress={() => {
                                                    setShowDayModal(false);
                                                    setSelectedDay(null);
                                                    navigation.navigate('AdicionarAlimentos', {
                                                        mealRecord: meal
                                                    });
                                                }}
                                            >
                                                <Icon
                                                    name={meal.checked ? "checkbox-marked" : "checkbox-blank-outline"}
                                                    size={24}
                                                    color={meal.checked ? "#4CAF50" : "#999"}
                                                />
                                                <View style={styles.mealInfo}>
                                                    <Text style={styles.mealName}>{meal.name}</Text>
                                                    <Text style={styles.mealItems}>
                                                        {meal.foodItemsCount} {meal.foodItemsCount === 1 ? 'item' : 'itens'}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                )}

                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={() => setShowDayModal(false)}
                                >
                                    <Text style={styles.closeButtonText}>Fechar</Text>
                                </TouchableOpacity>
                            </>
                        ) : null}
                    </View>
                </View>
            </Modal >
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F7FB',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    monthNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    navButton: {
        padding: 8,
    },
    monthTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1976D2',
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendColor: {
        width: 16,
        height: 16,
        borderRadius: 4,
        marginRight: 4,
    },
    legendText: {
        fontSize: 12,
        color: '#666',
    },
    weekdayHeader: {
        flexDirection: 'row',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    weekdayCell: {
        width: '14.285714%',
        alignItems: 'center',
        paddingVertical: 20,
    },
    weekdayText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    scrollContent: {
        flexGrow: 1,
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    dayCell: {
        width: '14.285714%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 2,
    },
    dayWithData: {
        flex: 1,
        borderRadius: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 1,
        minHeight: 0,
        minWidth: '100%',
    },
    todayCell: {
        borderWidth: 2,
        borderColor: '#1976D2',
    },
    dayNumber: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    dayNumberComplete: {
        color: '#fff',
    },
    todayText: {
        fontWeight: '700',
    },
    progressText: {
        fontSize: 10,
        color: '#fff',
        marginTop: 2,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#666',
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '85%',
        maxHeight: '70%',
        elevation: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1976D2',
        marginBottom: 16,
        textAlign: 'center',
    },
    noMealsText: {
        textAlign: 'center',
        color: '#666',
        fontSize: 14,
        marginVertical: 24,
    },
    mealsList: {
        maxHeight: 300,
    },
    mealItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    mealInfo: {
        flex: 1,
        marginLeft: 12,
    },
    mealName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    mealItems: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    closeButton: {
        backgroundColor: '#1976D2',
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 16,
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
    },
});

export default CalendarioRefeicoes;
