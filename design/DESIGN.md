---
name: Command Center
description: A well-lit workbench for shell commands — typed input tokens, a live command line, and a terminal that reports honestly.
colors:
  primary: "#0969da"
  primary-hover: "#0550ae"
  canvas: "#e9edf1"
  surface: "#f6f8fa"
  work-surface: "#ffffff"
  hover-fill: "#f3f4f6"
  fg: "#1f2328"
  muted: "#656d76"
  border: "#d0d7de"
  border-soft: "#d8dee4"
  run: "#1f883d"
  run-deep: "#1a7f37"
  danger: "#cf222e"
  danger-deep: "#a40e26"
  warn: "#9a6700"
  signal-wash: "#ddf4ff"
  caution-wash: "#fff8c5"
  caution-rule: "#d4a72c"
  run-wash: "#dafbe1"
  run-wash-rule: "#a9d3ab"
  halt-wash: "#ffebe9"
  halt-wash-rule: "#ffc1c0"
  terminal-bg: "#0d1117"
  terminal-fg: "#e6edf3"
  terminal-rule: "#30363d"
  terminal-dim: "#8b949e"
  terminal-green: "#3fb950"
  terminal-blue: "#79c0ff"
  terminal-red: "#ff7b72"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Noto Sans, Helvetica, Arial, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Noto Sans, Helvetica, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Noto Sans, Helvetica, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Noto Sans, Helvetica, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.5
  micro:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Noto Sans, Helvetica, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.5
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  xs: "4px"
  md: "6px"
  lg: "8px"
  pill: "9999px"
spacing:
  "2xs": "2px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  "2xl": "22px"
components:
  button-run:
    backgroundColor: "{colors.run}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "5px 16px"
    height: "32px"
  button-run-hover:
    backgroundColor: "{colors.run-deep}"
    textColor: "#ffffff"
  button-stop:
    backgroundColor: "{colors.danger}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "5px 16px"
    height: "32px"
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.md}"
    padding: "5px 16px"
    height: "32px"
  button-page:
    backgroundColor: "{colors.run}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "6px 18px"
    height: "36px"
  field:
    backgroundColor: "{colors.work-surface}"
    textColor: "{colors.fg}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  terminal:
    backgroundColor: "{colors.terminal-bg}"
    textColor: "{colors.terminal-fg}"
    typography: "{typography.mono}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
  card:
    backgroundColor: "{colors.work-surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    padding: "0 8px"
  badge-info:
    backgroundColor: "{colors.signal-wash}"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: "0 8px"
  badge-caution:
    backgroundColor: "{colors.caution-wash}"
    textColor: "{colors.warn}"
    rounded: "{rounded.pill}"
    padding: "0 8px"
  badge-run:
    backgroundColor: "{colors.run-wash}"
    textColor: "{colors.run-deep}"
    rounded: "{rounded.pill}"
    padding: "0 8px"
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  tab-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  segmented:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    padding: "5px 14px"
  segmented-active:
    backgroundColor: "{colors.work-surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.pill}"
    padding: "5px 14px"
  rail-pill:
    backgroundColor: "{colors.work-surface}"
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
    height: "32px"
  rail-pill-active:
    backgroundColor: "{colors.fg}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
    height: "32px"
---

# Design System: Command Center

## Overview

**Creative North Star: "The Well-Lit Workbench"**

Command Center is a clean, brightly lit bench where every tool sits within arm's reach and every reading is legible at a glance. Nothing on the bench is decorative: the surface is cool off-white, the borders are hairline, and the only saturated color is the one that means *go*. The dark terminal is the single heavy machine standing on that bench — a contained near-black slab that earns its weight by being the place where work actually gets reported, never a mood the whole room adopts.

The system is built for an expert who is not being taught anything. Density is high because the user reads fast, not because space is scarce; a 12px monospace token and a 12px status line are comfortable here. Depth is carried entirely by 1px borders and three tonal layers — a cool page canvas, an ash panel for secondary chrome, and pure white for the working surface — so the interface reads as a set of drawn regions rather than a stack of floating cards. Every state change is a fill or a border-color change; nothing moves, lifts, or bounces.

