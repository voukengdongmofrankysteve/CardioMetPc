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
                <label className="text-[#0d191b] dark:text-white text-sm font-semibold leading-normal">
                    {label}
                </label>
            )}
            <div className="relative group">
                <input
                    className={`
            flex w-full rounded-lg text-[#0d191b] dark:text-white 
            border border-[#cfe3e7] dark:border-white/10 
            bg-[#f8fbfc] dark:bg-[#101f22]/50 
            h-12 px-4 text-base font-normal transition-all
            placeholder:text-[#4c8d9a]
            focus:outline-none focus:ring-2 focus:ring-[#13c8ec]/20 focus:border-[#13c8ec]
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
              text-[#4c8d9a] hover:text-[#13c8ec] 
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
