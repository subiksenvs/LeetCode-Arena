import React, { useState, useEffect } from "react";
import { Code2, Zap, Flame, Trophy, Cpu } from "lucide-react";

export const LoadingSpinner: React.FC = () => {
    const [stepIndex, setStepIndex] = useState(0);

    const steps = [
        "Connecting to LeetCode GraphQL API...",
        "Fetching student submission metrics...",
        "Calculating streaks and global rankings...",
        "Formatting difficulty breakdowns...",
        "Compiling real-time leaderboard...",
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setStepIndex((prev) => (prev + 1) % steps.length);
        }, 1200);
        return () => clearInterval(interval);
    }, [steps.length]);

    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 max-w-lg mx-auto animate-fade-in">
            {/* Multi-Ring Glowing Orb Spinner */}
            <div className="relative w-28 h-28 flex items-center justify-center mb-8">
                {/* Background Ambient Glow */}
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />

                {/* Outer Ring */}
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/10 border-t-emerald-400 border-r-teal-400 animate-spin" style={{ animationDuration: "2s" }} />

                {/* Middle Counter-Rotating Ring */}
                <div
                    className="absolute inset-2.5 rounded-full border-2 border-cyan-500/10 border-b-cyan-400 border-l-emerald-400 animate-spin"
                    style={{ animationDuration: "1.4s", animationDirection: "reverse" }}
                />

                {/* Inner Pulsing Ring */}
                <div
                    className="absolute inset-5 rounded-full border border-amber-400/20 border-t-amber-400 animate-spin"
                    style={{ animationDuration: "0.9s" }}
                />

                {/* Center Core Icon */}
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 text-black flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <Code2 size={22} className="stroke-[2.5] animate-pulse" />
                </div>
            </div>

            {/* Live Progress Stage */}
            <div className="text-center space-y-2 mb-6">
                <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <h3 className="font-display font-bold text-white text-base tracking-wide">
                        Synchronizing Arena
                    </h3>
                </div>
                <p className="text-xs text-emerald-400/90 font-mono transition-all duration-300 min-h-[20px]">
                    {steps[stepIndex]}
                </p>
            </div>

            {/* Glowing Skeleton Cards Preview */}
            <div className="w-full glass-panel rounded-2xl p-4 border border-white/10 shadow-2xl relative overflow-hidden space-y-3">
                {/* Header Dots */}
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
                        <Cpu size={12} className="animate-pulse text-emerald-400" />
                        <span>PROCESSING</span>
                    </div>
                </div>

                {/* Shimmer Rows */}
                <div className="space-y-2.5">
                    {[
                        { icon: Trophy, color: "text-amber-400", bg: "bg-amber-400/10" },
                        { icon: Flame, color: "text-orange-400", bg: "bg-orange-400/10" },
                        { icon: Zap, color: "text-purple-400", bg: "bg-purple-400/10" },
                    ].map((item, i) => {
                        const Icon = item.icon;
                        return (
                            <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-black/30 border border-white/5">
                                <div className={`p-1.5 rounded-lg ${item.bg} ${item.color}`}>
                                    <Icon size={14} />
                                </div>
                                <div className="flex-1 space-y-1.5">
                                    <div
                                        className="h-2.5 bg-gradient-to-r from-white/15 via-white/5 to-white/15 rounded-full animate-pulse"
                                        style={{ width: `${80 - i * 15}%` }}
                                    />
                                    <div
                                        className="h-1.5 bg-gradient-to-r from-emerald-500/30 to-transparent rounded-full animate-pulse"
                                        style={{ width: `${50 + i * 10}%` }}
                                    />
                                </div>
                                <div className="w-12 h-4 bg-white/10 rounded-md animate-pulse" />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};