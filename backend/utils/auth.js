import crypto from "crypto";
import { getStoredAccounts, saveStoredAccount } from "./firebase.js";

export const hashPassword = (password) => {
    return crypto.createHash("sha256").update(password).digest("hex");
};

// Default seed admin
export const ADMIN_DEFAULT = {
    id: "admin-root-id",
    username: "admin",
    name: "Admin",
    role: "admin",
    passwordHash: hashPassword("admin@123"),
    createdAt: "2026-10-01T00:00:00.000Z",
};

export const registerAccount = async ({ username, password, name = "" }) => {
    if (!username || !password) {
        throw new Error("Username and password are required.");
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
        throw new Error("Username must be at least 3 characters long.");
    }
    if (password.length < 4) {
        throw new Error("Password must be at least 4 characters long.");
    }

    const accounts = await getStoredAccounts(ADMIN_DEFAULT);
    const existing = accounts.find((acc) => acc.username.toLowerCase() === cleanUsername);
    if (existing) {
        throw new Error("Username already taken. Please choose another.");
    }

    const newAccount = {
        id: crypto.randomUUID(),
        username: cleanUsername,
        name: name.trim() || cleanUsername,
        role: "user",
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString(),
    };

    await saveStoredAccount(newAccount);

    return {
        id: newAccount.id,
        username: newAccount.username,
        name: newAccount.name,
        role: newAccount.role,
        token: `token_${newAccount.id}_${Date.now()}`,
    };
};

export const authenticateAccount = async ({ username, password }) => {
    if (!username || !password) {
        throw new Error("Username and password are required.");
    }

    const cleanUsername = username.trim().toLowerCase();
    const accounts = await getStoredAccounts(ADMIN_DEFAULT);
    const account = accounts.find((acc) => acc.username.toLowerCase() === cleanUsername);

    if (!account) {
        throw new Error("Invalid username or password.");
    }

    const hash = hashPassword(password);
    if (account.passwordHash !== hash) {
        throw new Error("Invalid username or password.");
    }

    return {
        id: account.id,
        username: account.username,
        name: account.name,
        role: account.role || (cleanUsername === "admin" ? "admin" : "user"),
        token: `token_${account.id}_${Date.now()}`,
    };
};
