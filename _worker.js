// Custom Worker for Cloudflare Workers Assets
// This ensures the site works on both workers.dev and custom domains

export default {
  async fetch(request, env) {
    // Serve static assets from the 'out' directory
    // ASSETS is automatically bound by Cloudflare Workers Assets
    try {
      // Try to get the asset, regardless of hostname
      const response = await env.ASSETS.fetch(request);
      return response;
    } catch (e) {
      // If asset not found, return 404
      return new Response('Not Found', { 
        status: 404,
        headers: {
          'Content-Type': 'text/html; charset=utf-8'
        }
      });
    }
  }
};
