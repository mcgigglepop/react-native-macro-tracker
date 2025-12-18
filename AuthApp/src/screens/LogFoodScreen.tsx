import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import ApiService, { FoodRecord } from '../services/apiService';

interface LogFoodScreenProps {
  navigation: any;
}

const LogFoodScreen: React.FC<LogFoodScreenProps> = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [foodRecords, setFoodRecords] = useState<FoodRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Calculate totals from food records
  const dailyCalories = foodRecords.reduce((sum, record) => sum + (record.calories || 0), 0);
  const macros = {
    protein: foodRecords.reduce((sum, record) => sum + (record.protein || 0), 0),
    carbs: foodRecords.reduce((sum, record) => sum + (record.carbs || 0), 0),
    fat: foodRecords.reduce((sum, record) => sum + (record.fats || 0), 0),
  };

  // Fetch food records on mount and when screen comes into focus
  useEffect(() => {
    fetchFoodRecords();
    
    // Set up focus listener to refresh data when screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      fetchFoodRecords();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchFoodRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const records = await ApiService.getFoodRecords();
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

  const handleOpenModal = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    // Reset form fields
    setFoodName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
  };

  const handleSaveFood = async () => {
    // Validate input
    if (!foodName.trim()) {
      Alert.alert('Error', 'Please enter a food name');
      return;
    }

    const caloriesNum = parseFloat(calories);
    const proteinNum = parseFloat(protein);
    const carbsNum = parseFloat(carbs);
    const fatNum = parseFloat(fat);

    if (isNaN(caloriesNum) || isNaN(proteinNum) || isNaN(carbsNum) || isNaN(fatNum)) {
      Alert.alert('Error', 'Please enter valid numbers for all macros');
      return;
    }

    if (caloriesNum < 0 || proteinNum < 0 || carbsNum < 0 || fatNum < 0) {
      Alert.alert('Error', 'Macro values cannot be negative');
      return;
    }

    try {
      setSaving(true);
      const success = await ApiService.createFoodRecord({
        name: foodName.trim(),
        calories: caloriesNum,
        protein: proteinNum,
        carbs: carbsNum,
        fat: fatNum,
      });

      if (success) {
        handleCloseModal();
        // Refresh food records
        await fetchFoodRecords();
        Alert.alert('Success', 'Food record saved successfully');
      } else {
        Alert.alert('Error', 'Failed to save food record');
      }
    } catch (err) {
      console.error('Error saving food record:', err);
      Alert.alert('Error', 'Failed to save food record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Food Journal</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Fixed Daily Calories Card */}
      <View style={styles.caloriesCard}>
        <Text style={styles.caloriesLabel}>Daily Calories Consumed</Text>
        <Text style={styles.caloriesValue}>{dailyCalories}</Text>
        <Text style={styles.caloriesUnit}>kcal</Text>
      </View>

      {/* Fixed Macros Card */}
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

      {/* Fixed Add Food Button */}
      <TouchableOpacity 
        style={styles.addFoodButton}
        onPress={handleOpenModal}
      >
        <Text style={styles.addFoodButtonText}>+ Log Food</Text>
      </TouchableOpacity>

      {/* Fixed Section Title */}
      <View style={styles.fixedSectionTitle}>
        <Text style={styles.sectionTitle}>Foods Logged Today</Text>
      </View>

      {/* Scrollable Foods List */}
      <ScrollView 
        style={styles.foodsScrollView}
        contentContainerStyle={styles.foodsScrollContent}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading food records...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchFoodRecords}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : foodRecords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No food records for today</Text>
            <Text style={styles.emptySubtext}>Tap "+ Log Food" to add your first entry</Text>
          </View>
        ) : (
          foodRecords.map((food, index) => (
            <View key={`${food.date}-${food.name}-${index}`} style={styles.foodItem}>
              <View style={styles.foodHeader}>
                <Text style={styles.foodName}>{food.name}</Text>
              </View>
              <View style={styles.foodMacros}>
                <View style={styles.foodMacroItem}>
                  <Text style={styles.foodMacroLabel}>Calories</Text>
                  <Text style={styles.foodMacroValue}>{food.calories}</Text>
                </View>
                <View style={styles.foodMacroItem}>
                  <Text style={styles.foodMacroLabel}>Protein</Text>
                  <Text style={styles.foodMacroValue}>{food.protein}g</Text>
                </View>
                <View style={styles.foodMacroItem}>
                  <Text style={styles.foodMacroLabel}>Carbs</Text>
                  <Text style={styles.foodMacroValue}>{food.carbs}g</Text>
                </View>
                <View style={styles.foodMacroItem}>
                  <Text style={styles.foodMacroLabel}>Fat</Text>
                  <Text style={styles.foodMacroValue}>{food.fats}g</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal for Logging Food */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Food</Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Food Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter food name"
                  value={foodName}
                  onChangeText={setFoodName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Calories</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter calories"
                  value={calories}
                  onChangeText={setCalories}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Protein (g)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter protein in grams"
                  value={protein}
                  onChangeText={setProtein}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Carbs (g)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter carbs in grams"
                  value={carbs}
                  onChangeText={setCarbs}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Fat (g)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter fat in grams"
                  value={fat}
                  onChangeText={setFat}
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity 
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSaveFood}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Food</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: '#f5f5f5',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSpacer: {
    width: 60,
  },
  caloriesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
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
    marginHorizontal: 20,
    marginBottom: 16,
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
  addFoodButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addFoodButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  fixedSectionTitle: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#f5f5f5',
  },
  foodsScrollView: {
    flex: 1,
  },
  foodsScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  foodItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  foodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  foodName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  foodQuantity: {
    fontSize: 14,
    color: '#666',
  },
  foodMacros: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  foodMacroItem: {
    alignItems: 'center',
    flex: 1,
  },
  foodMacroLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  foodMacroValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: '300',
  },
  modalForm: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    opacity: 0.6,
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
    marginTop: 20,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default LogFoodScreen;

