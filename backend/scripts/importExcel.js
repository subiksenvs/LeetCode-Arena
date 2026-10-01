import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { exportToExcelCsv } from "./syncLeaderboard.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USERS_FILE_PATH = path.join(__dirname, "..", "data", "users.js");

const normalizeHeader = (header) => {
    return (header || "").toString().toLowerCase().replace(/[^a-z0-9]/g, "");
};

export const importAndSync = async (filePath) => {
    if (!filePath || !fs.existsSync(filePath)) {
        console.error("❌ Please provide a valid file path to an Excel (.xlsx, .csv) file.");
        process.exit(1);
    }

    console.log(`Reading file: ${filePath}`);
    let rows = [];

    // Simple CSV parser for node environment without external deps
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) {
        console.error("❌ File is empty or contains only headers.");
        return;
    }

    const headers = lines[0].split(",").map(h => h.replace(/^["']|["']$/g, "").trim());
    const findIndex = (candidates) => {
        return headers.findIndex((h) => {
            const norm = normalizeHeader(h);
            return candidates.some((c) => norm === c || norm.includes(c));
        });
    };

    const usernameIdx = findIndex(["username", "leetcodeusername", "leetcodeid", "handle", "leetcode", "id"]);
    const nameIdx = findIndex(["name", "studentname", "fullname", "displayname"]);
    const regNoIdx = findIndex(["regno", "registernumber", "registerno", "rollno", "registrationno", "reg"]);
    const deptIdx = findIndex(["dept", "department", "branch", "stream"]);

    if (usernameIdx === -1) {
        console.error("❌ Could not find a 'Username' or 'LeetCode Username' column in the header.");
        return;
    }

    for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",").map(p => p.replace(/^["']|["']$/g, "").trim());
        const username = parts[usernameIdx] || "";
        if (!username) continue;

        const name = nameIdx !== -1 ? parts[nameIdx] : username;
        const regNo = regNoIdx !== -1 ? parts[regNoIdx] : "";
        const dept = deptIdx !== -1 ? parts[deptIdx] : "";

        rows.push({
            name: name || username,
            regNo: regNo,
            dept: dept,
            username: username,
            displayName: name || username
        });
    }

    console.log(`Parsed ${rows.length} users from file.`);
    const fileContent = `const usernames = ${JSON.stringify({ users: rows }, null, 4)};\n\nexport default usernames;\n`;
    fs.writeFileSync(USERS_FILE_PATH, fileContent, "utf-8");
    console.log(`✅ Saved ${rows.length} users to data/users.js`);

    console.log("\nStarting export sync with LeetCode API...");
    await exportToExcelCsv();
};

const targetPath = process.argv[2];
if (targetPath) {
    importAndSync(targetPath);
} else {
    console.log("Usage: node backend/scripts/importExcel.js <path-to-excel-or-csv-file>");
}
