import React from "react";
import { Trophy, Flame, Zap, Users, GraduationCap } from "lucide-react";
import { UserData } from "../types/leetcode";

interface Props {
    data: UserData[];
}

export const StatsOverview: React.FC<Props> = ({ data }) => {
    if (data.length === 0) return null;

    const totalSolvedSum = data.reduce((acc, u) => acc + (u.totalSolved || 0), 0);
    const activeTodayCount = data.filter((u) => u.solvedToday).length;
    
    const avgAcceptance = data.length > 0
        ? (data.reduce((acc, u) => acc + (u.acceptanceRate || 0), 0) / data.length).toFixed(1)
        : "0.0";

    // Find top department
    const deptStats: Record<string, number> = {};
    data.forEach((u) => {
        const d = (u.dept || "Other").trim().toUpperCase();
        deptStats[d] = (deptStats[d] || 0) + (u.totalSolved || 0);
    });

    let topDept = "N/A";
    let maxSolved = -1;
    Object.entries(deptStats).forEach(([dept, solved]) => {
        if (solved > maxSolved && dept !== "OTHER") {
            maxSolved = solved;
            topDept = dept;
        }
    });

    const stats = [
        {
            title: "Total Solved",
            value: totalSolvedSum.toLocaleString(),
            subtitle: "Across all students",
            icon: Trophy,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
        },
        {
            title: "Active Today",
            value: activeTodayCount.toString(),
            subtitle: `${((activeTodayCount / data.length) * 100).toFixed(0)}% participation`,
            icon: Flame,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20",
        },
        {
            title: "Avg Acceptance",
            value: `${avgAcceptance}%`,
            subtitle: "Overall success rate",
            icon: Zap,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
            border: "border-purple-500/20",
        },
        {
            title: "Top Department",
            value: topDept,
            subtitle: maxSolved > 0 ? `${maxSolved.toLocaleString()} solved` : "Leading branch",
            icon: GraduationCap,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
        },
        {
            title: "Total Coders",
            value: data.length.toString(),
            subtitle: "Tracked in leaderboard",
            icon: Users,
            color: "text-cyan-400",
            bg: "bg-cyan-500/10",
            border: "border-cyan-500/20",
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-8 animate-slide-up">
            {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                    <div
                        key={idx}
                        className="glass-panel rounded-2xl p-4 border relative overflow-hidden group hover:border-white/20 transition-all duration-300"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 font-sans">
                                {stat.title}
                            </span>
                            <div className={`p-2 rounded-xl ${stat.bg} ${stat.color} border ${stat.border}`}>
                                <Icon size={16} />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-white font-display tracking-tight">
                            {stat.value}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1 font-sans">
                            {stat.subtitle}
                        </p>
                    </div>
                );
            })}
        </div>
    );
};
