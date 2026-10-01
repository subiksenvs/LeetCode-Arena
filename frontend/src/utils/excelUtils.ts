import { UserData, UserInput } from "../types/leetcode";

// Type declaration for window.XLSX from CDN
declare global {
    interface Window {
        XLSX: any;
    }
}

/**
 * Normalizes header string to match keys
 */
const normalizeHeader = (header: string): string => {
    return header.toString().toLowerCase().replace(/[^a-z0-9]/g, "");
};

/**
 * Parses an Excel or CSV file and extracts { name, regNo, dept, username }
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
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

                if (rawJson.length === 0) {
                    throw new Error("The uploaded Excel sheet is empty.");
                }

                // Detect column keys
                const sampleRow = rawJson[0];
                const keys = Object.keys(sampleRow);

                const findKey = (candidates: string[]) => {
                    return keys.find((key) => {
                        const normalized = normalizeHeader(key);
                        return candidates.some((c) => normalized === c || normalized.includes(c));
                    });
                };

                const usernameKey = findKey(["username", "leetcodeusername", "leetcodeid", "handle", "leetcode", "id"]);
                const nameKey = findKey(["name", "studentname", "fullname", "displayname"]);
                const regNoKey = findKey(["regno", "registernumber", "registerno", "rollno", "registrationno", "reg"]);
                const deptKey = findKey(["dept", "department", "branch", "stream", "section"]);

                const users: UserInput[] = rawJson
                    .map((row) => {
                        const username = (usernameKey ? row[usernameKey] : "").toString().trim();
                        const name = (nameKey ? row[nameKey] : "").toString().trim();
                        const regNo = (regNoKey ? row[regNoKey] : "").toString().trim();
                        const dept = (deptKey ? row[deptKey] : "").toString().trim();

                        return {
                            username,
                            name: name || username,
                            displayName: name || username,
                            regNo,
                            dept,
                        };
                    })
                    .filter((u) => u.username.length > 0);

                if (users.length === 0) {
                    throw new Error("No valid usernames found. Please make sure there is a column for 'Username' or 'LeetCode Username'.");
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
