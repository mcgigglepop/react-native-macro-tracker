export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string; // e.g., "6-10", "8-10", "max reps"
  lastRecorded?: {
    weight?: number;
    reps?: number;
    date: string;
  };
}

export interface WorkoutPlan {
  id: string;
  name: string;
  exercises: Exercise[];
  category: 'strength' | 'cardio' | 'flexibility';
}

export interface WorkoutSession {
  id: string;
  workoutPlanId: string;
  workoutName: string;
  date: string;
  exercises: ExerciseSession[];
}

export interface ExerciseSession {
  exerciseId: string;
  exerciseName: string;
  sets: SetData[];
}

export interface SetData {
  setNumber: number;
  weight?: number;
  reps: number;
  completed: boolean;
}

export interface LastRecordedData {
  exerciseId: string;
  exerciseName: string;
  weight?: number;
  reps: number;
  date: string;
} 