import React, { useState, useRef, useEffect } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X, Loader2, ArrowRight } from "lucide-react";
import { parseExcelFile } from "../utils/excelUtils";
import { UserInput } from "../types/leetcode";
import { AuthUser } from "../types/auth";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    apiUrl: string;
    authUser?: AuthUser | null;
}

export const ExcelUploadModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, apiUrl, authUser }) => {
    const [file, setFile] = useState<File | null>(null);
    const [parsedUsers, setParsedUsers] = useState<UserInput[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const reset = () => {
        setFile(null);
        setParsedUsers([]);
        setError(null);
        setSuccessMessage(null);
        setIsSubmitting(false);
        setIsParsing(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    useEffect(() => {
        if (isOpen) {
            reset();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError(null);
        setSuccessMessage(null);
        setIsParsing(true);

        try {
            const users = await parseExcelFile(selectedFile);
            setParsedUsers(users);
        } catch (err: any) {
            setError(err.message || "Failed to parse Excel file.");
            setParsedUsers([]);
        } finally {
            setIsParsing(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files?.[0];
        if (!droppedFile) return;

        setFile(droppedFile);
        setError(null);
        setSuccessMessage(null);
        setIsParsing(true);

        try {
            const users = await parseExcelFile(droppedFile);
            setParsedUsers(users);
        } catch (err: any) {
            setError(err.message || "Failed to parse Excel file.");
            setParsedUsers([]);
        } finally {
            setIsParsing(false);
        }
    };

    const handleUploadToServer = async () => {
        if (parsedUsers.length === 0) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch(`${apiUrl}/api/users/update-all`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    users: parsedUsers,
                    createdBy: authUser?.username || "admin",
                    role: authUser?.role || "user",
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to update users on server.");
            }

            setSuccessMessage(`Successfully saved ${parsedUsers.length} users!`);
            setTimeout(() => {
                reset();
                onSuccess();
                onClose();
            }, 600);
        } catch (err: any) {
            setError(err.message || "An error occurred while uploading.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
            <div className="glass-panel border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl bg-slate-900/95 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                            <FileSpreadsheet size={22} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold font-display text-white">
                                    Import Students from Excel
                                </h2>
                            </div>
                            <p className="text-xs text-gray-400">
                                Upload an Excel (.xlsx, .xls) or CSV file with Name, Reg No, Dept & Usernames
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    {/* Drag & Drop Area */}
                    {!file && (
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-white/15 hover:border-emerald-500/60 rounded-2xl p-8 flex flex-col items-center justify-center gap-3.5 cursor-pointer bg-black/30 hover:bg-white/[0.02] transition-all group"
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 group-hover:scale-110 transition-transform">
                                <Upload size={28} />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-white font-display">
                                    Click to browse or drag & drop your Excel file
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Supports .xlsx, .xls, .csv with columns: Name, Reg No, Dept, LeetCode Username
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {isParsing && (
                        <div className="flex items-center justify-center gap-3 py-10 text-gray-300">
                            <Loader2 size={24} className="animate-spin text-emerald-400" />
                            <span className="text-sm font-medium">Analyzing and parsing sheet...</span>
                        </div>
                    )}

                    {/* Preview Table */}
                    {file && parsedUsers.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between bg-black/40 p-3.5 rounded-2xl border border-white/10">
                                <div className="flex items-center gap-3">
                                    <FileSpreadsheet className="text-emerald-400" size={20} />
                                    <div>
                                        <div className="text-xs font-bold text-white font-mono">
                                            {file.name}
                                        </div>
                                        <div className="text-[11px] text-gray-400">
                                            Identified <span className="text-emerald-400 font-bold">{parsedUsers.length}</span> student records
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={reset}
                                    className="text-xs text-gray-400 hover:text-rose-400 transition"
                                >
                                    Select another file
                                </button>
                            </div>

                            <div className="border border-white/10 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-black/70 text-gray-400 uppercase sticky top-0 font-mono text-[10px]">
                                        <tr>
                                            <th className="px-3.5 py-2">#</th>
                                            <th className="px-3.5 py-2">Reg No</th>
                                            <th className="px-3.5 py-2">Name</th>
                                            <th className="px-3.5 py-2">Dept</th>
                                            <th className="px-3.5 py-2">LeetCode Username</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-gray-300 bg-black/20">
                                        {parsedUsers.slice(0, 50).map((u, i) => (
                                            <tr key={i} className="hover:bg-white/5">
                                                <td className="px-3.5 py-2 text-gray-600 font-mono">{i + 1}</td>
                                                <td className="px-3.5 py-2 font-mono text-gray-300">{u.regNo || "-"}</td>
                                                <td className="px-3.5 py-2 font-medium text-white">{u.name}</td>
                                                <td className="px-3.5 py-2 text-blue-400 font-semibold">{u.dept || "-"}</td>
                                                <td className="px-3.5 py-2 font-mono text-emerald-400">{u.username}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {parsedUsers.length > 50 && (
                                <p className="text-[11px] text-gray-500 text-center font-mono">
                                    ...and {parsedUsers.length - 50} more students
                                </p>
                            )}
                        </div>
                    )}

                    {/* Messages */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}
                    {successMessage && (
                        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs">
                            <CheckCircle2 size={16} />
                            <span>{successMessage}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-white/[0.02]">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition"
                    >
                        Cancel
                    </button>
                    {parsedUsers.length > 0 && (
                        <button
                            type="button"
                            onClick={handleUploadToServer}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-xl shadow-lg shadow-emerald-900/30 transition disabled:opacity-50 active:scale-95"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={15} className="animate-spin" />
                                    <span>Syncing with LeetCode...</span>
                                </>
                            ) : (
                                <>
                                    <span>Confirm & Load Leaderboard</span>
                                    <ArrowRight size={15} />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
