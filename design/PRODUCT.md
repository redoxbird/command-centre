# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A solo developer working on their own Windows machine. They already know which commands they want to run, but the exact flag-and-path combination is tedious to retype and easy to get wrong, so they save it once and drive it from a form afterward.

Secondary readers exist but are not the design target: the Learn surface doubles as a syntax reference, and the Community Hub previews browsing other people's commands.

## Product Purpose

Turn a shell command into a reusable, typed template. One saved command line carries its own `{{input.*}}` tokens; each token becomes the control that feeds it — file picker, port, color, date, select, checkbox, range, generated UUID or secret — so the same text is simultaneously the template, the form, and the live preview.

This build is an interactive prototype for validation, not a shipping runner: execution is simulated. Success at this stage means a stakeholder can click every flow end to end — browse, filter, add, run, read metadata, publish — and judge the concept without asking what would happen.

## Positioning

The variables are first-class, not string substitution. Every token declares its own type, default, option list, and autogenerate rule inline, and knows its identity well enough to appear more than once in one command with an independent value per occurrence (`{{input.dir}}` for source and destination in the same line). Values can be locked so the command runs without asking, and a per-command shell choice changes the prompt and transcript around the same template.

## Operating Context

- Windows desktop; PowerShell is the default shell and prompt (`PS C:\projects\app>`). Bash and Ubuntu are per-command alternates with their own prompt and icon, stored per command.
- Working directories are absolute Windows paths, shown as `C:\projects\media`, `C:\projects\shop-app`.
- Six surfaces, linked by a shared top nav: `index.html` (My commands), `hub.html` (Community Hub), `learn.html` (input reference), `add.html` (editor), `command.html` (detail and metadata), `publish.html` (share form).
- A run renders as a terminal transcript — prompt, command with resolved values, output lines, exit status — with Copy, Clear and Hide controls, and a stop that reports exit 130.
- Two list presentations per command: Command View (the template with example values inline) and Control View (the input form open). The choice persists.
- Persistence is entirely browser-local: saved commands, per-command values, locks, shell choice, view mode, Hub additions and Hub recents all live in localStorage.

## Capabilities and Constraints

Locked — confirmed by the user, future work must preserve:

- One self-contained HTML file per surface. No build step, no bundler, no framework; CSS and JS stay inline in the page.
- Browser-only storage. No backend, no accounts, no sync; localStorage is the whole persistence layer.
- Simulated execution only. No page may spawn a real process or install anything, and run/install transcripts stay labeled as simulated.

Present in the repo but **not confirmed as locked** — future work may change these:

- Windows / PowerShell-first defaults and `C:\projects\...` paths.
- The Open Design prototype harness: `.od-frames/` device frames, `*.artifact.json` metadata, live-artifact emission conventions.

Other established facts:

- Vanilla JS throughout; the editor on `add.html` loads CodeMirror 6 from esm.sh through an import map, with a plain textarea fallback.
- Input types are a closed enumerated set with aliases (`input.hexcolor` → `input.color`, `input.token` → `input.password`, `input.since` → `input.date`); an unknown `input.*` name fails to parse rather than silently passing through.
- Modifiers: `:default` prefill, `.autogenerate` (`{{input.uuid.autogenerate}}`), `=off` for checkboxes that start unchecked, and range bounds with a default (`{{input.range:18-28=23}}`).
- Terminology to keep: command, input token, Command View / Control View, Lock Values, Command Metadata, shell, package.

## Brand Commitments

The product is named Command Center; pages title themselves `<Surface> — Command Center`. No logo asset, voice guide, or external brand constraint was established. Icons on hand are limited to `icons/powershell.svg`, `icons/bash.svg`, `icons/ubuntu.svg`.

## Evidence on Hand

- Six working surfaces plus the three shell icons above; no photography, no product screenshots, no external assets.
- The Community Hub's content is fabricated demo data: 10 invented entries with invented authors (`@git-wizards`, `@media-tools`), invented add counts (`5.2k adds`), and invented install state. Its search placeholder claims "thousands of commands" and its footer calls them "community demos"; future work must never present any of it as real community data, real usage, or real registry content.
- No real user data, testimonials, benchmarks, pricing, or deployment claims exist anywhere in this repo, and none may be invented.

## Product Principles

1. **The command line is the interface.** The saved command line stays visible and authoritative; controls exist to fill it, never to hide it.
2. **Nothing runs unseen.** Every value resolves into a preview before it runs, and the transcript is the receipt.
3. **Typed, never raw.** A value is a file, a port, a date, a choice — not a string in a box. Anything unattended must be generated and labeled `auto`.
4. **Repetition is the point.** What is settled stays settled: Lock Values, "Once, then remember", and per-command shell/path defaults make the tenth run cheaper than the first.
5. **Teach at the point of use.** The reference lives one click away from the editor and the form, and shows a live control rather than describing one.

## Accessibility & Inclusion

The incumbent bar to preserve, with no formal audit standard required yet: full keyboard operability, visible focus rings on every interactive element, `role="status"` / `aria-live` on run status, `prefers-reduced-motion` honored, ≥44px touch targets where the layout mixes controls, table `scope` headers on the Learn reference, and real `<label>`/`aria-label` on every generated input.
