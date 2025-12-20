import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import ApiService, { FoodRecord } from '../services/apiService';

interface DashboardScreenProps {
  navigation: any;
  route: any;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation, route }) => {
  const [foodRecords, setFoodRecords] = useState<FoodRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sevenDayAverage, setSevenDayAverage] = useState<number | null>(null);
  const [centeredWeekAverage, setCenteredWeekAverage] = useState<number | null>(null);
  const [centeredWeekDaysRemaining, setCenteredWeekDaysRemaining] = useState<number>(0);
  const [loadingAverages, setLoadingAverages] = useState(false);
  const [sevenDayTotals, setSevenDayTotals] = useState<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null>(null);
  const [centeredWeekTotals, setCenteredWeekTotals] = useState<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null>(null);
  
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };
  
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());

  // Calculate totals from food records
  const dailyCalories = foodRecords.reduce((sum, record) => sum + (record.calories || 0), 0);
  const macros = {
    protein: foodRecords.reduce((sum, record) => sum + (record.protein || 0), 0),
    carbs: foodRecords.reduce((sum, record) => sum + (record.carbs || 0), 0),
    fat: foodRecords.reduce((sum, record) => sum + (record.fats || 0), 0),
  };

  // Fetch food records when selectedDate changes and when screen comes into focus
  useEffect(() => {
    fetchFoodRecords(selectedDate);
    fetchAverages(selectedDate);
  }, [selectedDate]);

  // Fetch averages when component mounts or screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAverages(selectedDate);
    });

    return unsubscribe;
  }, [navigation, selectedDate]);

  useEffect(() => {
    // Set up focus listener to refresh data when screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      // Check if a date was passed from navigation params (e.g., from LogFood screen)
      const dateFromParams = route.params?.date;
      if (dateFromParams && dateFromParams !== selectedDate) {
        // Date changed, update it (which will trigger the useEffect to fetch)
        setSelectedDate(dateFromParams);
      } else {
        // Always refresh data when screen comes into focus to ensure we have latest data
        // Use the date from params if available, otherwise use selectedDate
        const dateToFetch = dateFromParams || selectedDate;
        fetchFoodRecords(dateToFetch);
      }
    });

    return unsubscribe;
  }, [navigation, selectedDate, route.params?.date]);

  // Also check params on mount/update
  useEffect(() => {
    const dateFromParams = route.params?.date;
    if (dateFromParams && dateFromParams !== selectedDate) {
      setSelectedDate(dateFromParams);
    }
  }, [route.params?.date]);

  const fetchFoodRecords = async (date?: string) => {
    try {
      setLoading(true);
      setError(null);
      const records = await ApiService.getFoodRecords(date || selectedDate);
      if (records !== null) {
        setFoodRecords(records);
      } else {
        setError('Failed to fetch food records');
      }
    } catch (err) {
      console.error('Error fetching food records:', err);
      setError('Failed to load food records');
    } finally {
      setLoading(false);
    }
  };

  const fetchAverages = async (date: string = selectedDate) => {
    try {
      setLoadingAverages(true);
      const selectedDateObj = new Date(date + 'T00:00:00');
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const isFutureDate = date > todayStr;

      // Calculate 7-day rolling average (last 7 days including selected date)
      const sevenDaysAgo = new Date(selectedDateObj);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // 6 days ago + selected date = 7 days
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

      // Calculate centered 7-day period (3 days before, selected date, 3 days after)
      // Since we can't see future, we'll use: 3 days before, selected date, and show what's remaining
      const threeDaysAgo = new Date(selectedDateObj);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];
      
      // For centered week, end date is selected date (or today if selected date is in the future)
      const centeredWeekEndDate = isFutureDate ? todayStr : date;

      // Fetch 7-day rolling data (ending on selected date, or today if selected date is in the future)
      const sevenDayEndDate = isFutureDate ? todayStr : date;
      const sevenDayData = await ApiService.getFoodRecordsRange(sevenDaysAgoStr, sevenDayEndDate);
      
      // Fetch centered week data (3 days before + selected date)
      const centeredWeekData = await ApiService.getFoodRecordsRange(threeDaysAgoStr, centeredWeekEndDate);

      if (sevenDayData) {
        // Calculate 7-day rolling average and totals
        const days = Object.keys(sevenDayData).sort();
        const totals = days.reduce((acc, date) => ({
          calories: acc.calories + (sevenDayData[date]?.calories || 0),
          protein: acc.protein + (sevenDayData[date]?.protein || 0),
          carbs: acc.carbs + (sevenDayData[date]?.carbs || 0),
          fat: acc.fat + (sevenDayData[date]?.fat || 0),
        }), {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        });
        
        const average = days.length > 0 ? totals.calories / days.length : 0;
        setSevenDayAverage(average);
        setSevenDayTotals(totals);
      }

      if (centeredWeekData) {
        // Calculate centered week average and totals (so far)
        const days = Object.keys(centeredWeekData).sort();
        const totals = days.reduce((acc, date) => ({
          calories: acc.calories + (centeredWeekData[date]?.calories || 0),
          protein: acc.protein + (centeredWeekData[date]?.protein || 0),
          carbs: acc.carbs + (centeredWeekData[date]?.carbs || 0),
          fat: acc.fat + (centeredWeekData[date]?.fat || 0),
        }), {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        });
        const daysSoFar = days.length;
        const average = daysSoFar > 0 ? totals.calories / daysSoFar : 0;
        setCenteredWeekAverage(average);
        setCenteredWeekTotals(totals);
        
        // Calculate remaining days: 7-day period centered on selected date
        // If viewing a past date, all 7 days are in the past, so 0 remaining
        // If viewing today or future, calculate remaining days
        const selectedDateObj = new Date(date + 'T00:00:00');
        const threeDaysAfter = new Date(selectedDateObj);
        threeDaysAfter.setDate(threeDaysAfter.getDate() + 3);
        const threeDaysAfterStr = threeDaysAfter.toISOString().split('T')[0];
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        // Remaining days are the days after selected date that haven't happened yet
        const remainingDays = threeDaysAfterStr > todayStr 
          ? Math.max(0, Math.ceil((new Date(threeDaysAfterStr).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)))
          : 0;
        setCenteredWeekDaysRemaining(remainingDays);
      }
    } catch (err: any) {
      console.error('Error fetching averages:', err);
      // If it's a 403 error, the endpoint might not be deployed yet - set averages to null
      if (err?.message?.includes('403')) {
        console.log('Averages endpoint not available (likely not deployed yet)');
        setSevenDayAverage(null);
        setCenteredWeekAverage(null);
        setSevenDayTotals(null);
        setCenteredWeekTotals(null);
      }
      // Don't set error state - averages are secondary data
    } finally {
      setLoadingAverages(false);
    }
  };

  // Navigate to previous day
  const goToPreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  // Navigate to next day
  const goToNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    const newDate = date.toISOString().split('T')[0];
    const today = getTodayDate();
    
    // Don't allow navigation to future dates
    if (newDate <= today) {
      setSelectedDate(newDate);
    }
  };

  // Format date for display (e.g., "Monday, January 15, 2024")
  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues
    const today = new Date(getTodayDate() + 'T00:00:00');
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    if (date.toISOString().split('T')[0] === today.toISOString().split('T')[0]) {
      return 'Today, ' + date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } else if (date.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday, ' + date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', options);
    }
  };

  const canGoToNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0] <= getTodayDate();
  };

  const showAveragesExplanation = () => {
    Alert.alert(
      'Understanding Calorie Averages',
      `7-Day Rolling Average:
Shows your average daily calories over the last 7 days ending on the selected date. This helps you see your recent calorie intake trend.

Current Week Average:
Shows your average for a 7-day period centered on the selected date (3 days before, selected date, 3 days after). This helps you plan for the remaining days in that week period.`,
      [{ text: 'Got it', style: 'default' }],
      { cancelable: true }
    );
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  // Calculate percentages for pie chart
  const totalMacroCalories = macros.protein * 4 + macros.carbs * 4 + macros.fat * 9;
  const proteinPercent = totalMacroCalories > 0 ? (macros.protein * 4 / totalMacroCalories) * 100 : 0;
  const carbsPercent = totalMacroCalories > 0 ? (macros.carbs * 4 / totalMacroCalories) * 100 : 0;
  const fatPercent = totalMacroCalories > 0 ? (macros.fat * 9 / totalMacroCalories) * 100 : 0;

  // Simple pie chart component
  const PieChart = () => {
    const hasMacros = totalMacroCalories > 0;

  return (
      <View style={styles.pieChartContainer}>
        <View style={styles.pieChartWrapper}>
          {/* Circular pie chart visualization */}
          <View style={styles.pieChartOuter}>
            {hasMacros ? (
              <>
                {/* Protein slice */}
                <View 
                  style={[
                    styles.pieSegment,
                    styles.proteinSegment,
                    { flex: proteinPercent }
                  ]} 
                />
                {/* Carbs slice */}
                <View 
                  style={[
                    styles.pieSegment,
                    styles.carbsSegment,
                    { flex: carbsPercent }
                  ]} 
                />
                {/* Fat slice */}
                <View 
                  style={[
                    styles.pieSegment,
                    styles.fatSegment,
                    { flex: fatPercent }
                  ]} 
                />
              </>
            ) : (
              /* Empty state - gray circle */
              <View style={styles.emptyPieChart} />
            )}
          </View>
          {/* Center label overlay */}
          <View style={styles.pieChartCenterOverlay}>
            <Text style={styles.pieChartCenterText}>Macros</Text>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#DC3545' }]} />
            <Text style={styles.legendText}>
              Protein: {macros.protein}g {hasMacros ? `(${proteinPercent.toFixed(1)}%)` : ''}
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#2196F3' }]} />
            <Text style={styles.legendText}>
              Carbs: {macros.carbs}g {hasMacros ? `(${carbsPercent.toFixed(1)}%)` : ''}
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FFC107' }]} />
            <Text style={styles.legendText}>
              Fat: {macros.fat}g {hasMacros ? `(${fatPercent.toFixed(1)}%)` : ''}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <TouchableOpacity style={styles.profileButtonMinimal} onPress={handleProfilePress}>
          <Text style={styles.profileButtonTextMinimal}>Profile</Text>
        </TouchableOpacity>
      </View>
        
      {/* Date Selector - Fixed */}
      <View style={styles.dateSelector}>
          <TouchableOpacity 
          style={styles.dateArrow}
          onPress={goToPreviousDay}
          >
          <Text style={styles.dateArrowText}>←</Text>
          </TouchableOpacity>
        <Text style={styles.dateText}>{formatDisplayDate(selectedDate)}</Text>
          <TouchableOpacity 
          style={[styles.dateArrow, !canGoToNextDay() && styles.dateArrowDisabled]}
          onPress={goToNextDay}
          disabled={!canGoToNextDay()}
        >
          <Text style={[styles.dateArrowText, !canGoToNextDay() && styles.dateArrowTextDisabled]}>→</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading food records...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchFoodRecords(selectedDate)}>
              <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Daily Calories Card */}
            <View style={styles.caloriesCard}>
              <Text style={styles.caloriesLabel}>Daily Calories Consumed</Text>
              <Text style={styles.caloriesValue}>{dailyCalories}</Text>
              <Text style={styles.caloriesUnit}>kcal</Text>
              
              {/* Calorie Averages Subtext */}
              <View style={styles.averagesSubtextContainer}>
                <View style={styles.averageRow}>
                  <Text style={styles.averagesSubtext}>
                    7-Day Avg: {loadingAverages ? '...' : sevenDayAverage !== null ? Math.round(sevenDayAverage) : 'N/A'} kcal/day
                  </Text>
          <TouchableOpacity 
                    style={styles.infoButton}
                    onPress={showAveragesExplanation}
          >
                    <Text style={styles.infoButtonText}>?</Text>
          </TouchableOpacity>
                </View>
                <Text style={styles.averagesSubtext}>
                  Week Avg: {loadingAverages ? '...' : centeredWeekAverage !== null ? Math.round(centeredWeekAverage) : 'N/A'} kcal/day
                  {centeredWeekDaysRemaining > 0 && ` (${centeredWeekDaysRemaining} day${centeredWeekDaysRemaining !== 1 ? 's' : ''} remaining)`}
                </Text>
              </View>
        </View>

            {/* Log Food Button */}
            <TouchableOpacity 
              style={styles.logFoodButton}
              onPress={() => navigation.navigate('LogFood', { date: selectedDate })}
            >
              <Text style={styles.logFoodButtonText}>Food Journal</Text>
        </TouchableOpacity>

            {/* Macros Card */}
            <View style={styles.macrosCard}>
              <Text style={styles.sectionTitle}>Total Daily Macros</Text>
              <View style={styles.macrosGrid}>
                <View style={styles.macroItem}>
                  <Text style={styles.macroValue}>{macros.protein}g</Text>
                  <Text style={styles.macroLabel}>Protein</Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={styles.macroValue}>{macros.carbs}g</Text>
                  <Text style={styles.macroLabel}>Carbs</Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={styles.macroValue}>{macros.fat}g</Text>
                  <Text style={styles.macroLabel}>Fat</Text>
                </View>
              </View>
            </View>

            {/* Pie Chart Card */}
            <View style={styles.pieChartCard}>
              <Text style={styles.sectionTitle}>Calorie Breakdown by Macro</Text>
              <PieChart />
            </View>

            {/* 7-Day Totals Card */}
            <View style={styles.sevenDayTotalsCard}>
              <Text style={styles.sectionTitle}>7-Day Rolling Totals</Text>
              {loadingAverages ? (
                <View style={styles.totalsLoadingContainer}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.totalsLoadingText}>Loading...</Text>
                </View>
              ) : sevenDayTotals ? (
                <>
                  <View style={styles.totalsCaloriesContainer}>
                    <Text style={styles.totalsCaloriesValue}>{Math.round(sevenDayTotals.calories)}</Text>
                    <Text style={styles.totalsCaloriesLabel}>Total Calories Consumed (past 7 days)</Text>
                  </View>
                  <View style={styles.totalsMacrosGrid}>
                    <View style={styles.totalsMacroItem}>
                      <Text style={styles.totalsMacroValue}>{Math.round(sevenDayTotals.protein)}g</Text>
                      <Text style={styles.totalsMacroLabel}>Protein</Text>
                    </View>
                    <View style={styles.totalsMacroItem}>
                      <Text style={styles.totalsMacroValue}>{Math.round(sevenDayTotals.carbs)}g</Text>
                      <Text style={styles.totalsMacroLabel}>Carbs</Text>
                    </View>
                    <View style={styles.totalsMacroItem}>
                      <Text style={styles.totalsMacroValue}>{Math.round(sevenDayTotals.fat)}g</Text>
                      <Text style={styles.totalsMacroLabel}>Fat</Text>
                    </View>
                  </View>
                  
                  {/* Centered Week Totals */}
                  {centeredWeekTotals && centeredWeekDaysRemaining > 0 && (
                    <>
                      <View style={styles.centeredWeekDivider} />
                      <View style={styles.totalsCaloriesContainer}>
                        <Text style={styles.totalsCaloriesValue}>{Math.round(centeredWeekTotals.calories)}</Text>
                        <Text style={styles.totalsCaloriesLabel}>
                          Week Calorie Average ({centeredWeekDaysRemaining} day{centeredWeekDaysRemaining !== 1 ? 's' : ''} remaining)
                        </Text>
                      </View>
                    </>
                  )}
                </>
              ) : (
                <Text style={styles.totalsUnavailableText}>Totals unavailable</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateArrowDisabled: {
    opacity: 0.3,
  },
  dateArrowText: {
    fontSize: 24,
    color: '#333',
    fontWeight: 'bold',
  },
  dateArrowTextDisabled: {
    color: '#999',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  averagesSection: {
    marginBottom: 20,
  },
  averagesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  averageItem: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  averageLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  averageValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  averageUnit: {
    fontSize: 14,
    color: '#999',
  },
  averageSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  averageDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  caloriesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  caloriesLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  caloriesValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 3,
  },
  caloriesUnit: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  averagesSubtextContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    width: '100%',
  },
  averageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  averagesSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  infoButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  infoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  macrosCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroValue: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 3,
  },
  macroLabel: {
    fontSize: 11,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pieChartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sevenDayTotalsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  totalsLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  totalsLoadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  totalsCaloriesContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  totalsCaloriesValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  totalsCaloriesLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalsMacrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  totalsMacroItem: {
    alignItems: 'center',
    flex: 1,
  },
  totalsMacroValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  totalsMacroLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalsUnavailableText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    paddingVertical: 20,
  },
  centeredWeekDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
    marginHorizontal: -18,
  },
  pieChartContainer: {
    alignItems: 'center',
  },
  pieChartWrapper: {
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pieChartOuter: {
    width: 150,
    height: 150,
    borderRadius: 75,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  emptyPieChart: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
    borderRadius: 100,
  },
  pieSegment: {
    height: '100%',
  },
  proteinSegment: {
    backgroundColor: '#DC3545',
  },
  carbsSegment: {
    backgroundColor: '#2196F3',
  },
  fatSegment: {
    backgroundColor: '#FFC107',
  },
  pieChartCenterOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -9 }],
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 18,
    backgroundColor: '#fff',
    borderRadius: 9,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  pieChartCenterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  legend: {
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 9,
  },
  legendText: {
    fontSize: 12,
    color: '#333',
  },
  logFoodButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logFoodButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  profileButtonMinimal: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  profileButtonTextMinimal: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DashboardScreen; 