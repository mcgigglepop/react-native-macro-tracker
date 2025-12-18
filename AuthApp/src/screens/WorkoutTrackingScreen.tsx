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
  FlatList
} from 'react-native';
import { WorkoutPlan, ExerciseSession, SetData } from '../types/workout';
import ApiService, { WorkoutData, WorkoutExercise, WorkoutSession, ExercisePerformed, SetPerformed } from '../services/apiService';

interface WorkoutTrackingScreenProps {
  route: {
    params: {
      workoutPlanId: string;
    };
  };
  navigation: any;
}

const WorkoutTrackingScreen: React.FC<WorkoutTrackingScreenProps> = ({ route, navigation }) => {
  const { workoutPlanId } = route.params;
  const [workoutData, setWorkoutData] = useState<WorkoutData | null>(null);
  const [exerciseSessions, setExerciseSessions] = useState<ExerciseSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [exerciseNotes, setExerciseNotes] = useState<{ [key: string]: string }>({});
  const [exerciseRPE, setExerciseRPE] = useState<{ [key: string]: number }>({});
  const [exerciseMissedSets, setExerciseMissedSets] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetchWorkoutDetails();
  }, [workoutPlanId]);

  const fetchWorkoutDetails = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching workout details for ID:', workoutPlanId);
      
      const data = await ApiService.getWorkoutDetails(workoutPlanId);
      if (data) {
        console.log('Workout details fetched:', data);
        setWorkoutData(data);
        
        // Initialize exercise sessions from API data
        const sessions = data.exercises.map((exercise, index) => ({
          exerciseId: `exercise-${index}`,
          exerciseName: exercise.exerciseName,
          sets: exercise.sets.map((set, setIndex) => ({
            setNumber: set.set,
            weight: undefined,
            reps: 0,
            completed: false
          }))
        }));
        setExerciseSessions(sessions);
      } else {
        Alert.alert('Error', 'Failed to load workout details. Please try again.');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error fetching workout details:', error);
      Alert.alert('Error', 'Failed to load workout details. Please try again.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetData = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: string) => {
    const newSessions = [...exerciseSessions];
    const exercise = newSessions[exerciseIndex];
    const set = exercise.sets[setIndex];
    
    if (field === 'weight') {
      set.weight = value ? parseFloat(value) : undefined;
    } else {
      set.reps = value ? parseInt(value) : 0;
    }
    
    setExerciseSessions(newSessions);
  };

  const toggleSetCompleted = (exerciseIndex: number, setIndex: number) => {
    const newSessions = [...exerciseSessions];
    const exercise = newSessions[exerciseIndex];
    const set = exercise.sets[setIndex];
    set.completed = !set.completed;
    setExerciseSessions(newSessions);
  };

  const prepareWorkoutSession = (): WorkoutSession | null => {
    if (!workoutData) return null;

    const exercises: ExercisePerformed[] = exerciseSessions
      .filter(session => session.sets.some(set => set.completed))
      .map(session => {
        const setsPerformed: SetPerformed[] = session.sets
          .filter(set => set.completed)
          .map(set => ({
            set: set.setNumber,
            reps: set.reps,
            weight: set.weight
          }));

        return {
          exerciseName: session.exerciseName,
          setsPerformed,
          rpe: exerciseRPE[session.exerciseId] || undefined,
          missedSets: exerciseMissedSets[session.exerciseId] || 0,
          notes: exerciseNotes[session.exerciseId] || undefined
        };
      });

    if (exercises.length === 0) {
      Alert.alert('No Progress', 'Please complete at least one exercise before saving.');
      return null;
    }

    return {
      workoutId: workoutPlanId,
      workoutName: workoutData.workoutName,
      date: new Date().toISOString().split('T')[0],
      notes: notes.trim() || undefined,
      exercises
    };
  };

  const saveWorkout = async () => {
    const workoutSession = prepareWorkoutSession();
    if (!workoutSession) return;

    try {
      console.log('Saving workout session:', workoutSession);
      
      const success = await ApiService.saveWorkoutSession(workoutSession);
      if (success) {
        console.log('Workout session saved successfully');
        Alert.alert('Success', 'Workout saved successfully!');
        navigation.goBack();
      } else {
        console.log('Failed to save workout session');
        Alert.alert('Error', 'Failed to save workout. Please try again.');
      }
    } catch (error) {
      console.error('Error saving workout session:', error);
      Alert.alert('Error', 'Failed to save workout. Please try again.');
    }
  };

  const renderExercise = ({ item, index }: { item: ExerciseSession; index: number }) => {
    const exercise = workoutData?.exercises.find(e => e.exerciseName === item.exerciseName);
    
    return (
      <View style={styles.exerciseCard}>
        <View style={styles.exerciseHeader}>
          <Text style={styles.exerciseName}>{item.exerciseName}</Text>
          <Text style={styles.exerciseTarget}>
            {exercise?.sets.length} sets • {exercise?.sets[0]?.reps || 'varies'} reps
          </Text>
        </View>

        <View style={styles.setsContainer}>
          {item.sets.map((set, setIndex) => (
            <View key={setIndex} style={styles.setRow}>
              <View style={styles.setHeader}>
                <Text style={styles.setNumber}>Set {set.setNumber}</Text>
                <TouchableOpacity
                  style={[styles.completeButton, set.completed && styles.completedButton]}
                  onPress={() => toggleSetCompleted(index, setIndex)}
                >
                  <Text style={[styles.completeButtonText, set.completed && styles.completedButtonText]}>
                    {set.completed ? '✓' : '○'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputRow}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Weight (lbs)</Text>
                  <TextInput
                    style={styles.input}
                    value={set.weight?.toString() || ''}
                    onChangeText={(value) => updateSetData(index, setIndex, 'weight', value)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Reps</Text>
                  <TextInput
                    style={styles.input}
                    value={set.reps.toString()}
                    onChangeText={(value) => updateSetData(index, setIndex, 'reps', value)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Exercise-specific fields */}
        <View style={styles.exerciseFields}>
          <View style={styles.fieldRow}>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>RPE (1-10)</Text>
              <TextInput
                style={styles.fieldInput}
                value={exerciseRPE[item.exerciseId]?.toString() || ''}
                onChangeText={(value) => {
                  const rpe = value ? parseInt(value) : undefined;
                  setExerciseRPE(prev => ({
                    ...prev,
                    [item.exerciseId]: rpe || 0
                  }));
                }}
                keyboardType="numeric"
                placeholder="0"
                maxLength={2}
              />
            </View>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Missed Sets</Text>
              <TextInput
                style={styles.fieldInput}
                value={exerciseMissedSets[item.exerciseId]?.toString() || ''}
                onChangeText={(value) => {
                  const missed = value ? parseInt(value) : 0;
                  setExerciseMissedSets(prev => ({
                    ...prev,
                    [item.exerciseId]: missed
                  }));
                }}
                keyboardType="numeric"
                placeholder="0"
                maxLength={2}
              />
            </View>
          </View>
          
          <View style={styles.notesContainer}>
            <Text style={styles.fieldLabel}>Notes</Text>
            <TextInput
              style={styles.notesInput}
              value={exerciseNotes[item.exerciseId] || ''}
              onChangeText={(value) => {
                setExerciseNotes(prev => ({
                  ...prev,
                  [item.exerciseId]: value
                }));
              }}
              placeholder="Optional notes for this exercise..."
              multiline
              numberOfLines={2}
            />
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading workout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!workoutData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Workout not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{workoutData.workoutName}</Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={saveWorkout}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.workoutInfo}>
          <Text style={styles.workoutDescription}>
            Track your sets and reps for each exercise. Tap the circle to mark sets as completed.
          </Text>
        </View>

        {/* Overall workout notes */}
        <View style={styles.workoutNotesContainer}>
          <Text style={styles.workoutNotesLabel}>Workout Notes (Optional)</Text>
          <TextInput
            style={styles.workoutNotesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="How did the workout feel? Any notes..."
            multiline
            numberOfLines={3}
          />
        </View>

        <FlatList
          data={exerciseSessions}
          renderItem={renderExercise}
          keyExtractor={(item) => item.exerciseId}
          scrollEnabled={false}
        />
      </ScrollView>
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
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  workoutInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
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
  workoutDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  exerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
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
  exerciseHeader: {
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  exerciseTarget: {
    fontSize: 14,
    color: '#666',
  },
  lastRecordedContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  lastRecordedTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  lastRecordedText: {
    fontSize: 12,
    color: '#666',
  },
  setsContainer: {
    gap: 12,
  },
  setRow: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  setNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  completeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedButton: {
    backgroundColor: '#007AFF',
  },
  completeButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  completedButtonText: {
    color: '#fff',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseFields: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  fieldContainer: {
    flex: 1,
    marginRight: 10,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  notesContainer: {
    marginTop: 12,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    backgroundColor: '#fff',
    minHeight: 60,
  },
  workoutNotesContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
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
  workoutNotesLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  workoutNotesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    minHeight: 80,
  },
});

export default WorkoutTrackingScreen; 