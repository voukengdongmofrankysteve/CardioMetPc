import React, { useState, useEffect } from 'react';
import { DatabaseService } from '../../../services/database';
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
        try {
            const data = await DatabaseService.getUsersDetailed();
            setUsers(data);
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
        <div className="space-y-6">
            {/* Search and Actions */}
            <div className="flex justify-between items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#4c9a8d] text-lg">search</span>
                    <input
                        type="text"
                        placeholder="Search users by name, username, or role..."
                        className="w-full bg-white dark:bg-[#152a26] border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:border-primary outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button
                    icon="person_add"
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-primary hover:brightness-105 text-[#0d1b19] px-6 h-12 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                >
                    Add User
                </Button>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-[#152a26] rounded-xl border border-[#e7f3f1] dark:border-[#1e3a36] overflow-hidden">
                <table className="w-full">
                    <thead className="bg-[#f6f8f8] dark:bg-white/5 text-[11px] uppercase tracking-wider text-[#4c9a8d] font-bold">
                        <tr>
                            <th className="px-6 py-4 text-left">User</th>
                            <th className="px-6 py-4 text-left">Username</th>
                            <th className="px-6 py-4 text-left">Role</th>
                            <th className="px-6 py-4 text-left">Email</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e7f3f1] dark:divide-[#1e3a36]">
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-[#f6f8f8] dark:hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                            {user.full_name.charAt(0)}
                                        </div>
                                        <span className="font-bold text-sm text-[#0d1b19] dark:text-white">{user.full_name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-[#4c9a8d] font-medium">{user.username}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${user.role === 'Doctor'
                                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                        : user.role === 'Secretary'
                                            ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                                            : 'bg-gray-50 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-[#4c9a8d] font-medium">{user.email || '—'}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => setEditingUser(user)}
                                            className="size-8 rounded-lg hover:bg-[#f6f8f8] dark:hover:bg-white/5 flex items-center justify-center text-[#4c9a8d] hover:text-primary transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-lg">edit</span>
                                        </button>
                                        <button
                                            onClick={() => setDeletingUser(user)}
                                            className="size-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center text-[#4c9a8d] hover:text-red-500 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && (
                    <div className="py-12 text-center text-[#4c9a8d] text-sm">
                        No users found matching your search.
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
                <div className="bg-white dark:bg-[#152a26] rounded-xl border border-[#e7f3f1] dark:border-[#1e3a36] p-6">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <span className="material-symbols-outlined text-2xl">group</span>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-[#0d1b19] dark:text-white">{users.length}</p>
                            <p className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest">Total Users</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#152a26] rounded-xl border border-[#e7f3f1] dark:border-[#1e3a36] p-6">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                            <span className="material-symbols-outlined text-2xl">medical_services</span>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-[#0d1b19] dark:text-white">{users.filter(u => u.role === 'Doctor').length}</p>
                            <p className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest">Doctors</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#152a26] rounded-xl border border-[#e7f3f1] dark:border-[#1e3a36] p-6">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                            <span className="material-symbols-outlined text-2xl">badge</span>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-[#0d1b19] dark:text-white">{users.filter(u => u.role === 'Secretary').length}</p>
                            <p className="text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest">Staff</p>
                        </div>
                    </div>
                </div>
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
