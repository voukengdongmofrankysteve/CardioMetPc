import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    icon?: string;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    icon,
    className = '',
    disabled,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

    const variants = {
        primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-lg shadow-[var(--color-primary)]/20 focus:ring-[var(--color-primary)]/40',
        secondary: 'bg-[var(--color-primary-light)] text-[var(--color-primary)] hover:bg-[var(--color-primary-light)]/80 dark:bg-[var(--color-primary)]/10 dark:text-[var(--color-primary)]',
        outline: 'border border-[var(--color-border)] dark:border-[var(--color-dark-border)] text-[var(--color-text-main)] dark:text-[var(--color-dark-text-main)] hover:bg-[var(--color-bg-main)] dark:hover:bg-white/5',
        ghost: 'text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] dark:hover:bg-[var(--color-primary)]/5',
    };

    const sizes = {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading ? (
                <span className="material-symbols-outlined animate-spin text-lg">sync</span>
            ) : icon ? (
                <span className="material-symbols-outlined text-lg">{icon}</span>
            ) : null}
            <span className="truncate">{children}</span>
        </button>
    );
};
