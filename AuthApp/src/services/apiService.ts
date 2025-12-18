import { Alert } from 'react-native';
import CognitoService from './cognitoService';
import userPool from './cognitoConfig';

// API Configuration
// IMPORTANT: Update baseUrl to match your deployed API Gateway URL from terraform output
// Run: cd ../../backend/terraform && terraform output api_gateway_url
// The API Gateway MUST have Cognito authorizer configured (not AWS_IAM)
const API_CONFIG = {
  // TODO: Replace with your terraform output: terraform output api_gateway_url
  // Example: 'https://jle99e2dm8.execute-api.us-west-2.amazonaws.com/prod'
  baseUrl: process.env.API_BASE_URL || 'https://5roxcutyn4.execute-api.us-west-2.amazonaws.com/prod',
  endpoints: {
    userData: '/user-data',
    food: '/calorie-tracking', // Matches the existing API Gateway endpoint
    workoutNames: '/workout-names',
    workout: '/workout',
    workoutTracking: '/workout-tracking'
  }
};

export interface UserData {
  PK: string;
  Sk: string;
  DailyCalories: number;
}

export interface FoodRecord {
  date: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface FoodEntry {
  FoodName: string;
  FoodDate: string;
  Fats: number;
  Protein: number;
  Carbs: number;
  Calories?: number; // Optional in case it's not returned by the API
  SK?: string; // Sort key for delete operations
  FoodId?: string; // Food ID for delete operations
}

export interface DeleteFoodItem {
  FoodDate: string;
  FoodId: string;
}

export interface WorkoutName {
  WorkoutName: string;
  WorkoutId: string;
}

export interface WorkoutExercise {
  exerciseName: string;
  sets: Array<{
    set: number;
    reps: string;
  }>;
}

export interface WorkoutData {
  workoutName: string;
  exercises: WorkoutExercise[];
}

export interface SetPerformed {
  set: number;
  reps: number;
  weight?: number;
}

export interface ExercisePerformed {
  exerciseName: string;
  setsPerformed: SetPerformed[];
  rpe?: number;
  missedSets?: number;
  notes?: string;
}

export interface WorkoutSession {
  workoutId: string;
  workoutName: string;
  date: string;
  notes?: string;
  exercises: ExercisePerformed[];
}

export class ApiService {
  /**
   * Check if user is properly authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      console.log('Checking authentication status...');
      
      // First, try to get current user from CognitoService
      const cognitoUserData = await CognitoService.getCurrentUser();
      console.log('CognitoService.getCurrentUser result:', cognitoUserData);
      
      if (!cognitoUserData) {
        console.log('No user data from CognitoService');
        return false;
      }
      
      // Use the imported userPool instance
      const cognitoUser = userPool.getCurrentUser();
      
      console.log('Cognito user found:', !!cognitoUser);
      console.log('Cognito user username:', cognitoUser?.getUsername());
      
      if (!cognitoUser) {
        console.log('No Cognito user found');
        return false;
      }
      
      // Force session check
      return new Promise((resolve) => {
        cognitoUser.getSession((err: any, session: any) => {
          if (err) {
            console.error('Session check error:', err);
            resolve(false);
            return;
          }
          
          if (!session || !session.isValid()) {
            console.log('Session invalid or expired');
            resolve(false);
            return;
          }
          
          console.log('Session is valid');
          resolve(true);
        });
      });
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  /**
   * Get the current user's session token for API calls
   */
  private static async getSessionToken(): Promise<string | null> {
    try {
      // Use the imported userPool instance
      const cognitoUser = userPool.getCurrentUser();
      
      return new Promise((resolve) => {
        if (!cognitoUser) {
          console.log('No Cognito user found in API service');
          resolve(null);
          return;
        }

        cognitoUser.getSession((err: any, session: any) => {
          
          if (err || !session) {
            console.error('Error getting session in API service:', err);
            resolve(null);
            return;
          }

          if (session.isValid()) {
            const token = session.getIdToken().getJwtToken();
            console.log('Session token retrieved successfully in API service');
            resolve(token);
            return; // Add return statement to prevent further execution
          }

          // Only attempt refresh if session is not valid
          const refreshToken = session.getRefreshToken();
          cognitoUser.refreshSession(refreshToken, (err, newSession) => {
            if (err || !newSession) {
              console.error('Error refreshing session in API service:', err);
              resolve(null);
              return;
            }

            const token = newSession.getIdToken().getJwtToken();
            resolve(token);
          });
        });
      });
    } catch (error) {
      console.error('Error getting session token in API service:', error);
      return null;
    }
  }

  /**
   * Get user data from DynamoDB
   */
  static async getUserData(): Promise<UserData | null> {
    try {
      console.log('Fetching user data from API...');
      const token = await this.getSessionToken();
      
      if (!token) {
        console.error('No valid session token available');
        throw new Error('No valid session token');
      }

      console.log('Making API request to:', `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.userData}`);
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.userData}`, {
        method: 'GET',
        headers: {
          'Authorization': `${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('API response data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }

  /**
   * Update user's daily calorie goal
   */
  static async updateDailyCalories(dailyCalories: number): Promise<boolean> {
    try {
      console.log('Updating daily calories to:', dailyCalories);
      const token = await this.getSessionToken();
      if (!token) {
        throw new Error('No valid session token');
      }

      console.log('Making POST request to:', `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.userData}`);
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.userData}`, {
        method: 'POST',
        headers: {
          'Authorization': `${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          DailyCalories: dailyCalories
        })
      });

      console.log('POST response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('POST error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('POST response data:', data);
      return true;
    } catch (error) {
      console.error('Error updating daily calories:', error);
      return false;
    }
  }

