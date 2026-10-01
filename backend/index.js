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
app.use(cors({ origin: "*" }));
app.use(bodyParser.json({ limit: "50mb" }));

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

// Update all users (e.g. after uploading Excel sheet)
app.post("/api/users/update-all", async (req, res) => {
    try {
        const { users, createdBy = "admin", role = "user" } = req.body;
        if (!Array.isArray(users)) {
            return res.status(400).json({ error: "Invalid users list provided" });
        }

        const currentUsers = await getStoredUsers(usernames.users || []);

        const sanitizedUsers = users.map((u) => ({
            username: (u.username || "").trim(),
            name: (u.name || u.displayName || u.username || "").trim(),
            displayName: (u.displayName || u.name || u.username || "").trim(),
            regNo: (u.regNo || u.reg_no || u.registerNumber || "").toString().trim(),
            dept: (u.dept || u.department || "").toString().trim(),
            createdBy: u.createdBy || createdBy,
        })).filter(u => u.username.length > 0);

        let finalUsersList = [];
        if (role === "admin") {
            finalUsersList = sanitizedUsers;
        } else {
            const otherUsers = currentUsers.filter(
                (u) => u.createdBy && u.createdBy.toLowerCase() !== createdBy.toLowerCase()
            );
            finalUsersList = [...otherUsers, ...sanitizedUsers];
        }

        await saveStoredUsers(finalUsersList);

        res.json({
            message: `Successfully saved ${sanitizedUsers.length} users to leaderboard`,
            count: sanitizedUsers.length,
            users: sanitizedUsers,
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
            filteredUsers = currentUsers.filter(
                (u) =>
                    !(
                        u.username.toLowerCase() === cleanUsername &&
                        (!u.createdBy || (createdBy && u.createdBy.toLowerCase() === createdBy.toLowerCase()))
                    )
            );
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
            const remaining = currentUsers.filter(
                (u) => u.createdBy && u.createdBy.toLowerCase() !== createdBy.toLowerCase()
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
        const { username, name, regNo, dept, displayName, createdBy = "admin" } = req.body;
        if (!username) {
            return res.status(400).json({ error: "Username is required" });
        }

        const cleanUsername = username.trim();
        const currentUsers = await getStoredUsers(usernames.users || []);
        const existingIndex = currentUsers.findIndex(
            (u) => u.username.toLowerCase() === cleanUsername.toLowerCase()
        );

        const newUser = {
            username: cleanUsername,
            name: (name || displayName || cleanUsername).trim(),
            displayName: (displayName || name || cleanUsername).trim(),
            regNo: (regNo || "").toString().trim(),
            dept: (dept || "").toString().trim(),
            createdBy: createdBy,
        };

        let updatedUsers = [...currentUsers];
        if (existingIndex !== -1) {
            updatedUsers[existingIndex] = newUser;
        } else {
            updatedUsers.push(newUser);
        }

        await saveStoredUsers(updatedUsers);

        // Fetch user data to verify and return
        const userData = await fetchUserDetails(cleanUsername);
        const formattedData = formatUserData(userData, newUser);

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

