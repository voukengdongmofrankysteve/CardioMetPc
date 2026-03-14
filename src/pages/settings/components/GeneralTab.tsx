import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { systemService } from '../../../services/api';

interface GeneralSettings {
    clinicName: string;
    clinicAddress: string;
    clinicPhone: string;
    clinicEmail: string;
    timezone: string;
    language: string;
    dateFormat: string;
    currency: string;
}

export const GeneralTab: React.FC = () => {
    const [settings, setSettings] = useState<GeneralSettings>({
        clinicName: 'CardioMed ',
        clinicAddress: 'Yaoundé, Cameroun',
        clinicPhone: '(+237) 6xx-xxx-xxx',
        clinicEmail: 'contact@fce-titus.org',
        timezone: 'Africa/Douala',
        language: 'fr',
        dateFormat: 'DD/MM/YYYY',
        currency: 'XAF'
    });

    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const response = await systemService.getSettings();
            if (response.success) {
                const dbSettings = response.data;
                setSettings({
                    clinicName: dbSettings.clinicName || 'CardioMed ',
                    clinicAddress: dbSettings.clinicAddress || 'Yaoundé, Cameroun',
                    clinicPhone: dbSettings.clinicPhone || '(+237) 6xx-xxx-xxx',
                    clinicEmail: dbSettings.clinicEmail || 'contact@fce-titus.org',
                    timezone: dbSettings.timezone || 'Africa/Douala',
                    language: dbSettings.language || 'fr',
                    dateFormat: dbSettings.dateFormat || 'DD/MM/YYYY',
                    currency: dbSettings.currency || 'XAF'
                });
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const settingsToSave: Record<string, string> = {
                clinicName: settings.clinicName,
                clinicAddress: settings.clinicAddress,
                clinicPhone: settings.clinicPhone,
                clinicEmail: settings.clinicEmail,
                timezone: settings.timezone,
                language: settings.language,
                dateFormat: settings.dateFormat,
                currency: settings.currency
            };
            const response = await systemService.updateSettings(settingsToSave);
            if (response.success) {
                alert('Settings saved successfully!');
            } else {
                alert(response.message || 'Failed to save settings');
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save settings. Please try again.');
        } finally {
            setIsSaving(false);
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
            {/* Clinic Information */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-50">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Clinic Information</h3>
                    <p className="text-xs text-slate-400 mt-1">Basic information about your medical facility</p>
                </div>
                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Clinic Name</label>
                            <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-medium focus:border-[#22c55e] outline-none transition-all"
                                value={settings.clinicName}
                                onChange={(e) => setSettings({ ...settings, clinicName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                            <input
                                type="email"
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-medium focus:border-[#22c55e] outline-none transition-all"
                                value={settings.clinicEmail}
                                onChange={(e) => setSettings({ ...settings, clinicEmail: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Address</label>
                        <input
                            type="text"
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-medium focus:border-[#22c55e] outline-none transition-all"
                            value={settings.clinicAddress}
                            onChange={(e) => setSettings({ ...settings, clinicAddress: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                        <input
                            type="tel"
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-medium focus:border-[#22c55e] outline-none transition-all"
                            value={settings.clinicPhone}
                            onChange={(e) => setSettings({ ...settings, clinicPhone: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* Regional Settings */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-50">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Regional Settings</h3>
                    <p className="text-xs text-slate-400 mt-1">Configure timezone, language, and formats</p>
                </div>
                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Timezone</label>
                            <select
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-medium focus:border-[#22c55e] outline-none transition-all appearance-none cursor-pointer"
                                value={settings.timezone}
                                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                            >
                                <option value="Africa/Douala">Africa/Douala (WAT)</option>
                                <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                                <option value="Europe/Paris">Europe/Paris (CET)</option>
                                <option value="UTC">UTC</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Language</label>
                            <select
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-medium focus:border-[#22c55e] outline-none transition-all appearance-none cursor-pointer"
                                value={settings.language}
                                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                            >
                                <option value="fr">Français</option>
                                <option value="en">English</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Date Format</label>
                            <select
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-medium focus:border-[#22c55e] outline-none transition-all appearance-none cursor-pointer"
                                value={settings.dateFormat}
                                onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                            >
                                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Currency</label>
                            <select
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-medium focus:border-[#22c55e] outline-none transition-all appearance-none cursor-pointer"
                                value={settings.currency}
                                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                            >
                                <option value="XAF">XAF (CFA Franc)</option>
                                <option value="EUR">EUR (Euro)</option>
                                <option value="USD">USD (US Dollar)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* System Preferences */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-50">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">System Preferences</h3>
                    <p className="text-xs text-slate-400 mt-1">Application behavior and display options</p>
                </div>
                <div className="p-8 space-y-4">
                    {[
                        { label: 'Enable Notifications', desc: 'Receive system alerts and reminders', checked: true },
                        { label: 'Auto-save Drafts', desc: 'Automatically save consultation drafts', checked: true },
                        { label: 'Dark Mode', desc: 'Use dark theme for the interface', checked: false }
                    ].map((pref, i) => (
                        <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:border-[#22c55e]/30">
                            <div>
                                <p className="text-sm font-bold text-slate-900">{pref.label}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{pref.desc}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked={pref.checked} />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#22c55e]"></div>
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
                <Button
                    icon={isSaving ? "sync" : "save"}
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`bg-[#22c55e] text-white px-8 h-12 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-500/20 ${isSaving ? 'animate-pulse' : 'hover:bg-[#16a34a]'}`}
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </div>
    );
};
