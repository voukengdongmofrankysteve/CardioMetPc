import React, { useState, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
import { useUpdater } from '../../hooks/useUpdater';

const appWindow = getCurrentWindow();

export const TitleBar: React.FC = () => {
    const [appVersion, setAppVersion] = useState('...');
    const { updateAvailable, updateManifest, downloading, progress, installUpdate } = useUpdater();
    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
        loadVersion();
        const checkMaximized = async () => {
            setIsMaximized(await appWindow.isMaximized());
        };
        checkMaximized();

        // Listen to resize to update maximized state icon if needed (simplified)
        const unlisten = appWindow.listen('tauri://resize', checkMaximized);
        return () => { unlisten.then(f => f()); };
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
    const handleMaximize = async () => {
        await appWindow.toggleMaximize();
        setIsMaximized(await appWindow.isMaximized());
    };
    const handleClose = () => appWindow.close();

    return (
        <div
            data-tauri-drag-region
            className="h-titlebar bg-bg-surface dark:bg-dark-bg-surface flex items-center justify-between px-3 select-none shrink-0 border-b border-border dark:border-dark-border z-50 transition-colors duration-200"
        >
            {/* Left: Branding & Version */}
            <div className="flex items-center gap-3 pointer-events-none">
                <div className="flex items-center gap-2">
                    <div className="size-6 bg-primary/10 rounded-md flex items-center justify-center">
                        <span className="material-symbols-outlined text-[16px] text-primary">cardiology</span>
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="text-[12px] font-bold text-text-main dark:text-dark-text-main tracking-wide">CardioMed</span>
                        <span className="text-[9px] font-medium text-text-muted dark:text-dark-text-muted">Desktop App</span>
                    </div>
                </div>

                <div className="h-4 w-px bg-border dark:bg-dark-border mx-1"></div>

                <span className="text-[10px] font-medium text-text-muted dark:text-dark-text-muted bg-bg-main dark:bg-dark-bg-main px-2 py-0.5 rounded-full border border-border dark:border-dark-border">
                    v{appVersion}
                </span>

                {updateAvailable && (
                    <button
                        onClick={installUpdate}
                        disabled={downloading}
                        className="ml-2 pointer-events-auto flex items-center gap-1.5 px-2 py-0.5 bg-accent/10 hover:bg-accent/20 text-accent rounded transition-colors border border-accent/20"
                    >
                        {downloading ? (
                            <span className="text-[9px] font-bold">Updating {progress.toFixed(0)}%...</span>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[12px]">download</span>
                                <span className="text-[9px] font-bold">Update Available {updateManifest?.version}</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Right: Window Controls */}
            <div className="flex items-center gap-1">
                <WindowControlButton icon="remove" onClick={handleMinimize} />
                <WindowControlButton
                    icon={isMaximized ? "content_copy" : "crop_square"}
                    onClick={handleMaximize}
                />
                <WindowControlButton
                    icon="close"
                    onClick={handleClose}
                    isClose
                />
            </div>
        </div>
    );
};

interface WindowControlButtonProps {
    icon: string;
    onClick: () => void;
    isClose?: boolean;
}

const WindowControlButton: React.FC<WindowControlButtonProps> = ({ icon, onClick, isClose }) => (
    <button
        onClick={onClick}
        className={`h-7 w-9 flex items-center justify-center rounded-md transition-all duration-200
            ${isClose
                ? 'hover:bg-red-500 hover:text-white text-text-muted dark:text-dark-text-muted'
                : 'hover:bg-bg-main dark:hover:bg-dark-bg-main text-text-muted dark:text-dark-text-muted hover:text-text-main dark:hover:text-dark-text-main'
            }
        `}
    >
        <span className={`material-symbols-outlined text-[16px] ${isClose && 'group-hover:text-white'}`}>
            {icon}
        </span>
    </button>
);
