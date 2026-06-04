const SYSTEM_PROMPT = `
你是一个营养估算器，只能根据用户输入的食物和份量估算热量与三大营养素范围。
要求：
1. 只返回 JSON，不要 Markdown，不要解释正文。
2. 不确定份量时做合理假设，并写入 assumptions。
3. kcal 单位是 kcal；protein/carb/fat 单位是 g。
4. 返回范围和一个中位估计值，数值必须是数字。
5. 不提供医疗建议，不评价用户饮食好坏。
JSON 结构：
{
  "food_name": "食物名",
  "portion": "估算份量",
  "kcal": {"min": 0, "max": 0, "estimate": 0},
  "protein": {"min": 0, "max": 0, "estimate": 0},
  "carb": {"min": 0, "max": 0, "estimate": 0},
  "fat": {"min": 0, "max": 0, "estimate": 0},
  "confidence": "low|medium|high",
  "assumptions": "估算假设",
  "notes": ["简短注意事项"]
}
`;

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Sync-Token",
    "Content-Type": "application/json; charset=utf-8"
  };
}

function json(data, status, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(env)
  });
}

function isAuthorized(request, env) {
  if (!env.SYNC_TOKEN) return true;
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || request.headers.get("X-Sync-Token");
  return token === env.SYNC_TOKEN;
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    const url = new URL(request.url);
    if (url.pathname === "/log") {
      if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, 405, env);
      }
      if (!isAuthorized(request, env)) {
        return json({ error: "Unauthorized" }, 401, env);
      }
      if (!env.CALORIE_LOGS) {
        return json({ error: "Missing CALORIE_LOGS KV binding" }, 500, env);
      }

      let payload;
      try {
        payload = await request.json();
      } catch {
        return json({ error: "Invalid JSON body" }, 400, env);
      }

      const receivedAt = new Date().toISOString();
      const dateValue = String(payload.date || "");
      const date = /^\d{4}-\d{2}-\d{2}$/.test(dateValue) ? dateValue : "unknown";
      const id = crypto.randomUUID();
      const key = `entries/${date}/${receivedAt}-${id}`;
      await env.CALORIE_LOGS.put(key, JSON.stringify({ receivedAt, payload }));
      return json({ ok: true, key, receivedAt }, 200, env);
    }

    if (url.pathname === "/logs") {
      if (request.method !== "GET") {
        return json({ error: "Method not allowed" }, 405, env);
      }
      if (!isAuthorized(request, env)) {
        return json({ error: "Unauthorized" }, 401, env);
      }
      if (!env.CALORIE_LOGS) {
        return json({ error: "Missing CALORIE_LOGS KV binding" }, 500, env);
      }

      const listed = await env.CALORIE_LOGS.list({ prefix: "entries/", limit: 100 });
      const entries = await Promise.all(
        listed.keys.map(async (item) => {
          const value = await env.CALORIE_LOGS.get(item.name, "json");
          return { key: item.name, ...value };
        })
      );
      return json({ entries: entries.reverse() }, 200, env);
    }

    if (request.method !== "POST" || url.pathname !== "/estimate") {
      return json({ error: "Not found" }, 404, env);
    }

    if (!env.DEEPSEEK_API_KEY) {
      return json({ error: "Missing DEEPSEEK_API_KEY" }, 500, env);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400, env);
    }

    const description = String(body.description || "").trim();
    if (!description || description.length > 300) {
      return json({ error: "请输入 1-300 字的食物描述" }, 400, env);
    }

    const deepseekResponse = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: env.DEEPSEEK_MODEL || "deepseek-v4-flash",
        thinking: { type: "disabled" },
        temperature: 0.2,
        max_tokens: 700,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: description }
        ]
      })
    });

    const deepseekPayload = await deepseekResponse.json().catch(() => ({}));
    if (!deepseekResponse.ok) {
      return json({ error: "DeepSeek 请求失败", detail: deepseekPayload }, 502, env);
    }

    const content = deepseekPayload.choices?.[0]?.message?.content;
    try {
      return json({ estimate: JSON.parse(content) }, 200, env);
    } catch {
      return json({ error: "DeepSeek 返回内容不是合法 JSON", raw: content }, 502, env);
    }
  }
};
