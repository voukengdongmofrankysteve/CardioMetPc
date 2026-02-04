import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { DatabaseService } from '../../../services/database';

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
        try {
            const dbSettings = await DatabaseService.getSystemSettings();
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
            await DatabaseService.updateSystemSettings(settingsToSave);
            alert('Settings saved successfully!');
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
        <div className="space-y-8">
            {/* Clinic Information */}
            <div className="bg-white dark:bg-[#152a26] rounded-xl border border-[#e7f3f1] dark:border-[#1e3a36] overflow-hidden">
                <div className="p-6 border-b border-[#e7f3f1] dark:border-[#1e3a36]">
                    <h3 className="text-lg font-black text-[#0d1b19] dark:text-white uppercase tracking-tight">Clinic Information</h3>
                    <p className="text-xs text-[#4c9a8d] mt-1">Basic information about your medical facility</p>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest mb-2">Clinic Name</label>
                            <input
                                type="text"
                                className="w-full bg-[#f6f8f8] dark:bg-white/5 border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl py-3 px-4 text-sm font-medium focus:border-primary outline-none transition-all"
                                value={settings.clinicName}
                                onChange={(e) => setSettings({ ...settings, clinicName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest mb-2">Email Address</label>
                            <input
                                type="email"
                                className="w-full bg-[#f6f8f8] dark:bg-white/5 border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl py-3 px-4 text-sm font-medium focus:border-primary outline-none transition-all"
                                value={settings.clinicEmail}
                                onChange={(e) => setSettings({ ...settings, clinicEmail: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest mb-2">Address</label>
                        <input
                            type="text"
                            className="w-full bg-[#f6f8f8] dark:bg-white/5 border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl py-3 px-4 text-sm font-medium focus:border-primary outline-none transition-all"
                            value={settings.clinicAddress}
                            onChange={(e) => setSettings({ ...settings, clinicAddress: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest mb-2">Phone Number</label>
                        <input
                            type="tel"
                            className="w-full bg-[#f6f8f8] dark:bg-white/5 border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl py-3 px-4 text-sm font-medium focus:border-primary outline-none transition-all"
                            value={settings.clinicPhone}
                            onChange={(e) => setSettings({ ...settings, clinicPhone: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* Regional Settings */}
            <div className="bg-white dark:bg-[#152a26] rounded-xl border border-[#e7f3f1] dark:border-[#1e3a36] overflow-hidden">
                <div className="p-6 border-b border-[#e7f3f1] dark:border-[#1e3a36]">
                    <h3 className="text-lg font-black text-[#0d1b19] dark:text-white uppercase tracking-tight">Regional Settings</h3>
                    <p className="text-xs text-[#4c9a8d] mt-1">Configure timezone, language, and formats</p>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest mb-2">Timezone</label>
                            <select
                                className="w-full bg-[#f6f8f8] dark:bg-white/5 border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl py-3 px-4 text-sm font-medium focus:border-primary outline-none transition-all appearance-none cursor-pointer"
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
                            <label className="block text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest mb-2">Language</label>
                            <select
                                className="w-full bg-[#f6f8f8] dark:bg-white/5 border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl py-3 px-4 text-sm font-medium focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                                value={settings.language}
                                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                            >
                                <option value="fr">Français</option>
                                <option value="en">English</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest mb-2">Date Format</label>
                            <select
                                className="w-full bg-[#f6f8f8] dark:bg-white/5 border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl py-3 px-4 text-sm font-medium focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                                value={settings.dateFormat}
                                onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                            >
                                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest mb-2">Currency</label>
                            <select
                                className="w-full bg-[#f6f8f8] dark:bg-white/5 border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl py-3 px-4 text-sm font-medium focus:border-primary outline-none transition-all appearance-none cursor-pointer"
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
            <div className="bg-white dark:bg-[#152a26] rounded-xl border border-[#e7f3f1] dark:border-[#1e3a36] overflow-hidden">
                <div className="p-6 border-b border-[#e7f3f1] dark:border-[#1e3a36]">
                    <h3 className="text-lg font-black text-[#0d1b19] dark:text-white uppercase tracking-tight">System Preferences</h3>
                    <p className="text-xs text-[#4c9a8d] mt-1">Application behavior and display options</p>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[#f6f8f8] dark:bg-white/5 rounded-xl">
                        <div>
                            <p className="text-sm font-bold text-[#0d1b19] dark:text-white">Enable Notifications</p>
                            <p className="text-xs text-[#4c9a8d] mt-0.5">Receive system alerts and reminders</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#f6f8f8] dark:bg-white/5 rounded-xl">
                        <div>
                            <p className="text-sm font-bold text-[#0d1b19] dark:text-white">Auto-save Drafts</p>
                            <p className="text-xs text-[#4c9a8d] mt-0.5">Automatically save consultation drafts</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#f6f8f8] dark:bg-white/5 rounded-xl">
                        <div>
                            <p className="text-sm font-bold text-[#0d1b19] dark:text-white">Dark Mode</p>
                            <p className="text-xs text-[#4c9a8d] mt-0.5">Use dark theme for the interface</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button
                    icon={isSaving ? "sync" : "save"}
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`bg-primary text-[#0d1b19] px-8 h-12 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 ${isSaving ? 'animate-pulse' : 'hover:brightness-105'}`}
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </div>
    );
};
