import { useState } from "react";
import { ErrorMessage } from "./components/ErrorMessage";
import { Header } from "./components/Header";
import { LeaderboardTable } from "./components/LeaderboardTable";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { ExcelUploadModal } from "./components/ExcelUploadModal";
import { AddUserModal } from "./components/AddUserModal";
import { AuthScreen } from "./components/AuthScreen";
import { StatsOverview } from "./components/StatsOverview";
import { PodiumCards } from "./components/PodiumCards";
import { useLeetCode } from "./hooks/useLeetCode";
import { useAuth } from "./hooks/useAuth";
import { UserInput } from "./types/leetcode";
import { FileSpreadsheet, UserPlus, Terminal, ShieldCheck } from "lucide-react";

function App() {
    const { user: authUser, login, signup, logout } = useAuth();

    const {
        userData,
        setUserData,
        loading,
        error,
        serverChecked,
        refresh,
        apiUrl,
    } = useLeetCode(authUser);

    const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

    const handleAddUser = async (user: UserInput): Promise<boolean> => {
        try {
            const response = await fetch(`${apiUrl}/api/users/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...user,
                    createdBy: authUser?.username || "admin",
                }),
            });

            if (!response.ok) {
                return false;
            }

            const result = await response.json();
            if (result.user) {
                setUserData((prev) => {
                    const existingIndex = prev.findIndex(
                        (u) => u.username.toLowerCase() === result.user.username.toLowerCase()
                    );
                    if (existingIndex !== -1) {
                        const updated = [...prev];
                        updated[existingIndex] = result.user;
                        return updated;
                    }
                    return [result.user, ...prev];
                });
                return true;
            }
            return false;
        } catch {
            return false;
        }
    };

    const handleDeleteUser = async (username: string): Promise<boolean> => {
        try {
            const response = await fetch(`${apiUrl}/api/users/delete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username,
                    createdBy: authUser?.username,
                    role: authUser?.role,
                }),
            });

            if (!response.ok) {
                return false;
            }

            setUserData((prev) =>
                prev.filter(
                    (u) => u.username.toLowerCase() !== username.toLowerCase()
                )
            );
            return true;
        } catch {
            return false;
        }
    };

    const handleClearAllUsers = async (): Promise<boolean> => {
        try {
            const response = await fetch(`${apiUrl}/api/users/clear-all`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    createdBy: authUser?.username,
                    role: authUser?.role,
                }),
            });

            if (!response.ok) {
                return false;
            }

            setUserData([]);
            return true;
        } catch {
            return false;
        }
    };

    // Mandatory Authentication Screen
    if (!authUser) {
        return <AuthScreen onLogin={login} onSignup={signup} />;
    }

    return (
        <div className="min-h-screen bg-[#090d16] text-[#e2e8f0] relative overflow-hidden">
            {/* Ambient Background Gradient Glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/3 right-10 w-[30rem] h-[30rem] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 left-10 w-[26rem] h-[26rem] bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
                {/* Navbar Header */}
                <Header
                    onOpenExcelModal={() => setIsExcelModalOpen(true)}
                    onOpenAddUserModal={() => setIsAddUserModalOpen(true)}
                    onRefresh={refresh}
                    onLogout={logout}
                    isRefreshing={loading}
                    authUser={authUser}
                />

                {/* Admin Mode Indicator */}
                {authUser.role === "admin" && (
                    <div className="mb-6 flex items-center justify-between px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs">
                        <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                            <ShieldCheck size={16} />
                            <span>Administrator Control Panel — Viewing all records across all user accounts</span>
                        </div>
                        <span className="font-mono text-[11px] text-gray-400">
                            Logged in as @{authUser.username}
                        </span>
                    </div>
                )}

                {/* Dashboard Stats Overview */}
                {!loading && userData.length > 0 && <StatsOverview data={userData} />}

                {/* Top 3 Champions Podium */}
                {!loading && userData.length >= 2 && <PodiumCards data={userData} />}

                {/* Loading Spinner */}
                {loading && (
                    <div className="py-20">
                        <LoadingSpinner />
                    </div>
                )}

                {/* Leaderboard Table / Cards / Analytics */}
                {!loading && userData.length > 0 && (
                    <LeaderboardTable
                        data={userData}
                        onDeleteUser={handleDeleteUser}
                        onClearAllUsers={handleClearAllUsers}
                        isAdmin={authUser.role === "admin"}
                    />
                )}

                {/* Empty State when 0 users */}
                {!loading && userData.length === 0 && !error && (
                    <div className="text-center py-20 px-6 glass-panel rounded-3xl border border-white/10 max-w-2xl mx-auto shadow-2xl animate-fade-in my-8">
                        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-600 text-black flex items-center justify-center mx-auto mb-5 shadow-xl shadow-emerald-500/20">
                            <Terminal size={32} />
                        </div>
                        <h2 className="text-2xl font-bold font-display text-white mb-2">
                            {authUser.role === "admin" ? "No Global Records Found" : "Your Leaderboard is Empty"}
                        </h2>
                        <p className="text-sm text-gray-400 max-w-md mx-auto mb-8 font-sans">
                            {authUser.role === "admin"
                                ? "Upload an Excel sheet or wait for users to add students to populate the global leaderboard."
                                : "Upload your Excel spreadsheet with students' Name, Reg No, Department, and LeetCode usernames to populate your leaderboard."}
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => setIsExcelModalOpen(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-xl shadow-emerald-900/40 transition active:scale-95"
                            >
                                <FileSpreadsheet size={18} />
                                <span>Upload Excel Sheet</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsAddUserModalOpen(true)}
                                className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 rounded-2xl text-xs sm:text-sm font-semibold transition active:scale-95"
                            >
                                <UserPlus size={18} className="text-emerald-400" />
                                <span>Add Student Manually</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Error Banner */}
                {error && (
                    <div className="mt-8">
                        <ErrorMessage message={error} />
                        {!serverChecked && (
                            <div className="mt-4 glass-panel p-6 rounded-3xl border border-white/10">
                                <h3 className="text-lg font-bold mb-3 text-emerald-400 font-display">
                                    Backend Server is Not Running:
                                </h3>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300 font-sans">
                                    <li className="pl-2">
                                        Open terminal in the <code className="text-emerald-400 font-mono">backend</code> folder
                                    </li>
                                    <li className="pl-2">
                                        Run:{" "}
                                        <code className="bg-black/50 px-3 py-1 rounded-lg font-mono text-emerald-400 border border-white/10">
                                            node index.js
                                        </code>
                                    </li>
                                    <li className="pl-2">
                                        Click the <strong>Sync</strong> button at the top
                                    </li>
                                </ol>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer / Copyright */}
                <footer className="mt-16 pt-8 pb-4 border-t border-white/10 text-center">
                    <p className="text-xs text-gray-400 font-sans tracking-wide">
                        Developed by <span className="font-bold text-emerald-400">Subiksen V S</span> • © {new Date().getFullYear()} All Rights Reserved
                    </p>
                </footer>

                {/* Modals */}
                <ExcelUploadModal
                    isOpen={isExcelModalOpen}
                    onClose={() => setIsExcelModalOpen(false)}
                    onSuccess={refresh}
                    apiUrl={apiUrl}
                    authUser={authUser}
                />

                <AddUserModal
                    isOpen={isAddUserModalOpen}
                    onClose={() => setIsAddUserModalOpen(false)}
                    onAdd={handleAddUser}
                />
            </div>
        </div>
    );
}

export default App;
