import { UserData, UserInput } from "../types/leetcode";

// Type declaration for window.XLSX from CDN
declare global {
    interface Window {
        XLSX: any;
    }
}

/**
 * Normalizes header string to lowercase alphanumeric
 */
const normalizeHeader = (header: any): string => {
    if (header === null || header === undefined) return "";
    return header.toString().toLowerCase().trim().replace(/[^a-z0-9]/g, "");
};

/**
 * Extracts a clean LeetCode username even if a full profile URL is provided
 * e.g., "https://leetcode.com/u/john_doe/" -> "john_doe"
 */
const extractLeetCodeUsername = (input: string): string => {
    let clean = input.trim();
    if (!clean) return "";

    // If it's a URL
    if (clean.includes("leetcode.com")) {
        try {
            // Remove protocol and trailing slash
            clean = clean.replace(/https?:\/\/(www\.)?leetcode\.com\/(u\/)?/i, "").replace(/\/+$/, "");
            clean = clean.split("/")[0].split("?")[0].split("#")[0];
        } catch {
            // fallback
        }
    }
    // Remove @ prefix if present
    clean = clean.replace(/^@/, "").trim();
    return clean;
};

export interface ParsedExcelResult {
    users: UserInput[];
    detectedColumns: {
        username: string | null;
        name: string | null;
        regNo: string | null;
        dept: string | null;
    };
    totalRows: number;
}

/**
 * Parses an Excel or CSV file and accurately extracts ONLY { name, regNo, dept, username }
 * Guarantees that no two fields map to the exact same column.
 */
export const parseExcelFile = async (file: File): Promise<ParsedExcelResult> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const XLSX = window.XLSX;
                if (!XLSX) {
                    throw new Error("Excel parser library is not loaded. Please check your internet connection.");
                }

                const workbook = XLSX.read(data, { type: "array" });
                if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                    throw new Error("The uploaded Excel workbook contains no sheets. Please select a valid file.");
                }

                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

                if (rawJson.length === 0) {
                    throw new Error("The uploaded Excel sheet contains no data rows. Please select another file.");
                }

                const allKeys = Object.keys(rawJson[0]);
                const remainingKeys = new Set(allKeys);

                // Helper to claim the best matching key and remove it from remaining pool
                const claimBestKey = (exactMatchers: string[], fuzzyMatchers: string[]): string | null => {
                    // Pass 1: Exact match
                    for (const key of remainingKeys) {
                        const norm = normalizeHeader(key);
                        if (exactMatchers.includes(norm)) {
                            remainingKeys.delete(key);
                            return key;
                        }
                    }
                    // Pass 2: Fuzzy match
                    for (const key of remainingKeys) {
                        const norm = normalizeHeader(key);
                        if (fuzzyMatchers.some((f) => norm.includes(f))) {
                            remainingKeys.delete(key);
                            return key;
                        }
                    }
                    return null;
                };

                // 1. Claim LeetCode Username first (highest priority)
                const usernameKey = claimBestKey(
                    ["leetcodeusername", "leetcodeid", "lchandle", "leetcodehandle", "username", "leetcode", "lcu", "lcid", "handle", "profile", "leetcodeurl"],
                    ["leetcode", "username", "handle"]
                );

                // 2. Claim Reg No
                const regNoKey = claimBestKey(
                    ["regno", "registerno", "registernumber", "registrationno", "registrationnumber", "rollno", "rollnumber", "reg", "htno", "hallticket", "studentid", "idno", "roll"],
                    ["reg", "roll", "htno", "register"]
                );

                // 3. Claim Department
                const deptKey = claimBestKey(
                    ["department", "dept", "branch", "deptname", "departmentname", "stream", "course", "sec", "section"],
                    ["dept", "department", "branch", "stream"]
                );

                // 4. Claim Name (only from remaining unclaimed keys - never the same as username)
                const nameKey = claimBestKey(
                    ["studentname", "name", "fullname", "nameofstudent", "studentfullname", "candidatename", "displayname", "nameofcandidate", "student"],
                    ["name", "student"]
                );

                if (!usernameKey) {
                    const foundCols = allKeys.map(k => `"${k}"`).join(", ");
                    throw new Error(
                        `Could not find a required 'LeetCode Username' column in your sheet. Found columns: [${foundCols}]. Please ensure your file includes a column named 'LeetCode Username', 'Username', or 'Handle'.`
                    );
                }

                const userMap = new Map<string, UserInput>();

                for (const row of rawJson) {
                    const rawUsername = row[usernameKey]?.toString() || "";
                    const username = extractLeetCodeUsername(rawUsername);

                    // Skip rows without a valid username
                    if (!username || username.length === 0) continue;

                    const rawName = nameKey ? (row[nameKey]?.toString() || "").trim() : "";
                    const rawRegNo = regNoKey ? (row[regNoKey]?.toString() || "").trim() : "";
                    const rawDept = deptKey ? (row[deptKey]?.toString() || "").trim() : "";

                    const userRecord: UserInput = {
                        username: username,
                        name: rawName || username,
                        displayName: rawName || username,
                        regNo: rawRegNo,
                        dept: rawDept,
                    };

                    const dedupKey = username.toLowerCase();
                    userMap.set(dedupKey, userRecord);
                }

                const users = Array.from(userMap.values());

                if (users.length === 0) {
                    throw new Error("No valid usernames could be extracted from the sheet. Please verify your file contents.");
                }

                resolve({
                    users,
                    detectedColumns: {
                        username: usernameKey,
                        name: nameKey,
                        regNo: regNoKey,
                        dept: deptKey,
                    },
                    totalRows: rawJson.length,
                });
            } catch (err: any) {
                reject(err);
            }
        };

        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Exports current leaderboard data to an Excel (.xlsx) file
 */
export const exportLeaderboardToExcel = (data: UserData[], filename = "LeetCode_Leaderboard_Data.xlsx") => {
    const XLSX = window.XLSX;
    if (!XLSX) {
        alert("Excel export library is not ready. Please try again.");
        return;
    }

    // Sort by totalSolved desc
    const sorted = [...data].sort((a, b) => b.totalSolved - a.totalSolved);

    const exportRows = sorted.map((user, idx) => ({
        "Rank": idx + 1,
        "Registration No": user.regNo || "N/A",
        "Student Name": user.name || user.displayName || user.username,
        "Department": user.dept || "N/A",
        "LeetCode Username": user.username,
        "Total Solved": user.totalSolved,
        "Total Questions": user.totalQuestions,
        "Easy Solved": user.easySolved,
        "Medium Solved": user.mediumSolved,
        "Hard Solved": user.hardSolved,
        "Success Rate (%)": Number(user.acceptanceRate.toFixed(2)),
        "Global Ranking": user.ranking,
        "Streak (Days)": user.currentStreak,
        "Solved Today": user.solvedToday ? "Yes" : "No",
        "Profile URL": `https://leetcode.com/${user.username}/`,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);

    // Auto-fit column widths
    const colWidths = [
        { wch: 6 },  // Rank
        { wch: 16 }, // Reg No
        { wch: 24 }, // Student Name
        { wch: 14 }, // Dept
        { wch: 20 }, // Username
        { wch: 14 }, // Total Solved
        { wch: 14 }, // Total Questions
        { wch: 12 }, // Easy
        { wch: 14 }, // Medium
        { wch: 12 }, // Hard
        { wch: 16 }, // Success Rate
        { wch: 15 }, // Global Rank
        { wch: 14 }, // Streak
        { wch: 13 }, // Solved Today
        { wch: 35 }, // URL
    ];
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leaderboard");

    XLSX.writeFile(workbook, filename);
};
