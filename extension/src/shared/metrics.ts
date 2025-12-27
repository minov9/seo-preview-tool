/**
 * 5.1 像素宽度计算规范（MVP）
 * 目标：与预览 UI 的字号/字重一致
 */

const FONT_STACK = 'Sora, "Noto Sans SC", "PingFang SC", Arial, sans-serif';

export function getTextWidth(text: string, font: string): number {
    if (typeof document === 'undefined') return 0;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return 0;

    context.font = font;
    const metrics = context.measureText(text);
    return Math.ceil(metrics.width);
}

export function getTitleWidth(text: string): number {
    // Title: 20px, 600
    return getTextWidth(text, `600 20px ${FONT_STACK}`);
}

export function getDescriptionWidth(text: string): number {
    // Description: 14px, 400
    return getTextWidth(text, `400 14px ${FONT_STACK}`);
}
