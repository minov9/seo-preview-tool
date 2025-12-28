const AlipaySdk = require('alipay-sdk').default;
const { signLicense } = require('../../util/crypto');

module.exports = async (req, res) => {
    const appId = process.env.VITE_ALIPAY_APP_ID;
    const privateKey = process.env.ALIPAY_PRIVATE_KEY;
    const alipayPublicKey = process.env.ALIPAY_PUBLIC_KEY;

    if (!appId || !alipayPublicKey) {
        return res.status(500).send('Missing Alipay Configuration');
    }

    const alipaySdk = new AlipaySdk({
        appId,
        privateKey,
        alipayPublicKey,
        endpoint: 'https://openapi.alipay.com/gateway.do'
    });

    // Verify parameters
    const params = req.query;
    // alipay-sdk's verify method might need customization for Vercel query params
    // But generally alipaySdk.checkNotifySign or similar logic is needed.
    // For 'return_url', Alipay parameters are in query.
    // Note: 'sign_type' defaults to RSA2.

    try {
        // Basic verification: check signature
        const isValid = alipaySdk.checkNotifySign(params);
        if (!isValid) {
            return res.status(400).send('Invalid Signature');
        }

        // Extract info
        // out_trade_no, trade_no, total_amount
        const amount = params.total_amount;

        // Determine plan from amount (simple mapping)
        // 9.90 -> monthly, 99.00 -> yearly
        // Or check passback_params if we sent it?
        // In pay.js we put plan in 'body', but return url params might not have it unless we passed it.
        // However, we can infer from amount for MVP.
        let plan = 'pro';
        let durationDays = 30;

        if (amount === '99.00') {
            durationDays = 365;
        }

        const expiresAt = Date.now() + (durationDays * 24 * 60 * 60 * 1000);
        const payload = {
            licenseKey: params.out_trade_no, // Use order ID as base
            plan: 'pro',
            expiresAt: expiresAt,
            source: 'alipay'
        };

        // Generate Signed Key
        const signedKey = signLicense(payload);

        // Render HTML result
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>支付成功 - SEO预览工具</title>
        <style>
          body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f7f6f2; }
          .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); max-width: 500px; width: 90%; text-align: center; }
          .success-icon { color: #10b981; font-size: 48px; margin-bottom: 16px; }
          h1 { margin: 0 0 16px; font-size: 24px; color: #1f2937; }
          p { color: #6b7280; margin-bottom: 24px; line-height: 1.6; }
          .key-box { background: #f3f4f6; padding: 16px; border-radius: 8px; word-break: break-all; font-family: monospace; border: 1px dashed #d1d5db; margin-bottom: 24px; user-select: all; cursor: pointer; }
          .btn { background: #1f2937; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; cursor: pointer; border: none; }
          .btn:hover { background: #374151; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="success-icon">✓</div>
          <h1>支付成功 (Pro)</h1>
          <p>感谢订阅！请复制下方的激活码，回到插件中点击“升级Pro”->“输入激活码”进行激活。</p>
          
          <div class="key-box" onclick="copyKey()">${signedKey}</div>
          
          <button class="btn" onclick="copyKey()">复制激活码</button>
        </div>
        <script>
          function copyKey() {
            const key = document.querySelector('.key-box').innerText;
            navigator.clipboard.writeText(key).then(() => {
              alert('激活码已复制！');
            });
          }
        </script>
      </body>
      </html>
    `);

    } catch (err) {
        console.error('Verify Error:', err);
        res.status(500).send('Verification Failed: ' + err.message);
    }
};
