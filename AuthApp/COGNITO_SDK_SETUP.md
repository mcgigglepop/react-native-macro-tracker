# AWS Cognito SDK Setup Guide

This guide will help you set up AWS Cognito using the official Cognito SDK for your React Native app.

## Prerequisites

1. AWS Account
2. AWS CLI installed and configured
3. Node.js 16+ (current setup)

## Step 1: Create AWS Cognito User Pool

### Using AWS Console:

1. **Go to AWS Cognito Console**
   - Navigate to https://console.aws.amazon.com/cognito/
   - Click "Create user pool"

2. **Configure Sign-in Experience**
   - Choose "Cognito user pool"
   - Configure sign-in experience:
     - User name: `Email`
     - Allow email addresses: `Yes`
     - Allow phone numbers: `No`

3. **Configure Security Requirements**
   - Password policy: Choose your requirements
   - Multi-factor authentication: `Optional`
   - User account recovery: `Enabled`

4. **Configure Sign-up Experience**
   - Self-service sign-up: `Enabled`
   - Cognito-assisted verification and confirmation: `Enabled`
   - Required attributes: `Email`, `Name`
   - Optional attributes: `Given name`, `Family name`

5. **Configure Message Delivery**
   - Email provider: `Send email with Cognito`
   - From email address: `no-reply@verificationemail.com`

6. **Integrate Your App**
   - User pool name: `YourAppUserPool`
   - Initial app client: `Create app client`
   - App client name: `YourAppClient`
   - Client secret: `No client secret`

7. **Review and Create**
   - Review your settings
   - Click "Create user pool"

## Step 2: Get Your Configuration Details

After creating the user pool, you'll need these details:

1. **User Pool ID**: Found in the "User pool overview" section
2. **App Client ID**: Found in "App integration" > "App client list"
3. **Region**: The AWS region where you created the user pool

## Step 3: Update Cognito Configuration

Update the file `src/services/cognitoService.ts` with your actual values:

```typescript
// Cognito Configuration
const COGNITO_CONFIG = {
  UserPoolId: 'us-east-1_XXXXXXXXX', // Replace with your User Pool ID
  ClientId: 'XXXXXXXXXXXXXXXXXXXXXXXXXX', // Replace with your App Client ID
  Region: 'us-east-1' // Replace with your AWS region
};
```

## Step 4: Test the Setup

1. **Start your app**: `npm start`
2. **Try registering a new user**:
   - Go to the Register screen
   - Enter email, password, and name
   - Submit the form
   - Check your email for confirmation code

3. **Confirm the user**:
   - In AWS Console, go to your User Pool
   - Find the user in "Users and groups"
   - Click "Confirm user"

4. **Test login**:
   - Go to the Login screen
   - Enter the confirmed user's credentials
   - Should successfully log in

## Step 5: Optional - Add Email Confirmation Screen

You can add a confirmation screen to your app:

```typescript
// In your RegisterScreen or a new ConfirmationScreen
const confirmRegistration = async (email: string, code: string) => {
  try {
    await CognitoService.confirmRegistration(email, code);
    Alert.alert('Success', 'Account confirmed! You can now login.');
    // Navigate to login screen
  } catch (error) {
    Alert.alert('Error', 'Invalid confirmation code. Please try again.');
  }
};
```

## Troubleshooting

### Common Issues:

1. **"User not confirmed" error**:
   - Users must confirm their email before logging in
   - Check email for confirmation link
   - Or confirm manually in AWS Console

2. **"Invalid credentials" error**:
   - Ensure user is confirmed
   - Check email/password spelling
   - Verify user exists in Cognito

3. **"Network error"**:
   - Check internet connection
   - Verify AWS region is correct
   - Ensure app client is properly configured

### Debug Tips:

1. **Check AWS Console**:
   - User Pool > Users and groups
   - Look for your test users
   - Check their confirmation status

2. **Check App Logs**:
   - Look for Cognito error messages
   - Verify configuration values

3. **Test with AWS CLI**:
   ```bash
   aws cognito-idp list-user-pools --max-items 10
   ```

## API Reference

### CognitoService Methods:

```typescript
// Register a new user
await CognitoService.registerUser(email, password, name);

// Login user
const userData = await CognitoService.loginUser(email, password);

// Logout user
await CognitoService.logoutUser();

// Get current authenticated user
const currentUser = await CognitoService.getCurrentUser();

// Confirm registration with code
await CognitoService.confirmRegistration(email, code);

// Resend confirmation code
await CognitoService.resendConfirmationCode(email);
```

## Security Best Practices

1. **Use HTTPS** in production
2. **Implement proper password policies**
3. **Enable MFA** for sensitive applications
4. **Use IAM roles** for AWS service access
5. **Regularly audit user access**

## Next Steps

Once Cognito is working:

1. **Add email confirmation screen** to your app
2. **Implement password reset** functionality
3. **Add social login** (Google, Facebook, etc.)
4. **Set up user attributes** for profile data
5. **Integrate with other AWS services**

## Support

- AWS Cognito Documentation: https://docs.aws.amazon.com/cognito/
- Cognito Identity JS SDK: https://github.com/amazon-archives/amazon-cognito-identity-js
- AWS Support: https://aws.amazon.com/support/ 