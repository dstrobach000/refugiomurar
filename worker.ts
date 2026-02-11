import { EmailMessage } from "cloudflare:email";

type Env = {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  CONTACT_EMAIL: {
    send: (message: EmailMessage) => Promise<void>;
  };
  CONTACT_TO: string;
  CONTACT_FROM: string;
  ALLOWED_ORIGIN?: string;
  ALLOWED_ORIGINS?: string;
};

type ContactPayload = {
  name: string;
  email: string;
  message: string;
};

const json = (body: unknown, status = 200, origin = "*") =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "cache-control": "no-store",
    },
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

const escapeHeader = (value: string) => value.replace(/[\r\n]+/g, " ").trim();

const buildRawEmail = (payload: ContactPayload, env: Env) => {
  const now = new Date();
  const submittedAt = now.toISOString();
  const subject = escapeHeader(`Refugio Murar inquiry from ${payload.name}`);
  const from = escapeHeader(env.CONTACT_FROM);
  const to = escapeHeader(env.CONTACT_TO);
  const replyTo = escapeHeader(payload.email);
  const messageId = `<${crypto.randomUUID()}@refugiomurar.es>`;
  const body = [
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

  return {
    from,
    to,
    raw: [
      `From: ${from}`,
      `To: ${to}`,
      `Reply-To: ${replyTo}`,
      `Subject: ${subject}`,
      `Date: ${now.toUTCString()}`,
      `Message-ID: ${messageId}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=utf-8",
      "Content-Transfer-Encoding: 8bit",
      "",
      body,
    ].join("\r\n"),
  };
};

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const cors = withCorsOrigin(request, env);

    if (url.pathname === "/api/contact") {
      if (request.method === "OPTIONS") {
        return json({ ok: true }, 204, cors.origin);
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

      const email = buildRawEmail(payload, env);
      const message = new EmailMessage(email.from, email.to, email.raw);

      await env.CONTACT_EMAIL.send(message);
      return json({ ok: true }, 200, cors.origin);
    }

    return env.ASSETS.fetch(request);
  },
};

export default worker;
