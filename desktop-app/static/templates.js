// CCTemplates — task E1 (list templates, compiled once at load).
// Ported markup semantics from design/index.html, design/hub.html and
// design/publish.html. Values are precomputed by app.js; Mustache {{slots}}
// HTML-escape names and command text (no helper logic beyond fields).
// Dynamic command lines (.c, .cmdline) are painted via DOM after render so
// {{input.*}} tokens are never passed through Mustache.
(function () {
  "use strict";

  var T = {
    // My-commands card (design/index.html card skeleton).
    card: "" +
      '<section class="cmd" data-id="{{id}}">' +
      '<div class="cmd-top">' +
      '<button type="button" class="cmd-icon cmd-icon-btn" data-shellbtn aria-label="{{shellAria}}" title="{{shellTitle}}"><img src="{{shellIcon}}" alt="" /></button>' +
      '<div class="cmd-main">' +
      "<h2><a href=\"{{idHref}}\">{{name}}</a></h2>" +
      "<p>{{desc}}</p>" +
      '<details class="preview"><summary>Command preview <span class="live">live</span></summary>' +
      '<div class="cmdline"><span class="dim" data-pre>{{shellPre}}</span><span class="pwd">{{cwd}}</span><span class="dim" data-post>{{shellPost}}</span><span class="c"></span></div></details>' +
      '<div class="tags"><span class="tag">{{tag}}</span><span class="origin">{{origin}}</span></div>' +
      '<div class="vars" hidden><div class="vars-h"></div><div class="vrows"></div>' +
      '<div class="verr" hidden></div>' +
      '<div class="vacts"><button class="btn btn-run vgo" type="button"><span class="ric" aria-hidden="true">▶</span>Run Command</button>' +
      '<label class="lock-check"><input type="checkbox" class="vlock" aria-label="Lock values" /> Lock Values</label>' +
      '<button class="btn btn-ghost vclose" type="button" aria-label="Close inputs"><span aria-hidden="true">✕</span> Close</button></div></div>' +
      '<div class="term" aria-live="polite"><div class="term-bar"><span class="dot"></span>' +
      "<span>terminal — <span class=\"tname\">{{name}}</span></span><span class=\"sp\"></span>" +
      '<button type="button" data-a="copy">Copy</button><button type="button" data-a="clear">Clear</button><button type="button" data-a="hide">Hide</button></div>' +
      '<div class="term-body"><span class="term-empty">Not run yet — press Run to execute.</span></div></div>' +
      "</div>" +
      '<div class="cmd-side"><button class="btn btn-run" type="button" data-run title="Run this command" aria-label="Run this command">▶ Run</button>' +
      '<button class="linklike vunlock" type="button" hidden>Unlock Values</button>' +
      '<div class="status" role="status">Ready</div>' +
      '<button class="linklike vedit" type="button" hidden>Edit values</button></div>' +
      "</div></section>",

    // Community Hub card (design/hub.html hub item skeleton; F3 fills behavior).
    hubCard: "" +
      '<section class="cmd" data-hub-id="{{hubId}}">' +
      '<div class="cmd-top"><div class="cmd-main"><h2>{{name}}</h2><p>{{desc}}</p>' +
      '<div class="cmdline"><span class="dim">PS </span><span class="pwd">{{cwd}}</span><span class="dim">&gt; </span><span class="c"></span></div>' +
      '<div class="meta"><span class="cli">{{cli}}</span><span class="by">{{by}}</span></div></div>' +
      '<div class="cmd-side"><button type="button" class="btn btn-add">Add to My commands</button>' +
      '<div class="status" role="status"></div></div></div></section>',

    // Publish success panel (design/publish.html okBox; F4 fills behavior).
    publishOk: "" +
      "<span>{{statusText}}</span>" +
      '<div class="links"><a href="{{viewHref}}">View command →</a>' +
      '<a href="index.html">Back to My commands →</a>' +
      '<a href="hub.html">Open Community Hub →</a></div>',
  };

  // Compile once at load (throws early on a malformed template).
  if (window.Mustache && typeof window.Mustache.parse === "function") {
    for (const k of Object.keys(T)) {
      try {
        window.Mustache.parse(T[k]);
      } catch (e) {
        console.error("bad template: " + k, e);
      }
    }
  }

  window.CCTemplates = T;
})();
