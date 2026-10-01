import React from "react";
import { Crown, Medal, Flame, ExternalLink, Zap } from "lucide-react";
import { UserData } from "../types/leetcode";

interface Props {
    data: UserData[];
}

export const PodiumCards: React.FC<Props> = ({ data }) => {
    if (data.length < 2) return null;

    // Sort by total solved desc
    const sorted = [...data].sort((a, b) => b.totalSolved - a.totalSolved);
    const top3 = sorted.slice(0, 3);

    const podiumConfig = [
        {
            rank: 1,
            user: top3[0],
            title: "Grand Champion",
            badgeColor: "from-amber-400 to-yellow-500",
            borderColor: "border-amber-400/40 hover:border-amber-400/80",
            glow: "shadow-amber-500/20",
            icon: Crown,
            iconColor: "text-amber-300",
            order: "order-1 md:order-2 md:-translate-y-3",
            bgGlow: "bg-amber-500/10",
        },
        {
            rank: 2,
            user: top3[1],
            title: "Runner Up",
            badgeColor: "from-slate-300 to-gray-400",
            borderColor: "border-slate-400/30 hover:border-slate-300/70",
            glow: "shadow-slate-400/15",
            icon: Medal,
            iconColor: "text-slate-300",
            order: "order-2 md:order-1",
            bgGlow: "bg-slate-500/10",
        },
        ...(top3[2]
            ? [
                  {
                      rank: 3,
                      user: top3[2],
                      title: "2nd Runner Up",
                      badgeColor: "from-amber-600 to-orange-700",
                      borderColor: "border-amber-600/30 hover:border-amber-500/70",
                      glow: "shadow-amber-700/15",
                      icon: Medal,
                      iconColor: "text-amber-500",
                      order: "order-3 md:order-3",
                      bgGlow: "bg-amber-700/10",
                  },
              ]
            : []),
    ];

    return (
        <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Crown className="text-amber-400" size={20} />
                    <h2 className="text-lg font-bold font-display text-white tracking-wide">
                        Hall of Champions
                    </h2>
                </div>
                <span className="text-xs text-gray-400 font-medium">Top Performers</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
                {podiumConfig.map((item) => {
                    const user = item.user;
                    if (!user) return null;
                    const Icon = item.icon;

                    return (
                        <div
                            key={user.username}
                            className={`glass-panel rounded-3xl p-6 border ${item.borderColor} ${item.order} shadow-2xl ${item.glow} transition-all duration-300 relative overflow-hidden group`}
                        >
                            {/* Top decorative gradient glow */}
                            <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl ${item.bgGlow} opacity-60 group-hover:opacity-100 transition-opacity`} />

                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${item.badgeColor} text-black font-black font-display text-xl shadow-lg`}>
                                        #{item.rank}
                                    </div>
                                    <div>
                                        {user.name ? (
                                            <>
                                                <h3 className="font-bold text-white text-lg font-display group-hover:text-emerald-400 transition-colors">
                                                    {user.name}
                                                </h3>
                                                <a
                                                    href={`https://leetcode.com/${user.username}/`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-gray-400 hover:text-emerald-400 inline-flex items-center gap-1 font-mono transition-colors"
                                                >
                                                    @{user.username}
                                                    <ExternalLink size={10} />
                                                </a>
                                            </>
                                        ) : (
                                            <a
                                                href={`https://leetcode.com/${user.username}/`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-base font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 font-mono transition-colors"
                                            >
                                                @{user.username}
                                                <ExternalLink size={12} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div className={`p-2 rounded-xl bg-white/5 border border-white/10 ${item.iconColor}`}>
                                    <Icon size={20} />
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap items-center gap-2 mb-5">
                                {user.regNo && (
                                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300">
                                        {user.regNo}
                                    </span>
                                )}
                                {user.dept && (
                                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                        {user.dept}
                                    </span>
                                )}
                                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[11px] font-mono ml-auto">
                                    <Flame size={12} fill={user.solvedToday ? "currentColor" : "none"} />
                                    <span>{user.currentStreak}d streak</span>
                                </div>
                            </div>

                            {/* Stats Highlight */}
                            <div className="bg-black/40 rounded-2xl p-4 border border-white/5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400 font-medium">Problems Solved</span>
                                    <span className="text-xl font-black font-mono text-emerald-400">
                                        {user.totalSolved}
                                        <span className="text-xs text-gray-500 font-normal ml-1">/ {user.totalQuestions}</span>
                                    </span>
                                </div>

                                {/* Difficulty Pill Breakdown */}
                                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5 text-center text-xs">
                                    <div className="bg-emerald-500/10 rounded-lg py-1 border border-emerald-500/15">
                                        <span className="block font-bold text-emerald-400 font-mono">{user.easySolved}</span>
                                        <span className="text-[10px] text-gray-400">Easy</span>
                                    </div>
                                    <div className="bg-amber-500/10 rounded-lg py-1 border border-amber-500/15">
                                        <span className="block font-bold text-amber-400 font-mono">{user.mediumSolved}</span>
                                        <span className="text-[10px] text-gray-400">Med</span>
                                    </div>
                                    <div className="bg-rose-500/10 rounded-lg py-1 border border-rose-500/15">
                                        <span className="block font-bold text-rose-400 font-mono">{user.hardSolved}</span>
                                        <span className="text-[10px] text-gray-400">Hard</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                                    <span className="flex items-center gap-1">
                                        <Zap size={12} className="text-purple-400" />
                                        Success: <strong className="text-gray-200">{user.acceptanceRate.toFixed(1)}%</strong>
                                    </span>
                                    <span>
                                        Global: <strong className="text-gray-200">#{user.ranking > 0 ? user.ranking.toLocaleString() : "N/A"}</strong>
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
