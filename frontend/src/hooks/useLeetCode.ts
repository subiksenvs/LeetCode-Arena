import { useEffect, useState, useCallback } from "react";
import { UserData } from "../types/leetcode";
import { AuthUser } from "../types/auth";

export const API_URL = import.meta.env.VITE_API_KEY || "http://localhost:3000";

export const useLeetCode = (authUser?: AuthUser | null) => {
    const [userData, setUserData] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [serverChecked, setServerChecked] = useState(false);

    const checkServer = async () => {
        try {
            const response = await fetch(`${API_URL}/`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            setServerChecked(true);
            return true;
        } catch (err) {
            setError(
                "Failed to connect to the LeetCode Leaderboard backend server. Please make sure the backend is running on http://localhost:3000."
            );
            setLoading(false);
            return false;
        }
    };

    const fetchData = useCallback(async () => {
        if (!authUser) {
            setUserData([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const serverRunning = await checkServer();
        if (!serverRunning) return;

        try {
            const queryParams = new URLSearchParams({
                user: authUser.username,
                role: authUser.role || "user",
            });

            const response = await fetch(`${API_URL}/api/users?${queryParams.toString()}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setUserData(data.usersData as UserData[]);
            if (!data.totalUsers || data.totalUsers === 0 || data.fetchedUsers > 0) {
                setError(null);
            } else {
                setError(
                    "Failed to fetch LeetCode data. Please check your internet connection and LeetCode API status."
                );
            }
        } catch (err: any) {
            setError(
                err.message || "An unexpected error occurred while fetching users."
            );
        } finally {
            setLoading(false);
        }
    }, [authUser]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { userData, setUserData, loading, error, serverChecked, refresh: fetchData, apiUrl: API_URL };
};
