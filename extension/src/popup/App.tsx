import React, { useState } from 'react';
import { PreviewCard } from '../shared/components/PreviewCard';
import { SharePreviewCard } from '../shared/components/SharePreviewCard';
import { DiagnosticItem } from '../shared/components/DiagnosticItem';
import { Button } from '../shared/components/Button';
import { Badge } from '../shared/components/Badge';
import { useScan } from './useScan';
import { t } from '../shared/i18n';

const App: React.FC = () => {
    const { data, loading, error, reScan } = useScan();
    const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');

    const domain = (() => {
        if (!data) return '...';
        try {
            return new URL(data.url).hostname;
        } catch {
            return '...';
        }
    })();
    const pageTitle = data?.title?.value || t('popupNoData');

    if (loading) {
        return (
            <div className="w-[360px] min-h-[400px] bg-bg flex items-center justify-center flex-col space-y-3">
                <div className="w-6 h-6 border-2 border-text-main border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-text-secondary">{t('popupScanning')}</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="w-[360px] min-h-[400px] bg-bg p-6 flex flex-col justify-center items-center text-center space-y-4">
                <p className="text-sm font-medium text-text-main">{error || t('popupNoData')}</p>
                <Button onClick={reScan} variant="secondary">{t('popupTryAgain')}</Button>
            </div>
        );
    }

    const visibleIssues = data.issues;
    const issueCount = visibleIssues.length;
    // Limit to Top 3 for popup
    const topIssues = visibleIssues.slice(0, 3);

    return (
        <div className="w-[360px] min-h-[450px] bg-bg flex flex-col">
            {/* 1. Header */}
            <header className="px-4 py-3 flex justify-between items-center border-b border-border-main/50 bg-bg sticky top-0 z-10 backdrop-blur-sm">
                <div className="flex items-center space-x-2 min-w-0">
                    <div className="w-5 h-5 bg-text-main rounded-md flex items-center justify-center">
                        <span className="text-white font-bold text-xs">S</span>
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-sm font-bold tracking-tight-header text-text-main">{t('appName')}</h1>
                        <p className="text-[11px] text-text-secondary truncate">{pageTitle}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <span className="text-xs text-text-secondary font-mono tracking-tight max-w-[120px] truncate">{domain}</span>
                    {issueCount === 0 ? (
                        <Badge label={t('severityOk')} severity="success" className="font-mono" />
                    ) : (
                        <Badge label={`${issueCount}`} severity={visibleIssues[0]?.level || 'info'} className="font-mono min-w-[20px]" />
                    )}
                </div>
            </header>

            <main className="flex-1 p-4 space-y-5 overflow-y-auto custom-scrollbar">
                {/* 2. Preview Section */}
                <section>
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-[11px] font-bold text-text-secondary uppercase tracking-wide-tag">{t('popupPreview')}</h2>
                        <div className="flex items-center gap-2">
                            <Button
                                variant={device === 'desktop' ? 'primary' : 'outline'}
                                className="px-2 py-1 text-[10px]"
                                onClick={() => setDevice('desktop')}
                            >
                                {t('previewDeviceDesktop')}
                            </Button>
                            <Button
                                variant={device === 'mobile' ? 'primary' : 'outline'}
                                className="px-2 py-1 text-[10px]"
                                onClick={() => setDevice('mobile')}
                            >
                                {t('previewDeviceMobile')}
                            </Button>
                        </div>
                    </div>
                    <PreviewCard data={data} device={device} compact />
                    <div className="mt-3">
                        <SharePreviewCard data={data} size="compact" />
                    </div>
                </section>

                {/* 3. Diagnostics Section */}
                <section>
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-[11px] font-bold text-text-secondary uppercase tracking-wide-tag">{t('popupIssues')} ({issueCount})</h2>
                        {issueCount > 3 && (
                            <span
                                className="text-[10px] text-text-secondary hover:text-text-main cursor-pointer underline decoration-dotted"
                                onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('src/preview/index.html') })}
                            >
                                {t('popupViewAll')}
                            </span>
                        )}
                    </div>

                    {issueCount === 0 ? (
                        <div className="bg-card w-full p-4 rounded-card border border-border-main shadow-layered flex items-center justify-center text-xs text-text-secondary italic">
                            {t('popupNoIssues')}
                        </div>
                    ) : (
                        <div className="bg-card w-full p-3 rounded-card border border-border-main shadow-layered space-y-1">
                            {topIssues.map((issue, index) => (
                                <React.Fragment key={issue.id}>
                                    <DiagnosticItem
                                        severity={issue.level}
                                        ruleName={issue.id}
                                        conclusion={issue.title} // Used title as short conclusion
                                    />
                                    {index < topIssues.length - 1 && <div className="h-px bg-border-main/40 my-1"></div>}
                                </React.Fragment>
                            ))}
                        </div>
                    )}

                </section>
            </main>

            {/* 4. Footer Actions */}
            <footer className="p-4 pt-3 border-t border-border-main bg-card shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
                <div className="flex gap-3">
                    <Button variant="secondary" className="flex-1" onClick={reScan}>
                        {t('popupRefresh')}
                    </Button>
                    <Button
                        variant="primary"
                        className="flex-[1.5]"
                        onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('src/preview/index.html') })}
                    >
                        {t('popupFullReport')}
                    </Button>
                </div>
            </footer>
        </div>
    );
};

export default App;
