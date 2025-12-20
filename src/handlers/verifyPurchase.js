// handlers/verifyPurchase.js
import { ddb, GetCommand, UpdateCommand, KeyBuilders } from "../lib/db.js";
import crypto from "node:crypto";
import https from "node:https";

const USERS_TABLE = process.env.USERS_TABLE;
const APPLE_SHARED_SECRET = process.env.APPLE_SHARED_SECRET; // Optional: for subscription verification
const APPLE_VERIFY_RECEIPT_URL_PRODUCTION = "https://buy.itunes.apple.com/verifyReceipt";
const APPLE_VERIFY_RECEIPT_URL_SANDBOX = "https://sandbox.itunes.apple.com/verifyReceipt";

/**
 * API Gateway Lambda handler for verifying Apple purchase receipts
 * 
 * Event structure:
 * - event.requestContext.authorizer.claims.sub: Cognito user ID
 * - event.body: JSON string containing { receipt, productId, transactionId }
 * 
 * Response: 200 OK with updated subscription status
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

    const { receipt, productId, transactionId } = body;

    // Validate required fields
    if (!receipt || !productId || !transactionId) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Bad Request",
          message: "Missing required fields: receipt, productId, and transactionId are required",
        }),
      };
    }

    console.log(JSON.stringify({
      at: "request_body_received",
      requestId,
      userId,
      productId,
      transactionId,
      hasReceipt: !!receipt,
    }));

    // Verify receipt with Apple
    const verificationResult = await verifyReceiptWithApple(receipt, productId);

    if (!verificationResult.valid) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Invalid Receipt",
          message: verificationResult.message || "Receipt verification failed",
        }),
      };
    }

    // Update user's accountType to premium in DynamoDB
    const userKey = KeyBuilders.userProfile(userId);

    // First, get the current user to ensure they exist
    const getUserStartTime = Date.now();
    const getUserResponse = await ddb.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: userKey,
      })
    );
    const getUserDuration = Date.now() - getUserStartTime;

    if (!getUserResponse.Item) {
      console.log(JSON.stringify({
        at: "user_not_found",
        requestId,
        userId,
        getUserDurationMs: getUserDuration,
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

    // Update accountType to premium
    const now = new Date().toISOString();
    const updateStartTime = Date.now();
    
    await ddb.send(
      new UpdateCommand({
        TableName: USERS_TABLE,
        Key: userKey,
        UpdateExpression: "SET accountType = :accountType, updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":accountType": "premium",
          ":updatedAt": now,
        },
      })
    );
    const updateDuration = Date.now() - updateStartTime;

    // TODO: Optionally update Cognito user attribute
    // This would require AWS Cognito Identity Provider SDK
    // For now, we'll update DynamoDB which is the source of truth

    const totalDuration = Date.now() - startTime;
    console.log(JSON.stringify({
      at: "handler_success",
      requestId,
      userId,
      productId,
      transactionId,
      getUserDurationMs: getUserDuration,
      updateDurationMs: updateDuration,
      totalDurationMs: totalDuration,
    }));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Purchase verified and subscription activated successfully",
        data: {
          accountType: "premium",
          productId,
          transactionId,
          verifiedAt: now,
        },
      }),
    };
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(JSON.stringify({
      at: "handler_error",
      requestId,
      error: error.message,
      stack: error.stack,
      totalDurationMs: totalDuration,
    }));

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Internal Server Error",
        message: "An error occurred while processing the purchase",
      }),
    };
  }
};

/**
 * Verify receipt with Apple's servers
 * @param {string} receipt - Base64 encoded receipt data
 * @param {string} productId - Product ID that was purchased
 * @returns {Promise<{valid: boolean, message?: string}>}
 */
async function verifyReceiptWithApple(receipt, productId) {
  try {
    // Build request body for Apple's verifyReceipt API
    const requestBody = {
      "receipt-data": receipt,
      "password": APPLE_SHARED_SECRET || undefined, // Optional: for auto-renewable subscriptions
      "exclude-old-transactions": false,
    };

    // Try production first, then sandbox if needed
    let verifyUrl = APPLE_VERIFY_RECEIPT_URL_PRODUCTION;
    let result = await makeAppleReceiptRequest(verifyUrl, requestBody);

    // If status code is 21007, receipt is from sandbox - retry with sandbox URL
    if (result.status === 21007) {
      console.log("Receipt is from sandbox, retrying with sandbox URL");
      verifyUrl = APPLE_VERIFY_RECEIPT_URL_SANDBOX;
      result = await makeAppleReceiptRequest(verifyUrl, requestBody);
    }

    // Status code 0 means success
    if (result.status === 0) {
      // Verify that the receipt contains the expected product
      // For subscriptions, check receipt.in_app or receipt.latest_receipt_info
      // For consumables/non-consumables, check receipt.in_app
      
      const receiptInfo = result.receipt;
      const inAppPurchases = receiptInfo?.in_app || [];
      const latestReceiptInfo = result.latest_receipt_info || [];

      // Check if the product ID is in the receipt
      const allPurchases = [...inAppPurchases, ...latestReceiptInfo];
      const hasProduct = allPurchases.some(
        (purchase) => purchase.product_id === productId
      );

      if (!hasProduct) {
        return {
          valid: false,
          message: "Product ID not found in receipt",
        };
      }

      return {
        valid: true,
        receiptData: result,
      };
    } else {
      // Handle various error status codes
      const errorMessages = {
        21000: "The App Store could not read the JSON object you provided",
        21002: "The receipt data property was malformed or missing",
        21003: "The receipt could not be authenticated",
        21004: "The shared secret you provided does not match the shared secret on file",
        21005: "The receipt server is not currently available",
        21006: "This receipt is valid but the subscription has expired",
        21007: "This receipt is from the test environment, but it was sent to the production environment",
        21008: "This receipt is from the production environment, but it was sent to the test environment",
        21010: "This receipt could not be authorized",
      };

      return {
        valid: false,
        message: errorMessages[result.status] || `Receipt verification failed with status: ${result.status}`,
      };
    }
  } catch (error) {
    console.error("Error verifying receipt with Apple:", error);
    // For development/testing, you might want to allow this to pass through
    // In production, you should fail verification on errors
    return {
      valid: false,
      message: `Error verifying receipt: ${error.message}`,
    };
  }
}

/**
 * Make HTTP POST request to Apple's verifyReceipt endpoint
 * @param {string} url - Apple API URL
 * @param {object} requestBody - Request body object
 * @returns {Promise<object>} Apple API response
 */
function makeAppleReceiptRequest(url, requestBody) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(requestBody);

    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse Apple API response: ${error.message}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(new Error(`Request to Apple API failed: ${error.message}`));
    });

    req.write(postData);
    req.end();
  });
}

