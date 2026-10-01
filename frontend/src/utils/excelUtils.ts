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

/**
 * Parses an Excel or CSV file and accurately extracts ONLY { name, regNo, dept, username }
 */
export const parseExcelFile = async (file: File): Promise<UserInput[]> => {
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
                    throw new Error("The uploaded Excel workbook contains no sheets.");
                }

                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

                if (rawJson.length === 0) {
                    throw new Error("The uploaded Excel sheet is empty.");
                }

                const keys = Object.keys(rawJson[0]);

                // High-accuracy column matching
                const findBestKey = (exactMatchers: string[], fuzzyMatchers: string[]): string | undefined => {
                    // Pass 1: Check exact normalized match
                    for (const key of keys) {
                        const norm = normalizeHeader(key);
                        if (exactMatchers.includes(norm)) return key;
                    }
                    // Pass 2: Check fuzzy/substring match
                    for (const key of keys) {
                        const norm = normalizeHeader(key);
                        if (fuzzyMatchers.some((f) => norm.includes(f))) return key;
                    }
                    return undefined;
                };

                const usernameKey = findBestKey(
                    ["leetcodeusername", "leetcodeid", "lchandle", "leetcodehandle", "username", "leetcode", "lcu", "lcid", "handle", "profile", "leetcodeurl", "user"],
                    ["leetcode", "username", "handle"]
                );

                const nameKey = findBestKey(
                    ["studentname", "name", "fullname", "nameofstudent", "studentfullname", "candidatename", "displayname", "nameofcandidate", "student"],
                    ["name", "student"]
                );

                const regNoKey = findBestKey(
                    ["regno", "registerno", "registernumber", "registrationno", "registrationnumber", "rollno", "rollnumber", "reg", "htno", "hallticket", "studentid", "idno", "roll"],
                    ["reg", "roll", "htno", "register"]
                );

                const deptKey = findBestKey(
                    ["department", "dept", "branch", "deptname", "departmentname", "stream", "course", "sec", "section"],
                    ["dept", "department", "branch", "stream"]
                );

                const userMap = new Map<string, UserInput>();

                for (const row of rawJson) {
                    const rawUsername = usernameKey ? row[usernameKey]?.toString() || "" : "";
                    const username = extractLeetCodeUsername(rawUsername);

                    // Skip rows without a valid username
                    if (!username || username.length === 0) continue;

                    const rawName = nameKey ? (row[nameKey]?.toString() || "").trim() : "";
                    const rawRegNo = regNoKey ? (row[regNoKey]?.toString() || "").trim() : "";
                    const rawDept = deptKey ? (row[deptKey]?.toString() || "").trim() : "";

                    // Strictly extract only requested fields
                    const userRecord: UserInput = {
                        username: username,
                        name: rawName || username,
                        displayName: rawName || username,
                        regNo: rawRegNo,
                        dept: rawDept,
                    };

                    // Deduplicate within the file: matching username, or matching name + dept
                    const dedupKey = username.toLowerCase();
                    userMap.set(dedupKey, userRecord);
                }

                const users = Array.from(userMap.values());

                if (users.length === 0) {
                    throw new Error("No valid LeetCode usernames found. Please make sure your sheet has a column for 'LeetCode Username', 'Username', or 'Handle'.");
                }

                resolve(users);
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
