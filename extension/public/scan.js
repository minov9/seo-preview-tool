/* Self-contained content script (classic). */

const FONT_STACK = '"Roboto", "Arial", "Noto Sans SC", "PingFang SC", sans-serif';

function getTextWidth(text, font) {
  if (typeof document === 'undefined') return 0;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return 0;
  context.font = font;
  const metrics = context.measureText(text);
  return Math.ceil(metrics.width);
}

function getTitleWidth(text) {
  return getTextWidth(text, `400 20px ${FONT_STACK}`);
}

function getDescriptionWidth(text) {
  return getTextWidth(text, `400 14px ${FONT_STACK}`);
}

function getMetaContent(name) {
  const element = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
  return element ? element.getAttribute('content') : null;
}

function resolveUrl(value) {
  if (!value) return undefined;
  try {
    return new URL(value, document.baseURI).href;
  } catch {
    return value;
  }
}

function parseOg() {
  return {
    title: getMetaContent('og:title') || undefined,
    description: getMetaContent('og:description') || undefined,
    image: resolveUrl(getMetaContent('og:image')),
    siteName: getMetaContent('og:site_name') || undefined,
    imageWidth: Number(getMetaContent('og:image:width')) || undefined,
    imageHeight: Number(getMetaContent('og:image:height')) || undefined
  };
}

function parseTwitter() {
  return {
    card: getMetaContent('twitter:card') || undefined,
    title: getMetaContent('twitter:title') || undefined,
    description: getMetaContent('twitter:description') || undefined,
    image: resolveUrl(getMetaContent('twitter:image'))
  };
}

function parseH1() {
  const h1s = Array.from(document.querySelectorAll('h1'));
  return {
    count: h1s.length,
    text: (h1s[0] && h1s[0].textContent ? h1s[0].textContent.trim() : '') || undefined
  };
}

function getPageMetrics() {
  const rawTitle = document.title || '';
  const rawDesc = getMetaContent('description') || '';

  return {
    title: {
      value: rawTitle,
      pxWidth: getTitleWidth(rawTitle)
    },
    description: {
      value: rawDesc,
      pxWidth: getDescriptionWidth(rawDesc)
    }
  };
}

const SERP = {
  title: { lineWidth: 600, maxLines: 2, minWidth: 200 },
  description: { lineWidth: 600, maxLines: 2, minWidth: 400 }
};

const THRESHOLDS = { ogWidth: 1200, ogHeight: 630, ogRatio: 1.91 };

