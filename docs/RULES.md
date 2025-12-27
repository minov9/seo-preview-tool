# 诊断规则与文案模板

## 1. 输出模板（统一格式）
- 标题：规则名
- 结论：事实 + 当前值 + 阈值
- 建议：动词开头的短句

示例：
- Title 过长
  - 结论：当前 680px，超过建议上限 580px
  - 建议：缩短标题前半部分

## 1.1 严重度映射（MVP）
- Critical：会直接影响收录/展示（如 noindex、关键字段缺失）。
- Warning：存在明显风险，但不一定致命（如过长/过短/尺寸不合规）。
- Info：提示优化方向（如一致性/重复性）。

规则映射：
- R-001 Title 缺失：Critical
- R-002 Description 缺失：Warning
- R-003 Title 过长：Warning
- R-004 Description 过长：Warning
- R-005 OG 图片尺寸不合规：Warning
- R-101 Title 过短：Info
- R-102 Description 过短：Info
- R-103 Title 与 H1 高度重复：Info
- R-104 Title/Description 与分享文案不一致：Info
- R-105 分享卡片缺失或不匹配：Warning
- R-106 Canonical 缺失或不一致：Warning
- R-107 Robots/Noindex 风险：Critical
- R-108 H1 缺失或多 H1：Warning

## 2. Free 规则（基础诊断）
### R-001 Title 缺失
- 条件：title 为空
- 结论：未检测到 Title
- 建议：添加 30-60 字内标题

### R-002 Description 缺失
- 条件：meta description 为空
- 结论：未检测到 Description
- 建议：补充 90-160 字简短描述

### R-003 Title 过长
- 条件：title 像素宽度 > 580px
- 结论：当前 {width}px，超过建议上限 580px
- 建议：缩短标题前半部分

### R-004 Description 过长
- 条件：description 像素宽度 > 920px
- 结论：当前 {width}px，超过建议上限 920px
- 建议：精简描述，保留关键信息

### R-005 OG 图片尺寸不合规
- 条件：og:image 尺寸 < 1200x630 或比例偏离 1.91:1
- 结论：当前 {w}x{h}，不符合 1200x630
- 建议：更换为 1200x630 图片

### R-106 Canonical 缺失或不一致
- 条件：canonical 缺失或指向非当前 URL
- 结论：Canonical 缺失或不一致
- 建议：设置指向当前 URL 的 canonical

### R-107 Robots/Noindex 风险
- 条件：robots 包含 noindex
- 结论：检测到 noindex
- 建议：确认该页面是否需要被搜索引擎收录

### R-108 H1 缺失或多 H1
- 条件：H1 数量为 0 或 > 1
- 结论：当前 H1 数量为 {count}
- 建议：保留 1 个主标题

## 3. Pro 规则（高级诊断）
### R-101 Title 过短
- 条件：title 像素宽度 < 200px
- 结论：当前 {width}px，低于建议下限 200px
- 建议：补充核心关键词

### R-102 Description 过短
- 条件：description 像素宽度 < 400px
- 结论：当前 {width}px，低于建议下限 400px
- 建议：补充关键信息与卖点

### R-103 Title 与 H1 高度重复
- 条件：title 与 H1 文本相似度 >= 0.9
- 结论：Title 与 H1 高度重复
- 建议：区分页面标题与正文标题

### R-104 Title/Description 与 OG 不一致
- 条件：title/description 与 og:title/og:description 差异明显
- 结论：页面与分享文案不一致
- 建议：对齐分享文案与页面文案

### R-105 分享卡片缺失或不匹配
- 条件：twitter:card 缺失或与 og:image 不匹配
- 结论：未检测到合适的分享卡片
- 建议：设置 twitter:card 与图片

## 4. 阈值说明（可调整）
- Title 像素阈值：200px - 580px
- Description 像素阈值：400px - 920px
- OG 图片标准：1200x630（1.91:1）

## 5. 备注
- 阈值与规则可在后续版本调整与扩展。
- 保持“事实 + 阈值 + 建议”的输出结构，避免主观评分。
