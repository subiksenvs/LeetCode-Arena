import { useEffect, useState, useCallback } from "react";
import { UserData } from "../types/leetcode";
import { AuthUser } from "../types/auth";

export const getApiUrl = (): string => {
    const envUrl = import.meta.env.VITE_API_KEY || import.meta.env.VITE_API_URL;
    if (envUrl && typeof envUrl === "string" && envUrl.trim() !== "") {
        return envUrl.trim().replace(/\/$/, "");
    }
    // If accessing from GitHub Pages, mobile phone, or non-localhost domain, use Render cloud backend
    if (
        typeof window !== "undefined" &&
        window.location.hostname !== "localhost" &&
        window.location.hostname !== "127.0.0.1"
    ) {
        return "https://leetcode-arena-backend.onrender.com";
    }
    return "http://localhost:3000";
};

export const API_URL = getApiUrl();

export const useLeetCode = (authUser?: AuthUser | null) => {
    const [userData, setUserData] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [serverChecked, setServerChecked] = useState(false);

    const fetchData = useCallback(async (isRetry = false) => {
        if (!authUser) {
            setUserData([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const queryParams = new URLSearchParams({
                user: authUser.username,
                role: authUser.role || "user",
            });

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout for Render cold starts

            const response = await fetch(`${API_URL}/api/users?${queryParams.toString()}`, {
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Server returned HTTP ${response.status}`);
            }

            const data = await response.json();
            setUserData(data.usersData as UserData[]);
            setServerChecked(true);
            setError(null);
        } catch (err: any) {
            if (!isRetry) {
                // If first attempt fails (e.g. Render spin-up cold start), retry once after a short delay
                console.warn("Retrying fetch after potential server cold start...");
                setTimeout(() => fetchData(true), 3000);
                return;
            }
            setError(
                `Unable to connect to backend server (${API_URL}). If using free tier Render hosting, please wait 30 seconds for the cloud server to spin up and refresh.`
            );
        } finally {
            setLoading(false);
        }
    }, [authUser]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { userData, setUserData, loading, error, serverChecked, refresh: () => fetchData(false), apiUrl: API_URL };
};
