const fallbackMessages = {
    appName: 'SEO 预览',
    popupScanning: '正在扫描…',
    popupTryAgain: '重试',
    popupPreview: '预览',
    popupIssues: '问题',
    popupViewAll: '查看全部',
    popupNoIssues: '暂无问题',
    popupRefresh: '刷新',
    popupFullReport: '完整预览',
    popupNoData: '暂无数据',
    previewTitleMissing: '未检测到 Title',
    previewDescriptionMissing: '未检测到 Description',
    popupErrorInternal: '无法扫描此页面',
    popupErrorNoTab: '未找到当前标签页',
    popupErrorConnectionFailed: '连接失败，请刷新页面后重试',
    previewLoading: '加载中…',
    previewNoData: '暂无扫描数据，请先在弹窗中进行扫描',
    previewTitle: 'SEO 预览',
    previewGeneratedAt: '生成于 $1',
    previewExportPng: '导出 PNG',
    previewRefresh: '刷新',
    previewSearchPreview: '搜索预览',
    previewSocialPreview: '分享卡片预览',
    previewAnalysis: '问题诊断',
    previewAllClearTitle: '全部正常',
    previewAllClearDesc: '当前规则未发现问题',
    previewMetaDetails: '元信息详情',
    previewCopy: '复制',
    previewCopySummary: '复制摘要',
    previewShowSuggestion: '查看建议',
    previewExpand: '展开',
    previewDeviceDesktop: '桌面',
    previewDeviceMobile: '移动',
    previewIssuesCount: '发现 $1 个问题',
    previewNoImage: '无预览图',
    severityCritical: '严重',
    severityWarning: '警告',
    severityInfo: '提示',
    severityOk: 'OK'
};

type I18nKey = keyof typeof fallbackMessages;

function applySubstitutions(message: string, substitutions?: string[]) {
    if (!substitutions || substitutions.length === 0) return message;

    return substitutions.reduce((acc, value, index) => {
        const token = `$${index + 1}`;
        return acc.split(token).join(value);
    }, message);
}

export function t(key: I18nKey, substitutions?: string[]) {
    try {
        const chromeMessage = chrome?.i18n?.getMessage?.(key, substitutions);
        if (chromeMessage) return chromeMessage;
    } catch {
        // Ignore i18n lookup errors in non-extension contexts
    }

    const fallback = fallbackMessages[key] || key;
    return applySubstitutions(fallback, substitutions);
}

export type { I18nKey };