Hierarchy comes from the command line itself. Each saved command is a card whose dominant object is a monospace line of text with its variable slots highlighted in the signal blue, and the controls live beside it rather than in front of it. The system's job is to keep that line visible and honest: whatever the form collected shows up in the line before anything runs, and the terminal below is the receipt.

**Key Characteristics:**

- A cool grey-white bench: `#e9edf1` canvas, `#f6f8fa` panel, `#ffffff` working surface, separated by 1px hairlines rather than shadows.
- One signal blue (`#0969da`) reserved for accent and focus; one run green (`#1f883d`) reserved for the execute action and success.
- Monospace is a first-class voice, not a code afterthought: commands, values, ports, UUIDs, and identifiers all render in it.
- Pill geometry (`9999px`) for anything categorical — tabs, chips, segments, badges, rails — against 6px corners for anything structural.
- The near-black terminal (`#0d1117`) is the only dark surface in the system and always denotes execution.
- Flat at rest. Depth appears only as the focus ring and one floating popover.
- Machined and literal: 6px radii, 1px hard borders, tight 14px labels, no gradients, no bounce.

## Colors

A GitHub-Primer-derived instrument palette: one blue signal, a cool grey chassis, green for *go*, amber for caution, red for *halt*, and a near-black console reading.

### Primary

- **Signal Blue** (`#0969da`): The system's single accent. Used for the resolved-variable highlight inside command lines, links, active rail pills, focused input borders, the selected autocomplete row, and every focus ring. Its restraint is what makes it read as a signal rather than decoration.
- **Signal Blue Deep** (`#0550ae`): The pressed/hover state for blue-on-light text and links. Never used as a fill large enough to become a surface.

### Secondary

- **Run Green** (`#1f883d`): Exclusively the execute action — the Run button, the Add button, and the primary page action. This color means *this will run*.
- **Run Green Deep** (`#1a7f37`): The hover state of Run Green, and the text color on a green wash. Also the success status text in a run transcript.

### Tertiary

- **Halt Red** (`#cf222e`): The Stop button, destructive affordances, invalid field borders, and in transcript output, a failed or interrupted run.
- **Caution Amber** (`#9a6700`): Warning-level status only — the "needs input" state, an auto-generated value badge, a non-published command. It flags attention without accusing.

### Neutral

- **Overcast Canvas** (`#e9edf1`): The page background behind the app window. The bench surface everything sits on.
- **Ash Panel** (`#f6f8fa`): Secondary chrome — tab backgrounds when active, chip and badge fills, field labels, the vars panel, table group headers.
- **Work Surface** (`#ffffff`): The working surface. Cards, boxes, inputs, and the app window itself.
- **Hover Fill** (`#f3f4f6`): The one hover fill for ghost buttons and neutral interactive rows.
- **Graphite** (`#1f2328`): Primary text and the active rail pill's fill. Near-black, never pure black.
- **Instrument Grey** (`#656d76`): Secondary text — descriptions, metadata, labels, status, footer copy.
- **Hairline** (`#d0d7de`) / **Hairline Soft** (`#d8dee4`): Structural borders, and their softer sibling for dividers inside a bordered container.
- **Terminal Ink** (`#0d1117`): The console surface. Also the fill for `.cli` and `.pkgchip` monospace chips outside the terminal.
- **Terminal Paper** (`#e6edf3`): Text and Copy/Clear/Hide controls on Terminal Ink.
- **Terminal Rule** (`#30363d`): Borders and dividers inside the console.
- **Terminal Dim** (`#8b949e`): The prompt, simulated-output lines, and console chrome labels.
- **Terminal Green** (`#3fb950`) / **Terminal Blue** (`#79c0ff`) / **Terminal Red** (`#ff7b72`): Success, informational, and error lines inside a run transcript. Distinct from the UI-level Run/Halt colors because they are read on Terminal Ink, not on white.

### Named Rules

**The One Signal Rule.** Exactly one accent color exists. A second saturated color is never introduced to distinguish a feature — a new feature gets a new *shape*, a badge, or a label, not a new hue. The only other saturated colors in the system are semantic states (run / halt / caution) and console output.

**The Green Means Run Rule.** Run Green and its wash are reserved for the execute action and its successful result. Green must never be used for a passive confirmation, an informational badge, or decoration; if the user sees green, something either will run or did run.

**The Console Is Dark Rule.** Terminal Ink is the only dark surface. It is never used for a page background, a card, a header, or a sidebar. A dark region on screen always means execution output.