function normalizeText(text) {
  if (!text) return '';
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function similarityScore(a, b) {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left || !right) return 0;
  if (left === right) return 1;

  const bigrams = (value) => {
    const pairs = new Map();
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

function estimateLines(pxWidth, lineWidth) {
  if (!pxWidth || !lineWidth) return 0;
  return Math.ceil(pxWidth / lineWidth);
}

function normalizeUrl(value, base) {
  if (!value) return null;
  try {
    const url = new URL(value, base);
    url.hash = '';
    return url.href.replace(/\/$/, '');
  } catch {
    return null;
  }
}

function evaluateRules(data) {
  const issues = [];
  const { title, description, h1, og, twitter, robots, canonical, url } = data;

  if (!title.value) {
    issues.push({
      id: 'R-001',
      level: 'critical',
      title: 'Title 缺失',
      detail: '未检测到 Title',
      suggestion: '添加 30-60 字内标题',
      tier: 'free'
    });
  }

  if (!description.value) {
    issues.push({
      id: 'R-002',
      level: 'warning',
      title: 'Description 缺失',
      detail: '未检测到 Description',
      suggestion: '补充 90-160 字简短描述',
      tier: 'free'
    });
  }

  const titleLines = estimateLines(title.pxWidth, SERP.title.lineWidth);
  if (title.value && titleLines > SERP.title.maxLines) {
    issues.push({
      id: 'R-003',
      level: 'warning',
      title: 'Title 过长',
      detail: `预计 ${titleLines} 行，超过建议 ${SERP.title.maxLines} 行`,
      suggestion: '缩短标题前半部分',
      tier: 'free'
    });
  }

  const descLines = estimateLines(description.pxWidth, SERP.description.lineWidth);
  if (description.value && descLines > SERP.description.maxLines) {
    issues.push({
      id: 'R-004',
      level: 'warning',
      title: 'Description 过长',
      detail: `预计 ${descLines} 行，超过建议 ${SERP.description.maxLines} 行`,
      suggestion: '精简描述，保留关键信息',
      tier: 'free'
    });
  }

  if (!og.image) {
    issues.push({
      id: 'R-005',
      level: 'warning',
      title: 'OG 图片缺失',
      detail: '未检测到 og:image',
      suggestion: '设置 1200x630 分享图片',
      tier: 'free'
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
        suggestion: '更换为 1200x630 图片',
        tier: 'free'
      });
    }
  }

  if (title.value && (title.pxWidth || 0) > 0 && (title.pxWidth || 0) < SERP.title.minWidth) {
    issues.push({
      id: 'R-101',
      level: 'info',
      title: 'Title 过短',
      detail: `当前 ${title.pxWidth}px，低于建议下限 ${SERP.title.minWidth}px`,
      suggestion: '补充核心关键词',
      tier: 'pro'
    });
  }

  if (description.value && (description.pxWidth || 0) > 0 && (description.pxWidth || 0) < SERP.description.minWidth) {
    issues.push({
      id: 'R-102',
      level: 'info',
      title: 'Description 过短',
      detail: `当前 ${description.pxWidth}px，低于建议下限 ${SERP.description.minWidth}px`,
      suggestion: '补充关键信息与卖点',
      tier: 'pro'
    });
  }

  if (!canonical) {
    issues.push({
      id: 'R-106',
      level: 'warning',
      title: 'Canonical 缺失',
      detail: 'Canonical 标签缺失',
      suggestion: '设置指向当前 URL 的 canonical',
      tier: 'free'
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
        suggestion: '确保 canonical 指向当前页面',
        tier: 'free'
      });
    }
  }

  if (robots && robots.toLowerCase().includes('noindex')) {
    issues.push({
      id: 'R-107',
      level: 'critical',
      title: '检测到 Noindex',
      detail: '页面包含 noindex 指令',
      suggestion: '确认该页面是否需要被搜索引擎收录',
      tier: 'free'
    });
  }

  if (title.value && h1.text && similarityScore(title.value, h1.text) >= 0.9) {
    issues.push({
      id: 'R-103',
      level: 'info',
      title: 'Title 与 H1 高度重复',
      detail: 'Title 与 H1 文本高度一致',
      suggestion: '区分页面标题与正文标题',
      tier: 'pro'
    });
  }

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
      suggestion: '对齐页面文案与分享文案',
      tier: 'pro'
    });
  }

  if (h1.count === 0) {
    issues.push({
      id: 'R-108',
      level: 'warning',
      title: 'H1 缺失',
      detail: '当前 H1 数量为 0',
      suggestion: '添加 1 个主标题',
      tier: 'free'
    });
  } else if (h1.count > 1) {
    issues.push({
      id: 'R-108',
      level: 'warning',
      title: '多 H1 标签',
      detail: `当前 H1 数量为 ${h1.count}`,
      suggestion: '保留 1 个主标题',
      tier: 'free'
    });
  }

  const normalizedOgImage = normalizeUrl(og.image);
  const normalizedTwitterImage = normalizeUrl(twitter.image);
  if (!twitter.card) {
    issues.push({
      id: 'R-105',
      level: 'warning',
      title: '分享卡片缺失',
      detail: '未检测到 twitter:card',
      suggestion: '设置 twitter:card 与分享图片',
      tier: 'pro'
    });
  } else if (og.image && !twitter.image) {
    issues.push({
      id: 'R-105',
      level: 'warning',
      title: '分享卡片不完整',
      detail: '检测到 og:image，但缺少 twitter:image',
      suggestion: '补充 twitter:image',
      tier: 'pro'
    });
  } else if (normalizedOgImage && normalizedTwitterImage && normalizedOgImage !== normalizedTwitterImage) {
    issues.push({
      id: 'R-105',
      level: 'warning',
      title: '分享卡片图片不一致',
      detail: 'og:image 与 twitter:image 不一致',
      suggestion: '对齐分享图片，减少平台差异',
      tier: 'pro'
    });
  }

  return issues.sort((a, b) => {
    const severityScore = { critical: 3, warning: 2, info: 1 };
    return severityScore[b.level] - severityScore[a.level];
  });
}

function loadImageSize(url) {
  if (!url) return Promise.resolve(null);

  return new Promise((resolve) => {
    const image = new Image();
    const timeout = window.setTimeout(() => {
      cleanup();
      resolve(null);
    }, 3000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      image.onload = null;
      image.onerror = null;
    };

    image.onload = () => {
      cleanup();
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };

    image.onerror = () => {
      cleanup();
      resolve(null);
    };

    image.decoding = 'async';
    image.src = url;
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SCAN_PAGE') {
    (async () => {
      try {
        const metrics = getPageMetrics();
        const og = parseOg();
        const twitter = parseTwitter();
        const h1 = parseH1();
        const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || null;
        const robots = getMetaContent('robots');

        if (og.image && (!og.imageWidth || !og.imageHeight)) {
          const ogImageSize = await loadImageSize(og.image);
          if (ogImageSize) {
            og.imageWidth = ogImageSize.width;
            og.imageHeight = ogImageSize.height;
          }
        }

        if (twitter.image && (!og.imageWidth || !og.imageHeight)) {
          const twitterImageSize = await loadImageSize(twitter.image);
          if (twitterImageSize && !og.image) {
            og.imageWidth = twitterImageSize.width;
            og.imageHeight = twitterImageSize.height;
          }
        }

        const rawData = {
          url: window.location.href,
          title: metrics.title,
          description: metrics.description,
          canonical,
          robots,
          h1,
          og,
          twitter,
          metaGeneratedAt: Date.now()
        };

        const issues = evaluateRules(rawData);

        const result = {
          ...rawData,
          issues
        };

        const response = {
          success: true,
          data: result
        };

        sendResponse(response);
      } catch (error) {
        console.error('[SEO Preview] Scan failed:', error);
        const errorResponse = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        sendResponse(errorResponse);
      }
    })();
  }
  return true;
});
