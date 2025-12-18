import { CognitoUserPool } from 'amazon-cognito-identity-js';

// Shared Cognito Configuration
export const COGNITO_CONFIG = {
  UserPoolId: 'us-west-2_pawrcFIzb',
  ClientId: '1lmlkdamg3pqv4l4higiv848ns',
  Region: 'us-west-2'
};

// Create a single shared userPool instance
export const userPool = new CognitoUserPool({
  UserPoolId: COGNITO_CONFIG.UserPoolId,
  ClientId: COGNITO_CONFIG.ClientId
});

export default userPool; 