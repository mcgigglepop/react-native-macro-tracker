// handlers/getFoodRecordsRange.js
import { ddb, QueryCommand } from "../lib/db.js";
import crypto from "node:crypto";

const FOOD_RECORDS_TABLE = process.env.FOOD_RECORDS_TABLE;

/**
 * API Gateway Lambda handler for getting food records for a date range
 * Returns aggregated daily totals for each day in the range
 * 
 * Event structure:
 * - event.requestContext.authorizer.claims.sub: Cognito user ID
 * - event.queryStringParameters.startDate: Start date in YYYY-MM-DD format (required)
 * - event.queryStringParameters.endDate: End date in YYYY-MM-DD format (required)
 * 
 * Response: 200 OK with array of daily totals
 */
export const handler = async (event) => {
  const startTime = Date.now();
  const requestId = event.requestContext?.requestId || crypto.randomUUID();
  
  console.log(JSON.stringify({
    at: "handler_start",
    requestId,
    httpMethod: event.httpMethod,
    path: event.path,
    queryParams: event.queryStringParameters,
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

    // Get date range from query parameters
    const startDate = event.queryStringParameters?.startDate;
    const endDate = event.queryStringParameters?.endDate;

    if (!startDate || !endDate) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Bad Request",
          message: "Both startDate and endDate query parameters are required (YYYY-MM-DD format)",
        }),
      };
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Bad Request",
          message: "Dates must be in YYYY-MM-DD format",
        }),
      };
    }

    // Validate date range (startDate should be <= endDate)
    if (startDate > endDate) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Bad Request",
          message: "startDate must be less than or equal to endDate",
        }),
      };
    }

    // Limit range to max 30 days
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    if (daysDiff > 30) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Bad Request",
          message: "Date range cannot exceed 30 days",
        }),
      };
    }

    console.log(JSON.stringify({
      at: "date_range_validated",
      requestId,
      userId,
      startDate,
      endDate,
      daysInRange: daysDiff,
    }));

    // Query DynamoDB for all food records for each date in the range
    const dailyTotals = {};
    
    // Generate all dates in the range
    const dates = [];
    const currentDate = new Date(start);
    while (currentDate <= end) {
      dates.push(new Date(currentDate).toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Query for each date
    const queryPromises = dates.map(async (date) => {
      const queryStartTime = Date.now();
      try {
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

        const foodRecords = response.Items || [];
        
        // Calculate totals for this date
        const totals = foodRecords.reduce((acc, record) => ({
          calories: acc.calories + (record.calories || 0),
          protein: acc.protein + (record.protein || 0),
          carbs: acc.carbs + (record.carbs || 0),
          fat: acc.fat + (record.fat || 0),
        }), {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        });

        return {
          date,
          ...totals,
          count: foodRecords.length,
        };
      } catch (error) {
        console.error(`Error querying date ${date}:`, error);
        // Return zero totals for this date if query fails
        return {
          date,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          count: 0,
        };
      }
    });

    const results = await Promise.all(queryPromises);
    
    // Convert to object keyed by date
    results.forEach(result => {
      dailyTotals[result.date] = {
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        recordCount: result.count,
      };
    });

    const totalDuration = Date.now() - startTime;
    console.log(JSON.stringify({
      at: "handler_success",
      requestId,
      userId,
      startDate,
      endDate,
      daysInRange: daysDiff,
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
        data: dailyTotals,
        startDate,
        endDate,
        daysInRange: daysDiff,
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

