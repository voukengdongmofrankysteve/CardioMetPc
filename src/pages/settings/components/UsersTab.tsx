import React, { useState, useEffect } from 'react';
import { userService } from '../../../services/api';
import { Button } from '../../../components/ui/Button';
import { AddUserModal } from './AddUserModal';
import { EditUserModal } from './EditUserModal';
import { DeleteUserModal } from './DeleteUserModal';

interface User {
    id: number;
    username: string;
    full_name: string;
    role: string;
    email?: string;
    created_at?: string;
}

export const UsersTab: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const response = await userService.getUsers();
            if (response.success) {
                setUsers(response.data);
            }
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Search and Actions */}
            <div className="flex justify-between items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                    <input
                        type="text"
                        placeholder="Search users by name, username, or role..."
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:border-[#22c55e] outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button
                    icon="person_add"
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-[#22c55e] hover:bg-[#16a34a] text-white px-6 h-12 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-500/20"
                >
                    Add User
                </Button>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50/50 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100">
                        <tr>
                            <th className="px-8 py-4 text-left">User</th>
                            <th className="px-6 py-4 text-left">Username</th>
                            <th className="px-6 py-4 text-left">Role</th>
                            <th className="px-6 py-4 text-left">Email</th>
                            <th className="px-8 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50/30 transition-colors group">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="size-10 rounded-xl bg-[#22c55e]/10 flex items-center justify-center text-[#22c55e] font-bold text-sm">
                                            {user.full_name.charAt(0)}
                                        </div>
                                        <span className="font-bold text-sm text-slate-900">{user.full_name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-sm text-slate-500 font-medium italic">@{user.username}</td>
                                <td className="px-6 py-5">
                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${user.role === 'Doctor'
                                        ? 'bg-blue-50 text-blue-600'
                                        : user.role === 'Secretary'
                                            ? 'bg-purple-50 text-purple-600'
                                            : 'bg-slate-50 text-slate-600'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-sm text-slate-500 font-medium">{user.email || '—'}</td>
                                <td className="px-8 py-5 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setEditingUser(user)}
                                            className="size-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-[#22c55e] transition-all"
                                        >
                                            <span className="material-symbols-outlined text-xl">edit</span>
                                        </button>
                                        <button
                                            onClick={() => setDeletingUser(user)}
                                            className="size-9 rounded-xl hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all"
                                        >
                                            <span className="material-symbols-outlined text-xl">delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && (
                    <div className="py-20 text-center">
                        <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">person_off</span>
                        <p className="text-slate-400 text-sm font-medium">No users found matching your search.</p>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8">
                {[
                    { label: 'Total Users', value: users.length, icon: 'group', color: 'bg-slate-50 text-slate-400' },
                    { label: 'Doctors', value: users.filter(u => u.role === 'Doctor').length, icon: 'medical_services', color: 'bg-blue-50 text-blue-500' },
                    { label: 'Staff', value: users.filter(u => u.role === 'Secretary').length, icon: 'badge', color: 'bg-[#22c55e]/10 text-[#22c55e]' }
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

            {/* Add User Modal */}
            <AddUserModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onUserAdded={loadUsers}
            />

            {/* Edit User Modal */}
            <EditUserModal
                isOpen={editingUser !== null}
                onClose={() => setEditingUser(null)}
                onUserUpdated={loadUsers}
                user={editingUser}
            />

            {/* Delete User Modal */}
            <DeleteUserModal
                isOpen={deletingUser !== null}
                onClose={() => setDeletingUser(null)}
                onUserDeleted={loadUsers}
                user={deletingUser}
            />
        </div>
    );
};
