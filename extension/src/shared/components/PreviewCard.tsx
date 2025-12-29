import React from 'react';
import type { ScanResult } from '../types';
import { t } from '../i18n';

interface PreviewCardProps {
    data: ScanResult;
    device?: 'desktop' | 'mobile';
    showMetrics?: boolean;
    compact?: boolean;
}

export const PreviewCard: React.FC<PreviewCardProps> = ({ data, device = 'desktop', showMetrics = false, compact = false }) => {
    const { title, description, url } = data;
    const isMobile = device === 'mobile';

    // Google Preview Logic
    const displayTitle = title.value || t('previewTitleMissing');
    const displayDesc = description.value || t('previewDescriptionMissing');

    // Extract domain + path
    let domain = '';
    let path = '';
    try {
        const parsed = new URL(url);
        domain = parsed.hostname;
        path = parsed.pathname === '/' ? '' : parsed.pathname;
    } catch {
        domain = 'unknown';
    }

    const titleSize = isMobile ? 'text-[16px] leading-snug' : 'text-[20px] leading-snug';
    const descSize = isMobile ? 'text-[12px] leading-snug' : 'text-[14px] leading-snug';
    const urlSize = isMobile ? 'text-[9px]' : 'text-[11px]';
    const containerWidth = isMobile ? 'max-w-[360px]' : 'max-w-[600px]';

    return (
        <div className={`bg-card w-full ${containerWidth} font-serp rounded-card border border-border-main shadow-layered ${compact ? 'p-3' : 'p-4'}`}>
            <div className="flex items-center space-x-2 mb-2">
                <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 overflow-hidden">
                    <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt="favicon" className="w-3 h-3 opacity-90" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] leading-tight text-text-main font-medium">Google</span>
                    <span className={`${urlSize} leading-tight text-text-secondary truncate max-w-[240px]`}>{domain}{path}</span>
                </div>
            </div>

            <div className="space-y-1">
                <a href={url} target="_blank" rel="noreferrer" className={`block text-accent-blue font-normal line-clamp-2 hover:underline ${titleSize}`}>
                    {displayTitle}
                </a>
                <div className={`${descSize} text-text-secondary line-clamp-2`}>
                    {displayDesc}
                </div>
                {showMetrics && (
                    <div className="text-[10px] text-text-secondary refined-nums">
                        <span>标题 {title.pxWidth || 0}px</span>
                        <span className="mx-2">·</span>
                        <span>描述 {description.pxWidth || 0}px</span>
                    </div>
                )}
            </div>
        </div>
    );
};
