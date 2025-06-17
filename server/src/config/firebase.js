import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import * as dotenv from "dotenv";

dotenv.config();

const serviceAccountJSON = Buffer.from(
  process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || "",
  "base64"
).toString("utf-8");

const serviceAccount = JSON.parse(serviceAccountJSON);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const db = getFirestore();
export const auth = getAuth();
