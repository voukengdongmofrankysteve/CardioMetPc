import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { DatabaseService } from '../../../services/database';

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUserAdded: () => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onUserAdded }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        role: 'secretary',
        email: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.username || !formData.password || !formData.fullName) {
            setError('Please fill in all required fields');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setIsSubmitting(true);
        try {
            // In a real app, you'd hash the password on the backend
            // For now, we'll use a simple hash (NOT secure for production)
            const passwordHash = btoa(formData.password); // Base64 encoding (NOT secure!)

            console.log('Creating user with data:', {
                username: formData.username,
                full_name: formData.fullName,
                role: formData.role,
                email: formData.email || undefined
            });

            await DatabaseService.createUser({
                username: formData.username,
                password_hash: passwordHash,
                full_name: formData.fullName,
                role: formData.role,
                email: formData.email || undefined
            });

            // Reset form
            setFormData({
                username: '',
                password: '',
                confirmPassword: '',
                fullName: '',
                role: 'secretary',
                email: ''
            });

            onUserAdded();
            onClose();
        } catch (error: any) {
            console.error('Failed to create user:', error);
            console.error('Error details:', {
                message: error?.message,
                code: error?.code,
                stack: error?.stack
            });
            setError(`Failed to create user: ${error?.message || 'Unknown error'}. Please check the console for details.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#152a26] rounded-2xl border border-[#e7f3f1] dark:border-[#1e3a36] shadow-2xl w-full max-w-2xl mx-4 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-[#e7f3f1] dark:border-[#1e3a36] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-xl">person_add</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#0d1b19] dark:text-white uppercase tracking-tight">Add New User</h2>
                            <p className="text-xs text-[#4c9a8d] mt-0.5">Create a new user account</p>
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
                                placeholder="johndoe"
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
                                placeholder="John Doe"
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
                                placeholder="john@example.com"
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

                        {/* Password */}
                        <div>
                            <label className="block text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest mb-2">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                required
                                className="w-full bg-[#f6f8f8] dark:bg-white/5 border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl py-3 px-4 text-sm font-medium focus:border-primary outline-none transition-all"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="••••••••"
                                minLength={8}
                            />
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-[10px] font-black text-[#4c9a8d] uppercase tracking-widest mb-2">
                                Confirm Password <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                required
                                className="w-full bg-[#f6f8f8] dark:bg-white/5 border border-[#e7f3f1] dark:border-[#1e3a36] rounded-xl py-3 px-4 text-sm font-medium focus:border-primary outline-none transition-all"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                placeholder="••••••••"
                                minLength={8}
                            />
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
                            icon={isSubmitting ? undefined : "person_add"}
                            className="bg-primary hover:brightness-105 text-[#0d1b19] px-6 h-11 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-[#0d1b19] border-t-transparent rounded-full animate-spin"></div>
                                    Creating...
                                </div>
                            ) : (
                                'Create User'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
