import React, { useState, useEffect } from 'react';
import { DatabaseService } from '../../../services/database';

interface Permission {
    id: string;
    label: string;
    desc: string;
    doctor: boolean | 'locked';
    secretary: boolean | 'locked';
}

interface PermissionGroup {
    title: string;
    permissions: Permission[];
}

const initialPermissionsGroups: PermissionGroup[] = [
    {
        title: 'PATIENT RECORDS & CARE',
        permissions: [
            { id: 'view_medical', label: 'View Medical Data', desc: 'Access to patient history, lab results, and diagnostic imaging.', doctor: true, secretary: false },
            { id: 'edit_patient', label: 'Edit Patient Records', desc: 'Ability to modify personal information and medical history.', doctor: true, secretary: true },
            { id: 'manage_prescriptions', label: 'Manage Prescriptions', desc: 'Issue new prescriptions and renewal authorizations.', doctor: true, secretary: 'locked' },
        ]
    },
    {
        title: 'ADMINISTRATIVE OPERATIONS',
        permissions: [
            { id: 'create_consultations', label: 'Create Consultations', desc: 'Schedule and initialize new patient consultation sessions.', doctor: true, secretary: true },
            { id: 'manage_billing', label: 'Manage Billing', desc: 'Generate invoices and track payments for services.', doctor: false, secretary: true },
            { id: 'staff_management', label: 'Staff Management', desc: 'Invite new team members and edit their basic profile info.', doctor: false, secretary: false },
        ]
    },
    {
        title: 'CHARTS & REPORTING',
        permissions: [
            { id: 'view_analytics', label: 'View Analytics', desc: 'Access to clinical and financial performance dashboards.', doctor: true, secretary: false },
        ]
    }
];

