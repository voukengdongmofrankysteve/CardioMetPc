import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { securityService } from '../../../services/api';

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
        setIsLoading(true);
        try {
            // Load password policy
            const policyResponse = await securityService.getPasswordPolicy();
            if (policyResponse.success) {
                const policy = policyResponse.data;
                setPasswordSettings({
                    minLength: policy.min_length,
                    requireUppercase: Boolean(policy.require_uppercase),
                    requireNumbers: Boolean(policy.require_numbers),
                    requireSpecialChars: Boolean(policy.require_special_chars),
                    expiryDays: policy.expiry_days
                });
            }

            // Load audit logs
            const logsResponse = await securityService.getAuditLogs();
            if (logsResponse.success) {
                setAuditLogs(logsResponse.data.map((log: any) => ({
                    id: log.id,
                    timestamp: log.timestamp || log.created_at,
                    user: log.user_name || log.user?.full_name || 'System',
                    action: log.action,
                    details: log.details || '',
                    severity: (log.severity || 'info') as 'info' | 'warning' | 'critical'
                })));
            }
        } catch (error) {
            console.error('Failed to load security data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSavePolicy = async () => {
        try {
            const response = await securityService.updatePasswordPolicy({
                min_length: passwordSettings.minLength,
                require_uppercase: passwordSettings.requireUppercase,
                require_numbers: passwordSettings.requireNumbers,
                require_special_chars: passwordSettings.requireSpecialChars,
                expiry_days: passwordSettings.expiryDays
            });
            if (response.success) {
                alert('Password policy saved successfully!');
            } else {
                alert(response.message || 'Failed to save password policy');
            }
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Security Overview */}
            <div className="grid grid-cols-3 gap-8">
                {[
                    { label: 'System Status', value: 'Secure', icon: 'shield_check', color: 'bg-[#22c55e]/10 text-[#22c55e]' },
                    { label: 'Encryption', value: '256-bit', icon: 'lock', color: 'bg-blue-50 text-blue-500' },
                    { label: 'Recent Events', value: auditLogs.length, icon: 'history', color: 'bg-purple-50 text-purple-500' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm transition-all hover:border-[#22c55e]/30 group">
                        <div className="flex items-center gap-6">
                            <div className={`size-14 rounded-2xl ${stat.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                                <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Password Policy */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-50">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Password Policy</h3>
                    <p className="text-xs text-slate-400 mt-1">Configure password requirements for all users</p>
                </div>
                <div className="p-8 space-y-6">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Minimum Password Length</label>
                        <input
                            type="number"
                            min="6"
                            max="32"
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-medium focus:border-[#22c55e] outline-none transition-all"
                            value={passwordSettings.minLength}
                            onChange={(e) => setPasswordSettings({ ...passwordSettings, minLength: parseInt(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-4">
                        {[
                            { label: 'Require Uppercase Letters', key: 'requireUppercase' },
                            { label: 'Require Numbers', key: 'requireNumbers' },
                            { label: 'Require Special Characters', key: 'requireSpecialChars' }
                        ].map((pref) => (
                            <div key={pref.key} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:border-[#22c55e]/30">
                                <p className="text-sm font-bold text-slate-900">{pref.label}</p>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={(passwordSettings as any)[pref.key]}
                                        onChange={(e) => setPasswordSettings({ ...passwordSettings, [pref.key]: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#22c55e]"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Password Expiry (Days)</label>
                        <input
                            type="number"
                            min="0"
                            max="365"
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-medium focus:border-[#22c55e] outline-none transition-all"
                            value={passwordSettings.expiryDays}
                            onChange={(e) => setPasswordSettings({ ...passwordSettings, expiryDays: parseInt(e.target.value) })}
                        />
                        <p className="text-xs text-slate-400 mt-2 font-medium">Set to 0 for no expiry</p>
                    </div>
                </div>
            </div>

            {/* Audit Log */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Security Audit Log</h3>
                        <p className="text-xs text-slate-400 mt-1">Recent security events and user activities</p>
                    </div>
                    <Button
                        icon="download"
                        className="bg-white border border-slate-100 text-slate-400 hover:text-[#22c55e] hover:border-[#22c55e]/30 px-6 h-12 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                    >
                        Export Log
                    </Button>
                </div>
                <div className="divide-y divide-slate-50">
                    {auditLogs.map((log) => (
                        <div key={log.id} className="p-8 hover:bg-slate-50/30 transition-all group">
                            <div className="flex items-start gap-6">
                                <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${log.severity === 'critical'
                                    ? 'bg-red-50 text-red-500'
                                    : log.severity === 'warning'
                                        ? 'bg-amber-50 text-amber-500'
                                        : 'bg-blue-50 text-blue-500'
                                    }`}>
                                    <span className="material-symbols-outlined text-xl">
                                        {log.severity === 'critical' ? 'error' : log.severity === 'warning' ? 'warning' : 'info'}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-6">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{log.action}</p>
                                            <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{log.details}</p>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                                            {new Date(log.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-4">
                                        <div className="size-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                            {log.user.charAt(0)}
                                        </div>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Action by {log.user}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-6 bg-slate-50/30 border-t border-slate-100 flex justify-center">
                    <button className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-[#22c55e] transition-colors">
                        Load More Entries
                    </button>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
                <Button
                    icon="save"
                    onClick={handleSavePolicy}
                    className="bg-[#22c55e] hover:bg-[#16a34a] text-white px-8 h-12 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-500/20"
                >
                    Save Security Settings
                </Button>
            </div>
        </div>
    );
};
