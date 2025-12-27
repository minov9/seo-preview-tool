import React from 'react';
import type { ScanResult } from '../types';
import { t } from '../i18n';

interface SharePreviewCardProps {
    data: ScanResult;
    size?: 'compact' | 'full';
}

export const SharePreviewCard: React.FC<SharePreviewCardProps> = ({ data, size = 'full' }) => {
    const domain = (() => {
        try {
            return new URL(data.url).hostname;
        } catch {
            return 'unknown';
        }
    })();

    const title = data.og.title || data.title.value || t('previewTitleMissing');
    const description = data.og.description || data.description.value || t('previewDescriptionMissing');
    const image = data.og.image || data.twitter.image;

    const padding = size === 'compact' ? 'p-3' : 'p-4';
    const titleSize = size === 'compact' ? 'text-[12px]' : 'text-[15px]';
    const descSize = size === 'compact' ? 'text-[11px]' : 'text-sm';

    return (
        <div className={`bg-white rounded-xl border border-border-main shadow-layered overflow-hidden ${size === 'compact' ? '' : 'max-w-[520px]'}`}>
            {image ? (
                <div
                    className="aspect-[1.91/1] w-full bg-cover bg-center border-b border-border-main/50"
                    style={{ backgroundImage: `url(${image})` }}
                />
            ) : (
                <div className="aspect-[1.91/1] w-full bg-gray-50 flex items-center justify-center border-b border-border-main/50">
                    <span className="text-[10px] text-text-secondary font-mono">{t('previewNoImage')}</span>
                </div>
            )}
            <div className={`${padding} bg-gray-50/50`}>
                <div className="uppercase text-[10px] text-text-secondary mb-1 truncate">{domain}</div>
                <div className={`font-bold text-text-main mb-1 leading-tight line-clamp-1 ${titleSize}`}>{title}</div>
                <div className={`text-text-secondary leading-snug line-clamp-2 ${descSize}`}>{description}</div>
            </div>
        </div>
    );
};
