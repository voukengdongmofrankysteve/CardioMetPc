import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { DatabaseService } from '../../../services/database';

interface AuditLog {
    id: number;
    timestamp: string;
    user: string;
    action: string;
    details: string;
    severity: 'info' | 'warning' | 'critical';
}

export const SecurityTab: React.FC = () => {
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [passwordSettings, setPasswordSettings] = useState({
        minLength: 8,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        expiryDays: 90
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Load password policy
            const policy = await DatabaseService.getPasswordPolicy();
            setPasswordSettings({
                minLength: policy.min_length,
                requireUppercase: Boolean(policy.require_uppercase),
                requireNumbers: Boolean(policy.require_numbers),
                requireSpecialChars: Boolean(policy.require_special_chars),
                expiryDays: policy.expiry_days
            });

            // Load audit logs
            const logs = await DatabaseService.getAuditLogs(20);
            setAuditLogs(logs.map(log => ({
                id: log.id,
                timestamp: log.timestamp,
                user: log.user_name || 'System',
                action: log.action,
                details: log.details,
                severity: log.severity as 'info' | 'warning' | 'critical'
            })));
        } catch (error) {
            console.error('Failed to load security data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSavePolicy = async () => {
        try {
            await DatabaseService.updatePasswordPolicy({
                min_length: passwordSettings.minLength,
                require_uppercase: passwordSettings.requireUppercase,
                require_numbers: passwordSettings.requireNumbers,
                require_special_chars: passwordSettings.requireSpecialChars,
                expiry_days: passwordSettings.expiryDays
            });
            alert('Password policy saved successfully!');
        } catch (error) {
            console.error('Failed to save password policy:', error);
            alert('Failed to save password policy. Please try again.');
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
        <div className="space-y-8">
            {/* Security Overview */}
            <div className="grid grid-cols-3 gap-6">
                <div className="bg-white dark:bg-[#152a26] rounded-xl border border-[#e7f3f1] dark:border-[#1e3a36] p-6">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                            <span className="material-symbols-outlined text-2xl">shield_check</span>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-[#0d1b19] dark:text-white">Secure</p>
                            <p className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest">System Status</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#152a26] rounded-xl border border-[#e7f3f1] dark:border-[#1e3a36] p-6">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <span className="material-symbols-outlined text-2xl">lock</span>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-[#0d1b19] dark:text-white">256-bit</p>
                            <p className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest">Encryption</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#152a26] rounded-xl border border-[#e7f3f1] dark:border-[#1e3a36] p-6">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                            <span className="material-symbols-outlined text-2xl">history</span>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-[#0d1b19] dark:text-white">{auditLogs.length}</p>
                            <p className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest">Recent Events</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Password Policy */}
            <div className="bg-white dark:bg-[#152a26] rounded-xl border border-[#e7f3f1] dark:border-[#1e3a36] overflow-hidden">
                <div className="p-6 border-b border-[#e7f3f1] dark:border-[#1e3a36]">
                    <h3 className="text-lg font-black text-[#0d1b19] dark:text-white uppercase tracking-tight">Password Policy</h3>
                    <p className="text-xs text-[#4c9a8d] mt-1">Configure password requirements for all users</p>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest mb-2">Minimum Password Length</label>
                        <input
                            type="number"
                            min="6"
                            max="32"
                            className="w-full bg-[#f6f8f8] dark:bg-white/5 border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl py-3 px-4 text-sm font-medium focus:border-primary outline-none transition-all"
                            value={passwordSettings.minLength}
                            onChange={(e) => setPasswordSettings({ ...passwordSettings, minLength: parseInt(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-[#f6f8f8] dark:bg-white/5 rounded-xl">
                            <p className="text-sm font-bold text-[#0d1b19] dark:text-white">Require Uppercase Letters</p>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={passwordSettings.requireUppercase}
                                    onChange={(e) => setPasswordSettings({ ...passwordSettings, requireUppercase: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-[#f6f8f8] dark:bg-white/5 rounded-xl">
                            <p className="text-sm font-bold text-[#0d1b19] dark:text-white">Require Numbers</p>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={passwordSettings.requireNumbers}
                                    onChange={(e) => setPasswordSettings({ ...passwordSettings, requireNumbers: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-[#f6f8f8] dark:bg-white/5 rounded-xl">
                            <p className="text-sm font-bold text-[#0d1b19] dark:text-white">Require Special Characters</p>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={passwordSettings.requireSpecialChars}
                                    onChange={(e) => setPasswordSettings({ ...passwordSettings, requireSpecialChars: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest mb-2">Password Expiry (Days)</label>
                        <input
                            type="number"
                            min="0"
                            max="365"
                            className="w-full bg-[#f6f8f8] dark:bg-white/5 border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl py-3 px-4 text-sm font-medium focus:border-primary outline-none transition-all"
                            value={passwordSettings.expiryDays}
                            onChange={(e) => setPasswordSettings({ ...passwordSettings, expiryDays: parseInt(e.target.value) })}
                        />
                        <p className="text-xs text-[#4c9a8d] mt-2">Set to 0 for no expiry</p>
                    </div>
                </div>
            </div>

            {/* Audit Log */}
            <div className="bg-white dark:bg-[#152a26] rounded-xl border border-[#e7f3f1] dark:border-[#1e3a36] overflow-hidden">
                <div className="p-6 border-b border-[#e7f3f1] dark:border-[#1e3a36] flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-black text-[#0d1b19] dark:text-white uppercase tracking-tight">Security Audit Log</h3>
                        <p className="text-xs text-[#4c9a8d] mt-1">Recent security events and user activities</p>
                    </div>
                    <Button
                        icon="download"
                        className="bg-[#f6f8f8] dark:bg-white/5 text-[#4c9a8d] border border-[#e7f3f1] dark:border-[#1e3a36] hover:border-primary px-4 h-10 text-[10px] font-black uppercase tracking-widest"
                    >
                        Export Log
                    </Button>
                </div>
                <div className="divide-y divide-[#e7f3f1] dark:divide-[#1e3a36]">
                    {auditLogs.map((log) => (
                        <div key={log.id} className="p-6 hover:bg-[#f6f8f8] dark:hover:bg-white/5 transition-colors">
                            <div className="flex items-start gap-4">
                                <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${log.severity === 'critical'
                                    ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                    : log.severity === 'warning'
                                        ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                                        : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                    }`}>
                                    <span className="material-symbols-outlined text-lg">
                                        {log.severity === 'critical' ? 'error' : log.severity === 'warning' ? 'warning' : 'info'}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-bold text-[#0d1b19] dark:text-white">{log.action}</p>
                                            <p className="text-xs text-[#4c9a8d] mt-1">{log.details}</p>
                                        </div>
                                        <span className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest shrink-0">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#4c9a8d] mt-2">By: {log.user}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button
                    icon="save"
                    onClick={handleSavePolicy}
                    className="bg-primary hover:brightness-105 text-[#0d1b19] px-8 h-12 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                >
                    Save Security Settings
                </Button>
            </div>
        </div>
    );
};
