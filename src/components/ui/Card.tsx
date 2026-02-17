import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    subtitle?: string;
    headerIcon?: string;
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    title,
    subtitle,
    headerIcon
}) => {
    return (
        <div className={`
      w-full bg-[var(--color-bg-surface)] dark:bg-[var(--color-dark-bg-surface)] rounded-xl shadow-xl 
      border border-[var(--color-border)] dark:border-[var(--color-dark-border)] overflow-hidden
      ${className}
    `}>
            {(title || headerIcon) && (
                <div className="pt-10 pb-6 px-8 text-center border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                    {headerIcon && (
                        <div className="flex justify-center mb-4">
                            <div className="p-3 bg-[var(--color-primary-light)] dark:bg-[var(--color-primary)]/20 rounded-full">
                                <span className="material-symbols-outlined text-[var(--color-primary)] text-4xl">
                                    {headerIcon}
                                </span>
                            </div>
                        </div>
                    )}
                    {title && (
                        <h1 className="text-[var(--color-text-main)] dark:text-[var(--color-dark-text-main)] tracking-tight text-2xl font-bold leading-tight pb-2">
                            {title}
                        </h1>
                    )}
                    {subtitle && (
                        <p className="text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)] text-sm font-medium">
                            {subtitle}
                        </p>
                    )}
                </div>
            )}
            <div className="p-8">
                {children}
            </div>
        </div>
    );
};