## Typography

**Display Font:** System UI stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif`)
**Body Font:** The same system stack — one family for every piece of prose. There is no second sans.
**Label/Mono Font:** `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace`

**Character:** A deliberate two-voice system with no middle ground. Prose is set in the platform's own UI font so the tool feels native to the machine it runs on; everything the machine reads or writes — the command template, its resolved values, paths, ports, UUIDs, exit codes, metadata dumps — is monospace. The mono voice is used far more than in a typical app, because the command line is the product's primary object rather than an artifact of it.

### Hierarchy

- **Display** (700, 24px, 1.25, −0.01em): The single `h1` per page, naming the surface — "Commands", "Community Hub", "Learn inputs". One per page, never repeated inside a section.
- **Title** (600, 14px, 1.5): Command names, box headers, field labels, and the `.tname` in a terminal bar. The workhorse emphasis size.
- **Body** (400, 14px, 1.5): Descriptions, lede copy, form values, button labels. Line length is capped where prose runs long — the Learn lede at 62ch, the command-page lede at 70ch.
- **Label** (600, 12px, 1.5): Metadata, status lines, table headers, badge and chip text, hints. This is the system's default low-emphasis voice and carries most of its information.
- **Micro** (600, 11px, 1.5): Badge pills only — input counts, `auto` flags, occurrence pills, version badges. The floor of the scale; nothing below 11px.
- **Mono** (400, 12px, 1.6): Command lines, terminal transcripts, resolved values, token names, hex values, option tables, and the metadata `.json` summary. Set at 12px in both the app and the console so a wrapped command reads identically before and after it runs.

### Named Rules

**The Two Voices Rule.** Text is either system UI font or monospace, and the choice is semantic: anything the shell will read, or anything the machine generated, is monospace. A path, a port, a flag, a duration, or an exit code is never set in the prose font, and a sentence is never set in mono.

**The 11px Floor Rule.** Nothing renders below 11px. The scale is dense by design (12px is the most-used size in the system), but legibility of the dense metadata layer is what makes the density affordable.

## Layout

Single-column, full-bleed, and centered as one app window on an Overcast Canvas. The window has no border, no radius, and no shadow — it is the page. Horizontal padding is a steady 20px (22px on the two form surfaces), with vertical rhythm built from a 2 / 4 / 8 / 12 / 16 / 20 / 22 spacing set. There is no max-width container on the list surfaces: command cards stretch to the viewport, because a long command line benefits from every available pixel. The Learn reference is the one exception, capped at 1280px and centered, since its tables read poorly when stretched.

Vertical order is fixed across every surface: a pill-top nav (My commands · Community Hub · Learn, with Learn pushed right by `margin-left: auto`), then the surface header row, then controls, then content, then a small `--muted` footer that states what is simulated. Because the nav and footer are constant, moving between surfaces feels like turning pages in one document rather than navigating an app.

Card internals are a two-column split: a flexible content column and a fixed-width action column (`min-width: 132px`, `150px` on the Hub) that pins Run/Stop, the status line, and the Unlock/Edit links to a stable right edge. The terminal and the variables panel both span the full card width beneath that split, so a run never shifts the card's horizontal geometry.

Responsive behavior is a single breakpoint at 640px, and it is a reflow rather than a redesign: the two-column card split becomes a vertical stack with the action column turning into a horizontal row, the search input takes the full width, form action buttons share the row equally, and page padding drops to `12px 8px`. The Learn table converts to stacked cards with its group headers made sticky and its column headers dropped. The three-up `.mods` grid on Learn collapses to one column at 760px, one step ahead of the main breakpoint.

**The Constant Chrome Rule.** The top nav, the surface header, and the footer line are identical in position on all six surfaces. A new surface adds content in the middle; it does not invent new chrome.

## Elevation & Depth

The system is flat. Surfaces are separated by 1px hairline borders and three tonal layers — `#e9edf1` canvas behind, `#f6f8fa` panel for secondary chrome, `#ffffff` for the working surface — not by shadows. Nothing lifts off the page at rest, and no card, box, or panel gains a shadow on hover. Depth is a *state* signal, not an ambient property: it appears only for focus, and once for a genuinely floating element (the autocomplete popover).

