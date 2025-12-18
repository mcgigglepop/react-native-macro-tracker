// db.js
// Centralized DynamoDB client and helper functions for users table
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, DeleteCommand, UpdateCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-west-2",
});

export const ddb = DynamoDBDocumentClient.from(client);

// Export command classes for direct use if needed
export { PutCommand, GetCommand, QueryCommand, DeleteCommand, UpdateCommand, ScanCommand };

// Table names from environment variables (set by Lambda)
export const USERS_TABLE = process.env.USERS_TABLE || process.env.USER_TABLE;
export const SUBSCRIPTIONS_TABLE = process.env.SUBSCRIPTIONS_TABLE;
export const DEALER_BATCHES_TABLE = process.env.DEALER_BATCHES_TABLE;
export const MINT_JOBS_TABLE = process.env.MINT_JOBS_TABLE;
export const IDEMPOTENCY_TABLE = process.env.IDEMPOTENCY_TABLE;

// Backward compatibility alias
export const TABLE = USERS_TABLE;

// Global Secondary Index names
export const GSI1 = "GSI1"; // Used for email lookups

// Primary key attribute names
export const PK = "PK"; // Partition key
export const SK = "SK"; // Sort key

// GSI key attribute names
export const GSI1PK = "GSI1PK";
export const GSI1SK = "GSI1SK";

// Item type constants
export const ITEM_TYPES = {
  USER: "USER",
  DEALER_BATCH: "DEALER_BATCH",
  DEALER_BATCH_ITEM: "DEALER_BATCH_ITEM",
};

// Helper functions for building keys according to the users table schema
export const KeyBuilders = {
  /**
   * Build primary key for user profile
   * @param {string} userID - Cognito sub or UUID
   * @returns {{PK: string, SK: string}}
   */
  userProfile: (userID) => ({
    PK: `USER#${userID}`,
    SK: "PROFILE",
  }),

  /**
   * Build GSI1 key for user lookup by email
   * @param {string} email - User email address
   * @param {string} userID - User ID (for sort key)
   * @returns {{GSI1PK: string, GSI1SK: string}}
   */
  emailLookup: (email, userID) => ({
    GSI1PK: `EMAIL#${email.toLowerCase()}`,
    GSI1SK: `USER#${userID}`,
  }),

  /**
   * Build primary key for dealer batch
   * @param {string} dealerId - Dealer ID
   * @param {string} batchId - Batch ID
   * @returns {{PK: string, SK: string}}
   */
  dealerBatch: (dealerId, batchId) => ({
    PK: `BATCH#${dealerId}#${batchId}`,
    SK: "STATUS#",
  }),

  /**
   * Build primary key for dealer batch item (individual cert)
   * @param {string} dealerId - Dealer ID
   * @param {string} batchId - Batch ID
   * @param {string} certNumber - Certificate number
   * @param {string} gradingCompany - Grading company
   * @returns {{PK: string, SK: string}}
   */
  dealerBatchItem: (dealerId, batchId, certNumber, gradingCompany) => ({
    PK: `BATCH#${dealerId}#${batchId}`,
    SK: `CERT#${gradingCompany}#${certNumber}`,
  }),

  /**
   * Build primary key for idempotency lock (global based on cert + grading company)
   * @param {string} gradingCompany - Grading company
   * @param {string} certNumber - Certificate number
   * @returns {{PK: string, SK: string}}
   */
  idempotencyKey: (gradingCompany, certNumber) => ({
    PK: `IDEMPOTENCY#${gradingCompany.toUpperCase()}#${certNumber}`,
    SK: "LOCK#",
  }),
};

/**
 * Helper functions for common DynamoDB operations
 * These provide convenience wrappers around the SDK commands
 */

/**
 * Put an item into DynamoDB
 * @param {string} tableName - Table name
 * @param {object} item - Item to put
 * @param {object} options - Optional parameters (ConditionExpression, etc.)
 * @returns {Promise<object>} PutCommand output
 */
export async function putItem(tableName, item, options = {}) {
  return ddb.send(new PutCommand({
    TableName: tableName,
    Item: item,
    ...options,
  }));
}

/**
 * Get an item from DynamoDB
 * @param {string} tableName - Table name
 * @param {object} key - Primary key (PK, SK)
 * @param {object} options - Optional parameters (ConsistentRead, etc.)
 * @returns {Promise<object>} GetCommand output
 */
export async function getItem(tableName, key, options = {}) {
  return ddb.send(new GetCommand({
    TableName: tableName,
    Key: key,
    ...options,
  }));
}

/**
 * Query items from DynamoDB (primary key or GSI)
 * @param {string} tableName - Table name
 * @param {string} keyConditionExpression - Key condition expression (e.g., "PK = :pk")
 * @param {object} expressionAttributeValues - Expression attribute values
 * @param {object} options - Optional parameters (IndexName, FilterExpression, etc.)
 * @returns {Promise<object>} QueryCommand output
 */
export async function queryItems(tableName, keyConditionExpression, expressionAttributeValues, options = {}) {
  return ddb.send(new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ...options,
  }));
}

/**
 * Delete an item from DynamoDB
 * @param {string} tableName - Table name
 * @param {object} key - Primary key (PK, SK)
 * @param {object} options - Optional parameters (ConditionExpression, etc.)
 * @returns {Promise<object>} DeleteCommand output
 */
export async function deleteItem(tableName, key, options = {}) {
  return ddb.send(new DeleteCommand({
    TableName: tableName,
    Key: key,
    ...options,
  }));
}

/**
 * Update an item in DynamoDB
 * @param {string} tableName - Table name
 * @param {object} key - Primary key (PK, SK)
 * @param {string} updateExpression - Update expression (e.g., "SET #status = :status")
 * @param {object} expressionAttributeNames - Expression attribute names (e.g., { "#status": "status" })
 * @param {object} expressionAttributeValues - Expression attribute values (e.g., { ":status": "COMPLETE" })
 * @param {object} options - Optional parameters (ConditionExpression, etc.)
 * @returns {Promise<object>} UpdateCommand output
 */
export async function updateItem(tableName, key, updateExpression, expressionAttributeNames = {}, expressionAttributeValues = {}, options = {}) {
  return ddb.send(new UpdateCommand({
    TableName: tableName,
    Key: key,
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
    ExpressionAttributeValues: Object.keys(expressionAttributeValues).length > 0 ? expressionAttributeValues : undefined,
    ...options,
  }));
}