// handlers/getUserInfo.js
import { ddb, GetCommand, KeyBuilders } from "../lib/db.js";
import crypto from "node:crypto";

const USERS_TABLE = process.env.USERS_TABLE;

/**
 * API Gateway Lambda handler for getting user information
 * 
 * Event structure:
 * - event.requestContext.authorizer.claims.sub: Cognito user ID
 * 
 * Response: 200 OK with user profile information
 */
export const handler = async (event) => {
  const startTime = Date.now();
  const requestId = event.requestContext?.requestId || crypto.randomUUID();
  
  console.log(JSON.stringify({
    at: "handler_start",
    requestId,
    httpMethod: event.httpMethod,
    path: event.path,
  }));

  try {
    // Get user ID from Cognito authorizer
    const userId = event.requestContext?.authorizer?.claims?.sub;
    if (!userId) {
      return {
        statusCode: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Unauthorized",
          message: "User ID not found in request context",
        }),
      };
    }

    console.log(JSON.stringify({
      at: "user_id_extracted",
      requestId,
      userId,
    }));

    // Build the key for the user profile
    const userKey = KeyBuilders.userProfile(userId);

    // Get user profile from DynamoDB
    const getStartTime = Date.now();
    const response = await ddb.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: userKey,
      })
    );
    const getDuration = Date.now() - getStartTime;

    if (!response.Item) {
      console.log(JSON.stringify({
        at: "user_not_found",
        requestId,
        userId,
        getDurationMs: getDuration,
      }));

      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Not Found",
          message: "User profile not found",
        }),
      };
    }

    // Verify the user is requesting their own profile (security check)
    if (response.Item.userID !== userId) {
      console.log(JSON.stringify({
        at: "unauthorized_access_attempt",
        requestId,
        userId,
        profileUserId: response.Item.userID,
      }));

      return {
        statusCode: 403,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Forbidden",
          message: "You do not have permission to access this user profile",
        }),
      };
    }

    const totalDuration = Date.now() - startTime;
    console.log(JSON.stringify({
      at: "handler_success",
      requestId,
      userId,
      getDurationMs: getDuration,
      totalDurationMs: totalDuration,
    }));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "User information retrieved successfully",
        data: response.Item,
      }),
    };
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    
    console.error(JSON.stringify({
      at: "handler_error",
      requestId,
      error: error?.message,
      errorName: error?.name,
      stack: error?.stack,
      durationMs: totalDuration,
    }));

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Internal Server Error",
        message: error?.message || "An unexpected error occurred",
      }),
    };
  }
};

