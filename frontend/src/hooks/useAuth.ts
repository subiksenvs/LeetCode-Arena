import { useState, useEffect } from "react";
import { AuthUser } from "../types/auth";
import { API_URL } from "./useLeetCode";

const AUTH_STORAGE_KEY = "leetcode_arena_user";

export const useAuth = () => {
    const [user, setUser] = useState<AuthUser | null>(() => {
        try {
            const saved = localStorage.getItem(AUTH_STORAGE_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    useEffect(() => {
        if (user) {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(AUTH_STORAGE_KEY);
        }
    }, [user]);

    const parseResponse = async (response: Response) => {
        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch {
            if (!response.ok) {
                throw new Error(`Backend server returned HTTP ${response.status}. Please restart the backend server.`);
            }
            throw new Error("Invalid response received from backend server.");
        }
    };

    const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await parseResponse(response);
            if (!response.ok) {
                return { success: false, error: data.error || "Login failed. Invalid username or password." };
            }

            setUser(data.user);
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message || "Network error. Please make sure the backend server is running." };
        }
    };

    const signup = async (username: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await fetch(`${API_URL}/api/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, name }),
            });

            const data = await parseResponse(response);
            if (!response.ok) {
                return { success: false, error: data.error || "Signup failed. Username may already exist." };
            }

            setUser(data.user);
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message || "Network error. Please make sure the backend server is running." };
        }
    };

    const logout = () => {
        setUser(null);
    };

    return { user, login, signup, logout, isAuthenticated: !!user };
};
