import { useState, useEffect } from 'react';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export const useUpdater = () => {
    const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
    const [updateManifest, setUpdateManifest] = useState<Update | null>(null);
    const [checking, setChecking] = useState<boolean>(false);
    const [downloading, setDownloading] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [statusText, setStatusText] = useState<string>('');

    const checkUpdate = async () => {
        try {
            setChecking(true);
            setError(null);
            setStatusText('Checking for updates...');

            const update = await check();

            if (update) {
                setUpdateManifest(update);
                setUpdateAvailable(true);
                setStatusText(`Update available: ${update.version}`);
            } else {
                setUpdateAvailable(false);
                setUpdateManifest(null);
                setStatusText('Your app is up to date.');
            }
        } catch (err) {
            console.error('Failed to check for updates:', err);
            setError('Failed to check for updates.');
            setStatusText('Error checking for updates.');
        } finally {
            setChecking(false);
        }
    };

    const installUpdate = async () => {
        if (!updateManifest) return;

        try {
            setDownloading(true);
            setStatusText('Downloading update...');

            let downloaded = 0;
            let contentLength = 0;

            await updateManifest.downloadAndInstall((event) => {
                switch (event.event) {
                    case 'Started':
                        contentLength = event.data.contentLength || 0;
                        console.log(`Started downloading ${event.data.contentLength} bytes`);
                        break;
                    case 'Progress':
                        downloaded += event.data.chunkLength;
                        if (contentLength > 0) {
                            const pct = (downloaded / contentLength) * 100;
                            setProgress(pct);
                            setStatusText(`Downloading: ${pct.toFixed(0)}%`);
                        }
                        break;
                    case 'Finished':
                        console.log('Download finished');
                        setStatusText('Download finished. Installing...');
                        break;
                }
            });

            setStatusText('Update installed. Restarting...');
            await relaunch();

        } catch (err) {
            console.error('Failed to install update:', err);
            setError('Failed to install update.');
            setStatusText('Error installing update.');
        } finally {
            setDownloading(false);
        }
    };

    useEffect(() => {
        checkUpdate();
    }, []);

    return {
        updateAvailable,
        updateManifest,
        checking,
        downloading,
        progress,
        error,
        statusText,
        checkUpdate,
        installUpdate
    };
};
