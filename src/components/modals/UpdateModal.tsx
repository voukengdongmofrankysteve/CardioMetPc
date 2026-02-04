import React from 'react';

interface UpdateModalProps {
    isOpen: boolean;
    currentVersion: string;
    requiredVersion: string;
    releaseNotes?: string;
    priority: boolean;
    onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
    isOpen,
    currentVersion,
    requiredVersion,
    releaseNotes,
    priority,
    onClose
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#152a26] rounded-3xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
                {/* Header */}
                <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 px-8 py-8 border-b border-[#e7f3f1] dark:border-[#1e3a36]">
                    <div className="flex items-start gap-4">
                        <div className="size-16 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-4xl text-primary">system_update</span>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-black text-[#0d1b19] dark:text-white uppercase tracking-tight">
                                {priority ? 'Critical Update Required' : 'Update Available'}
                            </h2>
                            <p className="text-sm text-[#4c9a8d] font-medium mt-1">
                                {priority
                                    ? 'This update is mandatory and must be installed to continue using the application.'
                                    : 'A new version is available with improvements and bug fixes.'}
                            </p>
                        </div>
                        {!priority && (
                            <button
                                onClick={onClose}
                                className="size-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center transition-colors"
                            >
                                <span className="material-symbols-outlined text-[#4c9a8d]">close</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="px-8 py-8 space-y-6">
                    {/* Version Comparison */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 border border-[#e7f3f1] dark:border-[#1e3a36]">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-lg text-[#4c9a8d]">info</span>
                                <span className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest">Current Version</span>
                            </div>
                            <p className="text-3xl font-black text-[#0d1b19] dark:text-white">{currentVersion}</p>
                        </div>
                        <div className="bg-primary/10 rounded-2xl p-6 border border-primary/20">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-lg text-primary">new_releases</span>
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Required Version</span>
                            </div>
                            <p className="text-3xl font-black text-[#0d1b19] dark:text-white">{requiredVersion}</p>
                        </div>
                    </div>

                    {/* Release Notes */}
                    {releaseNotes && (
                        <div className="bg-[#f6f8f8] dark:bg-white/5 rounded-2xl p-6 border border-[#e7f3f1] dark:border-[#1e3a36]">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-lg text-primary">description</span>
                                <span className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest">Release Notes</span>
                            </div>
                            <p className="text-sm text-[#0d1b19] dark:text-white font-medium leading-relaxed whitespace-pre-wrap">
                                {releaseNotes}
                            </p>
                        </div>
                    )}

                    {/* Priority Warning */}
                    {priority && (
                        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
                            <div className="size-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-red-500">warning</span>
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-tight">Mandatory Update</h4>
                                <p className="text-xs text-red-600/80 dark:text-red-400/80 font-medium leading-relaxed mt-1">
                                    This update contains critical security patches and bug fixes. You must update to continue using the application.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={() => {
                                // Open download page or trigger update
                                window.open('https://github.com/your-repo/releases', '_blank');
                            }}
                            className="flex-1 px-6 py-4 bg-primary text-[#0d1b19] rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-105 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">download</span>
                            Download Update
                        </button>
                        {!priority && (
                            <button
                                onClick={onClose}
                                className="px-6 py-4 bg-gray-100 dark:bg-white/5 text-[#4c9a8d] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                            >
                                Remind Me Later
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
