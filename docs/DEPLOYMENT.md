# 部署记录（SEO Preview）

## 1. 真实项目位置（不要在仓库根目录跑 Vercel）
- Vercel 项目只绑定在 `site/` 目录。
- 源信息：`site/.vercel/project.json`
  - projectName: seo-preview-tool-site
  - org/team: x233s-projects

> 结论：所有 Vercel CLI 操作必须在 `site/` 目录执行。

## 2. 生产域名（默认建议）
- 站点 + License API 基础域名：`https://seo-preview-tool-site.vercel.app`
- License 校验接口：`/api/license/verify`

如使用自定义域名，替换上述域名即可。

## 3. 插件侧配置
- `VITE_LICENSE_API_BASE`: 上述域名
- `VITE_UPGRADE_URL`: 同上（购买/引导页）

## 4. CLI 核验命令（固定流程）
```bash
cd site
vercel ls
```

## 5. 备注
- 仓库根目录的 `.vercel` 如出现，视为误链接（忽略/删除）。
- GitHub 仓库：`https://github.com/minov9/seo-preview-tool.git`
