import { qrController } from "../controllers/qrController.js";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin if not already initialized
if (!process.env.FIREBASE_PROJECT_ID) {
  console.error("FIREBASE_PROJECT_ID environment variable is required");
  process.exit(1);
}

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || "{}"
);

if (!serviceAccount.project_id) {
  console.error(
    "FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is required"
  );
  process.exit(1);
}

try {
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
  });
} catch (error) {
  console.log("Firebase app already initialized or error:", error.message);
}

// Function to run the cleanup
async function runCleanup() {
  try {
    console.log(
      "Starting scheduled cleanup of expired quick share QR codes..."
    );
    const deletedCount = await qrController.deleteExpiredQuickShareQRCodes(
      {},
      { json: () => {} }
    );
    console.log(`Cleanup completed. Deleted ${deletedCount} expired QR codes.`);
    return deletedCount;
  } catch (error) {
    console.error("Error during scheduled cleanup:", error);
    throw error;
  }
}

if (require.main === module) {
  runCleanup()
    .then(() => {
      console.log("Cleanup script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Cleanup script failed:", error);
      process.exit(1);
    });
}

module.exports = { runCleanup };
