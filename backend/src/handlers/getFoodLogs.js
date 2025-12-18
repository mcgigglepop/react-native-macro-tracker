// handlers/getFoodLogs.js
// Lambda function to get food logs for a user
import { ddb, FOOD_LOGS_TABLE, KeyBuilders, QueryCommand } from "../lib/db.js";
import { logger } from "../lib/logger.js";
import crypto from "node:crypto";

export const handler = async (event) => {
  const startTime = Date.now();
  const requestId = crypto?.randomUUID?.() || `req-${Date.now()}`;

  logger.info({
    at: "handler_start",
    requestId,
    httpMethod: event.httpMethod,
    path: event.path,
    queryStringParameters: event.queryStringParameters,
  });

  try {
    // Extract user ID from Cognito authorizer context
    const userID = event.requestContext?.authorizer?.claims?.sub;
    if (!userID) {
      return {
        statusCode: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }

    // Get date from query parameters (default to today)
    const dateParam = event.queryStringParameters?.date;
    const date = dateParam || new Date().toISOString().split("T")[0];

    // Query food logs for this user and date using GSI1
    const gsi1Key = KeyBuilders.foodLogByDate(userID, date, "");
    const gsi1PK = gsi1Key.GSI1PK;

    const result = await ddb.send(
      new QueryCommand({
        TableName: FOOD_LOGS_TABLE,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :gsi1pk",
        ExpressionAttributeValues: {
          ":gsi1pk": gsi1PK,
        },
        ScanIndexForward: false, // Sort descending (newest first)
      })
    );

    // Format response
    const foodLogs = (result.Items || []).map((item) => ({
      foodName: item.foodName,
      fats: item.fats,
      protein: item.protein,
      carbs: item.carbs,
      calories: item.calories,
      timestamp: item.timestamp,
    }));

    const duration = Date.now() - startTime;

    logger.info({
      at: "food_logs_retrieved",
      requestId,
      userID,
      date,
      count: foodLogs.length,
      durationMs: duration,
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(foodLogs),
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error({
      at: "handler_error",
      requestId,
      error: error?.message,
      errorName: error?.name,
      stack: error?.stack,
      durationMs: duration,
    });

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
