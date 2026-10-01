import React from "react";
import { GraduationCap, Users, Trophy, Flame } from "lucide-react";
import { UserData } from "../types/leetcode";

interface Props {
    data: UserData[];
}

export const DepartmentAnalytics: React.FC<Props> = ({ data }) => {
    if (data.length === 0) return null;

    // Group by department
    const deptMap: Record<
        string,
        {
            count: number;
            totalSolved: number;
            easySolved: number;
            mediumSolved: number;
            hardSolved: number;
            topCoder: UserData;
            activeToday: number;
        }
    > = {};

    data.forEach((user) => {
        const dept = (user.dept || "General").trim().toUpperCase();
        if (!deptMap[dept]) {
            deptMap[dept] = {
                count: 0,
                totalSolved: 0,
                easySolved: 0,
                mediumSolved: 0,
                hardSolved: 0,
                topCoder: user,
                activeToday: 0,
            };
        }

        const curr = deptMap[dept];
        curr.count += 1;
        curr.totalSolved += user.totalSolved || 0;
        curr.easySolved += user.easySolved || 0;
        curr.mediumSolved += user.mediumSolved || 0;
        curr.hardSolved += user.hardSolved || 0;
        if (user.solvedToday) curr.activeToday += 1;

        if (user.totalSolved > curr.topCoder.totalSolved) {
            curr.topCoder = user;
        }
    });

    const sortedDepts = Object.entries(deptMap).sort(
        (a, b) => b[1].totalSolved - a[1].totalSolved
    );

    const maxDeptSolved = Math.max(...sortedDepts.map((d) => d[1].totalSolved), 1);

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {sortedDepts.map(([dept, info], idx) => {
                    const avgSolved = (info.totalSolved / info.count).toFixed(1);
                    const progressPercent = Math.min(
                        100,
                        (info.totalSolved / maxDeptSolved) * 100
                    );

                    return (
                        <div
                            key={dept}
                            className="glass-panel rounded-3xl p-6 border border-white/10 hover:border-emerald-500/30 transition-all duration-300 relative overflow-hidden group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20 font-bold font-display">
                                        #{idx + 1}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg font-display">
                                            {dept}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <Users size={12} />
                                            <span>{info.count} {info.count === 1 ? "student" : "students"}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                                    <Flame size={12} />
                                    <span>{info.activeToday} active</span>
                                </div>
                            </div>

                            {/* Solved Progress */}
                            <div className="space-y-2 mb-4 bg-black/30 p-3.5 rounded-2xl border border-white/5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-400 font-medium">Department Total</span>
                                    <span className="font-mono font-bold text-emerald-400 text-sm">
                                        {info.totalSolved.toLocaleString()} solved
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-700"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                                    <span>Avg / Student: <strong className="text-gray-200">{avgSolved}</strong></span>
                                    <span>E: {info.easySolved} | M: {info.mediumSolved} | H: {info.hardSolved}</span>
                                </div>
                            </div>

                            {/* Top Performer Card */}
                            <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl border border-white/5">
                                <div className="flex items-center gap-2">
                                    <Trophy size={14} className="text-amber-400" />
                                    <div className="text-xs">
                                        <div className="text-gray-400 text-[10px]">Top Performer</div>
                                        <div className="font-semibold text-gray-200">
                                            {info.topCoder.name || info.topCoder.username}
                                        </div>
                                    </div>
                                </div>
                                <span className="font-mono text-xs font-bold text-emerald-400">
                                    {info.topCoder.totalSolved} solved
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
