import React, { useState } from "react";
import { UserPlus, Loader2 } from "lucide-react";
import { UserInput } from "../types/leetcode";

interface Props {
    onAdd: (user: UserInput) => Promise<boolean>;
}

export const AddUserForm: React.FC<Props> = ({ onAdd }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const [regNo, setRegNo] = useState("");
    const [dept, setDept] = useState("");
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            dept: dept.trim(),
            username: username.trim(),
        });

        setLoading(false);

        if (success) {
            setName("");
            setRegNo("");
            setDept("");
            setUsername("");
            setIsOpen(false);
        } else {
            setError("Failed to add user. Verify the LeetCode username and server connection.");
        }
    };

    if (!isOpen) {
        return (
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white rounded-xl text-sm font-semibold border border-gray-700 transition"
            >
                <UserPlus size={16} className="text-leetcode-button" />
                <span>Add Single User</span>
            </button>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="p-4 bg-gray-900/90 border border-gray-800 rounded-2xl shadow-xl flex flex-col md:flex-row gap-3 items-stretch md:items-center animate-fade-in"
        >
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Student Name"
                className="px-3 py-2 bg-black/40 text-gray-200 placeholder-gray-500 border border-gray-700 rounded-xl text-sm focus:border-leetcode-button focus:outline-none flex-1"
            />
            <input
                type="text"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                placeholder="Reg No (e.g. 21CS101)"
                className="px-3 py-2 bg-black/40 text-gray-200 placeholder-gray-500 border border-gray-700 rounded-xl text-sm focus:border-leetcode-button focus:outline-none w-full md:w-36"
            />
            <input
                type="text"
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                placeholder="Dept (e.g. CSE)"
                className="px-3 py-2 bg-black/40 text-gray-200 placeholder-gray-500 border border-gray-700 rounded-xl text-sm focus:border-leetcode-button focus:outline-none w-full md:w-28"
            />
            <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="LeetCode Username *"
                required
                className="px-3 py-2 bg-black/40 text-gray-200 placeholder-gray-500 border border-gray-700 rounded-xl text-sm focus:border-leetcode-button focus:outline-none flex-1"
            />

            <div className="flex items-center gap-2">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-leetcode-button hover:bg-leetcode-hover text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
                >
                    {loading ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <UserPlus size={16} />
                    )}
                    <span>Save</span>
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setIsOpen(false);
                        setError(null);
                    }}
                    className="px-3 py-2 bg-gray-800 text-gray-400 hover:text-white rounded-xl text-sm transition"
                >
                    Cancel
                </button>
            </div>

            {error && <span className="text-xs text-red-400 md:w-full">{error}</span>}
        </form>
    );
};