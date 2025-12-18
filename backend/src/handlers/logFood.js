// handlers/logFood.js
// Lambda function to log a food entry
import { ddb, FOOD_LOGS_TABLE, KeyBuilders, ITEM_TYPES, PutCommand } from "../lib/db.js";
import { logger } from "../lib/logger.js";
import crypto from "node:crypto";

/**
 * Calculate calories from macros
 * 1 gram fat = 9 calories
 * 1 gram protein = 4 calories
 * 1 gram carbs = 4 calories
 */
function calculateCalories(fats, protein, carbs) {
  return fats * 9 + protein * 4 + carbs * 4;
}

export const handler = async (event) => {
  const startTime = Date.now();
  const requestId = crypto?.randomUUID?.() || `req-${Date.now()}`;

  logger.info({
    at: "handler_start",
    requestId,
    httpMethod: event.httpMethod,
    path: event.path,
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

    // Parse request body
    const body = JSON.parse(event.body || "{}");
    const { foodName, fats, protein, carbs } = body;

    // Validate input
    if (!foodName || fats === undefined || protein === undefined || carbs === undefined) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Missing required fields: foodName, fats, protein, carbs",
        }),
      };
    }

    // Validate numeric values
    const fatsNum = parseFloat(fats);
    const proteinNum = parseFloat(protein);
    const carbsNum = parseFloat(carbs);

    if (isNaN(fatsNum) || isNaN(proteinNum) || isNaN(carbsNum)) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Invalid numeric values" }),
      };
    }

    if (fatsNum < 0 || proteinNum < 0 || carbsNum < 0) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Values cannot be negative" }),
      };
    }

    // Calculate calories
    const calories = calculateCalories(fatsNum, proteinNum, carbsNum);

    // Create timestamp
    const timestamp = new Date().toISOString();
    const date = timestamp.split("T")[0]; // YYYY-MM-DD

    // Build keys
    const foodLogKey = KeyBuilders.foodLog(userID, timestamp);
    const foodLogByDateKey = KeyBuilders.foodLogByDate(userID, date, timestamp);

    // Create food log item
    const foodLogItem = {
      ...foodLogKey,
      ...foodLogByDateKey,
      itemType: ITEM_TYPES.FOOD_LOG,
      userID,
      foodName,
      fats: fatsNum,
      protein: proteinNum,
      carbs: carbsNum,
      calories,
      date,
      timestamp,
      createdAt: timestamp,
    };

    // Save to DynamoDB
    await ddb.send(
      new PutCommand({
        TableName: FOOD_LOGS_TABLE,
        Item: foodLogItem,
      })
    );

    const duration = Date.now() - startTime;

    logger.info({
      at: "food_logged",
      requestId,
      userID,
      foodName,
      calories,
      durationMs: duration,
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        foodName,
        fats: fatsNum,
        protein: proteinNum,
        carbs: carbsNum,
        calories,
        timestamp,
      }),
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