The one place the system permits a shadow is Chromium's own painted material for a popover, because a floating list over a command editor must visually detach to remain readable; the terminal's `#0d1117` slab achieves the same detachment through tonal contrast alone, with no shadow at all.

### Shadow Vocabulary

- **Focus ring** (`box-shadow: 0 0 0 3px rgba(9,105,218,.3)`): The system's dominant depth device, used on every focusable element. Applied alongside an accent border-color change, never instead of it.
- **Console focus ring** (`box-shadow: 0 0 0 2px #e6edf3`): The focus treatment for controls *inside* the terminal, where a blue ring on near-black would be illegible.
- **Popover lift** (`box-shadow: 0 8px 24px rgba(31,35,40,.16)`): The autocomplete dropdown on the command editor only. The single true elevation in the system.
- **Control hairline** (`box-shadow: 0 1px 0 rgba(31,35,40,.08)`): A 1px bottom highlight on a selected segmented control, standing in for a border it cannot draw cleanly.
- **Switch knob** (`box-shadow: 0 1px 2px rgba(31,35,40,.25)`): The knob's own tiny lift, so it reads as a physical part.
- **Run button inset** (`border-color: rgba(31,35,40,.15)`): A translucent dark border on the green and red buttons — a tonal inset, not a shadow. The same trick appears on the display font's weight, not as elevation.

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat at rest. A shadow may express focus, or a genuinely floating layer above the page — nothing else. Adding a hover lift, a card shadow, or an ambient glow is a violation of the world, not a refinement of it.

**The Border-Before-Shadow Rule.** If two regions need separating, the answer is a 1px `#d0d7de` border or a tonal step between `#ffffff` / `#f6f8fa` / `#e9edf1`. Reach for a shadow only when both have been tried and the element must float.

## Shapes

The form language is machined and literal. Structural containers — cards, boxes, inputs, buttons, terminals, the app window — take a 6px radius, which is the system's declared `--radius` and its most-used value. Small inline elements that would look clumsy at 6px, such as highlighted variable tokens and token pills, drop to 4px. One 8px step exists for the Hub's search palette, the single element large enough to warrant a softer corner. Nested surfaces step *in*, not out: an 8px outer palette holds a 6px inner control.

Categorical elements invert that geometry entirely and become full pills at `9999px` — nav tabs, tags, chips, badges, rail pills, segmented switches, radio groups, and colored-border checkboxes. The pill is the system's *taxonomy* shape: if it can be selected, filtered, counted, or labeled, it is round-ended. The single exception is the command card's `h2` link underline behavior and the switch track, a `9999px` element with a circular `50%` knob.

Borders are always 1px and always solid; the only dashed border in the system is the empty-state container and the "Add a reusable command" affordance, where dashes signal *a slot waiting to be filled* rather than a region that exists. Icons are monochrome functional glyphs: the three bundled shell marks (PowerShell, Bash, Ubuntu) at 20×20, and typographic glyphs for everything else — `+`, `⌕`, `×`, `→`, `▶`, `■`, `↻`, `✓`, and the completion-icon letterforms `F T # % ▾ ◷ ● • ◉ ☑ ▤ ◐`.

**The Pill-For-Taxonomy Rule.** Round-ended geometry is reserved for categorical and selectable things. A structural container never becomes a pill, and a selector never takes a 6px corner.

## Components

### Buttons

- **Shape:** 6px radius (`--radius`), 1px solid border, `min-height: 32px` in cards and `36px` on form pages.
- **Primary (Run / Add):** Run Green fill (`#1f883d`), white text, `5px 16px` padding, weight 500, and a translucent dark border (`rgba(31,35,40,.15)`) that keeps the edge defined on light backgrounds. Runs at `min-width: 84px` so Run → Rerun → Stop never reflows the card.
- **Stop:** The same geometry with a Halt Red fill (`#cf222e`). Run and Stop are the same button in two states — the control's position, size, and weight never change, only its fill and label.
- **Hover / Focus:** Hover darkens the fill one step (Run Green → `#1a7f37`; Stop → `#a40e26`) and changes nothing else — no transform, no lift, no size change. Focus is a 3px blue ring plus an accent border-color change.
- **Ghost / Secondary:** Ash Panel fill with a Hairline border, Graphite text, `#f3f4f6` on hover. Used for Cancel, Edit, Copy, Browse, and every non-destructive secondary action.
- **Disabled:** Opacity drops to 0.6–0.65 with `cursor: default`, so a disabled green button still reads as green — the action is recognized even when unavailable.
- **Link-style:** `.linklike` carries no border, no fill, and no padding — a 12px accent-colored text button used for "Edit values" and "Unlock Values". Focus still draws the ring.

