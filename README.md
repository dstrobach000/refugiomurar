# Refugio Murar

Refugio Murar

## Deploy via GitHub to Cloudflare Pages

This repository is configured to deploy automatically using Cloudflare's Git integration.

### One-time setup in Cloudflare

1. Open Cloudflare Dashboard -> Workers & Pages -> your project -> Settings -> Build.
2. Connect GitHub repo `dstrobach000/refugiomurar` on branch `main`.
3. Set build command to `npm run build`.
4. Set output directory to `out`.

### Notes

- `next.config.ts` is configured with `output: "export"` for static output.
- Pushing to `main` triggers a new Cloudflare deployment.
