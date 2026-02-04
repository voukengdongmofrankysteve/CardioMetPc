import React, { useState, useEffect } from 'react';
import { DatabaseService } from '../../../services/database';
import { invoke } from '@tauri-apps/api/core';

export const SecurityBackupsTab: React.FC = () => {
    const [subTab, setSubTab] = useState<'history' | 'audit'>('history');
    const [backups, setBackups] = useState<any[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        lastSuccessful: 'Loading...',
        failedLast24h: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isCreatingBackup, setIsCreatingBackup] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [backupHistory, backupStats] = await Promise.all([
                DatabaseService.getBackupHistory(10),
                DatabaseService.getBackupStats()
            ]);

            setBackups(backupHistory);
            setStats({
                total: backupStats.total,
                lastSuccessful: backupStats.lastSuccessful
                    ? new Date(backupStats.lastSuccessful).toLocaleString()
                    : 'Never',
                failedLast24h: backupStats.failedLast24h
            });
        } catch (error) {
            console.error('Failed to load backup data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateBackup = async () => {
        setIsCreatingBackup(true);
        try {
            const result = await invoke<string>('create_database_backup', { backupType: 'Manual' });
            const backupInfo = JSON.parse(result);

            // Save backup record to database
            await DatabaseService.createBackupRecord({
                type: 'Manual',
                filename: backupInfo.filename,
                size_mb: parseFloat(backupInfo.size_mb),
                status: 'Success'
            });

            alert(`Backup created successfully!\nFile: ${backupInfo.filename}\nSize: ${backupInfo.size_mb} MB`);

            // Reload data to show new backup
            await loadData();
        } catch (error: any) {
            console.error('Backup creation failed:', error);

            // Log failed backup
            try {
                await DatabaseService.createBackupRecord({
                    type: 'Manual',
                    filename: `failed_backup_${new Date().getTime()}.sql`,
                    size_mb: 0,
                    status: 'Failed',
                    error_message: error.toString()
                });
            } catch (dbError) {
                console.error('Failed to log backup error:', dbError);
            }

            alert(`Backup failed: ${error}`);
        } finally {
            setIsCreatingBackup(false);
        }
    };

    const handleRestoreBackup = async (filename: string) => {
        if (!confirm(`Are you sure you want to restore the database from "${filename}"? This will overwrite all current data!`)) {
            return;
        }

        try {
            const result = await invoke<string>('restore_database_backup', { filename });
            alert(result);
            window.location.reload(); // Reload app after restore
        } catch (error: any) {
            console.error('Restore failed:', error);
            alert(`Restore failed: ${error}`);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-[#152a26] p-6 rounded-2xl border border-[#e7f3f1] dark:border-[#1e3a36] shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="size-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-[#4c9a8d]">
                            <span className="material-symbols-outlined text-lg">database</span>
                        </div>
                        <span className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest">Total Backups</span>
                    </div>
                    <p className="text-4xl font-black text-[#0d1b19] dark:text-white">{stats.total}</p>
                </div>
                <div className="bg-white dark:bg-[#152a26] p-6 rounded-2xl border border-[#e7f3f1] dark:border-[#1e3a36] shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-lg">check_circle</span>
                        </div>
                        <span className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest">Last Successful Backup</span>
                    </div>
                    <p className="text-2xl font-black text-[#0d1b19] dark:text-white">{stats.lastSuccessful}</p>
                </div>
                <div className="bg-white dark:bg-[#152a26] p-6 rounded-2xl border border-[#e7f3f1] dark:border-[#1e3a36] shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <span className="material-symbols-outlined text-lg">shield</span>
                        </div>
                        <span className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest">Security Alerts (24h)</span>
                    </div>
                    <p className="text-4xl font-black text-[#42f0d3]">{stats.failedLast24h}</p>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white dark:bg-[#152a26] rounded-2xl border border-[#e7f3f1] dark:border-[#1e3a36] shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-[#e7f3f1] dark:border-[#1e3a36] flex items-center justify-between">
                    <div className="flex gap-8">
                        <button
                            onClick={() => setSubTab('history')}
                            className={`pb-2 text-xs font-black uppercase tracking-widest relative transition-all ${subTab === 'history' ? 'text-[#0d1b19] dark:text-white' : 'text-[#4c9a8d]'}`}
                        >
                            Backup History
                            {subTab === 'history' && <div className="absolute -bottom-[25px] left-0 right-0 h-1 bg-primary rounded-t-full"></div>}
                        </button>
                        <button
                            onClick={() => setSubTab('audit')}
                            className={`pb-2 text-xs font-black uppercase tracking-widest relative transition-all flex items-center gap-2 ${subTab === 'audit' ? 'text-[#0d1b19] dark:text-white' : 'text-[#4c9a8d]'}`}
                        >
                            Security Audit Logs
                            <div className="size-1.5 rounded-full bg-primary/40"></div>
                            {subTab === 'audit' && <div className="absolute -bottom-[25px] left-0 right-0 h-1 bg-primary rounded-t-full"></div>}
                        </button>
                    </div>
                    <button
                        onClick={handleCreateBackup}
                        disabled={isCreatingBackup}
                        className="px-6 py-2.5 bg-primary text-[#0d1b19] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isCreatingBackup ? (
                            <>
                                <div className="w-4 h-4 border-2 border-[#0d1b19] border-t-transparent rounded-full animate-spin"></div>
                                Creating...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-lg">add_circle</span>
                                Create Backup
                            </>
                        )}
                    </button>
                </div>

                <div className="p-6 bg-gray-50/30 dark:bg-white/5 flex items-center justify-between gap-4">
                    <div className="flex gap-3">
                        <select className="h-10 px-4 bg-white dark:bg-[#101f22] border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-primary">
                            <option>All Statuses</option>
                        </select>
                        <select className="h-10 px-4 bg-white dark:bg-[#101f22] border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-primary">
                            <option>Last 30 Days</option>
                        </select>
                    </div>
                    <p className="text-[10px] font-bold text-[#4c9a8d] uppercase">Showing 1-10 of 124 entries</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#e7f3f1] dark:border-[#1e3a36] text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest bg-gray-50/20 dark:bg-white/5">
                                <th className="px-8 py-4">Timestamp</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Filename</th>
                                <th className="px-6 py-4">Size</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-8 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e7f3f1] dark:divide-[#1e3a36]">
                            {backups.map((bak, i) => (
                                <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-8 py-5 text-sm font-medium text-[#0d1b19] dark:text-white">{bak.timestamp}</td>
                                    <td className="px-6 py-5">
                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter ${bak.type === 'Automatic' ? 'bg-gray-100 dark:bg-white/10 text-[#4c9a8d]' : 'bg-[#42f0d3]/20 text-[#2db6b8]'}`}>
                                            {bak.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-xs font-bold text-primary underline decoration-primary/30 underline-offset-4 cursor-pointer">
                                        {bak.filename}
                                    </td>
                                    <td className="px-6 py-5 text-xs font-bold text-[#4c9a8d]">{bak.size}</td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <span className={`material-symbols-outlined text-base ${bak.status === 'Success' ? 'text-green-500' : 'text-red-500'}`}>
                                                {bak.status === 'Success' ? 'check_circle' : 'cancel'}
                                            </span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${bak.status === 'Success' ? 'text-green-500' : 'text-red-500'}`}>
                                                {bak.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-4">
                                            <button className="material-symbols-outlined text-[#4c9a8d] hover:text-primary transition-colors text-lg">download</button>
                                            <button
                                                onClick={() => bak.status === 'Success' && handleRestoreBackup(bak.filename)}
                                                disabled={bak.status !== 'Success'}
                                                className={`text-[10px] font-black uppercase tracking-widest transition-colors ${bak.status === 'Success' ? 'text-[#0d1b19] dark:text-white hover:text-primary cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}
                                            >
                                                {bak.status === 'Success' ? 'Restore' : 'Failed'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 border-t border-[#e7f3f1] dark:border-[#1e3a36] flex items-center justify-between">
                    <button className="px-4 py-2 bg-white dark:bg-[#101f22] border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] hover:border-primary/50 transition-all">
                        Previous
                    </button>
                    <div className="flex gap-2">
                        {[1, 2, 3, '...', 12].map((p, i) => (
                            <button key={i} className={`size-8 rounded-xl flex items-center justify-center text-[10px] font-bold ${p === 1 ? 'bg-primary text-[#0d1b19]' : 'text-[#4c9a8d] hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                                {p}
                            </button>
                        ))}
                    </div>
                    <button className="px-4 py-2 bg-white dark:bg-[#101f22] border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] hover:border-primary/50 transition-all">
                        Next
                    </button>
                </div>
            </div>

            {/* Security Tip */}
            <div className="bg-[#42f0d3]/5 border border-[#42f0d3]/20 rounded-2xl p-4 flex items-start gap-4">
                <div className="size-10 rounded-xl bg-[#42f0d3]/10 flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined">info</span>
                </div>
                <div>
                    <h4 className="text-sm font-black text-[#0d1b19] dark:text-white uppercase tracking-tight">Security Tip</h4>
                    <p className="text-xs text-[#4c9a8d] font-medium leading-relaxed mt-1">
                        To maintain Medical Data Compliance (GDPR/HIPAA), manual backups are stored encrypted for 90 days. Always verify the integrity of the backup after a manual creation.
                    </p>
                </div>
            </div>
        </div>
    );
};