export const RolesPermissionsTab: React.FC = () => {
    const [permissionsGroups, setPermissionsGroups] = useState<PermissionGroup[]>(initialPermissionsGroups);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        loadPermissions();
    }, []);

    const loadPermissions = async () => {
        try {
            const dbPermissions = await DatabaseService.getRolesPermissions();

            // Update permissions based on database data
            const updatedGroups = initialPermissionsGroups.map(group => ({
                ...group,
                permissions: group.permissions.map(perm => {
                    const doctorPerm = dbPermissions.find(p => p.role === 'doctor' && p.permission === perm.id);
                    const secretaryPerm = dbPermissions.find(p => p.role === 'secretary' && p.permission === perm.id);

                    return {
                        ...perm,
                        doctor: perm.doctor === 'locked' ? ('locked' as const) : (doctorPerm?.allowed ? true : false),
                        secretary: perm.secretary === 'locked' ? ('locked' as const) : (secretaryPerm?.allowed ? true : false)
                    };
                })
            }));

            setPermissionsGroups(updatedGroups);
        } catch (error) {
            console.error('Failed to load permissions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const togglePermission = (groupIdx: number, permIdx: number, role: 'doctor' | 'secretary') => {
        const newGroups = [...permissionsGroups];
        const currentValue = newGroups[groupIdx].permissions[permIdx][role];

        if (currentValue !== 'locked') {
            newGroups[groupIdx].permissions[permIdx][role] = !currentValue;
            setPermissionsGroups(newGroups);
            setHasChanges(true);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Save all permissions to database
            for (const group of permissionsGroups) {
                for (const perm of group.permissions) {
                    if (perm.doctor !== 'locked') {
                        await DatabaseService.updateRolePermission('doctor', perm.id, perm.doctor as boolean);
                    }
                    if (perm.secretary !== 'locked') {
                        await DatabaseService.updateRolePermission('secretary', perm.id, perm.secretary as boolean);
                    }
                }
            }

            setHasChanges(false);
            alert('Permissions saved successfully!');
        } catch (error) {
            console.error('Failed to save permissions:', error);
            alert('Failed to save permissions. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDiscard = () => {
        loadPermissions();
        setHasChanges(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-[#152a26] rounded-2xl border border-[#e7f3f1] dark:border-[#1e3a36] overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-[#e7f3f1] dark:border-[#1e3a36]">
                            <th className="px-8 py-6 text-sm font-black text-[#0d1b19] dark:text-white uppercase tracking-wider">Access Permissions</th>
                            <th className="px-6 py-6 w-32 text-center">
                                <div className="flex flex-col items-center gap-1">
                                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined text-lg">medical_services</span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#0d1b19] dark:text-white">Doctor</span>
                                </div>
                            </th>
                            <th className="px-6 py-6 w-32 text-center">
                                <div className="flex flex-col items-center gap-1">
                                    <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                        <span className="material-symbols-outlined text-lg">support_agent</span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#0d1b19] dark:text-white">Secretary</span>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {permissionsGroups.map((group, groupIdx) => (
                            <React.Fragment key={groupIdx}>
                                <tr className="bg-[#f6f8f8] dark:bg-white/5">
                                    <td colSpan={3} className="px-8 py-3 text-[10px] font-black text-[#4c9a8d] uppercase tracking-[0.2em]">
                                        {group.title}
                                    </td>
                                </tr>
                                {group.permissions.map((perm, permIdx) => (
                                    <tr key={perm.id} className="border-b border-[#e7f3f1] dark:border-[#1e3a36] hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-bold text-[#0d1b19] dark:text-white">{perm.label}</p>
                                            <p className="text-xs text-[#4c9a8d] mt-0.5">{perm.desc}</p>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            {perm.doctor === 'locked' ? (
                                                <span className="material-symbols-outlined text-gray-300 dark:text-gray-600">lock</span>
                                            ) : (
                                                <button
                                                    onClick={() => togglePermission(groupIdx, permIdx, 'doctor')}
                                                    className={`inline-flex items-center justify-center size-6 rounded-lg border-2 transition-all cursor-pointer hover:scale-110 ${perm.doctor ? 'bg-primary border-primary text-[#0d1b19]' : 'border-[#e7f3f1] dark:border-[#1e3a36] hover:border-primary/50'}`}
                                                >
                                                    {perm.doctor && <span className="material-symbols-outlined text-base font-black">check</span>}
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            {perm.secretary === 'locked' ? (
                                                <span className="material-symbols-outlined text-gray-300 dark:text-gray-600">lock</span>
                                            ) : (
                                                <button
                                                    onClick={() => togglePermission(groupIdx, permIdx, 'secretary')}
                                                    className={`inline-flex items-center justify-center size-6 rounded-lg border-2 transition-all cursor-pointer hover:scale-110 ${perm.secretary ? 'bg-primary border-primary text-[#0d1b19]' : 'border-[#e7f3f1] dark:border-[#1e3a36] hover:border-primary/50'}`}
                                                >
                                                    {perm.secretary && <span className="material-symbols-outlined text-base font-black">check</span>}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
                <div className="p-8 bg-gray-50/30 dark:bg-white/5 flex justify-end gap-3">
                    <button
                        onClick={handleDiscard}
                        disabled={!hasChanges}
                        className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#4c9a8d] hover:text-[#0d1b19] dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Discard Changes
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                        className="px-8 py-2.5 bg-primary text-[#0d1b19] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-[#0d1b19] border-t-transparent rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-lg">save</span> Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="bg-[#42f0d3]/5 border border-[#42f0d3]/20 rounded-2xl p-4 flex items-start gap-4">
                <div className="size-10 rounded-xl bg-[#42f0d3]/10 flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined">info</span>
                </div>
                <div>
                    <h4 className="text-sm font-black text-[#0d1b19] dark:text-white uppercase tracking-tight">Security Tip</h4>
                    <p className="text-xs text-[#4c9a8d] font-medium leading-relaxed mt-1">
                        Changes to roles and permissions will be applied instantly to all assigned users. Make sure to notify staff before significant access removals.
                    </p>
                </div>
            </div>
        </div>
    );
};
