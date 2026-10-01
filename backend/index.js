import cors from "cors";
import express from "express";
import bodyParser from "body-parser";
import compression from "compression";
import NodeCache from "node-cache";
import fetch from "node-fetch";
import formatUserData from "./utils/Formatter.js";
import userDataQuery from "./utils/UserDataQuery.js";
import { registerAccount, authenticateAccount } from "./utils/auth.js";
import { getStoredUsers, saveStoredUsers } from "./utils/firebase.js";
import dotenv from "dotenv";
import usernames from "./data/users.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

// High-Performance In-Memory Caches
// 1. User stats cache: 10 minutes TTL per student
const userStatsCache = new NodeCache({ stdTTL: 600, checkperiod: 120, useClones: false });
// 2. Leaderboard payload cache: 3 minutes TTL per scoped query
const leaderboardCache = new NodeCache({ stdTTL: 180, checkperiod: 60, useClones: false });

const app = express();
app.disable("x-powered-by");

// Enable Gzip / Deflate compression for 70-80% smaller response sizes
app.use(compression({
    level: 6,
    threshold: 1024, // only compress responses larger than 1KB
}));

// Security & Caching Headers Middleware
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
});

app.use(cors({ origin: "*" }));
app.use(bodyParser.json({ limit: "10mb" }));

// Helper to invalidate all leaderboard responses when data changes
const invalidateLeaderboardCache = () => {
    leaderboardCache.flushAll();
};

// ----------------------------------------------------
// Health Check & Keep-Alive Endpoints (Zero Overhead)
// ----------------------------------------------------
const healthHandler = (req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.json({
        status: "healthy",
        service: "LeetCode Arena Backend",
        uptimeSeconds: Math.floor(process.uptime()),
        cachedProfiles: userStatsCache.stats.keys,
        timestamp: new Date().toISOString(),
    });
};

app.get("/", healthHandler);
app.get("/api/ping", healthHandler);
app.get("/api/health", healthHandler);
app.get("/healthz", healthHandler);

