import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import ApiService, { FoodRecord } from '../services/apiService';

interface DashboardScreenProps {
  navigation: any;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { logout } = useAuth();
  const [foodRecords, setFoodRecords] = useState<FoodRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
  }, [selectedDate]);

  useEffect(() => {
    // Set up focus listener to refresh data when screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      fetchFoodRecords(selectedDate);
    });

    return unsubscribe;
  }, [navigation, selectedDate]);

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

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
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
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <TouchableOpacity style={styles.logoutButtonMinimal} onPress={handleLogout}>
            <Text style={styles.logoutButtonTextMinimal}>Logout</Text>
          </TouchableOpacity>
        </View>
          
        {/* Date Selector */}
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
            </View>

            {/* Log Food Button */}
            <TouchableOpacity 
              style={styles.logFoodButton}
              onPress={() => navigation.navigate('LogFood')}
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
    marginBottom: 20,
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
    marginBottom: 20,
    paddingHorizontal: 10,
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
  logoutButtonMinimal: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  logoutButtonTextMinimal: {
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