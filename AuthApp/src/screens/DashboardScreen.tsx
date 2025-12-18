import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';

interface DashboardScreenProps {
  navigation: any;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { logout } = useAuth();

  // Mock data for UI display (no functionality)
  const dailyCalories = 1850;
  const macros = {
    protein: 120,
    carbs: 200,
    fat: 65,
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
  const proteinPercent = (macros.protein * 4 / totalMacroCalories) * 100;
  const carbsPercent = (macros.carbs * 4 / totalMacroCalories) * 100;
  const fatPercent = (macros.fat * 9 / totalMacroCalories) * 100;

  // Simple pie chart component
  const PieChart = () => {
    return (
      <View style={styles.pieChartContainer}>
        <View style={styles.pieChartWrapper}>
          {/* Circular pie chart visualization using stacked segments */}
          <View style={styles.pieChartOuter}>
            {/* Protein slice - starts at 0 */}
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
          </View>
          {/* Center label overlay */}
          <View style={styles.pieChartCenterOverlay}>
            <Text style={styles.pieChartCenterText}>Macros</Text>
          </View>
        </View>
        
        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4A90E2' }]} />
            <Text style={styles.legendText}>Protein: {macros.protein}g ({proteinPercent.toFixed(1)}%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#50C878' }]} />
            <Text style={styles.legendText}>Carbs: {macros.carbs}g ({carbsPercent.toFixed(1)}%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FF6B6B' }]} />
            <Text style={styles.legendText}>Fat: {macros.fat}g ({fatPercent.toFixed(1)}%)</Text>
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
        </View>

        {/* Daily Calories Card */}
        <View style={styles.caloriesCard}>
          <Text style={styles.caloriesLabel}>Daily Calories Consumed</Text>
          <Text style={styles.caloriesValue}>{dailyCalories}</Text>
          <Text style={styles.caloriesUnit}>kcal</Text>
        </View>

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
          <Text style={styles.sectionTitle}>Macro Breakdown</Text>
          <PieChart />
        </View>

        {/* Log Food Button */}
        <TouchableOpacity 
          style={styles.logFoodButton}
          onPress={() => navigation.navigate('LogFood')}
        >
          <Text style={styles.logFoodButtonText}>Log Food</Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
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
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  caloriesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
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
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  caloriesValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  caloriesUnit: {
    fontSize: 18,
    color: '#999',
  },
  macrosCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 14,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pieChartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
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
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pieChartOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  pieSegment: {
    height: '100%',
  },
  proteinSegment: {
    backgroundColor: '#4A90E2',
  },
  carbsSegment: {
    backgroundColor: '#50C878',
  },
  fatSegment: {
    backgroundColor: '#FF6B6B',
  },
  pieChartCenterOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -12 }],
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  legend: {
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
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
  logoutButton: {
    backgroundColor: '#dc3545',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#dc3545',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default DashboardScreen; 