// handlers/getFoodRecords.js
import { ddb, QueryCommand } from "../lib/db.js";
import crypto from "node:crypto";

const FOOD_RECORDS_TABLE = process.env.FOOD_RECORDS_TABLE;

/**
 * API Gateway Lambda handler for getting all food records for a user for the current day
 * 
 * Event structure:
 * - event.requestContext.authorizer.claims.sub: Cognito user ID
 * - event.queryStringParameters.date: Optional date in YYYY-MM-DD format (defaults to today)
 * 
 * Response: 200 OK with array of food records
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

    // Get date from query parameters or use today
    let date;
    if (event.queryStringParameters?.date) {
      date = event.queryStringParameters.date;
      // Validate date format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return {
          statusCode: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({
            error: "Bad Request",
            message: "Date must be in YYYY-MM-DD format",
          }),
        };
      }
    } else {
      // Default to today
      date = new Date().toISOString().split("T")[0];
    }

    console.log(JSON.stringify({
      at: "query_params_extracted",
      requestId,
      userId,
      date,
    }));

    // Query DynamoDB for all food records for this user and date
    // Sort key format: date#timestamp#recordId
    // We query with begins_with to get all records for the date
    const queryStartTime = Date.now();
    const response = await ddb.send(
      new QueryCommand({
        TableName: FOOD_RECORDS_TABLE,
        KeyConditionExpression: "user_id = :userId AND begins_with(date_timestamp, :datePrefix)",
        ExpressionAttributeValues: {
          ":userId": userId,
          ":datePrefix": `${date}#`,
        },
      })
    );
    const queryDuration = Date.now() - queryStartTime;

    const foodRecords = response.Items || [];

    // Sort by timestamp (descending - most recent first)
    foodRecords.sort((a, b) => {
      const timestampA = parseInt(a.date_timestamp.split("#")[1] || "0");
      const timestampB = parseInt(b.date_timestamp.split("#")[1] || "0");
      return timestampB - timestampA;
    });

    const totalDuration = Date.now() - startTime;
    console.log(JSON.stringify({
      at: "handler_success",
      requestId,
      userId,
      date,
      recordCount: foodRecords.length,
      queryDurationMs: queryDuration,
      totalDurationMs: totalDuration,
    }));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Food records retrieved successfully",
        data: foodRecords,
        date,
        count: foodRecords.length,
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

