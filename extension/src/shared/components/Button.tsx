import React from 'react';

type Variant = 'primary' | 'secondary' | 'outline';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    fullWidth = false,
    className = '',
    ...props
}) => {
    const baseStyles = "text-xs font-medium py-2 rounded-lg transition-all active:scale-[0.98] shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none";

    const variants = {
        primary: "bg-text-main text-white hover:opacity-90 border border-transparent",
        secondary: "bg-white text-text-main border border-border-main hover:bg-gray-50",
        outline: "bg-transparent text-text-secondary border border-border-main hover:text-text-main"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
