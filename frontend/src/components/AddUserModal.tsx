import React, { useState } from "react";
import { UserPlus, X, Loader2, User, Hash, GraduationCap, Code2 } from "lucide-react";
import { UserInput } from "../types/leetcode";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (user: UserInput) => Promise<boolean>;
}

export const AddUserModal: React.FC<Props> = ({ isOpen, onClose, onAdd }) => {
    const [name, setName] = useState("");
    const [regNo, setRegNo] = useState("");
    const [dept, setDept] = useState("");
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim()) {
            setError("LeetCode username is required.");
            return;
        }

        setLoading(true);
        setError(null);

        const success = await onAdd({
            name: name.trim() || username.trim(),
            displayName: name.trim() || username.trim(),
            regNo: regNo.trim(),
            dept: dept.trim().toUpperCase(),
            username: username.trim(),
        });

        setLoading(false);

        if (success) {
            setName("");
            setRegNo("");
            setDept("");
            setUsername("");
            onClose();
        } else {
            setError("Failed to add user. Verify the LeetCode username and server connection.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="glass-panel border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl bg-slate-900/95">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                            <UserPlus size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold font-display text-white">
                                Add New Student
                            </h2>
                            <p className="text-xs text-gray-400">
                                Enter student details and LeetCode handle
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                            Student Full Name
                        </label>
                        <div className="relative">
                            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. John Doe"
                                className="w-full pl-10 pr-4 py-2.5 bg-black/40 text-gray-100 placeholder-gray-500 rounded-xl border border-white/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm transition"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                                Reg / Roll No
                            </label>
                            <div className="relative">
                                <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    value={regNo}
                                    onChange={(e) => setRegNo(e.target.value)}
                                    placeholder="e.g. 21CS101"
                                    className="w-full pl-10 pr-4 py-2.5 bg-black/40 text-gray-100 placeholder-gray-500 rounded-xl border border-white/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm transition font-mono"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                                Department
                            </label>
                            <div className="relative">
                                <GraduationCap size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    value={dept}
                                    onChange={(e) => setDept(e.target.value)}
                                    placeholder="e.g. CSE"
                                    className="w-full pl-10 pr-4 py-2.5 bg-black/40 text-gray-100 placeholder-gray-500 rounded-xl border border-white/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm transition uppercase"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                            LeetCode Username <span className="text-emerald-400">*</span>
                        </label>
                        <div className="relative">
                            <Code2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="e.g. johndoe_lc"
                                className="w-full pl-10 pr-4 py-2.5 bg-black/40 text-gray-100 placeholder-gray-500 rounded-xl border border-white/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm transition font-mono"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-xl shadow-lg shadow-emerald-900/30 transition disabled:opacity-50 active:scale-95"
                        >
                            {loading ? (
                                <Loader2 size={15} className="animate-spin" />
                            ) : (
                                <UserPlus size={15} />
                            )}
                            <span>Save & Fetch Stats</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
