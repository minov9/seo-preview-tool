const fallbackMessages = {
    appName: 'SEO 预览',
    popupScanning: '正在扫描…',
    popupTryAgain: '重试',
    popupPreview: '预览',
    popupIssues: '问题',
    popupViewAll: '查看全部',
    popupNoIssues: '暂无问题',
    popupRefresh: '刷新',
    popupFullReport: 'SEO 工作台',
    popupNoData: '暂无数据',
    previewTitleMissing: '未检测到 Title',
    previewDescriptionMissing: '未检测到 Description',
    popupErrorInternal: '无法扫描此页面，请切换到普通网页',
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
    editorTitle: 'SEO 工作台',
    editorSubtitle: '模拟草稿 · 实时预览',
    editorNote: '仅供模拟与复制，不会修改页面内容',
    editorTitleLabel: 'Title',
    editorTitlePlaceholder: '输入页面标题',
    editorTitleHint: '参考区间：30-60 字',
    editorDescriptionLabel: 'Description',
    editorDescriptionPlaceholder: '输入页面描述',
    editorDescriptionHint: '参考区间：90-160 字',
    editorOgImageLabel: 'OG Image URL',
    editorOgImagePlaceholder: '输入分享图片链接（1200x630）',
    editorOgImageHint: '参考尺寸：1200x630',
    editorCharCount: '当前 $1 字',
    editorCodeLabel: '可复制 HTML',
    editorCopyHtml: '复制 HTML',
    editorCodePlaceholder: '<title>...</title>\\n<meta name=\"description\" content=\"...\">\\n<meta property=\"og:image\" content=\"...\">',
    editorCopySuccess: 'HTML 已复制',
    editorCopyFailed: '复制失败，请手动复制',
    editorCopyEmpty: '请输入内容后再复制',
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
