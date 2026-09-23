# Project Stack — Windows Desktop + Website + API

## Desktop App — `desktop-app/`

- Deno (https://docs.deno.com/runtime/) for bundling, packaging, running
- Deno Desktop (https://docs.deno.com/runtime/desktop/)
- Zod (https://zod.dev) for schema validation
- Alpine.js (https://alpinejs.dev) for client-side interactivity
- Alpine.js Plugins (https://github.com/alpinejs/alpine)
- Mustache (https://mustache.github.io) for templating
- xterm.js (https://xtermjs.org)

## Website — `website/`

Vanilla HTML rendered on server using workers and hono.

- Hono (https://hono.dev) for routing
- Cloudflare Workers (https://workers.cloudflare.com) for serverless functions
- Cloudflare D1 (https://developers.cloudflare.com/d1) for database
- Alpine.js (https://alpinejs.dev) for client-side interactivity
- Alpine.js Plugins (https://github.com/alpinejs/alpine)
- HTMX (https://htmx.org) for AJAX requests
- Mustache (https://mustache.github.io) for templating
- linkedom (https://github.com/WebReflection/linkedom) for DOM manipulation
- Bun (https://bun.sh) for bundling, packaging, running
- Drizzle ORM (https://orm.drizzle.team/docs/overview) for database interactions

## API — `api/`

- Hono (https://hono.dev) for routing
- Cloudflare Workers (https://workers.cloudflare.com) for serverless functions
- Cloudflare D1 (https://developers.cloudflare.com/d1) for database
- Bun (https://bun.sh) for bundling, packaging, running
- Drizzle ORM (https://orm.drizzle.team/docs/overview) for database interactions