### Chips

- **Style:** Ash Panel fill, Hairline border, Instrument Grey 12px text, `9999px`, `0 8px` padding. Two shapes coexist by role: `.tags span` (decorative, always muted) and `.cli` (an inverted Terminal Ink chip in monospace 700 for package names).
- **State:** `.tag` uses a Signal Wash fill with Signal Blue text for informational labels; `.vbadge` uses a Caution Wash fill with amber text for input counts, `auto` flags, and version badges. A chip that reports a *count or a caution* is amber; a chip that reports a *category* is blue.

### Cards / Containers

- **Corner Style:** 6px (`--radius`).
- **Background:** Work Surface (`#ffffff`) inside the app window; the variables panel inside a card uses Ash Panel instead, so a nested form reads as recessed.
- **Shadow Strategy:** None — see Elevation & Depth.
- **Border:** 1px Hairline, with `overflow: hidden` so the interior terminal and vars panel are clipped to the card's radius rather than drawing their own corners.
- **Internal Padding:** `12px 14px` for the card head, `10px 12px` for a command line, `16px` for form bodies and the add-card.
- **Active state:** A card gains the Signal Blue border plus the focus ring when it is a keyboard-selected search result in the Hub. Selection is communicated by border color, never by fill or scale.

### Inputs / Fields

- **Style:** Work Surface fill, 1px Hairline border, 6px radius, `6px 12px` padding, 14px system font, full width. Monospace inputs (paths, secrets, commands) switch to the mono stack at 12px.
- **Focus:** Accent border-color plus the 3px focus ring — always both, so the state is legible in high-contrast and colour-blind conditions alike.
- **Error:** The field border turns Halt Red and a `.verr` line appears above the actions in 12px Halt Red. Errors never move the field, and never replace the label.
- **Labels:** A 600-weight 12px label above the control (`.field label` on forms, `.vrow label` in a card), with the value's type, occurrence, and raw token appended in Instrument Grey 12px after a `·` separator. A label always states what the value *is* and where it came from.
- **Checkbox / Radio / Range / Color / Switch:** All native controls tinted with `accent-color: var(--accent)`. The switch is a custom `9999px` track that fills Run Green when on, in two measured sizes: 36×22px with a 16px knob on the Learn reference (16px travel, 120ms), and 36×20px with a 14px knob in the Add editor (18px travel, 80ms). Every control carries a real `<label>` or `aria-label`; the switch's input is visually hidden but focusable, with the ring drawn on the track.

### Navigation

- **Style:** A horizontal row of 6px-radius text links, 14px, Instrument Grey, no border when inactive. There is no nav background and no bottom rule.
- **Default / Hover / Active:** Hover adds the Ash Panel fill and switches text to Graphite. Active (`.on`) keeps that fill, adds a 1px Hairline border, and raises the text to weight 600 — the current page is distinguished by *weight and border*, not by a new color. The Active state is `aria-current="page"`.
- **Learn:** Pushed to the right edge with `margin-left: auto` and held at weight 400, so the reference reads as a utility rather than a peer destination. It only gains weight when it is the current page.
- **Mobile treatment:** The nav is not collapsed or replaced by a menu at 640px — three short labels fit, and hiding them would cost more than it saves.

### Terminal (signature component)

The most distinctive thing in the system, and the only dark surface. Terminal Ink (`#0d1117`) with a Terminal Rule border, 6px radius, and a two-part body: a 12px chrome bar and a monospace transcript.

