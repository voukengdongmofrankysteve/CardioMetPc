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
        <div className="flex flex-col min-h-screen bg-[#f6f8f8] dark:bg-[#10221f] font-sans text-[#0d1b19] dark:text-white overflow-y-auto no-scrollbar pb-12">
            <main className="max-w-[1200px] mx-auto w-full p-8 px-12">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-[10px] font-black text-[#4c9a8d] uppercase tracking-[0.2em] mb-4">
                    <span>Settings</span>
                    <span className="opacity-30">/</span>
                    <span className="text-[#0d1b19] dark:text-white underline decoration-primary decoration-2 underline-offset-4">
                        {getTabTitle()}
                    </span>
                </div>

                {/* Header */}
                <div className="flex justify-between items-end mb-10">
                    <div className="max-w-2xl">
                        <h1 className="text-4xl font-black text-[#0d1b19] dark:text-white tracking-tighter mb-3">
                            {getTabTitle()}
                        </h1>
                        <p className="text-sm text-[#4c9a8d] font-medium leading-relaxed">
                            {getTabDescription()}
                        </p>
                    </div>
                    {activeTab === 'roles' ? (
                        <Button icon="add" className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-[#0d1b19] transition-all px-6 h-12 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/5">
                            Create New Role
                        </Button>
                    ) : activeTab === 'backups' ? (
                        <Button icon="cloud_upload" className="bg-primary hover:brightness-105 text-[#0d1b19] px-6 h-12 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                            Create Manual Backup
                        </Button>
                    ) : null}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[#e7f3f1] dark:border-[#1e3a36] gap-10 mb-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as SettingsTab)}
                            className={`pb-4 px-1 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all relative ${activeTab === tab.id
                                ? 'text-[#0d1b19] dark:text-white'
                                : 'text-[#4c9a8d] hover:text-[#0d1b19] dark:hover:text-white'
                                }`}
                        >
                            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(66,240,211,0.5)]"></div>
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
