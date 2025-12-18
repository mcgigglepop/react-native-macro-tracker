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
  Modal
} from 'react-native';
import ApiService, { WorkoutName } from '../services/apiService';

interface Workout {
  id: string;
  name: string;
  duration: number;
  calories: number;
  date: string;
}

const WorkoutsScreen: React.FC = ({ navigation }: { navigation: any }) => {
  const [selectedWorkout, setSelectedWorkout] = useState<string>('');
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutNames, setWorkoutNames] = useState<WorkoutName[]>([]);
  const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(false);

  // Fetch workout names when component mounts
  useEffect(() => {
    fetchWorkoutNames();
  }, []);

  const fetchWorkoutNames = async () => {
    try {
      setIsLoadingWorkouts(true);
      console.log('Fetching workout names...');
      
      const names = await ApiService.getWorkoutNames();
      console.log('Workout names fetched:', names);
      
      setWorkoutNames(names);
    } catch (error) {
      console.error('Error fetching workout names:', error);
      Alert.alert('Error', 'Failed to load workout names. Please try again.');
    } finally {
      setIsLoadingWorkouts(false);
    }
  };

  const handleTrackWorkout = () => {
    if (!selectedWorkout) {
      Alert.alert('Error', 'Please select a workout');
      return;
    }

    const workoutName = workoutNames.find(w => w.WorkoutId === selectedWorkout);
    if (!workoutName) {
      Alert.alert('Error', 'Invalid workout selected');
      return;
    }

    // Navigate to the workout tracking screen
    navigation.navigate('WorkoutTracking', {
      workoutPlanId: selectedWorkout
    });
    
    setSelectedWorkout('');
    setShowWorkoutModal(false);
  };

  const renderWorkout = ({ item }: { item: Workout }) => (
    <View style={styles.workoutCard}>
      <View style={styles.workoutHeader}>
        <View style={styles.workoutInfo}>
          <Text style={styles.workoutName}>{item.name}</Text>
          <Text style={styles.workoutDate}>{item.date}</Text>
        </View>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => {
            Alert.alert(
              'Delete Workout',
              `Are you sure you want to delete "${item.name}"?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete', 
                  style: 'destructive',
                  onPress: () => {
                    setWorkouts(workouts.filter(workout => workout.id !== item.id));
                  }
                }
              ]
            );
          }}
        >
          <Text style={styles.deleteButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.workoutStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.duration}</Text>
          <Text style={styles.statLabel}>minutes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.calories}</Text>
          <Text style={styles.statLabel}>calories</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Workout Tracker</Text>
          <Text style={styles.subtitle}>Select a workout plan to track</Text>
        </View>

        <View style={styles.addWorkoutContainer}>
          <Text style={styles.sectionTitle}>Track Workout</Text>
          
          <TouchableOpacity 
            style={styles.workoutSelector}
            onPress={() => setShowWorkoutModal(true)}
            disabled={isLoadingWorkouts}
          >
            <Text style={selectedWorkout ? styles.selectedWorkoutText : styles.placeholderText}>
              {isLoadingWorkouts ? 'Loading workouts...' : 
               selectedWorkout ? workoutNames.find(w => w.WorkoutId === selectedWorkout)?.WorkoutName : 'Select a workout plan...'}
            </Text>
            <Text style={styles.selectorArrow}>▼</Text>
          </TouchableOpacity>

          {selectedWorkout && (
            <View style={styles.workoutDetails}>
              {(() => {
                const workout = workoutNames.find(w => w.WorkoutId === selectedWorkout);
                return workout ? (
                  <>
                    <Text style={styles.detailText}>Workout: {workout.WorkoutName}</Text>
                    <Text style={styles.detailText}>ID: {workout.WorkoutId}</Text>
                  </>
                ) : null;
              })()}
            </View>
          )}

          <TouchableOpacity 
            style={[styles.addButton, !selectedWorkout && styles.addButtonDisabled]} 
            onPress={handleTrackWorkout}
            disabled={!selectedWorkout}
          >
            <Text style={styles.addButtonText}>Track Workout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.historyContainer}>
          <Text style={styles.sectionTitle}>Recent Workouts</Text>
          <FlatList
            data={workouts}
            renderItem={renderWorkout}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>

      {/* Workout Selection Modal */}
      <Modal
        visible={showWorkoutModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWorkoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Workout Plan</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowWorkoutModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.workoutList}>
              {isLoadingWorkouts ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading workout names...</Text>
                </View>
              ) : workoutNames.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No workout plans available</Text>
                </View>
              ) : (
                workoutNames.map((workout, index) => (
                  <TouchableOpacity
                    key={workout.WorkoutId}
                    style={styles.workoutOption}
                    onPress={() => {
                      setSelectedWorkout(workout.WorkoutId);
                      setShowWorkoutModal(false);
                    }}
                  >
                    <View style={styles.workoutOptionInfo}>
                      <Text style={styles.workoutOptionName}>{workout.WorkoutName}</Text>
                      <Text style={styles.workoutOptionDetails}>
                        ID: {workout.WorkoutId}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
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
  scrollContainer: {
    padding: 20,
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

  addWorkoutContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  workoutSelector: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#fafafa',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedWorkoutText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  selectorArrow: {
    fontSize: 16,
    color: '#666',
  },
  workoutDetails: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  historyContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
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
  workoutCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  workoutDate: {
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
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  workoutList: {
    maxHeight: 400,
  },
  workoutOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  workoutOptionInfo: {
    flex: 1,
  },
  workoutOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  workoutOptionDetails: {
    fontSize: 14,
    color: '#666',
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
  },
});

export default WorkoutsScreen; 