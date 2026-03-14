import React, { useState, useEffect } from 'react';
import { securityService } from '../../../services/api';
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
            const response = await securityService.getBackups();
            if (response.success) {
                const backupHistory = response.data;
                setBackups(backupHistory);
                
                // Calculate stats from history for now
                const successfulBackups = backupHistory.filter((b: any) => b.status === 'Success' || b.status === 'completed');
                setStats({
                    total: backupHistory.length,
                    lastSuccessful: successfulBackups.length > 0
                        ? new Date(successfulBackups[0].created_at || successfulBackups[0].timestamp).toLocaleString()
                        : 'Never',
                    failedLast24h: backupHistory.filter((b: any) => 
                        (b.status === 'Failed' || b.status === 'error') && 
                        new Date(b.created_at || b.timestamp).getTime() > new Date().getTime() - 24 * 60 * 60 * 1000
                    ).length
                });
            }
        } catch (error) {
            console.error('Failed to load backup data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateBackup = async () => {
        setIsCreatingBackup(true);
        try {
            // First call the backend to initiate backup if server-side
            // Or use Tauri if client-side. The user wants API connection.
            const response = await securityService.createBackup();
            
            if (response.success) {
                alert('Backup created successfully!');
                await loadData();
            } else {
                alert(response.message || 'Backup failed');
            }
        } catch (error: any) {
            console.error('Backup creation failed:', error);
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-[#22c55e]/30 group">
                    <div className="flex items-center gap-6">
                        <div className="size-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 transition-transform group-hover:scale-110">
                            <span className="material-symbols-outlined text-2xl">database</span>
                        </div>
                        <div>
                            <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.total}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Backups</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-[#22c55e]/30 group">
                    <div className="flex items-center gap-6">
                        <div className="size-14 rounded-2xl bg-[#22c55e]/10 flex items-center justify-center text-[#22c55e] transition-transform group-hover:scale-110">
                            <span className="material-symbols-outlined text-2xl">check_circle</span>
                        </div>
                        <div>
                            <p className="text-xl font-bold text-slate-900 tracking-tight leading-none mb-1">Last Success</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{stats.lastSuccessful}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-[#22c55e]/30 group">
                    <div className="flex items-center gap-6">
                        <div className="size-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 transition-transform group-hover:scale-110">
                            <span className="material-symbols-outlined text-2xl">shield_locked</span>
                        </div>
                        <div>
                            <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.failedLast24h}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alerts (24h)</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
                    <div className="flex gap-10">
                        <button
                            onClick={() => setSubTab('history')}
                            className={`pb-2 text-[10px] font-black uppercase tracking-[0.2em] relative transition-all ${subTab === 'history' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Backup History
                            {subTab === 'history' && <div className="absolute -bottom-[25px] left-0 right-0 h-1 bg-[#22c55e] rounded-t-full"></div>}
                        </button>
                        <button
                            onClick={() => setSubTab('audit')}
                            className={`pb-2 text-[10px] font-black uppercase tracking-[0.2em] relative transition-all flex items-center gap-2 ${subTab === 'audit' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Security Logs
                            <div className="size-1.5 rounded-full bg-[#22c55e]/40"></div>
                            {subTab === 'audit' && <div className="absolute -bottom-[25px] left-0 right-0 h-1 bg-[#22c55e] rounded-t-full"></div>}
                        </button>
                    </div>
                    <button
                        onClick={handleCreateBackup}
                        disabled={isCreatingBackup}
                        className="px-6 py-2.5 bg-[#22c55e] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-500/20 hover:bg-[#16a34a] transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isCreatingBackup ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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

                <div className="p-6 bg-slate-50/50 flex items-center justify-between gap-4 border-b border-slate-100">
                    <div className="flex gap-3">
                        <select className="h-10 px-4 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#22c55e] cursor-pointer">
                            <option>All Statuses</option>
                        </select>
                        <select className="h-10 px-4 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#22c55e] cursor-pointer">
                            <option>Last 30 Days</option>
                        </select>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Showing {backups.length} entries</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/20">
                                <th className="px-8 py-4">Timestamp</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Filename</th>
                                <th className="px-6 py-4">Size</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-8 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {backups.map((bak, i) => (
                                <tr key={i} className="hover:bg-slate-50/30 transition-colors group">
                                    <td className="px-8 py-5 text-sm font-bold text-slate-900">{bak.timestamp}</td>
                                    <td className="px-6 py-5">
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${bak.type === 'Automatic' ? 'bg-slate-100 text-slate-500' : 'bg-[#22c55e]/10 text-[#22c55e]'}`}>
                                            {bak.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-xs font-bold text-[#22c55e] underline decoration-[#22c55e]/30 underline-offset-4 cursor-pointer hover:text-[#16a34a]">
                                        {bak.filename}
                                    </td>
                                    <td className="px-6 py-5 text-xs font-bold text-slate-400">{bak.size || '24.5 MB'}</td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <span className={`material-symbols-outlined text-base ${bak.status === 'Success' || bak.status === 'completed' ? 'text-[#22c55e]' : 'text-red-500'}`}>
                                                {bak.status === 'Success' || bak.status === 'completed' ? 'check_circle' : 'cancel'}
                                            </span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${bak.status === 'Success' || bak.status === 'completed' ? 'text-[#22c55e]' : 'text-red-500'}`}>
                                                {bak.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="size-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-[#22c55e] transition-all">
                                                <span className="material-symbols-outlined text-xl">download</span>
                                            </button>
                                            <button
                                                onClick={() => (bak.status === 'Success' || bak.status === 'completed') && handleRestoreBackup(bak.filename)}
                                                disabled={bak.status !== 'Success' && bak.status !== 'completed'}
                                                className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-lg transition-all ${bak.status === 'Success' || bak.status === 'completed' ? 'bg-slate-900 text-white hover:bg-black cursor-pointer' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                                            >
                                                Restore
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-8 border-t border-slate-100 flex items-center justify-between bg-white">
                    <button className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-[#22c55e]/50 hover:text-slate-900 transition-all">
                        Previous
                    </button>
                    <div className="flex gap-3">
                        {[1, 2, 3, '...', 12].map((p, i) => (
                            <button key={i} className={`size-10 rounded-xl flex items-center justify-center text-[10px] font-bold transition-all ${p === 1 ? 'bg-[#22c55e] text-white shadow-lg shadow-green-500/20' : 'text-slate-400 hover:bg-slate-50'}`}>
                                {p}
                            </button>
                        ))}
                    </div>
                    <button className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-[#22c55e]/50 hover:text-slate-900 transition-all">
                        Next
                    </button>
                </div>
            </div>

            {/* Security Tip */}
            <div className="bg-[#22c55e]/5 border border-[#22c55e]/20 rounded-2xl p-6 flex items-start gap-4">
                <div className="size-12 rounded-xl bg-[#22c55e]/10 flex items-center justify-center text-[#22c55e] shrink-0">
                    <span className="material-symbols-outlined text-2xl">verified_user</span>
                </div>
                <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Data Compliance Notice</h4>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1">
                        To maintain Medical Data Compliance, all backups are encrypted and stored in a secure offline environment. Always verify the integrity of the backup after manual creation.
                    </p>
                </div>
            </div>
        </div>
    );
};
