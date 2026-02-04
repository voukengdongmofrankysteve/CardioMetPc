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
    const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none';

    const variants = {
        primary: 'bg-[#13c8ec] text-white hover:bg-[#13c8ec]/90 shadow-lg shadow-[#13c8ec]/20 focus:ring-[#13c8ec]/40',
        secondary: 'bg-[#f0f9fa] text-[#13c8ec] hover:bg-[#e0f2f5] dark:bg-[#13c8ec]/10 dark:text-[#13c8ec]',
        outline: 'border border-[#cfe3e7] dark:border-white/10 text-[#0d191b] dark:text-white hover:bg-[#f8fbfc] dark:hover:bg-white/5',
        ghost: 'text-[#4c8d9a] hover:text-[#13c8ec] hover:bg-[#f0f9fa] dark:hover:bg-[#13c8ec]/5',
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
