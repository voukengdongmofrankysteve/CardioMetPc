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
      w-full bg-white dark:bg-[#1a2e32] rounded-xl shadow-xl 
      border border-[#cfe3e7] dark:border-white/5 overflow-hidden
      ${className}
    `}>
            {(title || headerIcon) && (
                <div className="pt-10 pb-6 px-8 text-center border-b border-[#f0f4f5] dark:border-white/5">
                    {headerIcon && (
                        <div className="flex justify-center mb-4">
                            <div className="p-3 bg-[#13c8ec]/10 rounded-full">
                                <span className="material-symbols-outlined text-[#13c8ec] text-4xl">
                                    {headerIcon}
                                </span>
                            </div>
                        </div>
                    )}
                    {title && (
                        <h1 className="text-[#0d191b] dark:text-white tracking-tight text-2xl font-bold leading-tight pb-2">
                            {title}
                        </h1>
                    )}
                    {subtitle && (
                        <p className="text-[#4c8d9a] dark:text-gray-400 text-sm font-medium">
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
