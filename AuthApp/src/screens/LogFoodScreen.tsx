import React, { useState } from 'react';
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
  Platform
} from 'react-native';

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

  // Dummy data for UI display
  const dailyCalories = 1850;
  const macros = {
    protein: 120,
    carbs: 200,
    fat: 65,
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

  const handleSaveFood = () => {
    // TODO: Save food logic will go here
    handleCloseModal();
  };

  // Dummy food list data
  const foodsLogged = [
    {
      id: '1',
      name: 'Grilled Chicken Breast',
      calories: 231,
      protein: 43.5,
      carbs: 0,
      fat: 5,
      quantity: '200g',
    },
    {
      id: '2',
      name: 'Brown Rice',
      calories: 216,
      protein: 5,
      carbs: 45,
      fat: 1.8,
      quantity: '1 cup',
    },
    {
      id: '3',
      name: 'Broccoli',
      calories: 55,
      protein: 3.7,
      carbs: 11,
      fat: 0.6,
      quantity: '1 cup',
    },
    {
      id: '4',
      name: 'Greek Yogurt',
      calories: 130,
      protein: 11,
      carbs: 9,
      fat: 5,
      quantity: '1 cup',
    },
    {
      id: '5',
      name: 'Banana',
      calories: 105,
      protein: 1.3,
      carbs: 27,
      fat: 0.4,
      quantity: '1 medium',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Log Food</Text>
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
        {foodsLogged.map((food) => (
          <View key={food.id} style={styles.foodItem}>
            <View style={styles.foodHeader}>
              <Text style={styles.foodName}>{food.name}</Text>
              <Text style={styles.foodQuantity}>{food.quantity}</Text>
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
                <Text style={styles.foodMacroValue}>{food.fat}g</Text>
              </View>
            </View>
          </View>
        ))}
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
                style={styles.saveButton}
                onPress={handleSaveFood}
              >
                <Text style={styles.saveButtonText}>Save Food</Text>
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
});

export default LogFoodScreen;

