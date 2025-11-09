import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { mealCalendarService } from '../services/MealCalendarService';

interface WeeklyMealWidgetProps {
    userId: string;
    onPress: () => void;
}

const WeeklyMealWidget: React.FC<WeeklyMealWidgetProps> = ({ userId, onPress }) => {
    const [weeklyProgress, setWeeklyProgress] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (userId) {
            loadWeeklyProgress();
        }
    }, [userId]);

    const loadWeeklyProgress = async () => {
        setLoading(true);
        try {
            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth() + 1;

            const data = await mealCalendarService.getMonthlyProgress(
                userId,
                currentYear,
                currentMonth
            );

            // Pegar os últimos 7 dias
            const last7Days = getLast7Days();
            const weekData = last7Days.map(dateStr => {
                const progress = data.find((p: any) => {
                    const pDateStr = typeof p.date === 'string' ? p.date.split('T')[0] : p.date;
                    return pDateStr === dateStr;
                });
                return {
                    date: dateStr,
                    progress: progress || null
                };
            });

            setWeeklyProgress(weekData);
        } catch (error) {
            console.error('Error loading weekly progress:', error);
        } finally {
            setLoading(false);
        }
    };

    const getLast7Days = (): string[] => {
        const days = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            days.push(dateStr);
        }

        return days;
    };

    const getColorForPercentage = (percentage: number): string => {
        if (percentage === 100) return '#4CAF50';
        if (percentage >= 75) return '#8BC34A';
        if (percentage >= 50) return '#FFC107';
        if (percentage >= 25) return '#FF9800';
        if (percentage > 0) return '#FF5722';
        return '#E0E0E0';
    };

    const getDayName = (dateStr: string): string => {
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const date = new Date(dateStr + 'T00:00:00');
        return days[date.getDay()];
    };

    const getDay = (dateStr: string): string => {
        const date = new Date(dateStr + 'T00:00:00');
        return String(date.getDate());
    };

    return (
        <TouchableOpacity
            style={styles.weeklyWidget}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={styles.widgetHeader}>
                <View style={styles.widgetHeaderLeft}>
                    <Icon name="calendar-check-o" size={18} color="#1976D2" />
                    <Text style={styles.widgetTitle}>Minha dieta</Text>
                </View>
                <Icon name="chevron-right" size={16} color="#666" />
            </View>

            {loading ? (
                <View style={styles.widgetLoading}>
                    <ActivityIndicator size="small" color="#1976D2" />
                </View>
            ) : (
                <View style={styles.weekDaysContainer}>
                    {weeklyProgress.map((day, index) => {
                        const percentage = day.progress?.completionPercentage || 0;
                        const bgColor = getColorForPercentage(percentage);
                        const isToday = index === 6; // Último dia é hoje
                        const textColor = percentage > 0 ? '#fff' : '#999';

                        return (
                            <View key={day.date} style={styles.dayColumn}>
                                <Text style={[
                                    styles.dayName,
                                    isToday && styles.todayDayName
                                ]}>
                                    {getDayName(day.date)}
                                </Text>
                                <View style={[
                                    styles.dayBar,
                                    { backgroundColor: bgColor },
                                    isToday && styles.todayBar
                                ]}>
                                    <Text style={[styles.dayNumber, { color: textColor }]}>
                                        {getDay(day.date)}
                                    </Text>
                                </View>
                                {day.progress && day.progress.totalMeals > 0 && (
                                    <Text style={styles.dayProgress}>
                                        {day.progress.completedMeals}/{day.progress.totalMeals}
                                    </Text>
                                )}
                            </View>
                        );
                    })}
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    weeklyWidget: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginTop: 10,
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    widgetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    widgetHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    widgetTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1976D2',
        marginLeft: 8,
    },
    widgetLoading: {
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    weekDaysContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
    },
    dayColumn: {
        flex: 1,
        alignItems: 'center',
        gap: 6,
    },
    dayName: {
        fontSize: 11,
        fontWeight: '600',
        color: '#666',
        textTransform: 'uppercase',
    },
    todayDayName: {
        color: '#1976D2',
        fontWeight: '700',
    },
    dayBar: {
        width: 36,
        height: 36,
        borderRadius: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    todayBar: {
        borderWidth: 2,
        borderColor: '#1976D2',
    },
    dayNumber: {
        fontSize: 16,
        fontWeight: '700',
    },
    dayProgress: {
        fontSize: 9,
        color: '#666',
        fontWeight: '600',
    },
});

export default WeeklyMealWidget;
