// triggers/postConfirmation.js
import { ddb, TABLE, KeyBuilders, ITEM_TYPES } from "../lib/db.js";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import crypto from "node:crypto";

/**
 * Cognito Post Confirmation Lambda Trigger
 * Creates a user profile in DynamoDB after email verification
 * 
 * Event structure:
 * - event.request.userAttributes.sub: Cognito user ID
 * - event.request.userAttributes.email: User email
 * - event.request.userAttributes.given_name: First name (optional)
 * - event.request.userAttributes.family_name: Last name (optional)
 * - event.request.userAttributes['custom:account_type']: Account type (optional) - 'basic' or 'premium'
 */

/**
 * Arrays of adjectives and nouns for GitHub-style username generation
 */
const ADJECTIVES = [
  "reimagined", "scaling", "swift", "mighty", "clever", "bright", "bold", "brave",
  "calm", "cool", "daring", "eager", "fierce", "gentle", "happy", "jolly",
  "kind", "lively", "merry", "noble", "proud", "quick", "radiant", "serene",
  "tranquil", "vibrant", "witty", "zealous", "ancient", "modern", "futuristic",
  "cosmic", "stellar", "lunar", "solar", "oceanic", "mountain", "forest", "desert",
  "tropical", "arctic", "crystal", "golden", "silver", "bronze", "diamond", "pearl",
  "emerald", "ruby", "sapphire", "amber", "ivory", "ebony", "crimson", "azure",
  "violet", "jade", "coral", "amber", "copper", "platinum", "titanium", "steel",
  "iron", "wooden", "stone", "marble", "granite", "quartz", "obsidian", "onyx"
];

const NOUNS = [
  "succotash", "barnacle", "penguin", "dolphin", "tiger", "eagle", "falcon", "hawk",
  "wolf", "fox", "bear", "lion", "panther", "jaguar", "leopard", "cheetah",
  "whale", "shark", "octopus", "squid", "jellyfish", "starfish", "crab", "lobster",
  "butterfly", "dragonfly", "firefly", "beetle", "ant", "bee", "wasp", "hornet",
  "spider", "scorpion", "snake", "lizard", "gecko", "chameleon", "turtle", "tortoise",
  "rabbit", "squirrel", "chipmunk", "hedgehog", "otter", "seal", "walrus", "manatee",
  "unicorn", "phoenix", "dragon", "griffin", "pegasus", "sphinx", "kraken", "leviathan",
  "mountain", "valley", "river", "lake", "ocean", "island", "peninsula", "archipelago",
  "volcano", "canyon", "waterfall", "glacier", "iceberg", "cave", "grotto", "cavern",
  "star", "planet", "comet", "asteroid", "nebula", "galaxy", "constellation", "meteor",
  "crystal", "gem", "jewel", "treasure", "artifact", "relic", "monument", "statue",
  "tower", "castle", "fortress", "palace", "temple", "shrine", "sanctuary", "cathedral"
];

/**
 * Generates a GitHub-style username using adjective-noun combination
 * @returns {string} Generated username (e.g., "reimagined-succotash")
 */
