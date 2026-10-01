import crypto from 'crypto';
import { getBearerUser, sbBase, sbHeaders, PLANS, planAmount, proCurrency, publicAppUrl } from './_pro.js';
import { getIpnId, submitOrder } from './_pesapal.js';

function json(res, status, body) { res.status(status).json(body); }

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'POST required' });
  try {
    const user = await getBearerUser(req);
    if (!user?.id || !user.email) return json(res, 401, { error: 'Sign in with an email account first.' });
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const planId = String(body.plan || '');
    const plan = PLANS[planId];
    const amount = planAmount(planId);
    const currency = proCurrency();
    if (!plan || !amount || !process.env.PESAPAL_CONSUMER_KEY || !process.env.PESAPAL_CONSUMER_SECRET) {
      return json(res, 503, { error: 'Checkout is temporarily unavailable. Please try again later or contact support@tapehead.pro.' });
    }
    const origin = publicAppUrl(req);
    if (!origin) return json(res, 500, { error: 'Checkout could not start. Please try again later.' });

    // Pesapal merchant references: max 50 chars, alphanumeric plus - _ . :
    const txRef = `TH-${Date.now().toString(36)}-${crypto.randomBytes(5).toString('hex')}`;
    const base = sbBase();
    const insert = await fetch(`${base}/rest/v1/pro_transactions`, {
      method: 'POST', headers: { ...sbHeaders(), Prefer: 'return=representation' },
      body: JSON.stringify({ user_id: user.id, tx_ref: txRef, plan: planId, amount, currency, status: 'pending' })
    });
    if (!insert.ok) return json(res, 500, { error: 'Could not create payment record.' });

    let order;
    try {
      const ipnId = await getIpnId(origin);
      order = await submitOrder({
        ref: txRef, amount, currency, description: `Tapehead Pro ${plan.label}`,
        callbackUrl: `${origin}/?payment=complete`, cancelUrl: `${origin}/?payment=cancelled`,
        ipnId, email: user.email, name: user.user_metadata?.username || user.email.split('@')[0]
      });
    } catch (e) {
      console.error('pro-checkout pesapal', e);
      await fetch(`${base}/rest/v1/pro_transactions?tx_ref=eq.${encodeURIComponent(txRef)}`, {
        method: 'PATCH', headers: sbHeaders(), body: JSON.stringify({ status: 'failed', provider_response: { error: String(e.message || e) } })
      }).catch(() => {});
      return json(res, 502, { error: 'Pesapal checkout could not be created.' });
    }

    // Bind Pesapal's tracking id to our reference so later verification can't be pointed at another order.
    await fetch(`${base}/rest/v1/pro_transactions?tx_ref=eq.${encodeURIComponent(txRef)}`, {
      method: 'PATCH', headers: sbHeaders(),
      body: JSON.stringify({ provider_transaction_id: order.orderTrackingId, provider_response: order.raw })
    }).catch(() => {});

    return json(res, 200, { link: order.redirectUrl, tx_ref: txRef, plan: planId });
  } catch (e) {
    console.error('pro-checkout', e);
    return json(res, 500, { error: 'Unable to start checkout.' });
  }
}
