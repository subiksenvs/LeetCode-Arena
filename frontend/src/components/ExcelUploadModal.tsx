import React, { useState, useRef, useEffect } from "react";
import {
    Upload,
    FileSpreadsheet,
    CheckCircle2,
    AlertCircle,
    X,
    Loader2,
    ArrowRight,
    RefreshCw,
    User,
    Hash,
    Building2,
    Code2,
    Check,
    HelpCircle
} from "lucide-react";
import { parseExcelFile, ParsedExcelResult } from "../utils/excelUtils";
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
    const [detectedCols, setDetectedCols] = useState<ParsedExcelResult["detectedColumns"] | null>(null);
    const [totalRows, setTotalRows] = useState<number>(0);
    const [isParsing, setIsParsing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const reset = () => {
        setFile(null);
        setParsedUsers([]);
        setDetectedCols(null);
        setTotalRows(0);
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

    const processFile = async (selectedFile: File) => {
        // Enforce single file validation
        setFile(selectedFile);
        setError(null);
        setSuccessMessage(null);
        setIsParsing(true);
        setParsedUsers([]);
        setDetectedCols(null);

        try {
            const result = await parseExcelFile(selectedFile);
            setParsedUsers(result.users);
            setDetectedCols(result.detectedColumns);
            setTotalRows(result.totalRows);
        } catch (err: any) {
            setError(err.message || "Failed to parse Excel file. Please check file format.");
            setParsedUsers([]);
            setDetectedCols(null);
        } finally {
            setIsParsing(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;
        await processFile(selectedFile);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files?.[0];
        if (!droppedFile) return;
        await processFile(droppedFile);
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

            setSuccessMessage(`Successfully processed & saved ${parsedUsers.length} students!`);
            setTimeout(() => {
                reset();
                onSuccess();
                onClose();
            }, 600);
        } catch (err: any) {
            setError(err.message || "An error occurred while uploading to server.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-x-hidden overflow-y-auto animate-fade-in">
            <div className="glass-panel border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl bg-slate-900/95 flex flex-col max-h-[90vh] my-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 bg-white/[0.02]">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20 shrink-0">
                            <FileSpreadsheet size={22} />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-base sm:text-lg font-bold font-display text-white truncate">
                                Import Students from Excel
                            </h2>
                            <p className="text-xs text-gray-400 truncate">
                                Upload a single .xlsx, .xls, or .csv sheet
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition shrink-0 ml-2"
                        title="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body - strictly overflow-x-hidden */}
                <div className="p-4 sm:p-6 space-y-4 overflow-y-auto overflow-x-hidden flex-1">
                    {/* Drag & Drop Area (shown when no file is selected) */}
                    {!file && !error && (
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-white/15 hover:border-emerald-500/60 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center gap-3.5 cursor-pointer bg-black/30 hover:bg-white/[0.02] transition-all group"
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                multiple={false}
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 group-hover:scale-110 transition-transform">
                                <Upload size={28} />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-sm font-bold text-white font-display">
                                    Click to browse or drag & drop single Excel file
                                </p>
                                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                                    Supported columns: <span className="text-emerald-400 font-semibold">LeetCode Username</span> (required), <span className="text-gray-300">Name</span>, <span className="text-gray-300">Reg No</span>, <span className="text-gray-300">Department</span>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {isParsing && (
                        <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-300">
                            <Loader2 size={28} className="animate-spin text-emerald-400" />
                            <span className="text-xs sm:text-sm font-medium">Analyzing headers & extracting student data...</span>
                        </div>
                    )}

                    {/* Invalid File / Error State with Retry Button */}
                    {error && (
                        <div className="p-4 sm:p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-3">
                            <div className="flex items-start gap-3 text-rose-400 text-xs sm:text-sm">
                                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                <div className="space-y-1 flex-1 min-w-0">
                                    <div className="font-bold text-rose-300">File Analysis Notice</div>
                                    <p className="text-xs text-rose-300/90 leading-relaxed break-words">{error}</p>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-rose-500/15 flex flex-wrap items-center justify-between gap-2">
                                <span className="text-[11px] text-gray-400">
                                    Please ensure your sheet includes valid headers.
                                </span>
                                <button
                                    type="button"
                                    onClick={reset}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-xl transition"
                                >
                                    <RefreshCw size={13} />
                                    <span>Upload another file</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Preview Table & Detected Columns */}
                    {file && parsedUsers.length > 0 && !isParsing && (
                        <div className="space-y-4">
                            {/* File Header Bar - Mobile friendly wrap */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-black/40 p-3.5 rounded-2xl border border-white/10 gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 shrink-0">
                                        <FileSpreadsheet size={18} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs font-bold text-white font-mono truncate" title={file.name}>
                                            {file.name}
                                        </div>
                                        <div className="text-[11px] text-gray-400">
                                            Found <span className="text-emerald-400 font-bold">{parsedUsers.length}</span> students across {totalRows} rows
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={reset}
                                    className="text-xs text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 transition shrink-0 self-start sm:self-auto flex items-center gap-1.5"
                                >
                                    <RefreshCw size={13} />
                                    <span>Select another file</span>
                                </button>
                            </div>

                            {/* Detected Columns Context Cards */}
                            {detectedCols && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-[11px] text-gray-400 px-1">
                                        <span className="font-semibold uppercase tracking-wider text-[10px] text-gray-300">
                                            Identified Column Mappings
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {/* Username Mapping */}
                                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                                            <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
                                                <Code2 size={13} />
                                                <span className="text-[11px]">LeetCode ID</span>
                                            </div>
                                            <div className="font-mono text-[11px] text-white font-semibold truncate" title={detectedCols.username || ""}>
                                                "{detectedCols.username}"
                                            </div>
                                            <div className="text-[9px] text-emerald-400 font-semibold mt-0.5">Matched</div>
                                        </div>

                                        {/* Name Mapping */}
                                        <div className={`p-2.5 rounded-xl text-xs border ${detectedCols.name ? "bg-sky-500/10 border-sky-500/20" : "bg-white/[0.02] border-white/10"}`}>
                                            <div className={`flex items-center gap-1.5 font-bold mb-1 ${detectedCols.name ? "text-sky-400" : "text-gray-400"}`}>
                                                <User size={13} />
                                                <span className="text-[11px]">Name</span>
                                            </div>
                                            <div className="font-mono text-[11px] text-white font-semibold truncate" title={detectedCols.name || "Not in sheet"}>
                                                {detectedCols.name ? `"${detectedCols.name}"` : "Not in sheet"}
                                            </div>
                                            <div className={`text-[9px] font-semibold mt-0.5 ${detectedCols.name ? "text-emerald-400" : "text-gray-400"}`}>
                                                {detectedCols.name ? "Matched" : "Not Matched"}
                                            </div>
                                        </div>

                                        {/* Reg No Mapping */}
                                        <div className={`p-2.5 rounded-xl text-xs border ${detectedCols.regNo ? "bg-purple-500/10 border-purple-500/20" : "bg-white/[0.02] border-white/10"}`}>
                                            <div className={`flex items-center gap-1.5 font-bold mb-1 ${detectedCols.regNo ? "text-purple-400" : "text-gray-400"}`}>
                                                <Hash size={13} />
                                                <span className="text-[11px]">Reg No</span>
                                            </div>
                                            <div className="font-mono text-[11px] text-white font-semibold truncate" title={detectedCols.regNo || "Not specified"}>
                                                {detectedCols.regNo ? `"${detectedCols.regNo}"` : "Not in sheet"}
                                            </div>
                                            <div className={`text-[9px] font-semibold mt-0.5 ${detectedCols.regNo ? "text-emerald-400" : "text-gray-400"}`}>
                                                {detectedCols.regNo ? "Matched" : "Not Matched"}
                                            </div>
                                        </div>

                                        {/* Dept Mapping */}
                                        <div className={`p-2.5 rounded-xl text-xs border ${detectedCols.dept ? "bg-amber-500/10 border-amber-500/20" : "bg-white/[0.02] border-white/10"}`}>
                                            <div className={`flex items-center gap-1.5 font-bold mb-1 ${detectedCols.dept ? "text-amber-400" : "text-gray-400"}`}>
                                                <Building2 size={13} />
                                                <span className="text-[11px]">Department</span>
                                            </div>
                                            <div className="font-mono text-[11px] text-white font-semibold truncate" title={detectedCols.dept || "Not specified"}>
                                                {detectedCols.dept ? `"${detectedCols.dept}"` : "Not in sheet"}
                                            </div>
                                            <div className={`text-[9px] font-semibold mt-0.5 ${detectedCols.dept ? "text-emerald-400" : "text-gray-400"}`}>
                                                {detectedCols.dept ? "Matched" : "Not Matched"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Inner Scroll Table ONLY - container will NOT scroll horizontally */}
                            <div className="border border-white/10 rounded-2xl overflow-hidden bg-black/40 shadow-inner">
                                <div className="overflow-x-auto max-h-60 overflow-y-auto">
                                    <table className="w-full text-left text-xs min-w-[560px]">
                                        <thead className="bg-slate-900/95 text-gray-400 uppercase sticky top-0 font-mono text-[10px] backdrop-blur-md z-10 border-b border-white/10">
                                            <tr>
                                                <th className="px-3.5 py-2.5 w-12">#</th>
                                                <th className="px-3.5 py-2.5 min-w-[110px]">Reg No</th>
                                                <th className="px-3.5 py-2.5 min-w-[160px]">Student Name</th>
                                                <th className="px-3.5 py-2.5 min-w-[90px]">Dept</th>
                                                <th className="px-3.5 py-2.5 min-w-[160px]">LeetCode Username</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 text-gray-300">
                                            {parsedUsers.slice(0, 50).map((u, i) => (
                                                <tr key={i} className="hover:bg-white/5 transition">
                                                    <td className="px-3.5 py-2 text-gray-500 font-mono">{i + 1}</td>
                                                    <td className="px-3.5 py-2 font-mono text-gray-300">{u.regNo || "-"}</td>
                                                    <td className="px-3.5 py-2 font-semibold text-white whitespace-nowrap">{u.name || "-"}</td>
                                                    <td className="px-3.5 py-2 text-cyan-400 font-semibold uppercase">{u.dept || "-"}</td>
                                                    <td className="px-3.5 py-2 font-mono text-emerald-400 font-semibold">{u.username}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Success Message */}
                    {successMessage && (
                        <div className="flex items-center gap-2 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs sm:text-sm">
                            <CheckCircle2 size={18} className="shrink-0" />
                            <span>{successMessage}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-5 sm:px-6 py-4 border-t border-white/10 bg-white/[0.02]">
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