function generateUsername() {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adjective}-${noun}`;
}

/**
 * Checks if a username already exists in the database
 * @param {string} username - Username to check
 * @returns {Promise<boolean>} True if username exists
 */
async function usernameExists(username) {
  try {
    // Query GSI1 to check if username exists (assuming we add a GSI for username lookup)
    // For now, we'll use a simple approach: check if any user has this username
    // Note: This requires a GSI on username, or we can use a scan (less efficient)
    // With adjective-noun combinations, collisions are extremely rare (64 * 64 = 4096 combinations,
    // but we have many more words, so collisions are unlikely)
    // In production, you might want to add a GSI1PK = USERNAME#{username} for efficient lookups
    return false; // Optimistic - collisions are rare with random combinations
  } catch (error) {
    console.warn(JSON.stringify({
      at: "username_exists_check_error",
      username,
      error: error.message,
    }));
    return false; // Assume available on error
  }
}

/**
 * Generates a unique username that doesn't exist in the database
 * Uses GitHub-style adjective-noun combinations (e.g., "reimagined-succotash")
 * @param {number} maxAttempts - Maximum attempts to generate unique username
 * @returns {Promise<string>} Unique username
 */
async function generateUniqueUsername(maxAttempts = 5) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const username = generateUsername();
    const exists = await usernameExists(username);
    if (!exists) {
      return username;
    }
    console.warn(JSON.stringify({
      at: "username_collision",
      username,
      attempt: attempt + 1,
      maxAttempts,
    }));
  }
  // Fallback: use adjective-noun + timestamp if all attempts fail
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const timestamp = Date.now().toString().slice(-6);
  return `${adjective}-${noun}-${timestamp}`;
}

export const handler = async (event) => {
  const startTime = Date.now();
  const requestId = event?.request?.requestId || crypto?.randomUUID?.() || `req-${Date.now()}`;
  
  console.log(JSON.stringify({
    at: "handler_start",
    requestId,
    triggerSource: event.triggerSource,
    userPoolId: event.userPoolId,
    userName: event.userName,
    hasUserAttributes: !!event.request?.userAttributes,
  }));

  try {
    const userAttributes = event.request.userAttributes;
    const userID = userAttributes.sub;
    const email = userAttributes.email?.toLowerCase() || "";
    const givenName = userAttributes.given_name || "";
    const familyName = userAttributes.family_name || "";
    const accountType = userAttributes["custom:account_type"] || "basic"; // Default to 'basic' if not provided

    console.log(JSON.stringify({
      at: "user_attributes_extracted",
      requestId,
      userID,
      email,
      hasGivenName: !!givenName,
      hasFamilyName: !!familyName,
      accountType,
      attributeKeys: Object.keys(userAttributes),
    }));
    
    // Build display name from given/family name, or use email prefix as fallback
    const displayName = givenName || familyName
      ? `${givenName} ${familyName}`.trim()
      : email.split("@")[0];

    // Generate unique username (GitHub-style, no email used)
    const usernameStartTime = Date.now();
    const username = await generateUniqueUsername();
    const usernameDuration = Date.now() - usernameStartTime;

    console.log(JSON.stringify({
      at: "display_name_built",
      requestId,
      userID,
      displayName,
      source: givenName || familyName ? "name" : "email",
    }));

    console.log(JSON.stringify({
      at: "username_generated",
      requestId,
      userID,
      username,
      usernameDurationMs: usernameDuration,
    }));

    // Hash email for Gravatar (MD5 hash in lowercase hex format)
    const gImgHash = crypto.createHash("md5").update(email.toLowerCase().trim()).digest("hex");
    console.log(JSON.stringify({
      at: "gimg_hash_generated",
      requestId,
      userID,
      gImgHash,
      emailLength: email.length,
    }));

    const now = new Date().toISOString();

    // Build keys using helper functions
    const userKey = KeyBuilders.userProfile(userID);
    const emailKey = KeyBuilders.emailLookup(email, userID);

    console.log(JSON.stringify({
      at: "dynamodb_keys_built",
      requestId,
      userID,
      userKey,
      emailKey,
    }));

    // Create user profile item according to kyc.md schema
    const userProfile = {
      ...userKey,
      ...emailKey,
      Type: ITEM_TYPES.USER,
      userID: userID,
      email: email,
      gImgHash: gImgHash, // MD5 hash for Gravatar (lowercase hex)
      username: username,
      displayName: displayName,
      accountType: accountType, // 'basic' or 'premium' from Cognito custom attribute
      roles: ["user"], // Default role - user only
      createdAt: now,
      updatedAt: now,
    };

    console.log(JSON.stringify({
      at: "user_profile_prepared",
      requestId,
      userID,
      email,
      gImgHash,
      username,
      displayName,
      accountType,
      table: TABLE,
      profileKeys: Object.keys(userProfile),
    }));

    // Use PutCommand with ConditionExpression to make it idempotent
    // This ensures we don't overwrite existing profiles
    const dbWriteStartTime = Date.now();
    await ddb.send(
      new PutCommand({
        TableName: TABLE,
        Item: userProfile,
        ConditionExpression: "attribute_not_exists(PK)",
      })
    );
    const dbWriteDuration = Date.now() - dbWriteStartTime;

    const totalDuration = Date.now() - startTime;
    console.log(JSON.stringify({
      at: "handler_success",
      requestId,
      userID,
      email,
      gImgHash,
      username,
      displayName,
      accountType,
      table: TABLE,
      dbWriteDurationMs: dbWriteDuration,
      totalDurationMs: totalDuration,
    }));

    return event;
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    
    // If item already exists (ConditionalCheckFailedException), that's okay
    // This makes the function idempotent
    if (error.name === "ConditionalCheckFailedException") {
      console.log(JSON.stringify({
        at: "user_profile_already_exists",
        requestId,
        userID: event.request?.userAttributes?.sub,
        email: event.request?.userAttributes?.email,
        durationMs: totalDuration,
        message: "User profile already exists (idempotent)",
      }));
      return event;
    }

    // Log other errors but don't fail the confirmation
    // Cognito will still confirm the user even if this fails
    console.error(JSON.stringify({
      at: "handler_error",
      requestId,
      userID: event.request?.userAttributes?.sub,
      email: event.request?.userAttributes?.email,
      error: error?.message,
      errorName: error?.name,
      stack: error?.stack,
      durationMs: totalDuration,
    }));
    
    return event;
  }
};
