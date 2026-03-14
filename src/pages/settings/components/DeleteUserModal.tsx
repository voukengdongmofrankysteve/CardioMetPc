import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { userService } from '../../../services/api';

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
            const response = await userService.deleteUser(user.id);
            if (response.success) {
                onUserDeleted();
                onClose();
            } else {
                setError(response.message || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Failed to delete user:', error);
            setError('Failed to delete user. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-300 overflow-hidden">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-red-50/30">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                            <span className="material-symbols-outlined text-xl">warning</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Delete User</h2>
                            <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Permanent Action</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-8 rounded-lg hover:bg-white/50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-8">
                    <div className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
                                <span className="material-symbols-outlined text-red-500">error</span>
                                <p className="text-sm font-bold text-red-600">{error}</p>
                            </div>
                        )}

                        <div className="text-center space-y-4">
                            <p className="text-sm font-bold text-slate-600">
                                You are about to permanently remove this user account.
                            </p>
                            
                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 border-dashed">
                                <div className="size-16 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-900 font-black text-xl mx-auto mb-3">
                                    {(user.full_name || 'U').charAt(0)}
                                </div>
                                <h3 className="font-black text-slate-900 uppercase tracking-tight">{user.full_name || 'Unknown'}</h3>
                                <p className="text-xs text-slate-400 font-medium">@{user.username}</p>
                            </div>

                            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                                <p className="text-[11px] text-red-600 font-bold leading-relaxed">
                                    This action will revoke all system access for this user. This process cannot be undone.
                                </p>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex flex-col gap-3 pt-4">
                            <Button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="bg-red-600 hover:bg-red-700 text-white w-full h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-red-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-lg">delete_forever</span>
                                        Confirm Deletion
                                    </>
                                )}
                            </Button>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isDeleting}
                                className="w-full h-12 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
                            >
                                Nevermind, Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
