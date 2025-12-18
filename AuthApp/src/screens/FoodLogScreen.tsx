import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { ApiService, FoodEntry } from '../services/apiService';

interface FoodLogScreenProps {
  navigation: any;
}

const FoodLogScreen: React.FC<FoodLogScreenProps> = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [fats, setFats] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadFoodEntries();
  }, []);

  const loadFoodEntries = async () => {
    setLoading(true);
    try {
      const entries = await ApiService.getFoodEntries(today);
      setFoodEntries(entries || []);
    } catch (error) {
      console.error('Error loading food entries:', error);
      Alert.alert('Error', 'Failed to load food entries');
    } finally {
      setLoading(false);
    }
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

  const handleSubmit = async () => {
    if (!foodName || !fats || !protein || !carbs) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const fatsNum = parseFloat(fats);
    const proteinNum = parseFloat(protein);
    const carbsNum = parseFloat(carbs);

    if (isNaN(fatsNum) || isNaN(proteinNum) || isNaN(carbsNum)) {
      Alert.alert('Error', 'Please enter valid numbers');
      return;
    }

    if (fatsNum < 0 || proteinNum < 0 || carbsNum < 0) {
      Alert.alert('Error', 'Values cannot be negative');
      return;
    }

    setSubmitting(true);
    try {
      const calories = calculateCalories(fatsNum, proteinNum, carbsNum);
      const foodRecord = {
        date: today,
        name: foodName,
        calories,
        protein: proteinNum,
        carbs: carbsNum,
        fats: fatsNum,
      };

      const success = await ApiService.saveFoodRecord(foodRecord);
      if (success) {
        setModalVisible(false);
        setFoodName('');
        setFats('');
        setProtein('');
        setCarbs('');
        await loadFoodEntries();
        Alert.alert('Success', 'Food logged successfully!');
      } else {
        Alert.alert('Error', 'Failed to log food');
      }
    } catch (error) {
      console.error('Error logging food:', error);
      Alert.alert('Error', 'Failed to log food');
    } finally {
      setSubmitting(false);
    }
  };

  const totals = calculateTotals();
  const previewCalories = calculateCalories(
    parseFloat(fats || '0'),
    parseFloat(protein || '0'),
    parseFloat(carbs || '0')
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Log Food</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Totals</Text>
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
          <View style={styles.caloriesContainer}>
            <Text style={styles.caloriesLabel}>Total Calories</Text>
            <Text style={styles.caloriesValue}>{Math.round(totals.calories)}</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
        ) : (
          <View style={styles.foodList}>
            {foodEntries.length === 0 ? (
              <Text style={styles.emptyText}>No food entries for today</Text>
            ) : (
              foodEntries.map((entry, index) => {
                const entryCalories = calculateCalories(
                  entry.Fats || 0,
                  entry.Protein || 0,
                  entry.Carbs || 0
                );
                return (
                  <View key={index} style={styles.foodItem}>
                    <Text style={styles.foodItemName}>{entry.FoodName}</Text>
                    <Text style={styles.foodItemMacros}>
                      F: {entry.Fats?.toFixed(1)}g | P: {entry.Protein?.toFixed(1)}g | C:{' '}
                      {entry.Carbs?.toFixed(1)}g
                    </Text>
                    <Text style={styles.foodItemCalories}>{Math.round(entryCalories)} cal</Text>
                  </View>
                );
              })
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Add Food</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Food</Text>

            <TextInput
              style={styles.input}
              placeholder="Food Name"
              value={foodName}
              onChangeText={setFoodName}
            />

            <TextInput
              style={styles.input}
              placeholder="Fats (grams)"
              value={fats}
              onChangeText={setFats}
              keyboardType="decimal-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Protein (grams)"
              value={protein}
              onChangeText={setProtein}
              keyboardType="decimal-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Carbs (grams)"
              value={carbs}
              onChangeText={setCarbs}
              keyboardType="decimal-pad"
            />

            {previewCalories > 0 && (
              <View style={styles.caloriePreview}>
                <Text style={styles.caloriePreviewText}>
                  Calories: {Math.round(previewCalories)}
                </Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setFoodName('');
                  setFats('');
                  setProtein('');
                  setCarbs('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 16,
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
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  caloriesContainer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  caloriesLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  caloriesValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  loader: {
    marginTop: 40,
  },
  foodList: {
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 40,
  },
  foodItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  foodItemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  foodItemMacros: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  foodItemCalories: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 18,
    margin: 16,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
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
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  caloriePreview: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  caloriePreviewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FoodLogScreen;
