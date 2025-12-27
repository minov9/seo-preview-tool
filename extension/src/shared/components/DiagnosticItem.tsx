import React from 'react';
import { Badge } from './Badge';
import { t } from '../i18n';

type Severity = 'critical' | 'warning' | 'info';

interface DiagnosticItemProps {
    severity: Severity;
    ruleName: string;
    conclusion: string;
}

export const DiagnosticItem: React.FC<DiagnosticItemProps> = ({ severity, ruleName, conclusion }) => {
    // Severity Label Mapping
    const labelMap = {
        critical: t('severityCritical'),
        warning: t('severityWarning'),
        info: t('severityInfo')
    };

    return (
        <div className="flex items-start space-x-2 py-1 group hover:bg-black/[0.02] -mx-2 px-2 rounded transition-colors cursor-default">
            <div className="flex-shrink-0 mt-0.5">
                <Badge label={labelMap[severity]} severity={severity} />
            </div>
            <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-text-main truncate tracking-tight">{ruleName}</span>
                <span className="text-[11px] text-text-secondary truncate font-normal">{conclusion}</span>
            </div>
        </div>
    );
};
