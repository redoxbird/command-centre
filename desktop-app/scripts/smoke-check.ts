const base = "http://localhost:8000";
const paths = [
  "/",
  "/index.html",
  "/command",
  "/add.html",
  "/learn",
  "/hub.html",
  "/publish",
  "/styles.css",
  "/vendor/alpine.min.js",
  "/vendor/e-input.js",
  "/vendor/range-slider.js",
  "/vendor/enhanced-inputs.css",
  "/vendor/inputs-remap.css",
  "/icons/powershell.svg",
  "/grammar.js",
  "/../deno.json",
  "/%2e%2e/deno.json",
  "/..%5cdeno.json",
  "/api/x",
  "/nope.html",
];
for (const p of paths) {
  try {
    const r = await fetch(base + p);
    const ct = r.headers.get("content-type") || "-";
    const body = await r.text();
    console.log(r.status, p, "|", ct, "|", body.length + "B");
  } catch (e) {
    console.log("ERR", p, (e as Error).message);
  }
}