- **Chrome bar:** An 8px status dot (Terminal Rule at rest, Run Green `#1f883d` while a run is live), the label `terminal — <command name>`, then Copy / Clear / Hide as 32px minimum-height outline buttons bordered in Terminal Rule and focused with a **white** ring (`0 0 0 2px #e6edf3`) because blue is unreadable on near-black.
- **Transcript:** 12px mono at 1.6 line-height, `max-height: 220px`, `min-height: 64px`, wrapping with `word-break: break-word` so long paths never force horizontal scroll. Prompt spans are Terminal Dim, the working directory Run Green 600, and the resolved command Terminal Paper.
- **Output semantics:** Four line classes carry meaning by color alone never — `dim` (`#8b949e`) for simulated progress, `grn` (`#3fb950`) for success, `blu` (`#79c0ff`) for info, `red` (`#ff7b72`) for failure. Every colored line also states its result in words (`✓ done · exit 0`), so the transcript survives greyscale and screen readers.
- **Cursor:** An 8×14px Terminal Paper block blinking at 1s `steps(1)`, removed entirely under `prefers-reduced-motion`.

### Command Line (signature component)

The system's primary object. A single monospace 12px line on Terminal Ink, in both the list card and the detail page, with three interchangeable spans: `.dim` for the prompt and its `>` chevron, `.pwd` for the working directory in Run Green 600, and `.ex` for each resolved variable — Signal Blue on a translucent blue wash with a soft blue border, so an input's slot is visible without breaking the line's continuity.

- **Behavior:** The same `.ex` treatment appears in three places — the example values in a list card, the filled values in the editor's live preview, and the raw token table on the detail page — which teaches the token syntax by showing it, not describing it. Hovering an `.ex` reveals the raw `{{input.*}}` token as its `title`.
- **Rendered state:** After a run, the line is replaced by the *resolved* command with no `.ex` highlighting, so the transcript above and the line below agree.

## Do's and Don'ts

### Do:

- **Do** reserve Signal Blue (`#0969da`) for accent, links, resolved-variable highlights, and focus rings; it is the only accent in the system.
- **Do** reserve Run Green (`#1f883d`) for the execute action and its success state — the button, and the `✓` line in a transcript.
- **Do** set every machine-read or machine-generated string in the mono stack at 12px: commands, paths, ports, UUIDs, hex values, token names, exit codes, and metadata dumps.
- **Do** separate regions with a 1px `#d0d7de` border or a step between `#ffffff`, `#f6f8fa`, and `#e9edf1` before considering any shadow.
- **Do** give every focusable element the 3px `rgba(9,105,218,.3)` ring together with an accent border-color change, and switch to the `0 0 0 2px #e6edf3` white ring inside the terminal.
- **Do** use `9999px` pills for anything categorical or selectable — tabs, tags, chips, badges, rail pills, segments, radios — and 6px corners for anything structural.
- **Do** use `rgba(31,35,40,.15)` translucent borders on the green and red buttons so their edges stay defined without darkening the fill.
- **Do** keep Run, Rerun, and Stop the same control at the same position and `min-width: 84px`, changing only fill and label.
- **Do** label every generated control with its type, occurrence, and raw token, so the form documents the syntax it consumes.
- **Do** keep text at 11px or above, and check the dense 12px metadata layer for legibility rather than shrinking it further.
- **Do** state the outcome in words next to every semantic color, as the transcript does with `✓ done · exit 0`.

### Don't:

- **Don't** add a second accent hue, or use color to distinguish a feature — use shape, a badge, or a label instead.
- **Don't** use Terminal Ink (`#0d1117`) as a page background, card, header, or sidebar. A dark region on screen means execution output, and nothing else.
- **Don't** introduce illustration, emoji, mascots, celebratory animation, or ornamental art. This is an instrument, not a consumer app.
- **Don't** add card shadows, hover lifts, ambient glows, scale-on-hover, or any transform-based hover state. Hover changes fill, border-color, and text color only.
- **Don't** use Run Green for a passive confirmation, a neutral badge, or decoration — green always implies something ran or will run.
- **Don't** set prose in monospace or a machine value in the body font; the two voices are semantic, not stylistic.
- **Don't** set a machine value, path, or identifier in the body font at 14px to make it "more readable" — the mono voice at 12px is the system's contract.
- **Don't** use a dashed border for a region that exists. Dashes mean a slot waiting to be filled.
- **Don't** give a structural container a pill radius, or a selector a 6px corner.
- **Don't** collapse or hide the three-label top nav on small screens; the reflow at 640px stacks content, it does not remove chrome.
- **Don't** convey state in a transcript by color alone — the `dim` / `grn` / `blu` / `red` classes must always sit beside words that say the same thing.
