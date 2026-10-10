/** Durable job helpers — service_role only for claim/complete. */
import { sbBase, sbHeaders } from './_pro.js';
import { clean, ALLOWED_AI_ACTIONS } from './security.js';

export const JOB_KINDS = new Set(['ai_generate', 'bounce', 'export', 'stem_render']);
export const JOB_PRIORITIES = {
  ai_generate: 5,
  bounce: 8,
  export: 10,
  stem_render: 9
};

/** A user may have at most this many unfinished jobs (counted over the last 30 minutes, so a stuck queue self-heals). */
export const MAX_OPEN_JOBS = 3;
export class JobLimitError extends Error {
  constructor() { super('Too many unfinished jobs.'); this.name = 'JobLimitError'; }
}

async function countOpenJobs(userId) {
  const base = sbBase();
  const since = new Date(Date.now() - 30 * 60_000).toISOString();
  const r = await fetch(
    `${base}/rest/v1/tapehead_jobs?user_id=eq.${encodeURIComponent(userId)}&status=in.(queued,running)&created_at=gte.${encodeURIComponent(since)}&select=id&limit=${MAX_OPEN_JOBS + 1}`,
    { headers: sbHeaders() }
  );
  if (!r.ok) throw new Error('Job count failed');
  return (await r.json()).length;
}

/** Whitelist + clamp what a client may put in an AI job (the worker never sees raw client input). */
export function normalizeAiPayload(raw) {
  const p = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const action = String(p.action || 'full_song');
  if (!ALLOWED_AI_ACTIONS.has(action)) return { ok: false, error: 'Unsupported AI action.' };
  const o = p.options && typeof p.options === 'object' && !Array.isArray(p.options) ? p.options : {};
  const out = {
    action,
    prompt: clean(p.prompt, 1600),
    context: clean(p.context, 7000),
    lyrics: clean(p.lyrics, 12000),
    hook: clean(p.hook, 300),
    section: clean(p.section, 100),
    options: {
      style: clean(o.style, 40), language: clean(o.language, 80), mood: clean(o.mood, 80), key: clean(o.key, 20),
      bpm: Number(o.bpm) || 120, length: Number(o.length) || 8, continuityBrief: clean(o.continuityBrief, 1200)
    }
  };
  if (!out.prompt && action !== 'full_song') return { ok: false, error: 'A prompt or lyric seed is required.' };
  return { ok: true, payload: out };
}

export async function createJob({ userId, kind, payload = {}, priority }) {
  if (!JOB_KINDS.has(kind)) throw new Error('Invalid job kind');
  const base = sbBase();
  if (!base || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Jobs not configured');
  if ((await countOpenJobs(userId)) >= MAX_OPEN_JOBS) throw new JobLimitError();

  const body = {
    user_id: userId,
    kind,
    status: 'queued',
    priority: priority ?? JOB_PRIORITIES[kind] ?? 5,
    payload,
    expires_at: new Date(Date.now() + 24 * 3600_000).toISOString()
  };

  const r = await fetch(`${base}/rest/v1/tapehead_jobs`, {
    method: 'POST',
    headers: { ...sbHeaders(), Prefer: 'return=representation' },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`Job create failed: ${await r.text()}`);
  const rows = await r.json();
  return rows[0];
}

export async function getJob(jobId, userId) {
  const base = sbBase();
  if (!base) return null;
  let url = `${base}/rest/v1/tapehead_jobs?id=eq.${encodeURIComponent(jobId)}&select=*&limit=1`;
  if (userId) url += `&user_id=eq.${encodeURIComponent(userId)}`;
  const r = await fetch(url, { headers: sbHeaders() });
  if (!r.ok) return null;
  const rows = await r.json();
  return rows[0] || null;
}

export async function claimJob(workerId, kinds = null) {
  const base = sbBase();
  const r = await fetch(`${base}/rest/v1/rpc/claim_tapehead_job`, {
    method: 'POST',
    headers: sbHeaders(),
    body: JSON.stringify({
      p_worker_id: workerId,
      p_kinds: kinds
    })
  });
  if (!r.ok) {
    const t = await r.text();
    if (r.status === 404 || /null|not found/i.test(t)) return null;
    throw new Error(`Claim failed: ${t}`);
  }
  const text = await r.text();
  if (!text || text === 'null') return null;
  try {
    const job = JSON.parse(text);
    return job && job.id ? job : null;
  } catch (_) {
    return null;
  }
}

export async function completeJob(jobId, result) {
  const base = sbBase();
  const r = await fetch(
    `${base}/rest/v1/tapehead_jobs?id=eq.${encodeURIComponent(jobId)}`,
    {
      method: 'PATCH',
      headers: { ...sbHeaders(), Prefer: 'return=representation' },
      body: JSON.stringify({
        status: 'succeeded',
        result,
        finished_at: new Date().toISOString(),
        error: null
      })
    }
  );
  if (!r.ok) throw new Error(`Complete failed: ${await r.text()}`);
  const rows = await r.json();
  return rows[0];
}

export async function failJob(jobId, error) {
  const base = sbBase();
  const r = await fetch(
    `${base}/rest/v1/tapehead_jobs?id=eq.${encodeURIComponent(jobId)}`,
    {
      method: 'PATCH',
      headers: { ...sbHeaders(), Prefer: 'return=representation' },
      body: JSON.stringify({
        status: 'failed',
        error: String(error || 'failed').slice(0, 2000),
        finished_at: new Date().toISOString()
      })
    }
  );
  if (!r.ok) throw new Error(`Fail update failed: ${await r.text()}`);
  const rows = await r.json();
  return rows[0];
}

export async function cancelJob(jobId, userId) {
  const job = await getJob(jobId, userId);
  if (!job) return null;
  if (job.status !== 'queued' && job.status !== 'running') return job;
  const base = sbBase();
  const r = await fetch(
    `${base}/rest/v1/tapehead_jobs?id=eq.${encodeURIComponent(jobId)}&user_id=eq.${encodeURIComponent(userId)}`,
    {
      method: 'PATCH',
      headers: { ...sbHeaders(), Prefer: 'return=representation' },
      body: JSON.stringify({
        status: 'canceled',
        finished_at: new Date().toISOString()
      })
    }
  );
  if (!r.ok) return null;
  const rows = await r.json();
  return rows[0] || null;
}

export function publicJob(job) {
  if (!job) return null;
  return {
    id: job.id,
    kind: job.kind,
    status: job.status,
    priority: job.priority,
    result: job.status === 'succeeded' ? job.result : undefined,
    error: job.status === 'failed' ? job.error : undefined,
    created_at: job.created_at,
    finished_at: job.finished_at
  };
}
