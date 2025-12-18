// lib/db.js
// Centralized DynamoDB client and helper functions
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-west-2",
});

export const ddb = DynamoDBDocumentClient.from(client);

// Export command classes for direct use if needed
export { PutCommand, GetCommand, QueryCommand };

// Table names from environment variables
export const USERS_TABLE = process.env.USERS_TABLE;
export const FOOD_LOGS_TABLE = process.env.FOOD_LOGS_TABLE;

// Primary key attribute names
export const PK = "PK"; // Partition key
export const SK = "SK"; // Sort key

// GSI key attribute names
export const GSI1PK = "GSI1PK";
export const GSI1SK = "GSI1SK";

// Item type constants
export const ITEM_TYPES = {
  USER: "USER",
  FOOD_LOG: "FOOD_LOG",
};

// Helper functions for building keys
export const KeyBuilders = {
  /**
   * Build primary key for user profile
   * @param {string} userID - Cognito sub
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
   * Build primary key for food log
   * @param {string} userID - User ID
   * @param {string} timestamp - ISO timestamp
   * @returns {{PK: string, SK: string}}
   */
  foodLog: (userID, timestamp) => ({
    PK: `USER#${userID}`,
    SK: `FOOD_LOG#${timestamp}`,
  }),

  /**
   * Build GSI1 key for food log by date
   * @param {string} userID - User ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} timestamp - ISO timestamp
   * @returns {{GSI1PK: string, GSI1SK: string}}
   */
  foodLogByDate: (userID, date, timestamp) => ({
    GSI1PK: `USER#${userID}#DATE#${date}`,
    GSI1SK: `FOOD_LOG#${timestamp}`,
  }),
};
