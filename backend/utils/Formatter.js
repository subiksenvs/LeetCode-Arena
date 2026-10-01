const getCurrentStreak = (calendar) => {
    if (!calendar || typeof calendar !== "object") {
        return { solvedToday: false, currentStreak: 0 };
    }

    const timestamps = Object.keys(calendar)
        .map(Number)
        .sort((a, b) => b - a);

    if (timestamps.length === 0) {
        return { solvedToday: false, currentStreak: 0 };
    }

    let currentStreak = 0;
    let solvedToday = true;
    let previousDate = new Date(timestamps[0] * 1000);
    const now = new Date();

    // Check if solved today
    const isSameDay = (d1, d2) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    const isYesterday = (d1, d2) => {
        const yesterday = new Date(d2);
        yesterday.setDate(yesterday.getDate() - 1);
        return isSameDay(d1, yesterday);
    };

    if (isSameDay(previousDate, now)) {
        solvedToday = true;
        currentStreak = 1;
    } else if (isYesterday(previousDate, now)) {
        solvedToday = false;
        currentStreak = 1;
    } else {
        return { solvedToday: false, currentStreak: 0 };
    }

    for (let i = 1; i < timestamps.length; i++) {
        const currentDate = new Date(timestamps[i] * 1000);
        const diffDays = Math.round((previousDate.setHours(0,0,0,0) - currentDate.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
            currentStreak += 1;
        } else if (diffDays > 1) {
            break;
        }
        previousDate = currentDate;
    }
    return { solvedToday, currentStreak };
};

const formatUserData = (userData, userMeta = null) => {
    let displayName = null;
    let name = "";
    let regNo = "";
    let dept = "";
    let createdBy = "";

    if (typeof userMeta === "string") {
        displayName = userMeta;
        name = userMeta;
    } else if (userMeta && typeof userMeta === "object") {
        name = userMeta.name || userMeta.displayName || "";
        displayName = userMeta.displayName || userMeta.name || "";
        regNo = userMeta.regNo || "";
        dept = userMeta.dept || "";
        createdBy = userMeta.createdBy || "";
    }

    if (!userData || !userData.matchedUser) {
        const fallbackUsername = (typeof userMeta === "string" ? userMeta : userMeta?.username) || "Unknown";
        return {
            username: fallbackUsername,
            name: name || fallbackUsername,
            displayName: displayName || name || fallbackUsername,
            regNo: regNo,
            dept: dept,
            createdBy: createdBy,
            realName: name || "",
            totalSolved: 0,
            totalQuestions: 0,
            easySolved: 0,
            totalEasy: 0,
            mediumSolved: 0,
            totalMedium: 0,
            hardSolved: 0,
            totalHard: 0,
            acceptanceRate: 0,
            ranking: 0,
            submissionCalendar: {},
            solvedToday: false,
            currentStreak: 0,
            activeBadge: null,
            isInvalid: true,
        };
    }

    const { solvedToday, currentStreak } = getCurrentStreak(
        JSON.parse(userData.matchedUser.submissionCalendar || "{}")
    );
    if (userData.matchedUser.activeBadge) {
        // if activeBadge.icon does not start with 'https://', then it is a relative path
        if (!userData.matchedUser.activeBadge.icon.startsWith("https://")) {
            userData.matchedUser.activeBadge.icon = `https://leetcode.com${userData.matchedUser.activeBadge.icon}`;
        }
    }
    return {
        username: userData.matchedUser.username,
        name: name || userData.matchedUser.profile?.realName || userData.matchedUser.username,
        displayName: displayName || userData.matchedUser.profile?.realName || userData.matchedUser.username,
        regNo: regNo,
        dept: dept,
        createdBy: createdBy,
        realName: userData.matchedUser.profile?.realName,
        totalSolved: userData.matchedUser.submitStats?.acSubmissionNum?.[0]?.count || 0,
        totalQuestions: userData.allQuestionsCount?.[0]?.count || 0,
        easySolved: userData.matchedUser.submitStats?.acSubmissionNum?.[1]?.count || 0,
        totalEasy: userData.allQuestionsCount?.[1]?.count || 0,
        mediumSolved: userData.matchedUser.submitStats?.acSubmissionNum?.[2]?.count || 0,
        totalMedium: userData.allQuestionsCount?.[2]?.count || 0,
        hardSolved: userData.matchedUser.submitStats?.acSubmissionNum?.[3]?.count || 0,
        totalHard: userData.allQuestionsCount?.[3]?.count || 0,
        acceptanceRate:
            userData.matchedUser.submitStats?.totalSubmissionNum?.[0]?.submissions > 0
                ? (100 *
                      (userData.matchedUser.submitStats.acSubmissionNum?.[0]?.submissions || 0)) /
                  userData.matchedUser.submitStats.totalSubmissionNum[0].submissions
                : 0,
        ranking: userData.matchedUser.profile?.ranking || 0,
        submissionCalendar: JSON.parse(userData.matchedUser.submissionCalendar || "{}"),
        solvedToday: solvedToday,
        currentStreak: currentStreak,
        activeBadge: userData.matchedUser.activeBadge,
    };
};

export default formatUserData;

