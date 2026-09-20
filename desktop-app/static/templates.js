// CCTemplates — Phase A scaffold (real templates land in Phase E, task E1).
// Exists so every page's <script src="templates.js"> resolves (no 404) and
// app.js has a stable namespace to extend. Mustache is global (vendor).
// Mirrors the Compressy templates.js pattern: values precomputed by app.js,
// no helper logic beyond precomputed fields.
window.CCTemplates = window.CCTemplates || {};
