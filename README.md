# Refugio Murar

## Contact Form Email Delivery on Cloudflare

This project now uses a Cloudflare Worker endpoint at `POST /api/contact` and Cloudflare Email Workers (`send_email`) to deliver contact form messages.

### Cloudflare setup required

1. In Cloudflare dashboard, enable **Email Routing** for `refugiomurar.es`.
2. Add and verify the sender mailbox used in `CONTACT_FROM`:
   - Current default is `noreply@refugiomurar.es`.
3. Confirm destination inbox:
   - Current default is `hello@refugiomurar.es`.
4. Optional but recommended: set allowed origin for CORS:
   - `wrangler secret put ALLOWED_ORIGIN`
   - Value should be your site URL (example: `https://refugiomurar.es`).

### Deploy

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
- Form delivery requires Email Routing to be active and sender address verified.
