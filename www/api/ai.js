// Tapehead Pro — secure server-side AI route for the Write page.
// Vercel Serverless Function. Never put OPENAI_API_KEY in the browser.
const ALLOWED = new Set(["finish_verse","next_section","polish","hook","full_song"]);
const AI_LIMIT_PER_HOUR = 30;

async function hasActivePro(userId) {
  const base = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return false;
  const r = await fetch(`${base}/rest/v1/pro_entitlements?user_id=eq.${encodeURIComponent(userId)}&status=eq.active&select=plan,expires_at&limit=1`, { headers: { apikey:key, Authorization:`Bearer ${key}` } });
  if (!r.ok) return false;
  const rows = await r.json();
  const p = rows[0];
  return !!p && (!p.expires_at || Date.now() < new Date(p.expires_at).getTime());
}

const STYLE_NOTES = {
  contemporary: "current, natural songwriting with a strong conversational voice",
  afrobeats: "melodic Afro-pop/Afrobeats phrasing, rhythmic pockets, vivid everyday imagery",
  amapiano: "danceable South African/African pop phrasing, short memorable lines and groove-aware cadence",
  rnb: "smooth R&B/soul phrasing, intimate imagery, internal rhyme and melodic space",
  hiphop: "hip-hop/trap writing with punchy bars, internal rhyme, attitude and precise imagery",
  gospel: "uplifting gospel writing with sincere faith language, hope and communal singability",
  pop: "highly memorable pop writing, clean phrasing, emotional clarity and a strong hook",
  lofi: "intimate lo-fi writing, understated imagery, reflective tone and conversational detail"
};

function json(res, status, body) {
  res.status(status).json(body);
}

function clean(v, max = 12000) {
  return String(v || "").replace(/\u0000/g, "").trim().slice(0, max);
}

function extractText(data) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) return data.output_text.trim();
  const out = Array.isArray(data?.output) ? data.output : [];
  const parts = [];
  for (const item of out) {
    for (const c of (item?.content || [])) {
      if (typeof c?.text === "string") parts.push(c.text);
    }
  }
  return parts.join("\n").trim();
}

async function verifyUser(req) {
  const auth = String(req.headers.authorization || "");
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!token || !supabaseUrl || !anonKey) return null;

  const r = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`
    }
  });
  if (!r.ok) return null;
  return r.json();
}


async function checkAndRecordUsage(userId) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) return { ok: false, configured: false };
  const base = supabaseUrl.replace(/\/$/, "");
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };
  const r = await fetch(`${base}/rest/v1/rpc/consume_ai_usage`, {
    method: "POST",
    headers,
    body: JSON.stringify({ p_user_id: userId, p_limit: AI_LIMIT_PER_HOUR })
  });
  if (!r.ok) throw new Error("AI usage check failed");
  const ok = await r.json();
  return { ok: !!ok, configured: true, retryAfter: ok ? 0 : 3600 };
}

function buildInstructions(action, options) {
  const style = STYLE_NOTES[options.style] || STYLE_NOTES.contemporary;
  const language = clean(options.language || "English", 80);
  const mood = clean(options.mood || "unspecified", 80);
  const key = clean(options.key || "unspecified", 20);
  const bpm = Number(options.bpm) || 120;
  const length = Math.min(12, Math.max(4, Number(options.length) || 8));

  const base = `You are Tapehead Pro's premium songwriting assistant.
Write original lyrics only. Do not imitate or reproduce a living artist's distinctive style, copyrighted lyrics, or recognizable lines.
Style: ${style}.
Language: ${language}.
Mood: ${mood}.
Musical context: key ${key}, ${bpm} BPM.
Prioritize specificity, emotional truth, singability, fresh imagery, varied line lengths, and natural rhyme.
Avoid filler, generic motivational phrases, overused AI metaphors, and forced rhymes.
Return ONLY usable lyric text, with no commentary, labels, quotation marks, or markdown unless the task explicitly requests section labels.`;

  if (action === "finish_verse") {
    return `${base}
Task: Continue the current section as a coherent verse. Preserve the user's voice and story. Add ${length} strong lines. Do not repeat lines already present.`;
  }
  if (action === "next_section") {
    return `${base}
Task: Write the next song section after the supplied section. Develop the story rather than paraphrasing it. Add ${length} lines.`;
  }
  if (action === "polish") {
    return `${base}
Task: Rewrite the supplied section at a professional songwriting level. Preserve its meaning and strongest original ideas, but improve imagery, cadence, rhyme, emotional specificity and singability. Return the same approximate number of lines.`;
  }
  if (action === "hook") {
    return `${base}
Task: Create a memorable chorus/hook. Produce 4-8 short, highly singable lines with a repeatable central phrase. Keep it original and easy for a crowd to remember.`;
  }
  return `${base}
Task: Create a complete song using these exact section labels:
[Intro]
[Verse 1]
[Chorus]
[Verse 2]
[Bridge]
[Outro]
Write 2-4 lines for Intro and Outro, 6-10 lines for each Verse, 4-8 lines for Chorus and Bridge. Make the chorus the strongest repeated idea. Return only the labeled song.`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "POST required" });

  try {
    const user = await verifyUser(req);
    if (!user?.id) return json(res, 401, { error: "Sign in required for Cloud AI." });

    const body = typeof req.body === "object" && req.body ? req.body : {};
    const action = String(body.action || "");
    if (!ALLOWED.has(action)) return json(res, 400, { error: "Unsupported AI action." });

    const prompt = clean(body.prompt, 1600);
    const context = clean(body.context, 7000);
    const lyrics = clean(body.lyrics, 12000);
    const hook = clean(body.hook, 300);
    const section = clean(body.section, 100);
    const options = body.options && typeof body.options === "object" ? body.options : {};

    if (!prompt && action !== "full_song") return json(res, 400, { error: "A prompt or lyric seed is required." });

    if (!(await hasActivePro(user.id))) return json(res, 403, { error: 'Pro or an active trial is required for Cloud AI.' });

    const usage = await checkAndRecordUsage(user.id);
    if (!usage.configured) return json(res, 503, { error: "Cloud AI is not fully configured. Add SUPABASE_SERVICE_ROLE_KEY." });
    if (!usage.ok) {
      res.setHeader("Retry-After", String(usage.retryAfter || 3600));
      return json(res, 429, { error: "AI limit reached. Try again later." });
    }

    const userInput = [
      `User idea/prompt:\n${prompt || "(use the existing song context)"}`,
      `Current section: ${section}`,
      `Current section text:\n${context || "(empty)"}`,
      `Existing hook:\n${hook || "(none)"}`,
      `Existing song context:\n${lyrics || "(none)"}`
    ].join("\n\n");

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return json(res, 503, { error: "Cloud AI is temporarily unavailable. Please try again later." });

    const model = process.env.OPENAI_MODEL || "gpt-5.6-sol";
    const payload = {
      model,
      input: [
        { role: "system", content: [{ type: "input_text", text: buildInstructions(action, options) }] },
        { role: "user", content: [{ type: "input_text", text: userInput }] }
      ],
      max_output_tokens: action === "full_song" ? 2600 : 1400
    };

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.error?.message || "Upstream AI request failed.";
      return json(res, response.status >= 500 ? 502 : response.status, { error: message });
    }

    const text = extractText(data);
    if (!text) return json(res, 502, { error: "AI returned an empty response." });

    return json(res, 200, { text, model });
  } catch (err) {
    console.error("Tapehead AI route error:", err);
    return json(res, 500, { error: "AI service temporarily unavailable." });
  }
}
