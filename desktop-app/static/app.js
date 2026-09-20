// Command Centre frontend — Phase A scaffold.
// Real components land in Phase E (tasks E2-E7). This stub exists so every
// page's `x-data="cc*"` root resolves and Alpine initializes cleanly instead
// of throwing ReferenceError on load (which killed the whole app root).
//
// Shape follows implementation.md §10 (Compressy pattern): one IIFE,
// `alpine:init` listener, `Alpine.data(...)` components. Component names
// match the x-data attributes in static/*.html exactly — Phase E keeps them.

(function () {
  "use strict";

  function base(name) {
    return function () {
      return {
        // Page identifier (matches <body data-page>).
        page: name,
        // Set once Alpine mounts this component (drives [x-cloak] in Phase E).
        ready: false,
        init() {
          this.ready = true;
          window.__ccMounted = window.__ccMounted || {};
          window.__ccMounted[name] = true;
        },
      };
    };
  }

  function register(Alpine) {
    Alpine.data("ccCommands", base("commands"));
    Alpine.data("ccDetail", base("detail"));
    Alpine.data("ccAuthor", base("author"));
    Alpine.data("ccLearn", base("learn"));
    Alpine.data("ccHub", base("hub"));
    Alpine.data("ccPublish", base("publish"));
  }

  document.addEventListener("alpine:init", function () {
    var Alpine = window.Alpine;
    if (!Alpine || typeof Alpine.data !== "function") return;
    register(Alpine);
  });

  // Exposed for tests / Phase E handoff checks.
  window.__ccStubComponents = ["ccCommands", "ccDetail", "ccAuthor", "ccLearn", "ccHub", "ccPublish"];
})();
