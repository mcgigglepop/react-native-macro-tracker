// triggers/postConfirmation.js
// Cognito Post Confirmation Lambda Trigger
import { ddb, USERS_TABLE, KeyBuilders, ITEM_TYPES, PutCommand } from "../lib/db.js";
import { logger } from "../lib/logger.js";
import crypto from "node:crypto";

export const handler = async (event) => {
  const startTime = Date.now();
  const requestId = event?.request?.requestId || crypto?.randomUUID?.() || `req-${Date.now()}`;

  logger.info({
    at: "handler_start",
    requestId,
    triggerSource: event.triggerSource,
    userPoolId: event.userPoolId,
    userName: event.userName,
  });

  try {
    const userAttributes = event.request.userAttributes;
    const userID = userAttributes.sub;
    const email = userAttributes.email?.toLowerCase() || "";

    if (!userID || !email) {
      throw new Error("Missing required user attributes: sub or email");
    }

    const now = new Date().toISOString();

    // Build user profile item
    const userKey = KeyBuilders.userProfile(userID);
    const emailKey = KeyBuilders.emailLookup(email, userID);

    const userItem = {
      ...userKey,
      ...emailKey,
      itemType: ITEM_TYPES.USER,
      userID,
      email,
      createdAt: now,
      updatedAt: now,
    };

    // Put user profile (with conditional check to make it idempotent)
    await ddb.send(
      new PutCommand({
        TableName: USERS_TABLE,
        Item: userItem,
        ConditionExpression: "attribute_not_exists(PK)",
      })
    );

    const duration = Date.now() - startTime;

    logger.info({
      at: "user_profile_created",
      requestId,
      userID,
      email,
      durationMs: duration,
    });

    return event;
  } catch (error) {
    const totalDuration = Date.now() - startTime;

    // If item already exists (ConditionalCheckFailedException), that's okay
    // This makes the function idempotent
    if (error.name === "ConditionalCheckFailedException") {
      logger.info({
        at: "user_profile_already_exists",
        requestId,
        userID: event.request?.userAttributes?.sub,
        email: event.request?.userAttributes?.email,
        durationMs: totalDuration,
        message: "User profile already exists (idempotent)",
      });
      return event;
    }

    // Log other errors but don't fail the confirmation
    // Cognito will still confirm the user even if this fails
    logger.error({
      at: "handler_error",
      requestId,
      userID: event.request?.userAttributes?.sub,
      email: event.request?.userAttributes?.email,
      error: error?.message,
      errorName: error?.name,
      stack: error?.stack,
      durationMs: totalDuration,
    });

    return event;
  }
};
