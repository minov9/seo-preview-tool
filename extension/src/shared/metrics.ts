/**
 * 5.1 像素宽度计算规范（MVP）
 * 目标：与预览 UI 的字号/字重一致
 */

const FONT_STACK = '"Roboto", "Arial", "Noto Sans SC", "PingFang SC", sans-serif';

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
    // Google desktop title: 20px, regular
    return getTextWidth(text, `400 20px ${FONT_STACK}`);
}

export function getDescriptionWidth(text: string): number {
    // Google desktop snippet: 14px, regular
    return getTextWidth(text, `400 14px ${FONT_STACK}`);
}
