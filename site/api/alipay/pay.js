const AlipaySdk = require('alipay-sdk').default;
const AlipayFormData = require('alipay-sdk/lib/form').default;

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).send('Method Not Allowed');
    }

    const appId = process.env.VITE_ALIPAY_APP_ID;
    const privateKey = process.env.ALIPAY_PRIVATE_KEY;
    const alipayPublicKey = process.env.ALIPAY_PUBLIC_KEY;
    const apiBase = process.env.VITE_LICENSE_API_BASE || 'https://seo-preview-tool-site.vercel.app';

    if (!appId || !privateKey) {
        return res.status(500).send('Missing Alipay Configuration');
    }

    const alipaySdk = new AlipaySdk({
        appId,
        privateKey,
        alipayPublicKey,
        endpoint: 'https://openapi.alipay.com/gateway.do',
        timeout: 9000
    });

    const upgradePlan = req.query.plan === 'yearly' ? 'yearly' : 'monthly';
    const amount = upgradePlan === 'yearly' ? '499.00' : '59.00';
    const subject = upgradePlan === 'yearly' ? 'SEO预览工具 Pro年费' : 'SEO预览工具 Pro月费';

    // Order ID: Date + Random
    const outTradeNo = Date.now().toString() + Math.random().toString().slice(2, 6);

    const formData = new AlipayFormData();
    formData.setMethod('get');
    formData.addField('returnUrl', `${apiBase}/api/alipay/return`);
    formData.addField('bizContent', {
        out_trade_no: outTradeNo,
        product_code: 'FAST_INSTANT_TRADE_PAY',
        total_amount: amount,
        subject: subject,
        body: JSON.stringify({ plan: upgradePlan }) // Pass plan in body or passback_params
    });

    try {
        const result = await alipaySdk.exec(
            'alipay.trade.page.pay',
            {},
            { formData: formData }
        );

        // Redirect user to Alipay
        res.redirect(result);
    } catch (err) {
        console.error('Alipay Error:', err);
        res.status(500).send('Payment Initialization Failed');
    }
};
