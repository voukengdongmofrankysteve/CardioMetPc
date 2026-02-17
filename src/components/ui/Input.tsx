import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: string;
    error?: string;
    onIconClick?: () => void;
    iconType?: string;
}

export const Input: React.FC<InputProps> = ({
    label,
    icon,
    error,
    onIconClick,
    iconType,
    className = '',
    ...props
}) => {
    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && (
                <label className="text-[var(--color-text-main)] dark:text-[var(--color-dark-text-main)] text-sm font-semibold leading-normal">
                    {label}
                </label>
            )}
            <div className="relative group">
                <input
                    className={`
            flex w-full rounded-lg text-[var(--color-text-main)] dark:text-[var(--color-dark-text-main)]
            border border-[var(--color-border)] dark:border-[var(--color-dark-border)]
            bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)]
            h-12 px-4 text-base font-normal transition-all
            placeholder:text-[var(--color-text-muted)]
            focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]
            ${icon ? 'pr-12' : ''}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            ${className}
          `}
                    {...props}
                />
                {icon && (
                    <div
                        className={`
              absolute right-3 top-1/2 -translate-y-1/2 
              text-[var(--color-text-muted)] hover:text-[var(--color-primary)]
              transition-colors flex items-center justify-center
              ${onIconClick ? 'cursor-pointer' : ''}
            `}
                        onClick={onIconClick}
                    >
                        <span className="material-symbols-outlined text-xl">
                            {icon}
                        </span>
                    </div>
                )}
            </div>
            {error && (
                <span className="text-red-500 text-xs font-medium">{error}</span>
            )}
        </div>
    );
};
