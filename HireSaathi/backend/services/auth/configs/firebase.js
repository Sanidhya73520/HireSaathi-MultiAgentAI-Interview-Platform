import { cert, initializeApp, getApps } from "firebase-admin/app";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let credential = null;

// 1. Try raw JSON or base64 encoded string from FIREBASE_SERVICE_ACCOUNT
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
    if (raw.startsWith("{")) {
      credential = cert(JSON.parse(raw));
    } else {
      const decoded = Buffer.from(raw, "base64").toString("utf-8");
      credential = cert(JSON.parse(decoded));
    }
    console.log("✅ Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT env variable");
  } catch (error) {
    console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT:", error.message);
  }
}

// 2. Try individual environment variables
if (!credential && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  try {
    credential = cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });
    console.log("✅ Firebase Admin initialized from individual Firebase environment variables");
  } catch (error) {
    console.error("❌ Failed to parse individual Firebase environment variables:", error.message);
  }
}

// 3. Fallback to local serviceAccountKey.json file if present on disk
if (!credential) {
  const possiblePaths = [
    path.join(__dirname, "../serviceAccountKey.json"),
    path.join(process.cwd(), "serviceAccountKey.json"),
    path.join(process.cwd(), "HireSaathi/backend/services/auth/serviceAccountKey.json"),
  ];

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      try {
        const fileContent = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        credential = cert(fileContent);
        console.log(`✅ Firebase Admin initialized from local file: ${filePath}`);
        break;
      } catch (error) {
        console.error(`❌ Failed to read service account from ${filePath}:`, error.message);
      }
    }
  }
}

let app = null;

if (getApps().length === 0) {
  if (credential) {
    app = initializeApp({ credential });
  } else {
    console.warn("⚠️ [WARNING] Firebase credentials not configured! Set FIREBASE_SERVICE_ACCOUNT or provide serviceAccountKey.json");
    try {
      app = initializeApp();
    } catch (e) {
      // Ignore fallback error
    }
  }
} else {
  app = getApps()[0];
}

export { app };
