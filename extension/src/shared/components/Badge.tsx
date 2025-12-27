import React from 'react';

type Severity = 'critical' | 'warning' | 'info' | 'success';

interface BadgeProps {
    label: string;
    severity?: Severity;
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ label, severity = 'info', className = '' }) => {
    const styles = {
        critical: "text-accent-red border-accent-red/20 bg-accent-red/5",
        warning: "text-accent-orange border-accent-orange/20 bg-accent-orange/5",
        info: "text-text-secondary border-border-main bg-white",
        success: "text-green-600 border-green-200 bg-green-50"
    };

    // Default design for "Status" badge in header is often just mono/uppercase
    // But for diagnostics, we need severity colors.

    return (
        <span className={`
      inline-flex items-center justify-center
      text-[10px] uppercase tracking-wide-tag font-bold font-mono
      px-1.5 py-0.5 rounded
      border
      ${styles[severity]}
      ${className}
    `}>
            {label}
        </span>
    );
};
