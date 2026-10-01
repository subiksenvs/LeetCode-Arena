import cors from "cors";
import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import formatUserData from "./utils/Formatter.js";
import userDataQuery from "./utils/UserDataQuery.js";
import { registerAccount, authenticateAccount } from "./utils/auth.js";
import { getStoredUsers, saveStoredUsers } from "./utils/firebase.js";
import dotenv from "dotenv";
import usernames from "./data/users.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || "*";

const app = express();
app.disable("x-powered-by");

// Security Headers Middleware
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
});

app.use(cors({ origin: "*" }));
app.use(bodyParser.json({ limit: "10mb" }));

// Auth Routes: Signup
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

// Auth Routes: Login
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

// Fetch User Details from LeetCode GraphQL
const fetchUserDetails = async (username) => {
    const response = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Referer: "https://leetcode.com",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
        body: JSON.stringify({
            query: userDataQuery,
            variables: { username: username.trim() },
        }),
    });

    const result = await response.json();

    if (result.errors) {
        throw new Error(result.errors[0].message);
    }

    return result.data;
};

// Single user details
app.post("/api/user", async (req, res) => {
    const { username, name, regNo, dept, displayName } = req.body;

    if (!username) {
        return res.status(400).json({ error: "Username is required" });
    }

    try {
        const userData = await fetchUserDetails(username);
        const formattedData = formatUserData(userData, {
            name: name || displayName || username,
            displayName: displayName || name || username,
            regNo: regNo || "",
            dept: dept || "",
        });
        res.json(formattedData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all configured users leaderboard data with role scoping
app.get("/api/users", async (req, res) => {
    try {
        const { user: reqUser, role } = req.query;
        let allUsers = await getStoredUsers(usernames.users || []);

        // Filter users based on role
        let users = allUsers;
        if (role !== "admin" && reqUser) {
            users = allUsers.filter(
                (u) => u.createdBy && u.createdBy.toLowerCase() === reqUser.toString().toLowerCase()
            );
        }

        if (users.length === 0) {
            return res.json({ totalUsers: 0, fetchedUsers: 0, usersData: [] });
        }

        const userDataPromises = users.map(async (user) => {
            try {
                const userData = await fetchUserDetails(user.username);
                return formatUserData(userData, user);
            } catch (error) {
                console.error(
                    `Error fetching data for ${user.username}: ${error.message}`
                );
                return null;
            }
        });

        const totalUsers = users.length;
        const usersData = (await Promise.all(userDataPromises)).filter(
            (user) => user !== null
        );
        const fetchedUsers = usersData.length;
        res.json({ totalUsers, fetchedUsers, usersData });
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
            name: (incoming.name || incoming.displayName || incoming.username || "").trim(),
            displayName: (incoming.displayName || incoming.name || incoming.username || "").trim(),
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
            // Update existing entry with any updated fields
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
            // New record
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
            // Admin can delete from global list
            filteredUsers = currentUsers.filter(
                (u) => u.username.toLowerCase() !== cleanUsername
            );
        } else {
            // Non-admin user can ONLY delete records they personally created (NEVER admin records or default records)
            const requester = (createdBy || "").toLowerCase();
            filteredUsers = currentUsers.filter((u) => {
                const isMatch = u.username.toLowerCase() === cleanUsername;
                if (!isMatch) return true; // keep other usernames

                // Only delete if created by this specific user and not admin
                const isCreatedByRequester = u.createdBy && u.createdBy.toLowerCase() === requester && u.createdBy.toLowerCase() !== "admin";
                return !isCreatedByRequester; // keep if created by admin or someone else
            });
        }

        await saveStoredUsers(filteredUsers);

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
            // Non-admin clear only removes their own records, strictly preserving admin and other users' records
            const remaining = currentUsers.filter(
                (u) => !u.createdBy || u.createdBy.toLowerCase() !== requester || u.createdBy.toLowerCase() === "admin"
            );
            await saveStoredUsers(remaining);
        }

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

        // Fetch user data to verify and return
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

app.get("/", (req, res) => {
    res.send("Welcome to LeetCode API");
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

