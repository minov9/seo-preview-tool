import type { ScanResult, Issue } from './types';

// Thresholds from RULES.md
const THRESHOLDS = {
    titleMin: 200,
    titleMax: 580,
    descMin: 400,
    descMax: 920,
    ogWidth: 1200,
    ogHeight: 630,
    ogRatio: 1.91
};

function normalizeText(text?: string) {
    if (!text) return '';
    return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function similarityScore(a?: string, b?: string) {
    const left = normalizeText(a);
    const right = normalizeText(b);
    if (!left || !right) return 0;
    if (left === right) return 1;

    const bigrams = (value: string) => {
        const pairs = new Map<string, number>();
        for (let i = 0; i < value.length - 1; i += 1) {
            const pair = value.slice(i, i + 2);
            pairs.set(pair, (pairs.get(pair) || 0) + 1);
        }
        return pairs;
    };

    const leftPairs = bigrams(left);
    const rightPairs = bigrams(right);
    if (leftPairs.size === 0 || rightPairs.size === 0) return 0;

    let intersection = 0;
    for (const [pair, count] of leftPairs.entries()) {
        const rightCount = rightPairs.get(pair) || 0;
        intersection += Math.min(count, rightCount);
    }

    const total = Array.from(leftPairs.values()).reduce((sum, count) => sum + count, 0)
        + Array.from(rightPairs.values()).reduce((sum, count) => sum + count, 0);
    return total === 0 ? 0 : (2 * intersection) / total;
}

function normalizeUrl(value?: string, base?: string) {
    if (!value) return null;
    try {
        const url = new URL(value, base);
        url.hash = '';
        return url.href.replace(/\/$/, '');
    } catch {
        return null;
    }
}

export function evaluateRules(data: Omit<ScanResult, 'issues'>): Issue[] {
    const issues: Issue[] = [];
    const { title, description, h1, og, twitter, robots, canonical, url } = data;

    // R-001 Title 缺失
    if (!title.value) {
        issues.push({
            id: 'R-001',
            level: 'critical',
            title: 'Title 缺失',
            detail: '未检测到 Title',
            suggestion: '添加 30-60 字内标题'
        });
    }

    // R-002 Description 缺失
    if (!description.value) {
        issues.push({
            id: 'R-002',
            level: 'warning',
            title: 'Description 缺失',
            detail: '未检测到 Description',
            suggestion: '补充 90-160 字简短描述'
        });
    }

    // R-003 Title 过长
    if (title.value && (title.pxWidth || 0) > THRESHOLDS.titleMax) {
        issues.push({
            id: 'R-003',
            level: 'warning',
            title: 'Title 过长',
            detail: `当前 ${title.pxWidth}px，超过建议上限 580px`,
            suggestion: '缩短标题前半部分'
        });
    }

    // R-004 Description 过长
    if (description.value && (description.pxWidth || 0) > THRESHOLDS.descMax) {
        issues.push({
            id: 'R-004',
            level: 'warning',
            title: 'Description 过长',
            detail: `当前 ${description.pxWidth}px，超过建议上限 920px`,
            suggestion: '精简描述，保留关键信息'
        });
    }

    // R-005 OG 图片尺寸不合规
    if (!og.image) {
        issues.push({
            id: 'R-005',
            level: 'warning',
            title: 'OG 图片缺失',
            detail: '未检测到 og:image',
            suggestion: '设置 1200x630 分享图片'
        });
    } else if (og.imageWidth && og.imageHeight) {
        const ratio = og.imageWidth / og.imageHeight;
        const ratioMismatch = Math.abs(ratio - THRESHOLDS.ogRatio) > 0.08;
        const sizeMismatch = og.imageWidth < THRESHOLDS.ogWidth || og.imageHeight < THRESHOLDS.ogHeight;
        if (ratioMismatch || sizeMismatch) {
            issues.push({
                id: 'R-005',
                level: 'warning',
                title: 'OG 图片尺寸不合规',
                detail: `当前 ${og.imageWidth}x${og.imageHeight}，建议 ${THRESHOLDS.ogWidth}x${THRESHOLDS.ogHeight}`,
                suggestion: '更换为 1200x630 图片'
            });
        }
    }

    // R-101 Title 过短
    if (title.value && (title.pxWidth || 0) > 0 && (title.pxWidth || 0) < THRESHOLDS.titleMin) {
        issues.push({
            id: 'R-101',
            level: 'info',
            title: 'Title 过短',
            detail: `当前 ${title.pxWidth}px，低于建议下限 200px`,
            suggestion: '补充核心关键词'
        });
    }

    // R-102 Description 过短
    if (description.value && (description.pxWidth || 0) > 0 && (description.pxWidth || 0) < THRESHOLDS.descMin) {
        issues.push({
            id: 'R-102',
            level: 'info',
            title: 'Description 过短',
            detail: `当前 ${description.pxWidth}px，低于建议下限 400px`,
            suggestion: '补充关键信息与卖点'
        });
    }

    // R-106 Canonical 缺失或不一致
    if (!canonical) {
        issues.push({
            id: 'R-106',
            level: 'warning',
            title: 'Canonical 缺失',
            detail: 'Canonical 标签缺失',
            suggestion: '设置指向当前 URL 的 canonical'
        });
    } else {
        const canonicalUrl = normalizeUrl(canonical, url);
        const currentUrl = normalizeUrl(url, url);
        if (canonicalUrl && currentUrl && canonicalUrl !== currentUrl) {
            issues.push({
                id: 'R-106',
                level: 'warning',
                title: 'Canonical 不一致',
                detail: 'Canonical 指向非当前 URL',
                suggestion: '确保 canonical 指向当前页面'
            });
        }
    }
    // Note: Checking "pointed to non-current URL" requires normalization of current URL which is tricky in different envs

    // R-107 Robots/Noindex
    if (robots && robots.toLowerCase().includes('noindex')) {
        issues.push({
            id: 'R-107',
            level: 'critical',
            title: '检测到 Noindex',
            detail: '页面包含 noindex 指令',
            suggestion: '确认该页面是否需要被搜索引擎收录'
        });
    }

    // R-103 Title 与 H1 高度重复
    if (title.value && h1.text && similarityScore(title.value, h1.text) >= 0.9) {
        issues.push({
            id: 'R-103',
            level: 'info',
            title: 'Title 与 H1 高度重复',
            detail: 'Title 与 H1 文本高度一致',
            suggestion: '区分页面标题与正文标题'
        });
    }

    // R-104 Title/Description 与 OG 不一致
    const titleMismatch = og.title && title.value && similarityScore(title.value, og.title) < 0.6;
    const descMismatch = og.description && description.value && similarityScore(description.value, og.description) < 0.6;
    if (titleMismatch || descMismatch) {
        const detailParts = [];
        if (titleMismatch) detailParts.push('Title 与 og:title 差异明显');
        if (descMismatch) detailParts.push('Description 与 og:description 差异明显');
        issues.push({
            id: 'R-104',
            level: 'info',
            title: '分享文案不一致',
            detail: detailParts.join('；'),
            suggestion: '对齐页面文案与分享文案'
        });
    }

    // R-108 H1 缺失或多 H1
    if (h1.count === 0) {
        issues.push({
            id: 'R-108',
            level: 'warning',
            title: 'H1 缺失',
            detail: '当前 H1 数量为 0',
            suggestion: '添加 1 个主标题'
        });
    } else if (h1.count > 1) {
        issues.push({
            id: 'R-108',
            level: 'warning',
            title: '多 H1 标签',
            detail: `当前 H1 数量为 ${h1.count}`,
            suggestion: '保留 1 个主标题'
        });
    }

    // R-105 分享卡片缺失或不匹配
    const normalizedOgImage = normalizeUrl(og.image);
    const normalizedTwitterImage = normalizeUrl(twitter.image);
    if (!twitter.card) {
        issues.push({
            id: 'R-105',
            level: 'warning',
            title: '分享卡片缺失',
            detail: '未检测到 twitter:card',
            suggestion: '设置 twitter:card 与分享图片'
        });
    } else if (og.image && !twitter.image) {
        issues.push({
            id: 'R-105',
            level: 'warning',
            title: '分享卡片不完整',
            detail: '检测到 og:image，但缺少 twitter:image',
            suggestion: '补充 twitter:image'
        });
    } else if (normalizedOgImage && normalizedTwitterImage && normalizedOgImage !== normalizedTwitterImage) {
        issues.push({
            id: 'R-105',
            level: 'warning',
            title: '分享卡片图片不一致',
            detail: 'og:image 与 twitter:image 不一致',
            suggestion: '对齐分享图片，减少平台差异'
        });
    }

    return issues.sort((a, b) => {
        const severityScore = { critical: 3, warning: 2, info: 1 };
        return severityScore[b.level] - severityScore[a.level];
    });
}
