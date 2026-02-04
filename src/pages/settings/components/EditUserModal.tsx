import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { DatabaseService } from '../../../services/database';

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUserUpdated: () => void;
    user: {
        id: number;
        username: string;
        full_name: string;
        role: string;
        email?: string;
    } | null;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, onUserUpdated, user }) => {
    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        role: 'secretary',
        email: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username,
                fullName: user.full_name,
                role: user.role,
                email: user.email || ''
            });
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!user) return;

        if (!formData.username || !formData.fullName) {
            setError('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            await DatabaseService.updateUser(user.id, {
                username: formData.username,
                full_name: formData.fullName,
                role: formData.role,
                email: formData.email || undefined
            });

            onUserUpdated();
            onClose();
        } catch (error) {
            console.error('Failed to update user:', error);
            setError('Failed to update user. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#152a26] rounded-2xl border border-[#e7f3f1] dark:border-[#1e3a36] shadow-2xl w-full max-w-2xl mx-4 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-[#e7f3f1] dark:border-[#1e3a36] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl">edit</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#0d1b19] dark:text-white uppercase tracking-tight">Edit User</h2>
                            <p className="text-xs text-[#4c9a8d] mt-0.5">Update user information</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center text-[#4c9a8d] transition-colors"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                            <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-xl">error</span>
                            <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-6">
                        {/* Username */}
                        <div>
                            <label className="block text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest mb-2">
                                Username <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full bg-[#f6f8f8] dark:bg-white/5 border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl py-3 px-4 text-sm font-medium focus:border-primary outline-none transition-all"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>

                        {/* Full Name */}
                        <div>
                            <label className="block text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest mb-2">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full bg-[#f6f8f8] dark:bg-white/5 border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl py-3 px-4 text-sm font-medium focus:border-primary outline-none transition-all"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                className="w-full bg-[#f6f8f8] dark:bg-white/5 border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl py-3 px-4 text-sm font-medium focus:border-primary outline-none transition-all"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        {/* Role */}
                        <div>
                            <label className="block text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest mb-2">
                                Role <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                className="w-full bg-[#f6f8f8] dark:bg-white/5 border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl py-3 px-4 text-sm font-medium focus:border-primary outline-none transition-all"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="doctor">Doctor</option>
                                <option value="secretary">Secretary</option>
                                <option value="admin">Administrator</option>
                            </select>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e7f3f1] dark:border-[#1e3a36]">
                        <Button
                            type="button"
                            onClick={onClose}
                            className="bg-white dark:bg-white/5 text-[#4c9a8d] border border-[#e7f3f1] dark:border-[#1e3a36] hover:border-primary px-6 h-11 text-[10px] font-black uppercase tracking-widest"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            icon={isSubmitting ? undefined : "save"}
                            className="bg-primary hover:brightness-105 text-[#0d1b19] px-6 h-11 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-[#0d1b19] border-t-transparent rounded-full animate-spin"></div>
                                    Saving...
                                </div>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
