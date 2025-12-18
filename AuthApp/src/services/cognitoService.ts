import {
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  ISignUpResult
} from 'amazon-cognito-identity-js';
import userPool from './cognitoConfig';

export interface CognitoUserData {
  id: string;
  email: string;
  name: string;
}

export class CognitoService {
  /**
   * Register a new user with Cognito
   */
  static async registerUser(email: string, password: string, name: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const attributeList = [
        new CognitoUserAttribute({
          Name: 'email',
          Value: email
        }),
        new CognitoUserAttribute({
          Name: 'name',
          Value: name
        }),
        new CognitoUserAttribute({
          Name: 'given_name',
          Value: name.split(' ')[0] || name
        }),
        new CognitoUserAttribute({
          Name: 'family_name',
          Value: name.split(' ').slice(1).join(' ') || ''
        })
      ];

      userPool.signUp(email, password, attributeList, [], (err, result) => {
        if (err) {
          console.error('Registration error:', err);
          reject(err);
          return;
        }

        if (result) {
          console.log('User registered successfully:', result.user);
          resolve(true);
        } else {
          reject(new Error('Registration failed'));
        }
      });
    });
  }

  /**
   * Login user with Cognito
   */
  static async loginUser(email: string, password: string): Promise<CognitoUserData> {
    return new Promise((resolve, reject) => {
      const authenticationDetails = new AuthenticationDetails({
        Username: email,
        Password: password
      });

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool
      });

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          console.log('Login successful');
          // Get user attributes
          cognitoUser.getUserAttributes((err, attributes) => {
            if (err) {
              reject(err);
              return;
            }

            if (attributes) {
              const userData: CognitoUserData = {
                id: cognitoUser.getUsername(),
                email: email,
                name: attributes.find(attr => attr.getName() === 'name')?.getValue() || 
                       attributes.find(attr => attr.getName() === 'given_name')?.getValue() || 
                       email
              };
              console.log('User data retrieved:', userData);
              resolve(userData);
            } else {
              reject(new Error('Failed to get user attributes'));
            }
          });
        },
        onFailure: (err) => {
          console.error('Login failed:', err);
          reject(err);
        }
      });
    });
  }

  /**
   * Logout user from Cognito
   */
  static async logoutUser(): Promise<void> {
    return new Promise((resolve, reject) => {
      const currentUser = userPool.getCurrentUser();
      
      if (currentUser) {
        currentUser.signOut(() => {
          console.log('User logged out successfully');
          resolve();
        });
      } else {
        console.log('No user to logout');
        resolve();
      }
    });
  }

  /**
   * Check if user is currently authenticated
   */
  static async getCurrentUser(): Promise<CognitoUserData | null> {
    return new Promise((resolve) => {
      const currentUser = userPool.getCurrentUser();
      
      console.log('getCurrentUser called, user found:', !!currentUser);
      
      if (!currentUser) {
        console.log('No current user found in CognitoService');
        resolve(null);
        return;
      }

      console.log('Current user username:', currentUser.getUsername());

      currentUser.getSession((err, session) => {
        if (err) {
          console.error('Session error in getCurrentUser:', err);
          resolve(null);
          return;
        }
        
        if (!session || !session.isValid()) {
          console.log('Session invalid in getCurrentUser');
          resolve(null);
          return;
        }

        console.log('Session valid in getCurrentUser');

        currentUser.getUserAttributes((err, attributes) => {
          if (err) {
            console.error('Attributes error in getCurrentUser:', err);
            resolve(null);
            return;
          }
          
          if (!attributes) {
            console.log('No attributes found in getCurrentUser');
            resolve(null);
            return;
          }

          const userData: CognitoUserData = {
            id: currentUser.getUsername(),
            email: attributes.find(attr => attr.getName() === 'email')?.getValue() || '',
            name: attributes.find(attr => attr.getName() === 'name')?.getValue() || 
                   attributes.find(attr => attr.getName() === 'given_name')?.getValue() || 
                   currentUser.getUsername()
          };
          
          console.log('User data retrieved in getCurrentUser:', userData);
          resolve(userData);
        });
      });
    });
  }

  /**
   * Confirm user registration with verification code
   */
  static async confirmRegistration(email: string, code: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool
      });

      cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) {
          console.error('Confirmation error:', err);
          reject(err);
          return;
        }

        console.log('User confirmed successfully:', result);
        resolve(true);
      });
    });
  }

  /**
   * Resend confirmation code
   */
  static async resendConfirmationCode(email: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool
      });

      cognitoUser.resendConfirmationCode((err, result) => {
        if (err) {
          console.error('Resend code error:', err);
          reject(err);
          return;
        }

        console.log('Confirmation code resent:', result);
        resolve(true);
      });
    });
  }
}

export default CognitoService; 