/* Tapehead Pro AI request client. Supports sync /api/ai responses and durable v1.11 jobs. */
(function attachTapeheadAIJobs(root) {
  'use strict';
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  async function readJson(response) { try { return await response.json(); } catch (_) { return {}; } }
  async function submitAndWait({ endpoint = '/api/ai', token, body, onStatus = () => {}, timeoutMs = 120000, pollMs = 1500, fetchImpl = root.fetch.bind(root) } = {}) {
    if (!token) throw new Error('Sign in to use Cloud AI');
    if (!body || typeof body !== 'object') throw new Error('Cloud AI request is missing its payload.');
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify(body)
    });
    const data = await readJson(response);
    if (!response.ok) throw new Error(data.error || `AI request failed (${response.status})`);
    // Synchronous /api/ai response remains supported.
    if (typeof data.text === 'string' && data.text.trim()) return data;
    // v1.11 API returns { async: true, job: { id, status } }.
    const jobId = data.job?.id || data.jobId;
    if (!jobId) throw new Error(data.error || 'AI returned neither text nor a job identifier.');
    const deadline = Date.now() + Math.max(1000, Number(timeoutMs) || 120000);
    while (Date.now() < deadline) {
      await sleep(Math.max(250, Number(pollMs) || 1500));
      const statusResponse = await fetchImpl('/api/jobs?id=' + encodeURIComponent(jobId), {
        headers: { Authorization: 'Bearer ' + token }, cache: 'no-store'
      });
      const statusData = await readJson(statusResponse);
      if (!statusResponse.ok) throw new Error(statusData.error || 'Could not check Cloud AI job.');
      const job = statusData.job || statusData;
      if (job.status === 'succeeded') {
        if (!job.result || typeof job.result.text !== 'string' || !job.result.text.trim()) throw new Error('AI job completed without a text result.');
        return { ...job.result, jobId, async: true };
      }
      if (job.status === 'failed') throw new Error(job.error || 'Cloud AI job failed.');
      if (job.status === 'canceled' || job.status === 'cancelled') throw new Error('Cloud AI job was canceled.');
      if (!['queued', 'running'].includes(job.status)) throw new Error('Cloud AI returned an unknown job status.');
      onStatus(job.status, job);
    }
    throw new Error('Cloud AI is still queued. Please try again shortly; your job remains saved.');
  }
  root.TapeheadAIJobs = Object.freeze({ submitAndWait });
})(window);
