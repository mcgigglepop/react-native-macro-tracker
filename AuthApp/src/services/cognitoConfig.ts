import { CognitoUserPool } from 'amazon-cognito-identity-js';

// Shared Cognito Configuration
export const COGNITO_CONFIG = {
  UserPoolId: 'us-west-2_isZa41XyP',
  ClientId: '1v420tr0j9nst48age3pat5tf3',
  Region: 'us-west-2'
};

// Create a single shared userPool instance
export const userPool = new CognitoUserPool({
  UserPoolId: COGNITO_CONFIG.UserPoolId,
  ClientId: COGNITO_CONFIG.ClientId
});

export default userPool; 