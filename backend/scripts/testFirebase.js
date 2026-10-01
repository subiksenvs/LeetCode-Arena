import { isFirebaseActive, getStoredUsers, saveStoredUsers, getStoredAccounts, saveStoredAccount } from "../utils/firebase.js";
import { ADMIN_DEFAULT } from "../utils/auth.js";

async function verifyDatabase() {
    console.log("--------------------------------------------------");
    console.log("🔍 Testing Firebase Firestore Database Connection...");
    console.log("--------------------------------------------------");

    try {
        // 1. Test Saving / Fetching Accounts
        console.log("1️⃣ Seeding Admin Account into Firestore 'accounts' collection...");
        await saveStoredAccount(ADMIN_DEFAULT);
        const accounts = await getStoredAccounts(ADMIN_DEFAULT);
        console.log("✅ Accounts in Database:", accounts.map((a) => `${a.username} (${a.role})`));

        // 2. Test Saving / Fetching Student Users
        console.log("\n2️⃣ Seeding Initial Students into Firestore 'leaderboard/students'...");
        const initialStudents = [
            {
                username: "subiksenvs",
                name: "Subiksen",
                displayName: "Subiksen",
                regNo: "160",
                dept: "CSE",
                createdBy: "admin",
            },
        ];
        await saveStoredUsers(initialStudents);
        const students = await getStoredUsers();
        console.log(`✅ Saved & retrieved ${students.length} student(s) from Firestore!`);

        console.log("\n🎉 Database setup is 100% COMPLETE and fully operational!");
        console.log("--------------------------------------------------");
        process.exit(0);
    } catch (error) {
        console.error("\n❌ Error connecting to Firestore:", error.message);
        console.log("\n👉 Please click 'Create Database' in Firebase Console: https://console.firebase.google.com/project/leetcode-arena-9b0e1/firestore");
        process.exit(1);
    }
}

verifyDatabase();
