import { getBearerUser, getEntitlement } from './_pro.js';
function json(res, status, body) { res.status(status).json(body); }
export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'GET required' });
  try {
    const user = await getBearerUser(req);
    if (!user?.id) return json(res, 401, { error: 'Sign in required.' });
    return json(res, 200, { entitlement: await getEntitlement(user.id) });
  } catch (e) { console.error('pro-status', e); return json(res, 500, { error: 'Could not load Pro status.' }); }
}
