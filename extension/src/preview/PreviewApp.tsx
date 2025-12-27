import React, { useEffect, useState, useRef, useCallback } from 'react';
import type { ScanResult, Issue } from '../shared/types';
import { Button } from '../shared/components/Button';
import { Badge } from '../shared/components/Badge';
import { PreviewCard } from '../shared/components/PreviewCard';
import { SharePreviewCard } from '../shared/components/SharePreviewCard';
import { toPng } from 'html-to-image';
import { t } from '../shared/i18n';


const PreviewApp: React.FC = () => {
    const [data, setData] = useState<ScanResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
    const exportRef = useRef<HTMLDivElement>(null);

    const handleExport = async () => {
        if (exportRef.current === null) {
            return;
        }

        try {
            const dataUrl = await toPng(exportRef.current, {
                cacheBust: true,
                pixelRatio: 2,
                backgroundColor: '#F7F6F2'
            });
            const link = document.createElement('a');
            link.download = `seo-report-${new Date().toISOString().split('T')[0]}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to export image', err);
            alert('导出失败，请稍后再试');
        }
    };

    const handleCopySummary = async () => {
        if (!data) return;
        const topIssues = data.issues.slice(0, 3);
        const lines = [
            `${t('appName')} - ${data.url}`,
            `标题: ${data.title.value || '-'}`,
            `描述: ${data.description.value || '-'}`,
            '',
            `${t('popupIssues')} (${data.issues.length})`,
            ...topIssues.map((issue) => `- ${issue.id} ${issue.title}: ${issue.detail}`)
        ];

        try {
            await navigator.clipboard.writeText(lines.join('\n'));
        } catch (err) {
            console.error('Failed to copy summary', err);
            alert('复制失败，请稍后重试');
        }
    };

    const handleRefresh = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab?.id) {
                setError(t('popupErrorNoTab'));
                return;
            }

            if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('edge://') || tab.url?.startsWith('about:')) {
                setError(t('popupErrorInternal'));
                return;
            }

            try {
                const response = await chrome.tabs.sendMessage(tab.id, { type: 'SCAN_PAGE' });
                if (response?.success && response.data) {
                    setData(response.data as ScanResult);
                    await chrome.storage.local.set({ lastScan: response.data });
                    return;
                }
                setError(response?.error || t('popupErrorConnectionFailed'));
            } catch (err) {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['assets/scan.js']
                });
                const retry = await chrome.tabs.sendMessage(tab.id, { type: 'SCAN_PAGE' });
                if (retry?.success && retry.data) {
                    setData(retry.data as ScanResult);
                    await chrome.storage.local.set({ lastScan: retry.data });
                    return;
                }
                setError(retry?.error || t('popupErrorConnectionFailed'));
            }
        } catch (err) {
            setError(t('popupErrorConnectionFailed'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const loadData = async () => {
            try {
                const result = await chrome.storage.local.get('lastScan');
                if (result.lastScan) {
                    setData(result.lastScan as ScanResult);
                }
            } catch (error) {
                console.error('Failed to load scan data', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) return <div className="p-8 text-center text-text-secondary">{t('previewLoading')}</div>;
    if (error) return <div className="p-8 text-center text-text-secondary">{error}</div>;
    if (!data) return <div className="p-8 text-center text-text-secondary">{t('previewNoData')}</div>;

    const domain = new URL(data.url).hostname;
    const sortedIssues = [...data.issues].sort((a, b) => {
        const priority = { critical: 0, warning: 1, info: 2 };
        return priority[a.level] - priority[b.level];
    });

    const groupedIssues = sortedIssues.reduce(
        (acc, issue) => {
            acc[issue.level].push(issue);
            return acc;
        },
        { critical: [] as Issue[], warning: [] as Issue[], info: [] as Issue[] }
    );

    return (
        <div className="min-h-screen bg-bg text-text-main font-sans selection:bg-accent-blue/20">
            {/* Top Bar */}
            <header className="h-16 border-b border-border-main bg-white px-8 flex justify-between items-center sticky top-0 z-20">
                <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-text-main rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xs">S</span>
                    </div>
                    <div>
                        <h1 className="text-base font-bold tracking-tight-header">{t('previewTitle')}</h1>
                        <div className="text-xs text-text-secondary truncate max-w-[320px]">{data.title.value || t('previewTitleMissing')}</div>
                        <div className="text-[11px] text-text-secondary font-mono">{domain}</div>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    {data.issues.length === 0 ? (
                        <Badge label={t('severityOk')} severity="success" />
                    ) : (
                        <Badge label={`${data.issues.length}`} severity={data.issues[0]?.level || 'info'} />
                    )}
                    <div className="text-xs text-text-secondary">
                        {t('previewGeneratedAt', [new Date(data.metaGeneratedAt).toLocaleTimeString()])}
                    </div>
                    <Button variant="secondary" onClick={handleRefresh}>{t('previewRefresh')}</Button>
                    <Button variant="secondary" onClick={handleCopySummary}>{t('previewCopySummary')}</Button>
                    <Button onClick={handleExport}>{t('previewExportPng')}</Button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-5 gap-8 bg-bg">
                {/* Left: Preview Area (3/5) */}
                <div className="lg:col-span-3 space-y-8">
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wide-tag">{t('previewSearchPreview')}</h2>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant={device === 'desktop' ? 'primary' : 'outline'}
                                    className="px-3 py-1 text-[10px]"
                                    onClick={() => setDevice('desktop')}
                                >
                                    {t('previewDeviceDesktop')}
                                </Button>
                                <Button
                                    variant={device === 'mobile' ? 'primary' : 'outline'}
                                    className="px-3 py-1 text-[10px]"
                                    onClick={() => setDevice('mobile')}
                                >
                                    {t('previewDeviceMobile')}
                                </Button>
                            </div>
                        </div>
                        <div className="transform scale-100 origin-top-left">
                            <PreviewCard data={data} device={device} showMetrics />
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wide-tag mb-4">{t('previewSocialPreview')}</h2>
                        <SharePreviewCard data={data} size="full" />
                    </section>
                </div>

                {/* Right: Diagnostics (2/5) */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wide-tag mb-2 flex justify-between items-center">
                        <span>{t('previewAnalysis')}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-text-secondary">{t('previewIssuesCount', [String(data.issues.length)])}</span>
                            <Badge label={`${data.issues.length}`} severity={data.issues[0]?.level || 'info'} />
                        </div>
                    </h2>

                    <div className="space-y-4">
                        {(['critical', 'warning', 'info'] as const).map((level) => (
                            <div key={level} className="space-y-3">
                                {groupedIssues[level].length > 0 && (
                                    <div className="text-[11px] font-bold text-text-secondary uppercase tracking-wide-tag">
                                        {level === 'critical' ? t('severityCritical') : level === 'warning' ? t('severityWarning') : t('severityInfo')}
                                    </div>
                                )}
                                {groupedIssues[level].map((issue) => (
                                    <details key={issue.id} className="bg-white p-4 rounded-xl border border-border-main shadow-sm">
                                        <summary className="list-none cursor-pointer">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <Badge label={level === 'critical' ? t('severityCritical') : level === 'warning' ? t('severityWarning') : t('severityInfo')} severity={issue.level} />
                                                    <span className="font-mono text-xs text-text-secondary">#{issue.id}</span>
                                                </div>
                                                <span className="text-[10px] text-text-secondary">{t('previewShowSuggestion')}</span>
                                            </div>
                                            <h3 className="font-bold text-sm text-text-main mt-2">{issue.title}</h3>
                                            <p className="text-xs text-text-secondary mt-1">{issue.detail}</p>
                                        </summary>
                                        <div className="bg-bg p-2 rounded-lg text-xs border border-border-main/50 mt-3">
                                            <span className="font-bold text-text-main mr-1">建议:</span>
                                            <span className="text-text-secondary">{issue.suggestion}</span>
                                        </div>
                                    </details>
                                ))}
                            </div>
                        ))}
                        {sortedIssues.length === 0 && (
                            <div className="text-center py-10 bg-white rounded-xl border border-border-main border-dashed">
                                <div className="text-sm font-bold text-text-main">{t('previewAllClearTitle')}</div>
                                <div className="text-xs text-text-secondary mt-1">{t('previewAllClearDesc')}</div>
                            </div>
                        )}
                    </div>

                    <details className="bg-white p-4 rounded-xl border border-border-main shadow-sm">
                        <summary className="list-none cursor-pointer flex items-center justify-between">
                            <span className="text-xs font-bold text-text-secondary uppercase tracking-wide-tag">{t('previewMetaDetails')}</span>
                            <span className="text-[10px] text-text-secondary">{t('previewExpand')}</span>
                        </summary>
                        <div className="mt-3 space-y-2 text-xs text-text-secondary">
                            <div><span className="font-semibold text-text-main">标题:</span> {data.title.value || '-'}</div>
                            <div><span className="font-semibold text-text-main">描述:</span> {data.description.value || '-'}</div>
                            <div><span className="font-semibold text-text-main">OG 标题:</span> {data.og.title || '-'}</div>
                            <div><span className="font-semibold text-text-main">OG 描述:</span> {data.og.description || '-'}</div>
                            <div><span className="font-semibold text-text-main">OG 图片:</span> {data.og.image || '-'}</div>
                            <div><span className="font-semibold text-text-main">Twitter Card:</span> {data.twitter.card || '-'}</div>
                            <div><span className="font-semibold text-text-main">Twitter 图片:</span> {data.twitter.image || '-'}</div>
                            <div><span className="font-semibold text-text-main">Canonical:</span> {data.canonical || '-'}</div>
                            <div><span className="font-semibold text-text-main">Robots:</span> {data.robots || '-'}</div>
                            <div><span className="font-semibold text-text-main">H1 数量:</span> {data.h1.count}</div>
                            <div><span className="font-semibold text-text-main">H1 内容:</span> {data.h1.text || '-'}</div>
                        </div>
                    </details>
                </div>
            </main>

            <div className="fixed -left-[9999px] top-0">
                <div ref={exportRef} className="w-[1200px] bg-bg p-6 space-y-4">
                    <PreviewCard data={data} device={device} showMetrics />
                    <SharePreviewCard data={data} size="full" />
                    <div className="bg-white p-4 rounded-xl border border-border-main shadow-layered">
                        <div className="text-xs font-bold text-text-secondary uppercase tracking-wide-tag mb-3">
                            {t('popupIssues')}（前 3）
                        </div>
                        <div className="space-y-2">
                            {data.issues.slice(0, 3).map((issue) => (
                                <div key={issue.id} className="text-xs text-text-secondary">
                                    <span className="font-mono text-text-main mr-2">#{issue.id}</span>
                                    <span className="text-text-main font-semibold">{issue.title}</span>
                                    <span className="ml-2">{issue.detail}</span>
                                </div>
                            ))}
                            {data.issues.length === 0 && (
                                <div className="text-xs text-text-secondary">{t('previewAllClearDesc')}</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PreviewApp;
