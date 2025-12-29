# 技术方案（MVP）

## 1. 总体架构
- Chrome 插件（核心）：负责读取当前页面 DOM 并渲染预览。
- 落地页（可选）：仅用于产品介绍/隐私政策/支持页。
- 无需后端：MVP 以本地解析为主，不做 URL 抓取。

## 2. 插件结构（建议）
- Manifest V3
- Content Script：读取页面 Title/Meta/OG/分享元数据/H1 等
- Popup UI：快速预览与问题摘要
- 完整预览页（扩展页面）：承载大预览与导出
- Storage：保存少量用户偏好与最近一次扫描结果

## 3. 目录结构（建议）
```
extension/
  manifest.json
  src/
    content/scan.ts
    popup/
      index.html
      popup.ts
    preview/
      index.html
      preview.ts
    shared/
      parser.ts
      rules.ts
      metrics.ts
      types.ts
```

## 4. 数据模型（ScanResult）
- url、title、description
- og: { title, description, image, imageSize }
- twitter: { card, title, description, image }
- canonical、robots
- h1: { count, text }
- metrics: { titlePx, descriptionPx }
- issues: [{ id, level, title, detail, suggestion }]

## 5. 关键实现点
- SERP 预览需做“像素宽度估算”用于截断提示
- 分享卡片图片需读取尺寸/可访问性
- 预览 UI 需可导出（如果启用导出功能）

## 5.1 像素宽度计算规范（MVP）
- 目标：与预览 UI 的字号/字重一致，避免“明明没溢出却提示截断”。
- 方法：使用 Canvas 2D 的 `measureText` 计算像素宽度。
- 字体基准（Google 桌面 SERP）：
  - Title：20px，400，字体栈 `"Roboto", "Arial", "Noto Sans SC", "PingFang SC", sans-serif`
  - Description：14px，400，字体栈同上
- 截断规则（按“行数”估算）：
  - Title 允许 2 行，基准行宽 600px
  - Description 允许 2 行，基准行宽 600px
- 备注：若 UI 字体修改，需同步更新测量字体与行宽。

## 5.2 分享元数据范围（MVP）
- 分享卡片基于 `og:*` 与 `twitter:*` 等元数据生成。
- 文案层统一称“分享卡片”，技术层保留字段解析。

## 5.3 配置化与可维护性（MVP）
- 规则与阈值集中配置（不硬编码在 UI 组件中）。
- 文案仅通过 i18n key 引用，避免散落在逻辑里。
- 预览样式参数（字号/行数/阈值）集中在单一配置文件。

## 6. 扫描流程（MVP）
- 点击插件图标后自动扫描当前页面
- Popup 向 Content Script 发送消息，获取 ScanResult
- 结果写入 storage（最近一次）并渲染到 Popup
- “完整预览”打开扩展页，读取最近一次结果并展示
- “刷新/重新扫描”触发重新抓取

## 7. 导出 PNG
- 在完整预览页对预览容器进行截图导出
- 可用 html2canvas / html-to-image 类库生成 PNG
- 导出内容包含：SERP（当前设备）+ 分享卡片 + 问题摘要

## 8. 访问限制与兼容性
- 无法运行在浏览器内置页面（如 chrome://、Chrome Web Store 等）。
- 少数站点使用 SPA 动态更新标题，需支持手动刷新或监听变更。
- OG 图片尺寸读取可能受跨域影响，需通过扩展权限或图片加载规避。

## 8.1 i18n 结构占位（MVP）
- 目录建议：`extension/src/locales/`
- 文件：`zh-CN.json` 为默认语言
- Key 命名：`popup.title`、`popup.status.updated`、`preview.export.png`
- 使用方式：UI 仅引用 key，不直接写死文案

## 9. 部署与托管
- 插件发布：Chrome Web Store
- 落地页：Vercel 免费部署（无需域名）

## 10. 访问策略（当前）
- 所有功能免费开放，不区分 Free/Pro。
- 不提供支付入口、授权校验或 License Key。

## 11. 不在 MVP 的技术项
- URL 批量抓取与解析
- 用户系统与团队协作
- 多语言完整本地化
