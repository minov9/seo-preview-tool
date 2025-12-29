# 部署（AI 自动执行 Runbook）

## 目的
- 由 AI 自动完成站点与 API 的部署。
- 人不手动操作，AI 按本流程执行。

## 关键约束
- Vercel 项目只绑定在 `site/` 目录。
- **禁止**在仓库根目录执行 Vercel 命令。
- 绑定信息来源：`site/.vercel/project.json`

## 执行步骤（AI）
1) 进入目录：
```bash
cd site
```

2) 同步项目配置（若需拉取环境变量）：
```bash
vercel pull --yes
```

3) 生产部署：
```bash
vercel deploy --prod
```

## 验证（AI）
1) 记录部署输出中的生产域名（如 `https://seo-preview-tool-site.vercel.app`）。
2) 打开落地页，确认无支付入口与价格卡片。

## 异常处理（AI）
- 若提示未登录：执行 `vercel login` 并等待完成授权后重试。
- 若部署输出域名为空：重试 `vercel deploy --prod`。
- 若 API 失败：优先检查 Vercel 部署是否成功或环境变量是否缺失。
