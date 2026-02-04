import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { DatabaseService } from '../../../services/database';

interface DeleteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUserDeleted: () => void;
    user: {
        id: number;
        full_name: string;
        username: string;
    } | null;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({ isOpen, onClose, onUserDeleted, user }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        if (!user) return;

        setIsDeleting(true);
        setError('');

        try {
            await DatabaseService.deleteUser(user.id);
            onUserDeleted();
            onClose();
        } catch (error) {
            console.error('Failed to delete user:', error);
            setError('Failed to delete user. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#152a26] rounded-2xl border border-[#e7f3f1] dark:border-[#1e3a36] shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-[#e7f3f1] dark:border-[#1e3a36] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                            <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-xl">warning</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#0d1b19] dark:text-white uppercase tracking-tight">Delete User</h2>
                            <p className="text-xs text-[#4c9a8d] mt-0.5">This action cannot be undone</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center text-[#4c9a8d] transition-colors"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                            <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-xl">error</span>
                            <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    )}

                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                        <p className="text-sm font-medium text-[#0d1b19] dark:text-white mb-4">
                            Are you sure you want to delete this user?
                        </p>
                        <div className="flex items-center gap-3 p-4 bg-white dark:bg-[#152a26] rounded-lg border border-red-200 dark:border-red-800">
                            <div className="size-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 font-bold text-sm">
                                {user.full_name.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-sm text-[#0d1b19] dark:text-white">{user.full_name}</p>
                                <p className="text-xs text-[#4c9a8d]">@{user.username}</p>
                            </div>
                        </div>
                        <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-4">
                            ⚠️ This will permanently delete the user account and all associated data.
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e7f3f1] dark:border-[#1e3a36]">
                        <Button
                            type="button"
                            onClick={onClose}
                            disabled={isDeleting}
                            className="bg-white dark:bg-white/5 text-[#4c9a8d] border border-[#e7f3f1] dark:border-[#1e3a36] hover:border-primary px-6 h-11 text-[10px] font-black uppercase tracking-widest"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            icon={isDeleting ? undefined : "delete"}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 h-11 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isDeleting ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Deleting...
                                </div>
                            ) : (
                                'Delete User'
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
