import React, { useEffect, useRef } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md'
}) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-xl',
        lg: 'max-w-3xl',
        xl: 'max-w-5xl'
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-white">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-[#0d1b19]/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div
                ref={modalRef}
                className={`w-full ${sizeClasses[size]} bg-white rounded-3xl shadow-2xl border border-border overflow-hidden flex flex-col relative animate-in zoom-in-95 fade-in duration-300`}
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-white">
                    <h3 className="text-xl font-black text-text-main uppercase tracking-tight">{title}</h3>
                    <button
                        onClick={onClose}
                        className="size-10 rounded-xl bg-bg-sidebar flex items-center justify-center text-text-muted hover:text-primary transition-all"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 overflow-y-auto max-h-[70vh] no-scrollbar">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-8 py-6 border-t border-border bg-bg-sidebar flex justify-end gap-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
