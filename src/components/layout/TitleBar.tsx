import React, { useState, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';

import { useUpdater } from '../../hooks/useUpdater';

const appWindow = getCurrentWindow();

export const TitleBar: React.FC = () => {
    const [appVersion, setAppVersion] = useState('...');
    const { updateAvailable, updateManifest, downloading, progress, installUpdate } = useUpdater();

    useEffect(() => {
        loadVersion();
    }, []);

    const loadVersion = async () => {
        try {
            const version = await invoke<string>('get_app_version');
            setAppVersion(version);
        } catch (error) {
            console.error('Failed to get app version:', error);
            setAppVersion('0.1.0');
        }
    };

    const handleMinimize = () => appWindow.minimize();
    const handleMaximize = () => appWindow.toggleMaximize();
    const handleClose = () => appWindow.close();

    return (
        <div
            data-tauri-drag-region
            className="h-10 bg-white dark:bg-[#152a26] flex items-center justify-between px-4 select-none shrink-0 border-b border-[#e7f3f1] dark:border-[#1e3a36]"
        >
            <div className="flex items-center gap-2 pointer-events-none">
                <div className="size-5 bg-[#42f0d3] rounded flex items-center justify-center">
                    <span className="material-symbols-outlined text-[14px] text-white">cardiology</span>
                </div>
                <span className="text-[11px] font-black text-[#0d1b19] dark:text-white/80 uppercase tracking-[0.1em]">CardioMet</span>
                <span className="text-[9px] font-black text-[#4c9a8d] uppercase tracking-widest bg-[#f6f8f8] dark:bg-white/5 px-2 py-0.5 rounded border border-[#e7f3f1] dark:border-[#1e3a36]">
                    v{appVersion}
                </span>

                {updateAvailable && ( 
                    <button
                        onClick={installUpdate}
                        disabled={downloading}
                        className="ml-2 pointer-events-auto flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded transition-colors border border-blue-500/20"
                    >
                        {downloading ? (
                            <span className="text-[9px] font-bold">Downloading {progress.toFixed(0)}%...</span>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[12px]">download</span>
                                <span className="text-[9px] font-bold">Update to v{updateManifest?.version}</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            <div className="flex items-center">
                <button
                    onClick={handleMinimize}
                    className="h-10 w-12 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                >
                    <span className="material-symbols-outlined text-[16px] text-[#4c9a8d] group-hover:text-[#0d1b19] dark:group-hover:text-white">remove</span>
                </button>
                <button
                    onClick={handleMaximize}
                    className="h-10 w-12 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                >
                    <span className="material-symbols-outlined text-[14px] text-[#4c9a8d] group-hover:text-[#0d1b19] dark:group-hover:text-white">check_box_outline_blank</span>
                </button>
                <button
                    onClick={handleClose}
                    className="h-10 w-12 flex items-center justify-center hover:bg-red-500 transition-colors group"
                >
                    <span className="material-symbols-outlined text-[18px] text-[#4c9a8d] group-hover:text-white">close</span>
                </button>
            </div>
        </div>
    );
};
