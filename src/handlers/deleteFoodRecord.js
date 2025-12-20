// handlers/deleteFoodRecord.js
import { ddb, DeleteCommand, GetCommand } from "../lib/db.js";
import crypto from "node:crypto";

const FOOD_RECORDS_TABLE = process.env.FOOD_RECORDS_TABLE;

/**
 * API Gateway Lambda handler for deleting a food log record
 * 
 * Event structure:
 * - event.requestContext.authorizer.claims.sub: Cognito user ID
 * - event.pathParameters.recordId: The date_timestamp (sort key) of the record to delete
 * 
 * Response: 200 OK if deleted successfully, 404 if not found, 403 if not authorized
 */
export const handler = async (event) => {
  const startTime = Date.now();
  const requestId = event.requestContext?.requestId || crypto.randomUUID();
  
  console.log(JSON.stringify({
    at: "handler_start",
    requestId,
    httpMethod: event.httpMethod,
    path: event.path,
    pathParameters: event.pathParameters,
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

    // Get record ID from path parameters
    // API Gateway automatically URL-decodes path parameters
    let recordId = event.pathParameters?.recordId;
    if (!recordId) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Bad Request",
          message: "Missing record ID in path parameters",
        }),
      };
    }

    // Decode the recordId in case it was encoded
    try {
      recordId = decodeURIComponent(recordId);
    } catch (e) {
      // If decoding fails, use the original value
      console.log(JSON.stringify({
        at: "recordId_decode_failed",
        requestId,
        recordId,
        error: e.message,
      }));
    }

    console.log(JSON.stringify({
      at: "delete_request_received",
      requestId,
      userId,
      recordId,
      recordIdType: typeof recordId,
      recordIdLength: recordId?.length,
      pathParameters: event.pathParameters,
    }));

    // First, verify the record exists and belongs to the user
    const getStartTime = Date.now();
    const getResponse = await ddb.send(
      new GetCommand({
        TableName: FOOD_RECORDS_TABLE,
        Key: {
          user_id: userId,
          date_timestamp: recordId,
        },
      })
    );
    const getDuration = Date.now() - getStartTime;

    if (!getResponse.Item) {
      console.log(JSON.stringify({
        at: "record_not_found",
        requestId,
        userId,
        recordId,
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
          message: "Food record not found",
        }),
      };
    }

    // Verify the record belongs to the user (additional security check)
    if (getResponse.Item.user_id !== userId) {
      console.log(JSON.stringify({
        at: "unauthorized_delete_attempt",
        requestId,
        userId,
        recordUserId: getResponse.Item.user_id,
        recordId,
      }));

      return {
        statusCode: 403,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Forbidden",
          message: "You do not have permission to delete this record",
        }),
      };
    }

    // Delete the record
    const deleteStartTime = Date.now();
    await ddb.send(
      new DeleteCommand({
        TableName: FOOD_RECORDS_TABLE,
        Key: {
          user_id: userId,
          date_timestamp: recordId,
        },
      })
    );
    const deleteDuration = Date.now() - deleteStartTime;

    const totalDuration = Date.now() - startTime;
    console.log(JSON.stringify({
      at: "handler_success",
      requestId,
      userId,
      recordId,
      getDurationMs: getDuration,
      deleteDurationMs: deleteDuration,
      totalDurationMs: totalDuration,
    }));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Food record deleted successfully",
        recordId,
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

