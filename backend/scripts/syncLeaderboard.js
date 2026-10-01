import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import formatUserData from "../utils/Formatter.js";
import userDataQuery from "../utils/UserDataQuery.js";
import usernames from "../data/users.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USERS_FILE_PATH = path.join(__dirname, "..", "data", "users.js");
const OUTPUT_EXCEL_PATH = path.join(__dirname, "..", "..", "LeetCode_Leaderboard_Export.csv");

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

// Export to CSV / Excel compatible format
export const exportToExcelCsv = async () => {
    console.log("Fetching all LeetCode statistics for export...");
    const users = usernames.users;
    const results = [];

    for (let i = 0; i < users.length; i++) {
        const u = users[i];
        try {
            console.log(`[${i + 1}/${users.length}] Fetching ${u.username}...`);
            const data = await fetchUserDetails(u.username);
            const formatted = formatUserData(data, u);
            results.push(formatted);
        } catch (err) {
            console.error(`Failed to fetch ${u.username}: ${err.message}`);
        }
    }

    // Sort by total solved desc
    results.sort((a, b) => b.totalSolved - a.totalSolved);

    const headers = [
        "Rank",
        "Reg No",
        "Name",
        "Department",
        "LeetCode Username",
        "Total Solved",
        "Total Questions",
        "Easy Solved",
        "Medium Solved",
        "Hard Solved",
        "Acceptance Rate (%)",
        "Global Ranking",
        "Current Streak (Days)",
        "Solved Today",
        "LeetCode Profile URL"
    ];

    const rows = results.map((user, idx) => [
        idx + 1,
        `"${user.regNo || ""}"`,
        `"${user.name || user.displayName || ""}"`,
        `"${user.dept || ""}"`,
        `"${user.username}"`,
        user.totalSolved,
        user.totalQuestions,
        user.easySolved,
        user.mediumSolved,
        user.hardSolved,
        user.acceptanceRate.toFixed(2),
        user.ranking,
        user.currentStreak,
        user.solvedToday ? "Yes" : "No",
        `"https://leetcode.com/${user.username}/"`
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    fs.writeFileSync(OUTPUT_EXCEL_PATH, "\uFEFF" + csvContent, "utf-8");
    console.log(`\n✅ Successfully generated leaderboard export at: ${OUTPUT_EXCEL_PATH}`);
    return OUTPUT_EXCEL_PATH;
};

// If run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    exportToExcelCsv();
}
