// Permanently delete the authenticated Tapehead account.
// Requires SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY.
function json(res, status, body) { res.status(status).json(body); }

async function verifyUser(req) {
  const auth = String(req.headers.authorization || '');
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  const base = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const anon = process.env.SUPABASE_ANON_KEY;
  if (!token || !base || !anon) return null;
  const r = await fetch(`${base}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } });
  if (!r.ok) return null;
  return r.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'POST required' });
  try {
    const user = await verifyUser(req);
    if (!user?.id) return json(res, 401, { error: 'Sign in required.' });
    const base = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!base || !key) return json(res, 503, { error: 'Account deletion is temporarily unavailable. Contact support@tapehead.pro.' });
    const headers = { apikey: key, Authorization: `Bearer ${key}` };

    // Delete private storage objects first; relational rows cascade from auth.users.
    const listUrl = `${base}/storage/v1/object/list/vocals`;
    const list = await fetch(listUrl, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ prefix: `${user.id}/`, limit: 1000 }) });
    if (list.ok) {
      const objects = await list.json();
      const names = (Array.isArray(objects) ? objects : []).map(x => `${user.id}/${x.name}`).filter(Boolean);
      if (names.length) {
        await fetch(`${base}/storage/v1/object/vocals`, { method: 'DELETE', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ prefixes: names }) });
      }
    }

    // Auth deletion cascades profiles and dependent relational data.
    const del = await fetch(`${base}/auth/v1/admin/users/${encodeURIComponent(user.id)}`, { method: 'DELETE', headers: headers });
    if (!del.ok) {
      const detail = await del.text().catch(() => '');
      console.error('delete auth user failed', del.status, detail);
      return json(res, 502, { error: 'Could not delete the account. Nothing was signed out automatically.' });
    }
    return json(res, 200, { ok: true });
  } catch (e) {
    console.error('delete-account error', e);
    return json(res, 500, { error: 'Account deletion failed.' });
  }
}
