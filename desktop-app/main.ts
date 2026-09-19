import { APP_NAME, APP_VERSION } from "./version.ts";
import { registerBindings } from "./bindings.ts";
import { join } from "std/path";
import { loadWindowGeometry, saveWindowGeometry } from "./settings.ts";

// Structural cast: Deno.BrowserWindow exists at runtime under `deno desktop`
// but is not yet part of the public type lib.
export interface DesktopWindow {
  setTitle(title: string): void;
  setSize(width: number, height: number): void;
  getSize(): [number, number];
  getPosition(): [number, number];
  addEventListener(type: string, listener: () => void): void;
  bind(name: string, handler: (...args: unknown[]) => unknown): void;
}

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

// Static assets: in dev they are the real `static/` folder next to the
// project; in a compiled binary they live in the embedded VFS relative to
// import.meta.url. Probe candidates at startup and pick the first that
// actually contains index.html.
function resolveWeb(): URL {
  const candidates = [
    // 1. CWD-relative (plain `deno run main.ts` from desktop-app/)
    new URL(`file://${Deno.cwd().replace(/\\/g, "/")}/static/`),
    // 2. import.meta-relative (compiled VFS: .../main.ts -> ./static/)
    new URL("./static/", import.meta.url),
    // 3. import.meta parent (VFS layouts that nest under the entry dir)
    new URL("../static/", import.meta.url),
  ];
  for (const url of candidates) {
    try {
      const info = Deno.statSync(new URL("index.html", url));
      if (info.isFile) {
        console.log(`[${APP_NAME}] static dir: ${url.href} (v${APP_VERSION})`);
        return url;
      }
    } catch {
      // try next
    }
  }
  console.warn(`[${APP_NAME}] static dir not found; falling back to import.meta`);
  return new URL("./static/", import.meta.url);
}
const WEB = resolveWeb();

const desktop = Deno as unknown as {
  BrowserWindow?: new (opts: {
    title?: string;
    width?: number;
    height?: number;
    x?: number | null;
    y?: number | null;
    frameless?: boolean;
  }) => DesktopWindow;
};

function respond(body: BodyInit, contentType: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": contentType,
      "cache-control": "no-cache",
      "x-content-type-options": "nosniff",
    },
  });
}

// The six pages, served both as /<name>.html and /<name>.
const PAGES = new Set([
  "index.html",
  "command.html",
  "add.html",
  "learn.html",
  "hub.html",
  "publish.html",
]);

async function serveStatic(pathname: string): Promise<Response> {
  // URL-decode exactly once; reject any segment that tries to escape static/.
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return respond("Bad request", "text/plain; charset=utf-8", 400);
  }
  if (decoded.includes("\\")) {
    return respond("Bad request", "text/plain; charset=utf-8", 400);
  }
  const segments = decoded.split("/");
  if (segments.some((s) => s === "..")) {
    return respond("Forbidden", "text/plain; charset=utf-8", 403);
  }

  let rel = decoded;
  if (rel.endsWith("/")) rel = rel.slice(0, -1);
  if (rel === "" || rel === "/") rel = "index.html";
  rel = rel.replace(/^\/+/, "");
  // Clean URL: /command -> command.html (only for the six known pages).
  if (!rel.includes(".") && PAGES.has(`${rel}.html`)) rel = `${rel}.html`;

  const url = new URL(rel, WEB);
  let info: Deno.FileInfo;
  try {
    info = await Deno.stat(url);
  } catch {
    return respond("Not found", "text/plain; charset=utf-8", 404);
  }
  if (!info.isFile) return respond("Not found", "text/plain; charset=utf-8", 404);
  const dot = url.pathname.lastIndexOf(".");
  const mime = dot >= 0
    ? MIME[url.pathname.slice(dot).toLowerCase()]
    : undefined;
  if (!mime) return respond("Not found", "text/plain; charset=utf-8", 404);
  return respond(await Deno.readFile(url), mime);
}

// ── Window lifecycle (desktop mode only) ───────────────────────────────────

async function setupWindow(): Promise<DesktopWindow | null> {
  if (!desktop.BrowserWindow) return null;

  const geometry = await loadWindowGeometry();
  const win = new desktop.BrowserWindow({
    title: APP_NAME,
    width: geometry.width ?? 1200,
    height: geometry.height ?? 860,
    x: geometry.x,
    y: geometry.y,
  });
  // Adoption may not apply constructor options to the pre-created window;
  // set title/size explicitly.
  win.setTitle(APP_NAME);
  win.setSize(geometry.width ?? 1200, geometry.height ?? 860);

  registerBindings(win);

  // Persist geometry (debounced) on move/resize.
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  const persist = () => {
    if (saveTimer !== null) clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      const [width, height] = win.getSize();
      const [x, y] = win.getPosition();
      await saveWindowGeometry({ width, height, x, y });
    }, 300);
  };
  win.addEventListener("resize", persist);
  win.addEventListener("move", persist);

  return win;
}

const win = await setupWindow();
if (!win) {
  console.log(`[${APP_NAME}] running without a desktop window (plain deno run)`);
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/")) {
    // Bindings are the API — no HTTP routes for data (RULES.md).
    return respond("Not found", "text/plain; charset=utf-8", 404);
  }
  return serveStatic(url.pathname);
});

// Re-export for tests.
export { PAGES, WEB, join };
