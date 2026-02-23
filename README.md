# Refugio Murar

## Contact Form Email Delivery on Cloudflare

This project uses a Cloudflare Worker endpoint at `POST /api/contact` and sends email through Resend for better deliverability.

### Resend setup required

1. Create a Resend account.
2. Add and verify your sending domain (`refugiomurar.es`) in Resend.
3. Create a Resend API key with send permissions.

### Cloudflare secrets required

Set these in the project directory:

1. `npx wrangler secret put RESEND_API_KEY`
   - value: your Resend API key
2. `npx wrangler secret put ALLOWED_ORIGINS`
   - value example: `https://refugiomurar.es,https://www.refugiomurar.es,https://refugiomurar.pages.dev`

### Deploy with Wrangler

This project is configured for Wrangler deployment:

1. Authenticate: `npx wrangler login`
2. Build static assets: `npm run build`
3. Deploy Worker + assets: `npx wrangler deploy`

The Worker serves static files from `out` and handles `/api/contact`.

### Config in repository

- Worker entry: `worker.ts`
- Frontend form submit: `src/app/page.tsx`
- Cloudflare config: `wrangler.jsonc`

### Notes

- `next.config.ts` uses `output: "export"` for static output.
- Form delivery requires a valid Resend API key and verified sending domain.
