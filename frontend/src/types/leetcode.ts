export interface UserData {
    username: string;
    name?: string;
    displayName: string;
    regNo?: string;
    dept?: string;
    createdBy?: string;
    realName?: string;
    totalSolved: number;
    totalQuestions: number;
    easySolved: number;
    totalEasy: number;
    mediumSolved: number;
    totalMedium: number;
    hardSolved: number;
    totalHard: number;
    acceptanceRate: number;
    ranking: number;
    currentStreak: number;
    solvedToday: boolean;
    activeBadge?: { displayName: string; icon: string } | null;
}

export interface UserInput {
    username: string;
    name?: string;
    displayName?: string;
    regNo?: string;
    dept?: string;
    createdBy?: string;
}
