import React, { useState } from 'react';
import { RolesPermissionsTab } from './components/RolesPermissionsTab';
import { SecurityBackupsTab } from './components/SecurityBackupsTab';
import { GeneralTab } from './components/GeneralTab';
import { UsersTab } from './components/UsersTab';
import { SecurityTab } from './components/SecurityTab';
import { Button } from '../../components/ui/Button';

type SettingsTab = 'general' | 'users' | 'roles' | 'security' | 'backups';

export const SettingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');

    const tabs = [
        { id: 'general', label: 'General', icon: 'settings' },
        { id: 'users', label: 'Users', icon: 'group' },
        { id: 'roles', label: 'Roles & Permissions', icon: 'verified_user' },
        { id: 'security', label: 'Security', icon: 'shield' },
        { id: 'backups', label: 'Backups', icon: 'cloud_upload' },
    ];

    const getTabTitle = () => {
        switch (activeTab) {
            case 'roles': return 'Roles & Permissions';
            case 'backups': return 'System Security & Backups';
            default: return activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
        }
    };

    const getTabDescription = () => {
        switch (activeTab) {
            case 'general': return 'Configure your clinic information and system preferences.';
            case 'users': return 'Manage user accounts, roles, and access permissions.';
            case 'roles': return 'Configure and manage access levels for different staff roles within the cardiology management system. Ensure data security and operational efficiency.';
            case 'security': return 'Configure password policies and monitor security audit logs.';
            case 'backups': return 'Manage database integrity, schedule backups, and monitor real-time security audit trails.';
            default: return `Configure your system ${activeTab} settings and preferences.`;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-white font-sans text-slate-900 overflow-y-auto no-scrollbar pb-12">
            <main className="max-w-[1200px] mx-auto w-full p-8 px-12">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
                    <span>Settings</span>
                    <span className="opacity-30">/</span>
                    <span className="text-slate-900 underline decoration-[#22c55e] decoration-2 underline-offset-4">
                        {getTabTitle()}
                    </span>
                </div>

                {/* Header */}
                <div className="flex justify-between items-end mb-10">
                    <div className="max-w-2xl">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-3">
                            {getTabTitle()}
                        </h1>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                            {getTabDescription()}
                        </p>
                    </div>
                    {activeTab === 'roles' ? (
                        <Button icon="add" className="bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 hover:bg-[#22c55e] hover:text-white transition-all px-6 h-12 text-[10px] font-black uppercase tracking-widest">
                            Create New Role
                        </Button>
                    ) : activeTab === 'backups' ? (
                        <Button icon="cloud_upload" className="bg-[#22c55e] hover:bg-[#16a34a] text-white px-6 h-12 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-500/20">
                            Create Manual Backup
                        </Button>
                    ) : null}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 gap-10 mb-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as SettingsTab)}
                            className={`pb-4 px-1 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all relative ${activeTab === tab.id
                                ? 'text-slate-900'
                                : 'text-slate-400 hover:text-slate-900'
                                }`}
                        >
                            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#22c55e] rounded-t-full"></div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="mt-8">
                    {activeTab === 'general' && <GeneralTab />}
                    {activeTab === 'users' && <UsersTab />}
                    {activeTab === 'roles' && <RolesPermissionsTab />}
                    {activeTab === 'security' && <SecurityTab />}
                    {activeTab === 'backups' && <SecurityBackupsTab />}
                </div>
            </main>
        </div>
    );
};
