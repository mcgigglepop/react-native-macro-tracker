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
    const { name, calories, protein, carbs, fat, quantity, date } = body;
    if (!name || protein === undefined || carbs === undefined || fat === undefined) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Bad Request",
          message: "Missing required fields: name, protein, carbs, fat",
        }),
      };
    }

    // Validate numeric values for required fields
    if (isNaN(protein) || isNaN(carbs) || isNaN(fat)) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Bad Request",
          message: "protein, carbs, and fat must be numbers",
        }),
      };
    }

    // Validate calories if provided
    if (calories !== undefined && calories !== null && isNaN(calories)) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Bad Request",
          message: "calories must be a number if provided",
        }),
      };
    }

    // Auto-calculate calories if not provided: (protein * 4) + (carbs * 4) + (fat * 9)
    const calculatedCalories = calories !== undefined && calories !== null
      ? Number(calories)
      : (Number(protein) * 4) + (Number(carbs) * 4) + (Number(fat) * 9);

    // Get date from request body or use current date
    let recordDate;
    if (date) {
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
      
      // Validate that the date is not in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const recordDateObj = new Date(date + 'T00:00:00');
      if (recordDateObj > today) {
        return {
          statusCode: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({
            error: "Bad Request",
            message: "Cannot create food records for future dates",
          }),
        };
      }
      
      recordDate = date;
    } else {
      // Default to current date
      recordDate = new Date().toISOString().split("T")[0];
    }
    
    const now = new Date();
    const timestamp = now.getTime();
    
    // Generate unique record ID
    const recordId = crypto.randomUUID();
    
    // Build sort key: date#timestamp#recordId
    const dateTimestamp = `${recordDate}#${timestamp}#${recordId}`;

    // Create food record item
    const foodRecord = {
      user_id: userId,
      date_timestamp: dateTimestamp,
      name: name.trim(),
      calories: calculatedCalories,
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
      date: recordDate,
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

