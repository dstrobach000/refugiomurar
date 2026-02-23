type Env = {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  CONTACT_TO: string;
  CONTACT_FROM: string;
  RESEND_API_KEY?: string;
  ALLOWED_ORIGIN?: string;
  ALLOWED_ORIGINS?: string;
};

type ContactPayload = {
  name: string;
  email: string;
  message: string;
};

const corsHeaders = (origin: string) => ({
  "access-control-allow-origin": origin,
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
  "cache-control": "no-store",
});

const json = (body: unknown, status = 200, origin = "*") =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders(origin),
    },
  });

const empty = (status = 204, origin = "*") =>
  new Response(null, {
    status,
    headers: corsHeaders(origin),
  });

const parseAllowedOrigins = (env: Env) => {
  const list = env.ALLOWED_ORIGINS?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (list && list.length > 0) {
    return list;
  }
  if (env.ALLOWED_ORIGIN?.trim()) {
    return [env.ALLOWED_ORIGIN.trim()];
  }
  return [];
};

const withCorsOrigin = (request: Request, env: Env) => {
  const requestOrigin = request.headers.get("origin");
  if (!requestOrigin) {
    return { origin: "*", allowed: true };
  }
  const allowedOrigins = parseAllowedOrigins(env);
  if (allowedOrigins.length === 0) {
    return { origin: requestOrigin, allowed: true };
  }
  if (allowedOrigins.includes(requestOrigin)) {
    return { origin: requestOrigin, allowed: true };
  }
  return { origin: "null", allowed: false };
};

const parsePayload = async (request: Request): Promise<ContactPayload | null> => {
  try {
    const body = (await request.json()) as Partial<ContactPayload>;
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const message = String(body.message ?? "").trim();
    if (!name || !email || !message) {
      return null;
    }
    return { name, email, message };
  } catch {
    return null;
  }
};

const resendEndpoint = "https://api.resend.com/emails";

const buildMessageText = (payload: ContactPayload) => {
  const submittedAt = new Date().toISOString();
  return [
    "NAME:",
    payload.name,
    "",
    "E-MAIL ADDRESS:",
    payload.email,
    "",
    "MESSAGE:",
    payload.message,
    "",
    `SUBMITTED: ${submittedAt}`,
  ].join("\r\n");
};

const sendViaResend = async (payload: ContactPayload, env: Env) => {
  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.CONTACT_FROM?.trim();
  const to = env.CONTACT_TO?.trim();
  if (!apiKey || !from || !to) {
    throw new Error("Missing Resend configuration.");
  }

  const response = await fetch(resendEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: payload.email,
      subject: `Refugio Murar inquiry from ${payload.name}`,
      text: buildMessageText(payload),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend error ${response.status}: ${errorText.slice(0, 500)}`);
  }
};

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const cors = withCorsOrigin(request, env);

    if (url.pathname === "/api/contact") {
      if (request.method === "OPTIONS") {
        return empty(204, cors.origin);
      }

      if (request.method !== "POST") {
        return json({ error: "Method not allowed." }, 405, cors.origin);
      }

      if (!cors.allowed) {
        return json({ error: "Origin not allowed." }, 403, cors.origin);
      }

      const payload = await parsePayload(request);
      if (!payload) {
        return json({ error: "Invalid request payload." }, 400, cors.origin);
      }

      if (payload.message.length > 5000 || payload.name.length > 200 || payload.email.length > 320) {
        return json({ error: "Message is too long." }, 400, cors.origin);
      }

      try {
        await sendViaResend(payload, env);
      } catch (error) {
        console.error("Contact form send failed:", error);
        return json(
          { error: "Message could not be sent right now. Please try again." },
          502,
          cors.origin,
        );
      }

      return json({ ok: true }, 200, cors.origin);
    }

    return env.ASSETS.fetch(request);
  },
};

export default worker;
