import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  FlatList,
  RefreshControl
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import ApiService, { FoodRecord, FoodEntry } from '../services/apiService';

interface CalorieEntry {
  id: string;
  name: string;
  calories: number;
  fat: number;
  protein: number;
  carbs: number;
  date: string;
  time: string;
}

const CaloriesScreen: React.FC = () => {
  const { dailyCaloriesGoal } = useAuth();
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [fat, setFat] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [consumed, setConsumed] = useState(0);
  const [totalFat, setTotalFat] = useState(0);
  const [totalProtein, setTotalProtein] = useState(0);
  const [totalCarbs, setTotalCarbs] = useState(0);
  const [entries, setEntries] = useState<CalorieEntry[]>([]);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [isLoadingFoodEntries, setIsLoadingFoodEntries] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Fetch food entries when component mounts
  useEffect(() => {
    fetchFoodEntries();
  }, []);

  const fetchFoodEntries = async () => {
    try {
      setIsLoadingFoodEntries(true);
      console.log('Fetching food entries for today:', today);
      
      const entries = await ApiService.getFoodEntries(today);
      console.log('Food entries fetched:', entries);
      
      setFoodEntries(entries);
      
      // Calculate totals from API data
      let totalCalories = 0;
      let totalFat = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      
      entries.forEach(entry => {
        // Calculate calories if not provided (4 calories per gram of protein/carbs, 9 for fat)
        const entryCalories = entry.Calories || (entry.Protein * 4 + entry.Carbs * 4 + entry.Fats * 9);
        totalCalories += entryCalories;
        totalFat += entry.Fats;
        totalProtein += entry.Protein;
        totalCarbs += entry.Carbs;
      });
      
      setConsumed(totalCalories);
      setTotalFat(totalFat);
      setTotalProtein(totalProtein);
      setTotalCarbs(totalCarbs);
      
    } catch (error) {
      console.error('Error fetching food entries:', error);
      Alert.alert('Error', 'Failed to load food entries. Please try again.');
    } finally {
      setIsLoadingFoodEntries(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFoodEntries();
    setRefreshing(false);
  };

  const deleteFoodEntry = async (foodDate: string, foodId: string, foodName: string) => {
    try {
      console.log('Attempting to delete food entry:', foodName, 'with FoodDate:', foodDate, 'and FoodId:', foodId);
      
      const success = await ApiService.deleteFoodRecord(foodDate, foodId);
      if (success) {
        console.log('Food entry deleted successfully');
        // Refresh the food entries to update the list
        await fetchFoodEntries();
        Alert.alert('Success', `${foodName} has been deleted!`);
      } else {
        console.log('Failed to delete food entry');
        Alert.alert('Error', 'Failed to delete food entry. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting food entry:', error);
      Alert.alert('Error', 'Failed to delete food entry. Please try again.');
    }
  };

  const bulkDeleteToday = async () => {
    try {
      if (foodEntries.length === 0) {
        Alert.alert('No Entries', 'There are no food entries to reset for today.');
        return;
      }

      console.log('Attempting to bulk delete all food entries for today');
      
      // Prepare the items array for bulk delete
      const deleteItems = foodEntries
        .filter(entry => entry.FoodId) // Only include entries with FoodId
        .map(entry => ({
          FoodDate: entry.FoodDate,
          FoodId: entry.FoodId!
        }));

      if (deleteItems.length === 0) {
        Alert.alert('No Entries', 'No valid food entries found to delete.');
        return;
      }

      console.log('Bulk delete items:', deleteItems);
      
      const success = await ApiService.bulkDeleteFoodRecords(deleteItems);
      if (success) {
        console.log('All food entries deleted successfully');
        // Refresh the food entries to update the list
        await fetchFoodEntries();
        Alert.alert('Success', `All ${deleteItems.length} food entries have been deleted!`);
      } else {
        console.log('Failed to bulk delete food entries');
        Alert.alert('Error', 'Failed to delete food entries. Please try again.');
      }
    } catch (error) {
      console.error('Error bulk deleting food entries:', error);
      Alert.alert('Error', 'Failed to delete food entries. Please try again.');
    }
  };

  const handleAddCalories = async () => {
    if (!calories || isNaN(Number(calories))) {
      Alert.alert('Error', 'Please enter a valid number for calories');
      return;
    }
    
    if (!foodName.trim()) {
      Alert.alert('Error', 'Please enter a food name');
      return;
    }
    
    const newEntry: CalorieEntry = {
      id: Date.now().toString(),
      name: foodName,
      calories: Number(calories),
      fat: fat ? Number(fat) : 0,
      protein: protein ? Number(protein) : 0,
      carbs: carbs ? Number(carbs) : 0,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
    };
    
    // Save to API
    const foodRecord: FoodRecord = {
      date: newEntry.date,
      name: newEntry.name,
      calories: newEntry.calories,
      protein: newEntry.protein,
      carbs: newEntry.carbs,
      fats: newEntry.fat
    };
    
    try {
      const success = await ApiService.saveFoodRecord(foodRecord);
      if (success) {
        // Clear all inputs
        setFoodName('');
        setCalories('');
        setFat('');
        setProtein('');
        setCarbs('');
        
        // Refresh food entries to get the updated list
        await fetchFoodEntries();
        
        Alert.alert('Success', `${foodName} (${calories} calories) saved!`);
      } else {
        Alert.alert('Error', 'Failed to save food record. Please try again.');
      }
    } catch (error) {
      console.error('Error saving food record:', error);
      Alert.alert('Error', 'Failed to save food record. Please try again.');
    }
  };

  const remaining = dailyCaloriesGoal - consumed;
  const progress = (consumed / dailyCaloriesGoal) * 100;

  const renderCalorieEntry = ({ item }: { item: CalorieEntry }) => (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <View style={styles.entryInfo}>
          <Text style={styles.entryName}>{item.name}</Text>
          <Text style={styles.entryDate}>{item.date}</Text>
        </View>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => {
            Alert.alert(
              'Delete Entry',
              `Are you sure you want to delete this ${item.calories} calorie entry?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete', 
                  style: 'destructive',
                  onPress: () => {
                    setEntries(entries.filter(entry => entry.id !== item.id));
                    setConsumed(consumed - item.calories);
                    setTotalFat(totalFat - item.fat);
                    setTotalProtein(totalProtein - item.protein);
                    setTotalCarbs(totalCarbs - item.carbs);
                  }
                }
              ]
            );
          }}
        >
          <Text style={styles.deleteButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.entryStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.fat}</Text>
          <Text style={styles.statLabel}>fat (g)</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.protein}</Text>
          <Text style={styles.statLabel}>protein (g)</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.carbs}</Text>
          <Text style={styles.statLabel}>carbs (g)</Text>
        </View>
      </View>
    </View>
  );

  const renderFoodEntry = ({ item }: { item: FoodEntry }) => {
    // Calculate calories if not provided
    const calories = item.Calories || (item.Protein * 4 + item.Carbs * 4 + item.Fats * 9);
    
    return (
      <View style={styles.entryCard}>
        <View style={styles.entryHeader}>
          <View style={styles.entryInfo}>
            <Text style={styles.entryName}>{item.FoodName}</Text>
            <Text style={styles.entryDate}>{item.FoodDate}</Text>
          </View>
          <View style={styles.headerActions}>
            <View style={styles.caloriesBadge}>
              <Text style={styles.caloriesText}>{Math.round(calories)} cal</Text>
            </View>
            {item.FoodId && (
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => {
                  Alert.alert(
                    'Delete Food Entry',
                    `Are you sure you want to delete "${item.FoodName}"?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Delete', 
                        style: 'destructive',
                        onPress: () => deleteFoodEntry(item.FoodDate, item.FoodId!, item.FoodName)
                      }
                    ]
                  );
                }}
              >
                <Text style={styles.deleteButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.entryStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.Fats}</Text>
            <Text style={styles.statLabel}>fat (g)</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.Protein}</Text>
            <Text style={styles.statLabel}>protein (g)</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.Carbs}</Text>
            <Text style={styles.statLabel}>carbs (g)</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Calorie Tracker</Text>
          <Text style={styles.subtitle}>Track your daily nutrition</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{consumed}</Text>
            <Text style={styles.statLabel}>Calories Consumed</Text>
          </View>
          <View style={[styles.statCard, remaining < 0 && styles.overGoalCard]}>
            <Text style={[styles.statNumber, remaining < 0 && styles.overGoalText]}>{remaining}</Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
        </View>

        <View style={styles.macrosContainer}>
          <Text style={styles.progressLabel}>Macronutrients (grams)</Text>
          <View style={styles.macrosRow}>
            <View style={styles.macroCard}>
              <Text style={styles.macroNumber}>{totalFat}</Text>
              <Text style={styles.macroLabel}>Fat</Text>
            </View>
            <View style={styles.macroCard}>
              <Text style={styles.macroNumber}>{totalProtein}</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macroCard}>
              <Text style={styles.macroNumber}>{totalCarbs}</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>Daily Progress ({dailyCaloriesGoal} calories)</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}% of daily goal</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Add Food & Calories</Text>
          <TextInput
            style={styles.foodNameInput}
            placeholder="Food Name (e.g., Grilled Chicken Breast)"
            value={foodName}
            onChangeText={setFoodName}
          />
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Calories"
              value={calories}
              onChangeText={setCalories}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddCalories}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.macrosInputRow}>
            <View style={styles.macroInput}>
              <Text style={styles.macroInputLabel}>Fat (g)</Text>
              <TextInput
                style={styles.macroTextInput}
                placeholder="0"
                value={fat}
                onChangeText={setFat}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.macroInput}>
              <Text style={styles.macroInputLabel}>Protein (g)</Text>
              <TextInput
                style={styles.macroTextInput}
                placeholder="0"
                value={protein}
                onChangeText={setProtein}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.macroInput}>
              <Text style={styles.macroInputLabel}>Carbs (g)</Text>
              <TextInput
                style={styles.macroTextInput}
                placeholder="0"
                value={carbs}
                onChangeText={setCarbs}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>



                <View style={styles.inputContainer}>
          <Text style={styles.progressLabel}>Today's Food Entries</Text>
          {isLoadingFoodEntries ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading food entries...</Text>
            </View>
          ) : foodEntries.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No food entries for today</Text>
              <Text style={styles.emptySubtext}>Add your first meal above!</Text>
            </View>
          ) : (
            <FlatList
              data={foodEntries}
              renderItem={renderFoodEntry}
              keyExtractor={(item, index) => item.FoodId || `${item.FoodName}-${item.FoodDate}-${index}`}
              scrollEnabled={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          )}
        </View>

        <TouchableOpacity 
          style={styles.resetButton}
          onPress={() => {
            Alert.alert(
              'Reset Today',
              `Are you sure you want to delete all ${foodEntries.length} food entries for today? This action cannot be undone.`,
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Reset', 
                  style: 'destructive', 
                  onPress: bulkDeleteToday
                }
              ]
            );
          }}
        >
          <Text style={styles.resetButtonText}>Reset Today</Text>
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
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  overGoalCard: {
    backgroundColor: '#fff5f5',
    borderColor: '#fed7d7',
  },
  overGoalText: {
    color: '#e53e3e',
  },
  progressContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginRight: 12,
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  resetButton: {
    backgroundColor: '#dc3545',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  macrosContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  macroNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  macrosInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  macroInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  macroInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  macroTextInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    backgroundColor: '#fafafa',
    textAlign: 'center',
  },
  recentEntriesContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  entryCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  entryInfo: {
    flex: 1,
  },
  entryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  entryDate: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    backgroundColor: '#ff4757',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  entryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  foodNameInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
  },
  caloriesBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginLeft: 10,
  },
  caloriesText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default CaloriesScreen; 