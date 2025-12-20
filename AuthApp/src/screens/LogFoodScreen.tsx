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
import { useSubscription } from '../context/SubscriptionContext';
import { canAccessDate, getDateRestrictionMessage } from '../utils/subscriptionUtils';
import { UpgradePrompt } from '../components/UpgradePrompt';

interface LogFoodScreenProps {
  navigation: any;
  route: any;
}

const LogFoodScreen: React.FC<LogFoodScreenProps> = ({ navigation, route }) => {
  const { isPremium } = useSubscription();
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
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradePromptMessage, setUpgradePromptMessage] = useState('');

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };
  
  // Initialize selectedDate from route params (from Dashboard) or default to today
  const getInitialDate = () => {
    return route.params?.date || getTodayDate();
  };
  
  const [selectedDate, setSelectedDate] = useState<string>(getInitialDate());

  // Calculate totals from food records
  const dailyCalories = foodRecords.reduce((sum, record) => sum + (record.calories || 0), 0);
  const macros = {
    protein: foodRecords.reduce((sum, record) => sum + (record.protein || 0), 0),
    carbs: foodRecords.reduce((sum, record) => sum + (record.carbs || 0), 0),
    fat: foodRecords.reduce((sum, record) => sum + (record.fats || 0), 0),
  };

  // Fetch food records when selectedDate changes and when screen comes into focus
  useEffect(() => {
    // Check if the selected date is accessible, if not, reset to today
    if (!canAccessDate(selectedDate, isPremium)) {
      const today = getTodayDate();
      if (selectedDate !== today) {
        setSelectedDate(today);
        return;
      }
    }
    fetchFoodRecords(selectedDate);
  }, [selectedDate, isPremium]);

  useEffect(() => {
    // Set up focus listener to refresh data when screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      // Check if a date was passed from navigation params (e.g., from Dashboard screen)
      const dateFromParams = route.params?.date;
      if (dateFromParams && dateFromParams !== selectedDate) {
        setSelectedDate(dateFromParams);
      } else {
        fetchFoodRecords(selectedDate);
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

  // Navigate to previous day
  const goToPreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    const newDate = date.toISOString().split('T')[0];
    
    if (!canAccessDate(newDate, isPremium)) {
      setUpgradePromptMessage(getDateRestrictionMessage(isPremium));
      setShowUpgradePrompt(true);
      return;
    }
    
    setSelectedDate(newDate);
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

  const isFutureDate = () => {
    return selectedDate > getTodayDate();
  };

  const canLogFoodForDate = () => {
    if (isFutureDate()) return false;
    // Premium users can log food for any past/current date
    if (isPremium) return true;
    // Free users can only log food for dates within the free range (last 7 days)
    return canAccessDate(selectedDate, false);
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

  const handleDeleteFood = async (recordId: string, foodName: string) => {
    if (!recordId) {
      Alert.alert('Error', 'Unable to delete: Record ID is missing');
      return;
    }

    Alert.alert(
      'Delete Food Record',
      `Are you sure you want to delete "${foodName}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Attempting to delete record with ID:', recordId);
              const success = await ApiService.deleteFoodRecord(recordId);
              if (success) {
                // Refresh food records
                await fetchFoodRecords(selectedDate);
                Alert.alert('Success', 'Food record deleted successfully');
              }
            } catch (err: any) {
              console.error('Error deleting food record:', err);
              Alert.alert('Error', err?.message || 'Failed to delete food record');
            }
          },
        },
      ]
    );
  };

  const handleSaveFood = async () => {
    // Check if user can log food for this date
    if (!canLogFoodForDate()) {
      setUpgradePromptMessage(
        isFutureDate() 
          ? 'Cannot add food records for future dates.'
          : getDateRestrictionMessage(isPremium)
      );
      setShowUpgradePrompt(true);
      return;
    }

    // Validate input
    if (!foodName.trim()) {
      Alert.alert('Error', 'Please enter a food name');
      return;
    }

    const proteinNum = parseFloat(protein);
    const carbsNum = parseFloat(carbs);
    const fatNum = parseFloat(fat);

    // Calories is optional - validate if provided
    const caloriesNum = calories.trim() ? parseFloat(calories) : null;

    if (isNaN(proteinNum) || isNaN(carbsNum) || isNaN(fatNum)) {
      Alert.alert('Error', 'Please enter valid numbers for protein, carbs, and fat');
      return;
    }

    if (caloriesNum !== null && isNaN(caloriesNum)) {
      Alert.alert('Error', 'Please enter a valid number for calories or leave it empty');
      return;
    }

    if (proteinNum < 0 || carbsNum < 0 || fatNum < 0) {
      Alert.alert('Error', 'Macro values cannot be negative');
      return;
    }

    if (caloriesNum !== null && caloriesNum < 0) {
      Alert.alert('Error', 'Calories cannot be negative');
      return;
    }

    // Auto-calculate calories if not provided: (protein * 4) + (carbs * 4) + (fat * 9)
    const calculatedCalories = caloriesNum !== null 
      ? caloriesNum 
      : (proteinNum * 4) + (carbsNum * 4) + (fatNum * 9);

    try {
      setSaving(true);
      console.log('Creating food record with date:', selectedDate);
      const success = await ApiService.createFoodRecord({
        name: foodName.trim(),
        calories: calculatedCalories,
        protein: proteinNum,
        carbs: carbsNum,
        fat: fatNum,
        date: selectedDate, // Pass the selected date
      });

      if (success) {
        handleCloseModal();
        // Refresh food records
        await fetchFoodRecords(selectedDate);
        Alert.alert('Success', 'Food record saved successfully');
      } else {
        Alert.alert('Error', 'Failed to save food record. Please try again.');
      }
    } catch (err: any) {
      console.error('Error saving food record:', err);
      const errorMessage = err?.message || 'Failed to save food record. Please check your connection and try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Dashboard', { date: selectedDate })}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Food Journal</Text>
        <View style={styles.headerSpacer} />
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
        style={[styles.addFoodButton, (!canLogFoodForDate()) && styles.addFoodButtonDisabled]}
        onPress={handleOpenModal}
        disabled={!canLogFoodForDate()}
      >
        <Text style={[styles.addFoodButtonText, (!canLogFoodForDate()) && styles.addFoodButtonTextDisabled]}>
          + Log Food
        </Text>
      </TouchableOpacity>

      {/* Fixed Section Title */}
      <View style={styles.fixedSectionTitle}>
        <Text style={styles.sectionTitle}>
          {selectedDate === getTodayDate() ? 'Foods Logged Today' : `Foods Logged on ${formatDisplayDate(selectedDate)}`}
        </Text>
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
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchFoodRecords(selectedDate)}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : foodRecords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {selectedDate === getTodayDate() 
                ? 'No food records for today' 
                : `No food records for ${formatDisplayDate(selectedDate)}`}
            </Text>
            <Text style={styles.emptySubtext}>
              {isFutureDate() 
                ? 'Cannot add food records for future dates' 
                : 'Tap "+ Log Food" to add your first entry'}
            </Text>
          </View>
        ) : (
          foodRecords.map((food, index) => (
            <View key={`${food.date}-${food.name}-${index}`} style={styles.foodItem}>
              <View style={styles.foodHeader}>
                <Text style={styles.foodName}>{food.name}</Text>
                {food.date_timestamp && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteFood(food.date_timestamp!, food.name)}
                  >
                    <Text style={styles.deleteButtonText}>×</Text>
                  </TouchableOpacity>
                )}
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
                <Text style={styles.inputLabel}>Calories (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Leave empty to auto-calculate"
                  value={calories}
                  onChangeText={setCalories}
                  keyboardType="numeric"
                />
                <Text style={styles.inputHint}>
                  Will be calculated from macros if not provided
                </Text>
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

      {/* Upgrade Prompt */}
      <UpgradePrompt
        visible={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        onUpgrade={() => {
          setShowUpgradePrompt(false);
          navigation.navigate('Subscription');
        }}
        message={upgradePromptMessage}
      />
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
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
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
  addFoodButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  addFoodButtonTextDisabled: {
    color: '#999',
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
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 20,
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
  inputHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
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

