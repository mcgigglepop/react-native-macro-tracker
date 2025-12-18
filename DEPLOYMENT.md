# Deployment Instructions

## Backend Deployment

The old API Gateway (`5roxcutyn4`) uses AWS_IAM authorization, which requires AWS Signature V4. 
You need to deploy the new backend which has Cognito authorizer configured.

### Step 1: Build and Package Lambda Functions

```bash
cd backend
npm install
npm run package
```

This will create ZIP files in `backend/dist/zips/`:
- `postConfirmation.zip`
- `logFood.zip`
- `getFoodLogs.zip`

### Step 2: Deploy Infrastructure

```bash
cd terraform
terraform init -backend-config=dev.config
terraform plan -var-file=dev.tfvars
terraform apply -var-file=dev.tfvars
```

### Step 3: Get API Gateway URL

After deployment, get the API Gateway URL:

```bash
terraform output api_gateway_url
```

Example output:
```
api_gateway_url = "https://jle99e2dm8.execute-api.us-west-2.amazonaws.com/prod"
```

### Step 4: Update App Configuration

Update `AuthApp/src/services/apiService.ts`:

```typescript
baseUrl: 'https://YOUR-API-GATEWAY-ID.execute-api.us-west-2.amazonaws.com/prod',
```

Replace `YOUR-API-GATEWAY-ID` with the actual ID from step 3.

Also update `AuthApp/src/services/cognitoConfig.ts` with the Cognito User Pool ID and Client ID from:

```bash
terraform output cognito_user_pool_id
terraform output cognito_client_id
```

## Why the Old API Gateway Doesn't Work

The API Gateway at `5roxcutyn4.execute-api.us-west-2.amazonaws.com` is configured with:
- **Authorization**: AWS_IAM (requires AWS Signature V4)
- **Expected format**: `Authorization: AWS4-HMAC-SHA256 Credential=...`

But your app is sending:
- **Authorization**: `Bearer <Cognito JWT Token>`
- **Expected by**: Cognito User Pools authorizer

These are incompatible. You must use the new API Gateway with Cognito authorizer.
