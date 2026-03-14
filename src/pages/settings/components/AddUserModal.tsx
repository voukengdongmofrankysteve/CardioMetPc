import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { userService } from '../../../services/api';

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
            const response = await userService.createUser({
                username: formData.username,
                password: formData.password,
                full_name: formData.fullName,
                role: formData.role,
                email: formData.email || undefined
            });

            if (response && response.success !== false) {
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
            } else {
                setError(response.message || 'Failed to create user');
            }
        } catch (err: any) {
            console.error('Failed to create user:', err);
            
            // Handle Laravel validation errors (422)
            const validationErrors = err.response?.data?.errors;
            if (validationErrors) {
                const firstErrorField = Object.keys(validationErrors)[0];
                const firstErrorMessage = validationErrors[firstErrorField][0];
                setError(firstErrorMessage);
            } else {
                setError(err.response?.data?.message || err.message || 'Failed to create user. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-[#22c55e]/10 flex items-center justify-center text-[#22c55e]">
                            <span className="material-symbols-outlined text-2xl">person_add</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Add New User</h2>
                            <p className="text-xs text-slate-400 mt-1 font-medium">Create a new access account for the system</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-10">
                    <div className="space-y-8">
                        {error && (
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-start gap-4 animate-in slide-in-from-top-2">
                                <span className="material-symbols-outlined text-red-500">error</span>
                                <p className="text-sm font-bold text-red-600 leading-tight">{error}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-8">
                            {/* Username */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                                    Username <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-[#22c55e] focus:ring-4 focus:ring-[#22c55e]/5 outline-none transition-all"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        placeholder="johndoe"
                                    />
                                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#22c55e] transition-colors">alternate_email</span>
                                </div>
                            </div>

                            {/* Full Name */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-[#22c55e] focus:ring-4 focus:ring-[#22c55e]/5 outline-none transition-all"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    placeholder="John Doe"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-[#22c55e] focus:ring-4 focus:ring-[#22c55e]/5 outline-none transition-all"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="john@example.com"
                                />
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                                    Account Role <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold text-slate-900 focus:bg-white focus:border-[#22c55e] outline-none transition-all appearance-none cursor-pointer"
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
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                                    Security Password <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-[#22c55e] focus:ring-4 focus:ring-[#22c55e]/5 outline-none transition-all"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                    minLength={8}
                                />
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                                    Confirm Password <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-[#22c55e] focus:ring-4 focus:ring-[#22c55e]/5 outline-none transition-all"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    placeholder="••••••••"
                                    minLength={8}
                                />
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex items-center justify-end gap-4 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-8 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
                            >
                                Cancel
                            </button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-[#22c55e] hover:bg-[#16a34a] text-white px-10 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-green-500/20 disabled:opacity-50 transition-all flex items-center gap-3"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Creating Account...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-lg">person_add</span>
                                        Create User Account
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
