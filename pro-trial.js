import { getBearerUser, sbBase, sbHeaders, getEntitlement, upsertEntitlement } from './_pro.js';
function json(res, status, body) { res.status(status).json(body); }
export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'POST required' });
  try {
    const user = await getBearerUser(req);
    if (!user?.id) return json(res, 401, { error: 'Sign in required.' });
    const existing = await getEntitlement(user.id);
    if (existing) return json(res, 200, { entitlement: existing });
    const base = sbBase();
    const prior = await fetch(`${base}/rest/v1/pro_entitlements?user_id=eq.${encodeURIComponent(user.id)}&select=id&limit=1`, { headers: sbHeaders() });
    if (!prior.ok) return json(res, 500, { error: 'Could not check trial.' });
    if ((await prior.json()).length) return json(res, 409, { error: 'Trial already used.' });
    const expiresAt = new Date(Date.now() + 30 * 864e5).toISOString();
    const entitlement = await upsertEntitlement({ userId: user.id, plan: 'trial', source: 'trial', provider: null, providerTxId: null, txRef: null, amount: 0, currency: null, expiresAt });
    return json(res, 200, { entitlement });
  } catch (e) { console.error('pro-trial', e); return json(res, 500, { error: 'Could not start trial.' }); }
}
