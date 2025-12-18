import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigationCleanup } from '../utils/navigationUtils';
import { ApiService, FoodEntry } from '../services/apiService';
import { Svg, Circle, G, Text as SvgText } from 'react-native-svg';

interface DashboardScreenProps {
  navigation: any;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useNavigationCleanup();

  useEffect(() => {
    loadFoodEntries();
  }, []);

  const loadFoodEntries = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const entries = await ApiService.getFoodEntries(today);
      setFoodEntries(entries || []);
    } catch (error) {
      console.error('Error loading food entries:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFoodEntries();
  };

  const calculateCalories = (fats: number, protein: number, carbs: number): number => {
    return fats * 9 + protein * 4 + carbs * 4;
  };

  const calculateTotals = () => {
    const totals = foodEntries.reduce(
      (acc, entry) => {
        const calories = calculateCalories(entry.Fats || 0, entry.Protein || 0, entry.Carbs || 0);
        return {
          fats: acc.fats + (entry.Fats || 0),
          protein: acc.protein + (entry.Protein || 0),
          carbs: acc.carbs + (entry.Carbs || 0),
          calories: acc.calories + calories,
        };
      },
      { fats: 0, protein: 0, carbs: 0, calories: 0 }
    );
    return totals;
  };

  const totals = calculateTotals();
  const totalGrams = totals.fats + totals.protein + totals.carbs;

  // Calculate percentages for pie chart
  const fatPercentage = totalGrams > 0 ? (totals.fats / totalGrams) * 100 : 0;
  const proteinPercentage = totalGrams > 0 ? (totals.protein / totalGrams) * 100 : 0;
  const carbsPercentage = totalGrams > 0 ? (totals.carbs / totalGrams) * 100 : 0;

  // Pie chart configuration
  const size = 200;
  const strokeWidth = 40;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Calculate stroke dasharray and offset for each segment
  // Start from top (12 o'clock position)
  const fatDashArray = (fatPercentage / 100) * circumference;
  const proteinDashArray = (proteinPercentage / 100) * circumference;
  const carbsDashArray = (carbsPercentage / 100) * circumference;

  // Calculate stroke dashoffset (circumference - dashArray to show the segment)
  const fatOffset = circumference - fatDashArray;
  const proteinOffset = circumference - (fatDashArray + proteinDashArray);
  const carbsOffset = circumference - (fatDashArray + proteinDashArray + carbsDashArray);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Macro Tracker</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Today's Calories</Text>
              <Text style={styles.calories}>{Math.round(totals.calories)}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Macros (grams)</Text>
              <View style={styles.macroRow}>
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>Fat</Text>
                  <Text style={styles.macroValue}>{Math.round(totals.fats)}g</Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>Protein</Text>
                  <Text style={styles.macroValue}>{Math.round(totals.protein)}g</Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>Carbs</Text>
                  <Text style={styles.macroValue}>{Math.round(totals.carbs)}g</Text>
                </View>
              </View>
            </View>

            {totalGrams > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Macro Split</Text>
                <View style={styles.chartContainer}>
                  <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <G>
                      {/* Background circle */}
                      <Circle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke="#e0e0e0"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                      />
                      <G transform={`rotate(-90 ${center} ${center})`}>
                        {/* Fat segment (first) */}
                        {fatPercentage > 0 && (
                          <Circle
                            cx={center}
                            cy={center}
                            r={radius}
                            stroke="#FF6B6B"
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            strokeDasharray={`${fatDashArray} ${circumference}`}
                            strokeDashoffset={0}
                            strokeLinecap="round"
                          />
                        )}
                        {/* Protein segment (second) */}
                        {proteinPercentage > 0 && (
                          <Circle
                            cx={center}
                            cy={center}
                            r={radius}
                            stroke="#4ECDC4"
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            strokeDasharray={`${proteinDashArray} ${circumference}`}
                            strokeDashoffset={-fatDashArray}
                            strokeLinecap="round"
                          />
                        )}
                        {/* Carbs segment (third) */}
                        {carbsPercentage > 0 && (
                          <Circle
                            cx={center}
                            cy={center}
                            r={radius}
                            stroke="#FFE66D"
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            strokeDasharray={`${carbsDashArray} ${circumference}`}
                            strokeDashoffset={-(fatDashArray + proteinDashArray)}
                            strokeLinecap="round"
                          />
                        )}
                      </G>
                    </G>
                  </Svg>
                  <View style={styles.legend}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendColor, { backgroundColor: '#FF6B6B' }]} />
                      <Text style={styles.legendText}>Fat: {fatPercentage.toFixed(1)}%</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendColor, { backgroundColor: '#4ECDC4' }]} />
                      <Text style={styles.legendText}>Protein: {proteinPercentage.toFixed(1)}%</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendColor, { backgroundColor: '#FFE66D' }]} />
                      <Text style={styles.legendText}>Carbs: {carbsPercentage.toFixed(1)}%</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.logFoodButton}
              onPress={() => navigation.navigate('FoodLog')}
            >
              <Text style={styles.logFoodButtonText}>Log Food</Text>
            </TouchableOpacity>
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
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#007AFF',
    fontSize: 16,
  },
  loader: {
    marginTop: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  calories: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  macroValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  legend: {
    marginTop: 20,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  legendText: {
    fontSize: 16,
    color: '#333',
  },
  logFoodButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 18,
    marginTop: 8,
    alignItems: 'center',
  },
  logFoodButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default DashboardScreen;
