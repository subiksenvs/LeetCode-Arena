import React from "react";
import { Terminal, FileSpreadsheet, RefreshCw, UserPlus, LogIn, LogOut, UserCheck } from "lucide-react";
import { AuthUser } from "../types/auth";

interface Props {
    onOpenExcelModal: () => void;
    onOpenAddUserModal: () => void;
    onRefresh: () => void;
    onLogout: () => void;
    isRefreshing: boolean;
    authUser: AuthUser | null;
}

export const Header: React.FC<Props> = ({
    onOpenExcelModal,
    onOpenAddUserModal,
    onRefresh,
    onLogout,
    isRefreshing,
    authUser,
}) => {
    return (
        <header className="glass-panel sticky top-4 z-40 rounded-3xl px-6 py-4 mb-8 border border-white/10 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Brand */}
                <div className="flex items-center gap-3.5">
                    <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-black shadow-lg shadow-emerald-500/20">
                        <Terminal size={24} className="stroke-[2.5]" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black font-display tracking-tight text-white">
                            LEETCODE <span className="text-emerald-400">ARENA</span>
                        </h1>
                        <p className="text-xs text-gray-400 font-sans hidden sm:block">
                            Realtime Competitive Programming & Streaks Leaderboard
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 flex-wrap justify-end w-full md:w-auto">
                    {/* Add Single User Button */}
                    <button
                        type="button"
                        onClick={onOpenAddUserModal}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 transition active:scale-95 shadow-sm"
                    >
                        <UserPlus size={15} className="text-emerald-400" />
                        <span>Add Student</span>
                    </button>

                    {/* Refresh Button */}
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 transition active:scale-95 disabled:opacity-50"
                        title="Sync live LeetCode stats"
                    >
                        <RefreshCw size={14} className={isRefreshing ? "animate-spin text-emerald-400" : ""} />
                        <span>Sync</span>
                    </button>

                    {/* Upload Excel Button */}
                    <button
                        type="button"
                        onClick={onOpenExcelModal}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-900/30 transition-all duration-200 active:scale-95"
                    >
                        <FileSpreadsheet size={16} />
                        <span>Upload Excel</span>
                    </button>

                    {authUser && (
                        <div className="flex items-center gap-2 pl-1 border-l border-white/10 ml-1">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs">
                                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                                    <UserCheck size={12} />
                                </div>
                                <span className="font-semibold text-white truncate max-w-[120px]">
                                    {authUser.role === "admin" || authUser.username.toLowerCase() === "admin"
                                        ? "Admin"
                                        : (authUser.name || authUser.username)}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={onLogout}
                                className="p-2 text-gray-400 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/20 rounded-xl transition text-xs"
                                title="Sign Out"
                            >
                                <LogOut size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
