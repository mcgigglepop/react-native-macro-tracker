// handlers/createFoodRecord.js
import { ddb, PutCommand } from "../lib/db.js";
import crypto from "node:crypto";

const FOOD_RECORDS_TABLE = process.env.FOOD_RECORDS_TABLE;

/**
 * API Gateway Lambda handler for creating a food log record
 * 
 * Event structure:
 * - event.requestContext.authorizer.claims.sub: Cognito user ID
 * - event.body: JSON string containing { name, calories, protein, carbs, fat, quantity? }
 * 
 * Response: 201 Created with the created food record
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

    // Parse request body
    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch (error) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Bad Request",
          message: "Invalid JSON in request body",
        }),
      };
    }

    // Validate required fields
    const { name, calories, protein, carbs, fat, quantity } = body;
    if (!name || calories === undefined || protein === undefined || carbs === undefined || fat === undefined) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Bad Request",
          message: "Missing required fields: name, calories, protein, carbs, fat",
        }),
      };
    }

    // Validate numeric values
    if (isNaN(calories) || isNaN(protein) || isNaN(carbs) || isNaN(fat)) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Bad Request",
          message: "calories, protein, carbs, and fat must be numbers",
        }),
      };
    }

    // Get current date in YYYY-MM-DD format
    const now = new Date();
    const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const timestamp = now.getTime();
    
    // Generate unique record ID
    const recordId = crypto.randomUUID();
    
    // Build sort key: date#timestamp#recordId
    const dateTimestamp = `${date}#${timestamp}#${recordId}`;

    // Create food record item
    const foodRecord = {
      user_id: userId,
      date_timestamp: dateTimestamp,
      name: name.trim(),
      calories: Number(calories),
      protein: Number(protein),
      carbs: Number(carbs),
      fat: Number(fat),
      quantity: quantity || null,
      createdAt: now.toISOString(),
    };

    console.log(JSON.stringify({
      at: "food_record_prepared",
      requestId,
      userId,
      date,
      dateTimestamp,
      foodRecord,
    }));

    // Save to DynamoDB
    const dbWriteStartTime = Date.now();
    await ddb.send(
      new PutCommand({
        TableName: FOOD_RECORDS_TABLE,
        Item: foodRecord,
      })
    );
    const dbWriteDuration = Date.now() - dbWriteStartTime;

    const totalDuration = Date.now() - startTime;
    console.log(JSON.stringify({
      at: "handler_success",
      requestId,
      userId,
      recordId,
      dbWriteDurationMs: dbWriteDuration,
      totalDurationMs: totalDuration,
    }));

    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Food record created successfully",
        data: foodRecord,
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

