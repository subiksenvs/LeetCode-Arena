import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USERS_FILE_PATH = path.join(__dirname, "..", "data", "users.js");
const ACCOUNTS_FILE_PATH = path.join(__dirname, "..", "data", "accounts.json");
const LOCAL_SERVICE_KEY_PATH = path.join(__dirname, "..", "serviceAccountKey.json");

let db = null;
let isFirebaseActive = false;

// Initialize Firebase Admin
try {
    let credential = null;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // Option 1: Full JSON string in env var
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        credential = cert(serviceAccount);
    } else if (
        process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY
    ) {
        // Option 2: Individual env vars
        credential = cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        });
    } else if (fs.existsSync(LOCAL_SERVICE_KEY_PATH)) {
        // Option 3: Local file
        const serviceAccount = JSON.parse(fs.readFileSync(LOCAL_SERVICE_KEY_PATH, "utf-8"));
        credential = cert(serviceAccount);
    }

    if (credential) {
        if (!getApps().length) {
            initializeApp({ credential });
        }
        db = getFirestore();
        isFirebaseActive = true;
        console.log("🔥 Firebase Firestore connected successfully as primary database!");
    } else {
        console.log("ℹ️ Firebase credentials not found. Using local JSON storage fallback.");
    }
} catch (error) {
    console.warn("⚠️ Could not initialize Firebase Admin SDK:", error.message);
    console.log("ℹ️ Falling back to local storage.");
    db = null;
    isFirebaseActive = false;
}

// --------------------- USERS / STUDENTS REPOSITORY ---------------------

export const getStoredUsers = async (defaultFallback = []) => {
    if (isFirebaseActive && db) {
        try {
            const doc = await db.collection("leaderboard").doc("students").get();
            if (doc.exists && Array.isArray(doc.data()?.users)) {
                return doc.data().users;
            }
            // If doc doesn't exist yet, seed it
            if (defaultFallback && defaultFallback.length > 0) {
                await saveStoredUsers(defaultFallback);
            }
            return defaultFallback;
        } catch (err) {
            console.error("Firestore getStoredUsers error:", err.message);
        }
    }

    // Local fallback
    try {
        if (fs.existsSync(USERS_FILE_PATH)) {
            const content = fs.readFileSync(USERS_FILE_PATH, "utf-8");
            const match = content.match(/const usernames = ([\s\S]*?);\s*export default/);
            if (match) {
                const parsed = JSON.parse(match[1]);
                return parsed.users || [];
            }
        }
    } catch {}
    return defaultFallback;
};

export const saveStoredUsers = async (usersList) => {
    // 1. Save to Firebase if active
    if (isFirebaseActive && db) {
        try {
            await db.collection("leaderboard").doc("students").set({
                users: usersList,
                updatedAt: new Date().toISOString(),
            });
        } catch (err) {
            console.error("Firestore saveStoredUsers error:", err.message);
        }
    }

    // 2. Always persist to local file as backup/cache
    try {
        const fileContent = `const usernames = ${JSON.stringify({ users: usersList }, null, 4)};\n\nexport default usernames;\n`;
        fs.writeFileSync(USERS_FILE_PATH, fileContent, "utf-8");
    } catch (err) {
        console.warn("Local users file save error:", err.message);
    }
};

// --------------------- ACCOUNTS REPOSITORY ---------------------

export const getStoredAccounts = async (defaultAdmin) => {
    if (isFirebaseActive && db) {
        try {
            const snapshot = await db.collection("accounts").get();
            if (!snapshot.empty) {
                const accounts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                // Ensure admin exists
                if (!accounts.some((a) => a.username?.toLowerCase() === "admin")) {
                    await saveStoredAccount(defaultAdmin);
                    accounts.unshift(defaultAdmin);
                }
                return accounts;
            } else if (defaultAdmin) {
                await saveStoredAccount(defaultAdmin);
                return [defaultAdmin];
            }
        } catch (err) {
            console.error("Firestore getStoredAccounts error:", err.message);
        }
    }

    // Local fallback
    try {
        if (!fs.existsSync(ACCOUNTS_FILE_PATH)) {
            fs.writeFileSync(ACCOUNTS_FILE_PATH, JSON.stringify([defaultAdmin], null, 2), "utf-8");
            return [defaultAdmin];
        }
        const data = fs.readFileSync(ACCOUNTS_FILE_PATH, "utf-8");
        const accounts = JSON.parse(data || "[]");
        if (!accounts.some((acc) => acc.username?.toLowerCase() === "admin")) {
            accounts.unshift(defaultAdmin);
            fs.writeFileSync(ACCOUNTS_FILE_PATH, JSON.stringify(accounts, null, 2), "utf-8");
        }
        return accounts;
    } catch {
        return [defaultAdmin];
    }
};

export const saveStoredAccount = async (account) => {
    if (isFirebaseActive && db) {
        try {
            await db.collection("accounts").doc(account.id || account.username).set(account);
        } catch (err) {
            console.error("Firestore saveStoredAccount error:", err.message);
        }
    }

    // Local fallback
    try {
        let accounts = [];
        if (fs.existsSync(ACCOUNTS_FILE_PATH)) {
            accounts = JSON.parse(fs.readFileSync(ACCOUNTS_FILE_PATH, "utf-8") || "[]");
        }
        const idx = accounts.findIndex((a) => a.username.toLowerCase() === account.username.toLowerCase());
        if (idx !== -1) {
            accounts[idx] = account;
        } else {
            accounts.push(account);
        }
        fs.writeFileSync(ACCOUNTS_FILE_PATH, JSON.stringify(accounts, null, 2), "utf-8");
    } catch (err) {
        console.warn("Local account save error:", err.message);
    }
};

export { isFirebaseActive };
