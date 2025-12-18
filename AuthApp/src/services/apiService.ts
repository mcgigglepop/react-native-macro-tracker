import userPool from './cognitoConfig';

// API Configuration
const API_CONFIG = {
  baseUrl: 'https://nvqbytljw7.execute-api.us-west-2.amazonaws.com/dev',
  endpoints: {
    foodRecords: '/food-records',
  }
};

export interface FoodRecord {
  date: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export class ApiService {
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
   * Create a new food record
   * @param foodRecord Food record data to create
   */
  static async createFoodRecord(foodRecord: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    quantity?: string;
  }): Promise<boolean> {
    try {
      console.log('Creating food record:', foodRecord);
      const token = await this.getSessionToken();
      
      if (!token) {
        console.error('No valid session token available');
        throw new Error('No valid session token');
      }

      const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.foodRecords}`;
      console.log('Making POST request to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(foodRecord)
      });

      console.log('Create food record response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Create food record error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Create food record response:', data);
      return true;
    } catch (error) {
      console.error('Error creating food record:', error);
      return false;
    }
  }

  /**
   * Get food records for the current day (or specified date)
   * @param date Optional date in YYYY-MM-DD format (defaults to today)
   */
  static async getFoodRecords(date?: string): Promise<FoodRecord[] | null> {
    try {
      console.log('Fetching food records from API...');
      const token = await this.getSessionToken();
      
      if (!token) {
        console.error('No valid session token available');
        throw new Error('No valid session token');
      }

      // Build URL with optional date query parameter
      let url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.foodRecords}`;
      if (date) {
        url += `?date=${date}`;
      }

      console.log('Making API request to:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
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
      
      // The API returns { message, data, date, count }
      // Map the data to FoodRecord format
      if (data.data && Array.isArray(data.data)) {
        return data.data.map((record: any) => ({
          date: record.date_timestamp?.split('#')[0] || new Date().toISOString().split('T')[0],
          name: record.name || '',
          calories: record.calories || 0,
          protein: record.protein || 0,
          carbs: record.carbs || 0,
          fats: record.fat || 0
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching food records:', error);
      return null;
    }
  }
}

export default ApiService; 