# 支付流程（Automated，支付宝）

## 目标
- 仅人民币（支付宝）
- **自动发卡**：支付成功后即时生成 License Key
- 无需数据库：使用签名验证（Stateless Signed Keys）

## 流程
1) 用户在插件点击 "Upgrade Pro" -> 跳转官网落地页
2) 官网展示价格方案（月付/年付）
3) 用户点击 "立即购买" -> 跳转支付宝支付 (`/api/alipay/pay`)
4) 支付成功 -> 跳转回调页 (`/api/alipay/return`)
5) 回调页校验支付宝签名 -> **通过加密算法生成 Signed License Key**
6) 页面展示激活码 -> 用户复制
7) 用户在插件内输入激活码 -> 激活 Pro

## 数据模型（Stateless License）
License Key 是一个包含签名数据的 Base64 字符串，结构如下：
`Base64(Payload).Base64(Signature)`

Payload:
```json
{
  "licenseKey": "ORDER_ID",
  "plan": "pro",
  "expiresAt": 1767110400000,
  "source": "alipay"
}
```

## 授权验证 (`/api/license/verify`)
1. 接收 Key
2. 验证 Signature (使用 `ALIPAY_PRIVATE_KEY` 对应的公钥)
3. 签名有效且未过期 -> 返回验证成功

## 备注
- 续费：目前设计为到期后再次购买生成新 Key（覆盖旧 Key）。
- 安全性：私钥仅存储在 Vercel 环境变量，前端无法伪造。
