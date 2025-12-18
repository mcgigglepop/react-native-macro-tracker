import { WorkoutPlan } from '../types/workout';

export const workoutPlans: WorkoutPlan[] = [
  {
    id: 'chest-day',
    name: 'Chest Day',
    category: 'strength',
    exercises: [
      {
        id: 'flat-bench-press',
        name: 'Flat Bench Press',
        sets: 4,
        reps: '6-10',
        lastRecorded: {
          weight: 185,
          reps: 8,
          date: '2025-01-01'
        }
      },
      {
        id: 'flat-db-fly',
        name: 'Flat Bench DB Fly',
        sets: 3,
        reps: '8-10',
        lastRecorded: {
          weight: 35,
          reps: 10,
          date: '2025-01-01'
        }
      },
      {
        id: 'incline-db-bench',
        name: 'Incline DB Bench Press',
        sets: 4,
        reps: '8-10',
        lastRecorded: {
          weight: 45,
          reps: 9,
          date: '2025-01-01'
        }
      },
      {
        id: 'low-high-cable-fly',
        name: 'Low to High Cable Fly',
        sets: 3,
        reps: '10',
        lastRecorded: {
          weight: 25,
          reps: 10,
          date: '2025-01-01'
        }
      },
      {
        id: 'chest-dips',
        name: 'Chest Dips',
        sets: 3,
        reps: '10',
        lastRecorded: {
          reps: 12,
          date: '2025-01-01'
        }
      },
      {
        id: 'decline-pushups',
        name: 'Decline Pushups',
        sets: 3,
        reps: 'max reps',
        lastRecorded: {
          reps: 15,
          date: '2025-01-01'
        }
      }
    ]
  },
  {
    id: 'back-day',
    name: 'Back Day',
    category: 'strength',
    exercises: [
      {
        id: 'pull-ups',
        name: 'Pull-ups',
        sets: 4,
        reps: '8-12',
        lastRecorded: {
          reps: 10,
          date: '2025-01-02'
        }
      },
      {
        id: 'barbell-rows',
        name: 'Barbell Rows',
        sets: 4,
        reps: '8-10',
        lastRecorded: {
          weight: 135,
          reps: 8,
          date: '2025-01-02'
        }
      },
      {
        id: 'lat-pulldowns',
        name: 'Lat Pulldowns',
        sets: 3,
        reps: '10-12',
        lastRecorded: {
          weight: 120,
          reps: 12,
          date: '2025-01-02'
        }
      }
    ]
  },
  {
    id: 'leg-day',
    name: 'Leg Day',
    category: 'strength',
    exercises: [
      {
        id: 'squats',
        name: 'Barbell Squats',
        sets: 4,
        reps: '6-8',
        lastRecorded: {
          weight: 225,
          reps: 6,
          date: '2025-01-03'
        }
      },
      {
        id: 'deadlifts',
        name: 'Deadlifts',
        sets: 3,
        reps: '5-8',
        lastRecorded: {
          weight: 275,
          reps: 5,
          date: '2025-01-03'
        }
      },
      {
        id: 'leg-press',
        name: 'Leg Press',
        sets: 3,
        reps: '10-12',
        lastRecorded: {
          weight: 315,
          reps: 12,
          date: '2025-01-03'
        }
      }
    ]
  },
  {
    id: 'shoulder-day',
    name: 'Shoulder Day',
    category: 'strength',
    exercises: [
      {
        id: 'overhead-press',
        name: 'Overhead Press',
        sets: 4,
        reps: '6-8',
        lastRecorded: {
          weight: 115,
          reps: 6,
          date: '2025-01-04'
        }
      },
      {
        id: 'lateral-raises',
        name: 'Lateral Raises',
        sets: 3,
        reps: '12-15',
        lastRecorded: {
          weight: 20,
          reps: 15,
          date: '2025-01-04'
        }
      },
      {
        id: 'rear-delt-fly',
        name: 'Rear Delt Fly',
        sets: 3,
        reps: '12-15',
        lastRecorded: {
          weight: 15,
          reps: 12,
          date: '2025-01-04'
        }
      }
    ]
  }
]; 