## RULES
- Design pages in design/ are the visual and behavioural source of truth; port markup verbatim, never redesign.
- Desktop app runs on Deno 2.9.6 with deno desktop backend cef, never webview.
- No Electron, Tauri, React, Vue, Svelte, bundler, or runtime CDN anywhere.
- Drizzle ORM is the only data layer: libsql SQLite file on desktop, drizzle-orm/d1 on website and API.
- Zod validates every binding boundary and every API input.
- All input rendering goes through <e-input type="..."> from enhanced-inputs; never hand-write input markup or use standalone input-* tags.
- Grammar positions are distinct: type is input.name, dot-suffix .autogenerate sets auto, colon sets the default value.
- Unknown input.* token names stay literal in the template; never map unknown tokens to text.
- One seed module owns all built-in commands under a single id space; pages never ship their own ids.
- Bindings are the desktop API; no HTTP routes inside the desktop app.
- Range tokens need the vendored range-slider-element or they render inert.
- Never set the shadow attribute on e-input; styling is light-DOM .i-* classes plus --input-* tokens.
- Library validation handles presentation constraints; runner.ts unresolved-token gate remains the execution authority.
- Desktop phases A through G complete before website and API work starts.
- Every task stays Pending until its acceptance criterion is observed, never marked done on code-written alone.
- Variable names should be descriptive and follow camelCase convention, no abbreviations or snake_case.
- Functions should be named for their purpose, not their implementation.
- Comments should explain why code does what it does, not what it does.
- Names should be descriptive and follow camelCase convention, no abbreviations or snake_case.

## Notes
- Take inspiration from "C:\projects\compressy" for structure of the project.