// ----------------------------------------------------
// Auth Routes
// ----------------------------------------------------
app.post("/api/auth/signup", async (req, res) => {
    try {
        const { username, password, name } = req.body;
        const user = await registerAccount({ username, password, name });
        res.json({
            message: "Account created successfully",
            user,
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await authenticateAccount({ username, password });
        res.json({
            message: "Login successful",
            user,
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// ----------------------------------------------------
// LeetCode GraphQL Fetcher with Retry & In-Memory Cache
// ----------------------------------------------------
const fetchUserDetailsFromLeetCode = async (username, retries = 2) => {
    const cleanUser = username.trim();
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

            const response = await fetch("https://leetcode.com/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Referer: "https://leetcode.com",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                },
                body: JSON.stringify({
                    query: userDataQuery,
                    variables: { username: cleanUser },
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                if (response.status === 429 && attempt < retries) {
                    await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
                    continue;
                }
                throw new Error(`LeetCode API returned status ${response.status}`);
            }

            const result = await response.json();
            if (result.errors) {
                throw new Error(result.errors[0]?.message || "GraphQL query error");
            }

            return result.data;
        } catch (err) {
            if (attempt === retries) throw err;
            await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
        }
    }
};

// Cached wrapper for fetching user details
const fetchUserDetails = async (username, forceRefresh = false) => {
    const cacheKey = username.trim().toLowerCase();
    if (!forceRefresh) {
        const cached = userStatsCache.get(cacheKey);
        if (cached) return cached;
    }

    const data = await fetchUserDetailsFromLeetCode(username);
    if (data && data.matchedUser) {
        userStatsCache.set(cacheKey, data);
    }
    return data;
};

// Concurrency Batch Helper (prevents CPU spikes & LeetCode 429 errors)
const runWithConcurrency = async (items, concurrencyLimit, workerFn) => {
    const results = new Array(items.length);
    let currentIndex = 0;

    const workers = Array.from({ length: Math.min(concurrencyLimit, items.length) }, async () => {
        while (currentIndex < items.length) {
            const index = currentIndex++;
            try {
                results[index] = await workerFn(items[index]);
            } catch (err) {
                results[index] = null;
            }
        }
    });

    await Promise.all(workers);
    return results;
};

// ----------------------------------------------------
// User & Leaderboard Routes
// ----------------------------------------------------

// Single user details
app.post("/api/user", async (req, res) => {
    const { username, name, regNo, dept, displayName } = req.body;

    if (!username) {
        return res.status(400).json({ error: "Username is required" });
    }

    try {
        const userData = await fetchUserDetails(username);
        const formattedData = formatUserData(userData, {
            name: name || displayName || "",
            displayName: displayName || name || "",
            regNo: regNo || "",
            dept: dept || "",
        });
        res.json(formattedData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all configured users leaderboard data with role scoping & high-speed cache
app.get("/api/users", async (req, res) => {
    try {
        const { user: reqUser, role, refresh } = req.query;
        const forceRefresh = refresh === "true" || refresh === "1";
        const cacheKey = `leaderboard_${role || "user"}_${(reqUser || "all").toString().toLowerCase()}`;

        // Return from cache if valid and refresh not explicitly requested (< 5ms response time)
        if (!forceRefresh) {
            const cachedResponse = leaderboardCache.get(cacheKey);
            if (cachedResponse) {
                res.setHeader("X-Cache", "HIT");
                return res.json(cachedResponse);
            }
        }

        let allUsers = await getStoredUsers(usernames.users || []);

        // Filter users based on role
        let users = allUsers;
        if (role !== "admin" && reqUser) {
            users = allUsers.filter(
                (u) => u.createdBy && u.createdBy.toLowerCase() === reqUser.toString().toLowerCase()
            );
        }

        if (users.length === 0) {
            const emptyResult = { totalUsers: 0, fetchedUsers: 0, usersData: [] };
            leaderboardCache.set(cacheKey, emptyResult, 60);
            return res.json(emptyResult);
        }

        // Fetch user stats with controlled concurrency (Max 8 parallel queries)
        const usersData = await runWithConcurrency(users, 8, async (user) => {
            try {
                const userData = await fetchUserDetails(user.username, forceRefresh);
                return formatUserData(userData, user);
            } catch (error) {
                console.error(`Error fetching data for ${user.username}: ${error.message}`);
                // Return minimal fallback so student record still appears
                return formatUserData(null, user);
            }
        });

        const validUsersData = usersData.filter((u) => u !== null);
        const payload = {
            totalUsers: users.length,
            fetchedUsers: validUsersData.length,
            usersData: validUsersData,
        };

        // Store in fast in-memory cache for 3 minutes
        leaderboardCache.set(cacheKey, payload, 180);
        res.setHeader("X-Cache", "MISS");
        res.json(payload);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper: Merges new incoming user records into existing list, updating matching records
const mergeUserRecords = (existingList, incomingList, defaultCreatedBy) => {
    const result = [...existingList];

    for (const incoming of incomingList) {
        const cleanUser = {
            username: (incoming.username || "").trim(),
            name: (incoming.name || incoming.displayName || "").trim(),
            displayName: (incoming.displayName || incoming.name || "").trim(),
            regNo: (incoming.regNo || incoming.reg_no || incoming.registerNumber || "").toString().trim(),
            dept: (incoming.dept || incoming.department || "").toString().trim(),
            createdBy: incoming.createdBy || defaultCreatedBy,
        };

        if (!cleanUser.username) continue;

        // Match based on LeetCode username OR RegNo OR Name+Dept
        const matchIndex = result.findIndex((existing) => {
            const sameUsername = existing.username.toLowerCase() === cleanUser.username.toLowerCase();
            const sameRegNo =
                Boolean(existing.regNo) &&
                Boolean(cleanUser.regNo) &&
                existing.regNo.toLowerCase() === cleanUser.regNo.toLowerCase();
            const sameNameAndDept =
                Boolean(existing.name) &&
                Boolean(cleanUser.name) &&
                Boolean(existing.dept) &&
                Boolean(cleanUser.dept) &&
                existing.name.toLowerCase() === cleanUser.name.toLowerCase() &&
                existing.dept.toLowerCase() === cleanUser.dept.toLowerCase();

            return sameUsername || sameRegNo || sameNameAndDept;
        });

        if (matchIndex !== -1) {
            result[matchIndex] = {
                ...result[matchIndex],
                username: cleanUser.username || result[matchIndex].username,
                name: cleanUser.name || result[matchIndex].name,
                displayName: cleanUser.displayName || result[matchIndex].displayName,
                regNo: cleanUser.regNo || result[matchIndex].regNo,
                dept: cleanUser.dept || result[matchIndex].dept,
                createdBy: cleanUser.createdBy || result[matchIndex].createdBy,
            };
        } else {
            result.push(cleanUser);
        }
    }

    return result;
};

// Update all users (e.g. after uploading Excel sheet)
app.post("/api/users/update-all", async (req, res) => {
    try {
        const { users, createdBy = "admin", role = "user" } = req.body;
        if (!Array.isArray(users)) {
            return res.status(400).json({ error: "Invalid users list provided" });
        }

        const currentUsers = await getStoredUsers(usernames.users || []);

        let finalUsersList = [];
        if (role === "admin") {
            finalUsersList = mergeUserRecords(currentUsers, users, createdBy);
        } else {
            // Regular user: strictly preserve all admin records and other users' records
            const requester = (createdBy || "user").toLowerCase();
            const otherUsers = currentUsers.filter(
                (u) => !u.createdBy || u.createdBy.toLowerCase() !== requester || u.createdBy.toLowerCase() === "admin"
            );
            const myCurrentUsers = currentUsers.filter(
                (u) => u.createdBy && u.createdBy.toLowerCase() === requester && u.createdBy.toLowerCase() !== "admin"
            );
            const myMergedUsers = mergeUserRecords(myCurrentUsers, users, createdBy);
            finalUsersList = [...otherUsers, ...myMergedUsers];
        }

        await saveStoredUsers(finalUsersList);
        invalidateLeaderboardCache();

        res.json({
            message: `Successfully saved & updated ${users.length} users in leaderboard`,
            count: finalUsersList.length,
            users: finalUsersList,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a single user
app.post("/api/users/delete", async (req, res) => {
    try {
        const { username, createdBy, role } = req.body;
        if (!username) {
            return res.status(400).json({ error: "Username is required" });
        }

        const cleanUsername = username.trim().toLowerCase();
        const currentUsers = await getStoredUsers(usernames.users || []);
        let filteredUsers = [];

        if (role === "admin") {
            filteredUsers = currentUsers.filter(
                (u) => u.username.toLowerCase() !== cleanUsername
            );
        } else {
            const requester = (createdBy || "").toLowerCase();
            filteredUsers = currentUsers.filter((u) => {
                const isMatch = u.username.toLowerCase() === cleanUsername;
                if (!isMatch) return true;
                const isCreatedByRequester = u.createdBy && u.createdBy.toLowerCase() === requester && u.createdBy.toLowerCase() !== "admin";
                return !isCreatedByRequester;
            });
        }

        await saveStoredUsers(filteredUsers);
        invalidateLeaderboardCache();

        res.json({
            message: `User ${username} deleted successfully`,
            users: filteredUsers,
            count: filteredUsers.length,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Clear users
app.post("/api/users/clear-all", async (req, res) => {
    try {
        const { createdBy, role } = req.body;
        const currentUsers = await getStoredUsers(usernames.users || []);

        if (role === "admin") {
            await saveStoredUsers([]);
        } else if (createdBy) {
            const requester = createdBy.toLowerCase();
            const remaining = currentUsers.filter(
                (u) => !u.createdBy || u.createdBy.toLowerCase() !== requester || u.createdBy.toLowerCase() === "admin"
            );
            await saveStoredUsers(remaining);
        }

        invalidateLeaderboardCache();

        res.json({
            message: "Users have been cleared successfully",
            count: 0,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add a single user
app.post("/api/users/add", async (req, res) => {
    try {
        const { username, name, regNo, dept, displayName, createdBy = "admin", role = "user" } = req.body;
        if (!username) {
            return res.status(400).json({ error: "Username is required" });
        }

        const currentUsers = await getStoredUsers(usernames.users || []);
        let updatedUsers = [];

        if (role === "admin") {
            const singleIncoming = [{ username, name: name || "", regNo: regNo || "", dept: dept || "", displayName: displayName || name || "", createdBy: "admin" }];
            updatedUsers = mergeUserRecords(currentUsers, singleIncoming, "admin");
        } else {
            const userCreatedBy = createdBy || "user";
            const otherUsers = currentUsers.filter(
                (u) => !u.createdBy || u.createdBy.toLowerCase() !== userCreatedBy.toLowerCase() || u.createdBy.toLowerCase() === "admin"
            );
            const myCurrentUsers = currentUsers.filter(
                (u) => u.createdBy && u.createdBy.toLowerCase() === userCreatedBy.toLowerCase() && u.createdBy.toLowerCase() !== "admin"
            );
            const singleIncoming = [{ username, name: name || "", regNo: regNo || "", dept: dept || "", displayName: displayName || name || "", createdBy: userCreatedBy }];
            const myMergedUsers = mergeUserRecords(myCurrentUsers, singleIncoming, userCreatedBy);
            updatedUsers = [...otherUsers, ...myMergedUsers];
        }

        await saveStoredUsers(updatedUsers);
        invalidateLeaderboardCache();

        const userData = await fetchUserDetails(username.trim());
        const formattedData = formatUserData(userData, {
            username: username.trim(),
            name: name || "",
            displayName: displayName || name || "",
            regNo: regNo || "",
            dept: dept || "",
            createdBy: role === "admin" ? "admin" : createdBy,
        });

        res.json({
            message: "User added/updated successfully",
            user: formattedData,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Periodic background sync loop (every 10 minutes) to keep cache warm
setInterval(async () => {
    try {
        const stored = await getStoredUsers(usernames.users || []);
        if (stored && stored.length > 0) {
            // Warm cache with max 6 concurrent background requests
            await runWithConcurrency(stored.slice(0, 50), 6, async (u) => {
                try {
                    await fetchUserDetails(u.username, true);
                } catch {
                    // ignore background errors
                }
            });
        }
    } catch {
        // ignore background worker errors
    }
}, 10 * 60 * 1000);

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running with high-performance caching on port ${PORT}`);
});
