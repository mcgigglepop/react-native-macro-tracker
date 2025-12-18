import { CognitoUserPool } from 'amazon-cognito-identity-js';

// Shared Cognito Configuration
export const COGNITO_CONFIG = {
  UserPoolId: 'us-west-2_IMBNxCBXo',
  ClientId: '5m2aoiq58569jhmvofv1k6lmi1',
  Region: 'us-west-2'
};

// Create a single shared userPool instance
export const userPool = new CognitoUserPool({
  UserPoolId: COGNITO_CONFIG.UserPoolId,
  ClientId: COGNITO_CONFIG.ClientId
});

export default userPool; 