import {
    ArrowUpDown,
    ExternalLink,
    Flame,
    Target,
    Trophy,
    Zap,
    Search,
    Download,
    Layers,
    UserCheck,
    CheckCircle,
    Trash2,
    LayoutGrid,
    Table as TableIcon,
    BarChart3,
} from "lucide-react";
import React, { useState, useMemo } from "react";
import { UserData } from "../types/leetcode";
import { exportLeaderboardToExcel } from "../utils/excelUtils";
import { DepartmentAnalytics } from "./DepartmentAnalytics";

interface Props {
    data: UserData[];
    onDeleteUser: (username: string) => Promise<boolean>;
    onClearAllUsers: () => Promise<boolean>;
    isAdmin?: boolean;
}

type SortKey = "totalSolved" | "ranking" | "acceptanceRate" | "currentStreak" | "name" | "regNo";
type ViewMode = "table" | "cards" | "analytics";

export const LeaderboardTable: React.FC<Props> = ({
    data,
    onDeleteUser,
    onClearAllUsers,
    isAdmin = false,
}) => {
    const [sortKey, setSortKey] = useState<SortKey>("totalSolved");
    const [sortDesc, setSortDesc] = useState(true);
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDept, setSelectedDept] = useState("ALL");
    const [selectedUploader, setSelectedUploader] = useState("ALL");
    const [deletingUsername, setDeletingUsername] = useState<string | null>(null);
    const [isClearing, setIsClearing] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>("table");

    // Extract unique departments
    const departments = useMemo(() => {
        const set = new Set<string>();
        data.forEach((u) => {
            if (u.dept && u.dept.trim().length > 0) {
                set.add(u.dept.trim().toUpperCase());
            }
        });
        return ["ALL", ...Array.from(set).sort()];
    }, [data]);

    // Extract unique uploaders (for admin)
    const uploaders = useMemo(() => {
        const set = new Set<string>();
        data.forEach((u) => {
            if (u.createdBy && u.createdBy.trim().length > 0) {
                set.add(u.createdBy.trim().toLowerCase());
            }
        });
        return ["ALL", ...Array.from(set).sort()];
    }, [data]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDesc(!sortDesc);
        } else {
            setSortKey(key);
            setSortDesc(key === "ranking" || key === "name" || key === "regNo" ? false : true);
        }
    };

    // Filter by department, uploader and search query
    const filteredData = useMemo(() => {
        return data.filter((user) => {
            const matchesDept =
                selectedDept === "ALL" ||
                (user.dept && user.dept.trim().toUpperCase() === selectedDept);

            const matchesUploader =
                selectedUploader === "ALL" ||
                (user.createdBy && user.createdBy.trim().toLowerCase() === selectedUploader.toLowerCase());

            const q = searchQuery.toLowerCase().trim();
            const matchesSearch =
                !q ||
                user.username.toLowerCase().includes(q) ||
                (user.name && user.name.toLowerCase().includes(q)) ||
                (user.displayName && user.displayName.toLowerCase().includes(q)) ||
                (user.regNo && user.regNo.toLowerCase().includes(q)) ||
                (user.dept && user.dept.toLowerCase().includes(q)) ||
                (user.createdBy && user.createdBy.toLowerCase().includes(q));

            return matchesDept && matchesUploader && matchesSearch;
        });
    }, [data, selectedDept, selectedUploader, searchQuery]);

    const sortedData = useMemo(() => {
        return [...filteredData].sort((a, b) => {
            const multiplier = sortDesc ? -1 : 1;
            if (sortKey === "name") {
                const nameA = a.name || a.displayName || a.username;
                const nameB = b.name || b.displayName || b.username;
                return nameA.localeCompare(nameB) * (sortDesc ? 1 : -1);
            }
            if (sortKey === "regNo") {
                const regA = a.regNo || "";
                const regB = b.regNo || "";
                return regA.localeCompare(regB) * (sortDesc ? 1 : -1);
            }
            if (sortKey === "ranking") {
                const rankA = a.ranking || 99999999;
                const rankB = b.ranking || 99999999;
                return (rankA - rankB) * (sortDesc ? -1 : 1);
            }
            return ((a[sortKey] || 0) - (b[sortKey] || 0)) * multiplier;
        });
    }, [filteredData, sortKey, sortDesc]);

    const totalSolvedTodayCount = useMemo(() => {
        return data.filter((u) => u.solvedToday).length;
    }, [data]);

    const getProgressBarWidth = (solved: number, total: number) => {
        if (!total) return "0%";
        return `${Math.min(100, (solved / total) * 100)}%`;
    };

    const handleDelete = async (username: string) => {
        if (window.confirm(`Are you sure you want to delete @${username} from the leaderboard?`)) {
            setDeletingUsername(username);
            await onDeleteUser(username);
            setDeletingUsername(null);
        }
    };

    const handleClearAll = async () => {
        if (window.confirm("⚠️ Are you sure you want to delete ALL users from the leaderboard? This action cannot be undone.")) {
            setIsClearing(true);
            await onClearAllUsers();
            setIsClearing(false);
        }
    };

    return (
        <div className="space-y-5 animate-slide-up">
            {/* Top Toolbar: Search, Dept Filter, View Switcher & Actions */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 glass-panel p-4 rounded-3xl border border-white/10">
                {/* Search input */}
                <div className="relative flex-1 max-w-md">
                    <Search
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
                    />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by student name, reg no, username, dept..."
                        className="w-full pl-10 pr-4 py-2 bg-black/40 text-gray-100 placeholder-gray-500 rounded-2xl border border-white/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs sm:text-sm transition"
                    />
                </div>

                {/* Controls & Badges */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* View Switcher Tabs */}
                    <div className="flex items-center bg-black/40 p-1 rounded-2xl border border-white/10">
                        <button
                            onClick={() => setViewMode("table")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                                viewMode === "table"
                                    ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                                    : "text-gray-400 hover:text-white"
                            }`}
                        >
                            <TableIcon size={14} />
                            <span>Table</span>
                        </button>
                        <button
                            onClick={() => setViewMode("cards")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                                viewMode === "cards"
                                    ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                                    : "text-gray-400 hover:text-white"
                            }`}
                        >
                            <LayoutGrid size={14} />
                            <span>Cards</span>
                        </button>
                        <button
                            onClick={() => setViewMode("analytics")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                                viewMode === "analytics"
                                    ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                                    : "text-gray-400 hover:text-white"
                            }`}
                        >
                            <BarChart3 size={14} />
                            <span>Analytics</span>
                        </button>
                    </div>

                    {/* Department Dropdown */}
                    {departments.length > 2 && (
                        <div className="flex items-center gap-1.5 bg-black/40 px-3 py-2 rounded-2xl border border-white/10 text-xs">
                            <Layers size={13} className="text-gray-400" />
                            <select
                                value={selectedDept}
                                onChange={(e) => setSelectedDept(e.target.value)}
                                className="bg-transparent text-gray-200 outline-none font-semibold cursor-pointer"
                            >
                                {departments.map((dept) => (
                                    <option
                                        key={dept}
                                        value={dept}
                                        className="bg-slate-900 text-gray-200"
                                    >
                                        {dept === "ALL" ? "All Depts" : dept}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Admin Uploader Dropdown */}
                    {isAdmin && uploaders.length > 2 && (
                        <div className="flex items-center gap-1.5 bg-black/40 px-3 py-2 rounded-2xl border border-emerald-500/20 text-xs">
                            <UserCheck size={13} className="text-emerald-400" />
                            <span className="text-gray-400 text-[11px]">User:</span>
                            <select
                                value={selectedUploader}
                                onChange={(e) => setSelectedUploader(e.target.value)}
                                className="bg-transparent text-emerald-400 outline-none font-semibold cursor-pointer"
                            >
                                {uploaders.map((uploader) => (
                                    <option
                                        key={uploader}
                                        value={uploader}
                                        className="bg-slate-900 text-gray-200"
                                    >
                                        {uploader === "ALL" ? "All Users" : uploader}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Export Excel Button */}
                    <button
                        onClick={() => exportLeaderboardToExcel(sortedData)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-2xl text-xs font-semibold transition active:scale-95"
                        title="Download formatted Excel spreadsheet"
                    >
                        <Download size={14} />
                        <span>Export</span>
                    </button>

                    {/* Clear All Option */}
                    {data.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            disabled={isClearing}
                            className="p-2 text-rose-400/80 hover:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-2xl transition active:scale-95 disabled:opacity-50"
                            title="Delete all users"
                        >
                            <Trash2 size={15} />
                        </button>
                    )}
                </div>
            </div>

            {/* View 1: Analytics Mode */}
            {viewMode === "analytics" && <DepartmentAnalytics data={data} />}

            {/* View 2: Cards Grid Mode */}
            {viewMode === "cards" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                    {sortedData.map((user, index) => (
                        <div
                            key={user.username}
                            className="glass-panel rounded-3xl p-5 border border-white/10 hover:border-emerald-500/30 transition-all duration-300 relative overflow-hidden group"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <span
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-display font-black text-sm ${
                                            index === 0
                                                ? "bg-amber-400 text-black"
                                                : index === 1
                                                ? "bg-slate-300 text-black"
                                                : index === 2
                                                ? "bg-amber-700 text-white"
                                                : "bg-white/5 text-gray-400 border border-white/10"
                                        }`}
                                    >
                                        #{index + 1}
                                    </span>
                                    <div>
                                        <div className="font-bold text-white text-base font-display group-hover:text-emerald-400 transition-colors">
                                            {user.name || user.displayName || user.username}
                                        </div>
                                        <a
                                            href={`https://leetcode.com/${user.username}/`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-gray-400 hover:text-emerald-400 font-mono inline-flex items-center gap-1 transition-colors"
                                        >
                                            @{user.username}
                                            <ExternalLink size={10} />
                                        </a>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleDelete(user.username)}
                                    className="p-1.5 text-gray-500 hover:text-rose-400 rounded-lg transition"
                                    title="Delete user"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>

                            {/* Tags */}
                            <div className="flex items-center gap-2 mb-4">
                                {user.regNo && (
                                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-gray-300 border border-white/10">
                                        {user.regNo}
                                    </span>
                                )}
                                {user.dept && (
                                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                        {user.dept}
                                    </span>
                                )}
                                <div className="flex items-center gap-1 ml-auto text-[11px] font-mono text-orange-400">
                                    <Flame size={12} fill={user.solvedToday ? "currentColor" : "none"} />
                                    <span>{user.currentStreak}d</span>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="bg-black/40 rounded-2xl p-3 border border-white/5 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-400">Total Solved</span>
                                    <span className="font-mono font-bold text-emerald-400 text-sm">
                                        {user.totalSolved}
                                        <span className="text-[10px] text-gray-500 font-normal ml-1">/ {user.totalQuestions}</span>
                                    </span>
                                </div>
                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                                        style={{ width: getProgressBarWidth(user.totalSolved, user.totalQuestions) }}
                                    />
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                                    <span>E: {user.easySolved} | M: {user.mediumSolved} | H: {user.hardSolved}</span>
                                    <span>Rate: {user.acceptanceRate.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* View 3: Table Mode */}
            {viewMode === "table" && (
                <div className="overflow-hidden rounded-3xl border border-white/10 glass-panel shadow-2xl backdrop-blur-xl">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-white/10">
                            <thead className="bg-black/50">
                                <tr>
                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 font-sans">
                                        Rank
                                    </th>
                                    <th
                                        className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 cursor-pointer group font-sans"
                                        onClick={() => handleSort("regNo")}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            Reg No
                                            <ArrowUpDown
                                                size={12}
                                                className="opacity-40 group-hover:opacity-100 transition-opacity"
                                            />
                                        </div>
                                    </th>
                                    <th
                                        className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 cursor-pointer group font-sans"
                                        onClick={() => handleSort("name")}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            Student & LeetCode ID
                                            <ArrowUpDown
                                                size={12}
                                                className="opacity-40 group-hover:opacity-100 transition-opacity"
                                            />
                                        </div>
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 font-sans">
                                        Dept
                                    </th>
                                    <th
                                        className="px-5 py-4 cursor-pointer group font-sans"
                                        onClick={() => handleSort("totalSolved")}
                                    >
                                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                            <Trophy
                                                size={14}
                                                className="text-emerald-400"
                                            />
                                            Problems
                                            <ArrowUpDown
                                                size={14}
                                                className="opacity-50 group-hover:opacity-100 transition-opacity"
                                            />
                                        </div>
                                    </th>
                                    <th
                                        className="px-5 py-4 cursor-pointer group text-center font-sans"
                                        onClick={() => handleSort("ranking")}
                                    >
                                        <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                            <Target
                                                size={14}
                                                className="text-blue-400"
                                            />
                                            Global Rank
                                            <ArrowUpDown
                                                size={14}
                                                className="opacity-50 group-hover:opacity-100 transition-opacity"
                                            />
                                        </div>
                                    </th>
                                    <th
                                        className="px-5 py-4 cursor-pointer group text-center font-sans"
                                        onClick={() => handleSort("acceptanceRate")}
                                    >
                                        <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                            <Zap
                                                size={14}
                                                className="text-purple-400"
                                            />
                                            Success Rate
                                            <ArrowUpDown
                                                size={14}
                                                className="opacity-50 group-hover:opacity-100 transition-opacity"
                                            />
                                        </div>
                                    </th>
                                    <th
                                        className="px-5 py-4 cursor-pointer group font-sans"
                                        onClick={() => handleSort("currentStreak")}
                                    >
                                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                            <Flame
                                                size={14}
                                                className="text-orange-500"
                                            />
                                            Streak
                                            <ArrowUpDown
                                                size={14}
                                                className="opacity-50 group-hover:opacity-100 transition-opacity"
                                            />
                                        </div>
                                    </th>
                                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400 font-sans">
                                        Difficulty Breakdown
                                    </th>
                                    <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 font-sans">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 bg-black/20">
                                {sortedData.map((user, index) => (
                                    <tr
                                        key={user.username}
                                        className="group hover:bg-white/[0.03] transition-colors duration-150"
                                        onMouseEnter={() => setHoveredRow(index)}
                                        onMouseLeave={() => setHoveredRow(null)}
                                    >
                                        {/* Rank */}
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-display font-black text-xs ${
                                                        index === 0
                                                            ? "bg-amber-400 text-black shadow-lg shadow-amber-500/20"
                                                            : index === 1
                                                            ? "bg-slate-300 text-black"
                                                            : index === 2
                                                            ? "bg-amber-700 text-white"
                                                            : "text-gray-400 font-mono"
                                                    }`}
                                                >
                                                    #{index + 1}
                                                </span>
                                                {user.activeBadge && (
                                                    <div className="relative group/badge">
                                                        <img
                                                            src={user.activeBadge.icon}
                                                            alt={user.activeBadge.displayName}
                                                            className="w-6 h-6 object-contain"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Reg No */}
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <span className="font-mono text-xs px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-gray-300">
                                                {user.regNo || "-"}
                                            </span>
                                        </td>

                                        {/* Name & Username */}
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="font-bold text-white text-sm font-display group-hover:text-emerald-400 transition-colors">
                                                    {user.name || user.displayName || user.username}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <a
                                                        href={`https://leetcode.com/${user.username}/`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-gray-400 hover:text-emerald-400 inline-flex items-center gap-1 transition-colors font-mono mt-0.5"
                                                    >
                                                        @{user.username}
                                                        <ExternalLink size={10} />
                                                    </a>
                                                    {isAdmin && user.createdBy && (
                                                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-gray-400">
                                                            by {user.createdBy}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Department */}
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            {user.dept ? (
                                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                    {user.dept}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-600">-</span>
                                            )}
                                        </td>

                                        {/* Problems Solved & Progress */}
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1.5 min-w-[140px]">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-base font-black text-emerald-400">
                                                        {user.totalSolved}
                                                    </span>
                                                    <span className="text-xs text-gray-500 font-mono">
                                                        / {user.totalQuestions}
                                                    </span>
                                                </div>
                                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 ease-out"
                                                        style={{
                                                            width: getProgressBarWidth(
                                                                user.totalSolved,
                                                                user.totalQuestions
                                                            ),
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </td>

                                        {/* Global Rank */}
                                        <td className="px-5 py-4 whitespace-nowrap text-center">
                                            <span className="font-mono text-xs text-gray-300">
                                                {user.ranking > 0
                                                    ? user.ranking.toLocaleString()
                                                    : "N/A"}
                                            </span>
                                        </td>

                                        {/* Success Rate */}
                                        <td className="px-5 py-4 whitespace-nowrap text-center">
                                            <span
                                                className={`font-mono text-xs font-bold ${
                                                    user.acceptanceRate >= 70
                                                        ? "text-emerald-400"
                                                        : user.acceptanceRate >= 50
                                                        ? "text-amber-400"
                                                        : "text-rose-400"
                                                }`}
                                            >
                                                {user.acceptanceRate.toFixed(1)}%
                                            </span>
                                        </td>

                                        {/* Streak */}
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <Flame
                                                    size={16}
                                                    fill={
                                                        user.solvedToday
                                                            ? "currentColor"
                                                            : "none"
                                                    }
                                                    className={`transition-all duration-300 ${
                                                        user.solvedToday
                                                            ? "text-orange-500 animate-pulse drop-shadow-[0_0_8px_rgba(249,115,22,0.7)]"
                                                            : "text-gray-600"
                                                    }`}
                                                />
                                                <span
                                                    className={`font-mono text-xs font-semibold ${
                                                        user.solvedToday
                                                            ? "text-orange-400"
                                                            : "text-gray-500"
                                                    }`}
                                                >
                                                    {user.currentStreak}d
                                                </span>
                                            </div>
                                        </td>

                                        {/* Difficulty Breakdown */}
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <div className="flex gap-2 items-center">
                                                <div className="flex flex-col items-center bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                                                    <span className="text-emerald-400 font-mono text-xs font-bold">
                                                        {user.easySolved}
                                                    </span>
                                                    <span className="text-[9px] text-gray-500 uppercase">
                                                        Easy
                                                    </span>
                                                </div>
                                                <div className="flex flex-col items-center bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                                                    <span className="text-amber-400 font-mono text-xs font-bold">
                                                        {user.mediumSolved}
                                                    </span>
                                                    <span className="text-[9px] text-gray-500 uppercase">
                                                        Med
                                                    </span>
                                                </div>
                                                <div className="flex flex-col items-center bg-rose-500/5 px-2 py-0.5 rounded border border-rose-500/10">
                                                    <span className="text-rose-400 font-mono text-xs font-bold">
                                                        {user.hardSolved}
                                                    </span>
                                                    <span className="text-[9px] text-gray-500 uppercase">
                                                        Hard
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Delete Action */}
                                        <td className="px-4 py-4 whitespace-nowrap text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(user.username)}
                                                disabled={deletingUsername === user.username}
                                                className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition disabled:opacity-50"
                                                title={`Delete @${user.username}`}
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {sortedData.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={10}
                                            className="py-12 text-center text-gray-500 text-sm"
                                        >
                                            No matching students found for "{searchQuery}"
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
