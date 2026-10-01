import React, { useState } from "react";
import { Lock, User, Eye, EyeOff, Loader2, LogIn, UserPlus, Terminal } from "lucide-react";

interface Props {
    onLogin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    onSignup: (username: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
}

export const AuthScreen: React.FC<Props> = ({ onLogin, onSignup }) => {
    const [tab, setTab] = useState<"login" | "signup">("login");
    const [username, setUsername] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (tab === "login") {
            const res = await onLogin(username, password);
            setLoading(false);
            if (!res.success) {
                setError(res.error || "Login failed. Please check your credentials.");
            }
        } else {
            const res = await onSignup(username, password, name);
            setLoading(false);
            if (!res.success) {
                setError(res.error || "Signup failed. Please try a different username.");
            }
        }
    };

    const switchTab = (newTab: "login" | "signup") => {
        setTab(newTab);
        setError(null);
    };

    return (
        <div className="min-h-screen bg-[#090d16] text-[#e2e8f0] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient Background Gradient Glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[28rem] h-[28rem] bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-md relative z-10 animate-fade-in">
                {/* Brand Header */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-600 text-black flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/25">
                        <Terminal size={32} className="stroke-[2.5]" />
                    </div>
                    <h1 className="text-2xl font-black font-display tracking-tight text-white">
                        LEETCODE <span className="text-emerald-400">ARENA</span>
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">
                        Sign in to access your leaderboard and analytics
                    </p>
                </div>

                {/* Main Auth Card */}
                <div className="glass-panel border border-white/10 rounded-3xl overflow-hidden shadow-2xl bg-slate-900/95 backdrop-blur-xl">
                    {/* Tab Navigation */}
                    <div className="flex border-b border-white/10 p-2 bg-black/40 gap-2">
                        <button
                            type="button"
                            onClick={() => switchTab("login")}
                            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
                                tab === "login"
                                    ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                                    : "text-gray-400 hover:text-white"
                            }`}
                        >
                            <LogIn size={15} />
                            <span>Sign In</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => switchTab("signup")}
                            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
                                tab === "signup"
                                    ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                                    : "text-gray-400 hover:text-white"
                            }`}
                        >
                            <UserPlus size={15} />
                            <span>Create Account</span>
                        </button>
                    </div>

                    {/* Auth Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {tab === "signup" && (
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5 font-sans">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Subiksen"
                                        className="w-full pl-10 pr-4 py-2.5 bg-black/40 text-gray-100 placeholder-gray-500 rounded-xl border border-white/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm transition"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5 font-sans">
                                Username
                            </label>
                            <div className="relative">
                                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="e.g. username"
                                    className="w-full pl-10 pr-4 py-2.5 bg-black/40 text-gray-100 placeholder-gray-500 rounded-xl border border-white/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm transition font-mono"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5 font-sans">
                                Password
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-10 py-2.5 bg-black/40 text-gray-100 placeholder-gray-500 rounded-xl border border-white/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm transition font-mono"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-900/30 transition disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : tab === "login" ? (
                                <>
                                    <LogIn size={16} />
                                    <span>Sign In to Arena</span>
                                </>
                            ) : (
                                <>
                                    <UserPlus size={16} />
                                    <span>Create My Account</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