  /**
   * Create or update user data in DynamoDB
   */
  static async createUserData(dailyCalories: number): Promise<boolean> {
    try {
      console.log('Creating user data with daily calories:', dailyCalories);
      const token = await this.getSessionToken();
      if (!token) {
        throw new Error('No valid session token');
      }

      console.log('Making POST request to create user data:', `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.userData}`);
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.userData}`, {
        method: 'POST',
        headers: {
          'Authorization': `${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          DailyCalories: dailyCalories
        })
      });

      console.log('Create user data response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Create user data error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Create user data response:', data);
      return true;
    } catch (error) {
      console.error('Error creating user data:', error);
      return false;
    }
  }

  /**
   * Save food record to DynamoDB
   */
  static async saveFoodRecord(foodRecord: FoodRecord): Promise<boolean> {
    try {
      console.log('Saving food record:', foodRecord);
      const token = await this.getSessionToken();
      if (!token) {
        throw new Error('No valid session token');
      }

      console.log('Making POST request to save food record:', `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.food}`);
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.food}`, {
        method: 'POST',
        headers: {
          'Authorization': `${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(foodRecord)
      });

      console.log('Save food record response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Save food record error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Save food record response:', data);
      return true;
    } catch (error) {
      console.error('Error saving food record:', error);
      return false;
    }
  }

  /**
   * Get food entries for a specific date
   */
  static async getFoodEntries(date: string): Promise<FoodEntry[]> {
    try {
      console.log('Fetching food entries for date:', date);
      const token = await this.getSessionToken();
      
      if (!token) {
        console.error('No valid session token available');
        throw new Error('No valid session token');
      }

      const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.food}?date=${date}`;
      console.log('Making GET request to:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Get food entries response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Get food entries error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Get food entries response data:', data);
      
      // Handle both array and object responses
      const entries = Array.isArray(data) ? data : (data.items || data.entries || []);
      return entries;
    } catch (error) {
      console.error('Error fetching food entries:', error);
      return [];
    }
  }

  /**
   * Delete a food record from DynamoDB
   */
  static async deleteFoodRecord(foodDate: string, foodId: string): Promise<boolean> {
    try {
      console.log('Deleting food record with FoodDate:', foodDate, 'and FoodId:', foodId);
      const token = await this.getSessionToken();
      
      if (!token) {
        console.error('No valid session token available');
        throw new Error('No valid session token');
      }

      const deletePayload = {
        items: [
          {
            FoodDate: foodDate,
            FoodId: foodId
          }
        ]
      };

      console.log('Making DELETE request to:', `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.food}`);
      console.log('Delete payload:', deletePayload);
      
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.food}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(deletePayload)
      });

      console.log('token', token);
      console.log('Delete food record response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete food record error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Delete food record response:', data);
      return true;
    } catch (error) {
      console.error('Error deleting food record:', error);
      return false;
    }
  }

  /**
   * Bulk delete multiple food records from DynamoDB
   */
  static async bulkDeleteFoodRecords(foodItems: DeleteFoodItem[]): Promise<boolean> {
    try {
      console.log('Bulk deleting food records:', foodItems.length, 'items');
      const token = await this.getSessionToken();
      
      if (!token) {
        console.error('No valid session token available');
        throw new Error('No valid session token');
      }

      const deletePayload = {
        items: foodItems
      };

      console.log('Making bulk DELETE request to:', `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.food}`);
      console.log('Bulk delete payload:', deletePayload);
      
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.food}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(deletePayload)
      });

      console.log('Bulk delete response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Bulk delete error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Bulk delete response:', data);
      return true;
    } catch (error) {
      console.error('Error bulk deleting food records:', error);
      return false;
    }
  }

  /**
   * Get list of available workout names
   */
  static async getWorkoutNames(): Promise<WorkoutName[]> {
    try {
      console.log('Fetching workout names...');
      const token = await this.getSessionToken();
      
      if (!token) {
        console.error('No valid session token available');
        throw new Error('No valid session token');
      }

      const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.workoutNames}`;
      console.log('Making GET request to:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Get workout names response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Get workout names error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Get workout names response data:', data);
      
      return data;
    } catch (error) {
      console.error('Error fetching workout names:', error);
      return [];
    }
  }

  /**
   * Get workout details by workout ID
   */
  static async getWorkoutDetails(workoutId: string): Promise<WorkoutData | null> {
    try {
      console.log('Fetching workout details for ID:', workoutId);
      const token = await this.getSessionToken();
      
      if (!token) {
        console.error('No valid session token available');
        throw new Error('No valid session token');
      }

      const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.workout}?workoutId=${workoutId}`;
      console.log('Making GET request to:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Get workout details response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Get workout details error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Get workout details response data:', data);
      
      return data;
    } catch (error) {
      console.error('Error fetching workout details:', error);
      return null;
    }
  }

  /**
   * Save workout session to DynamoDB
   */
  static async saveWorkoutSession(workoutSession: WorkoutSession): Promise<boolean> {
    try {
      console.log('Saving workout session:', workoutSession);
      const token = await this.getSessionToken();
      
      if (!token) {
        console.error('No valid session token available');
        throw new Error('No valid session token');
      }

      console.log('Making POST request to:', `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.workoutTracking}`);
      console.log('Workout session payload:', workoutSession);
      
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.workoutTracking}`, {
        method: 'POST',
        headers: {
          'Authorization': `${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workoutSession)
      });

      console.log('Save workout session response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Save workout session error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Save workout session response:', data);
      return true;
    } catch (error) {
      console.error('Error saving workout session:', error);
      return false;
    }
  }
}

export default ApiService;
