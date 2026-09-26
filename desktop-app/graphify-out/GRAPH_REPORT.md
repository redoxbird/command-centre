# Graph Report - .  (2026-09-26)

## Corpus Check
- Corpus is ~35,711 words - fits in a single context window. You may not need a graph.

## Summary
- 363 nodes · 728 edges · 14 communities (13 shown, 1 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 25 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Command Library and IDs
- Frontend App UI Helpers
- Desktop Bindings and Window
- Grammar and Input Registry
- Build Config and Tasks
- Run Execution and Shells
- UI Pages and Concepts
- Database Layer
- Client Grammar Engine
- Toolchain Icons
- Boot and Widget Mounting
- Database Schema
- Clean Script

## God Nodes (most connected - your core abstractions)
1. `registerBindings()` - 30 edges
2. `saveCommand()` - 17 edges
3. `tasks` - 16 edges
4. `openDatabase()` - 14 edges
5. `readMetadata()` - 12 edges
6. `defaultMetadata()` - 11 edges
7. `appBaseDir()` - 10 edges
8. `dbOrDefault()` - 10 edges
9. `importJson()` - 10 edges
10. `runCommand()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `registerBindings()` --calls--> `appBaseDir()`  [EXTRACTED]
  bindings.ts → db/db.ts
- `registerBindings()` --calls--> `openDatabase()`  [EXTRACTED]
  bindings.ts → db/db.ts
- `registerBindings()` --calls--> `duplicateCommand()`  [EXTRACTED]
  bindings.ts → library.ts
- `registerBindings()` --calls--> `getCommand()`  [EXTRACTED]
  bindings.ts → library.ts
- `registerBindings()` --calls--> `importJson()`  [EXTRACTED]
  bindings.ts → library.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Primary navigation shared across all pages** — static_add_page, static_command_page, static_hub_page, static_index_page, static_learn_page, static_publish_page, static_index_primary_nav [EXTRACTED 1.00]

## Communities (14 total, 1 thin omitted)

### Community 0 - "Command Library and IDs"
Cohesion: 0.07
Nodes (62): Db, CONSONANTS, ensureUniqueCommandId(), generateCommandId(), ID_CONSONANTS, ID_RE, isValidCommandId(), randOf() (+54 more)

### Community 1 - "Frontend App UI Helpers"
Cohesion: 0.07
Nodes (42): SHELL_ORDER, B(), buildVarControl(), collectInputs(), cycleShell(), describeError(), el(), errorMessage() (+34 more)

### Community 2 - "Desktop Bindings and Window"
Cohesion: 0.09
Nodes (34): CommandIdArg, err(), IdArg, pickFileNative(), pickFolderNative(), platformShells(), NOTE: no windowsHide here — CREATE_NO_WINDOW would suppress explorer's, registerBindings() (+26 more)

### Community 3 - "Grammar and Input Registry"
Cohesion: 0.09
Nodes (37): ccAutoGenerate(), ccInstanceKey(), ccRandInt(), ccRandStr(), ccUuid(), exampleFor(), FILE_EXAMPLES, NUMBER_EXAMPLES (+29 more)

### Community 4 - "Build Config and Tasks"
Cohesion: 0.06
Nodes (32): icons, identifier, name, desktop, app, backend, output, exports (+24 more)

### Community 5 - "Run Execution and Shells"
Cohesion: 0.13
Nodes (28): ActiveRun, append(), bufferStart(), cancelRun(), finish(), flushPending(), getRunProgress(), killTree() (+20 more)

### Community 6 - "UI Pages and Concepts"
Cohesion: 0.13
Nodes (25): Ask-for-values mode, Command authoring form, Command metadata labels, Live command preview, Add command page, Edit Publish Export actions, Command detail and run page, Run command terminal panel (+17 more)

### Community 7 - "Database Layer"
Cohesion: 0.23
Nodes (15): appBaseDir(), appDataRoot(), applyMigrations(), callbackFor(), closeDatabase(), dbFilePath(), dirExists(), listMigrations() (+7 more)

### Community 8 - "Client Grammar Engine"
Cohesion: 0.22
Nodes (16): ccAutoGenerate(), ccInstanceKey(), ccRandInt(), ccRandStr(), ccUuid(), exampleFor(), lookupType(), metaForOption() (+8 more)

### Community 9 - "Toolchain Icons"
Cohesion: 0.27
Nodes (11): Bash Shell Icon, Bun JavaScript Runtime Icon, Chocolatey Package Manager Icon, Docker Container Platform Icon, Node.js Runtime Icon, npm Package Manager Icon, curl Data Transfer Tool Icon, FFmpeg Multimedia Framework Icon (+3 more)

### Community 10 - "Boot and Widget Mounting"
Cohesion: 0.39
Nodes (6): AUTO_WIDGETS, ccSource(), G(), mount(), tokenField(), typeEntries()

### Community 11 - "Database Schema"
Cohesion: 0.29
Nodes (6): commands, hubCache, hubState, publishQueue, publishStatus, settings

## Knowledge Gaps
- **67 isolated node(s):** `dist`, `hubCache`, `hubState`, `publishQueue`, `publishStatus` (+62 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SHELL_ORDER` connect `Frontend App UI Helpers` to `Run Execution and Shells`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
- **What connects `dist`, `hubCache`, `hubState` to the rest of the system?**
  _67 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Command Library and IDs` be split into smaller, more focused modules?**
  _Cohesion score 0.07023705004389816 - nodes in this community are weakly interconnected._
- **Should `Frontend App UI Helpers` be split into smaller, more focused modules?**
  _Cohesion score 0.06516290726817042 - nodes in this community are weakly interconnected._
- **Should `Desktop Bindings and Window` be split into smaller, more focused modules?**
  _Cohesion score 0.09191919191919191 - nodes in this community are weakly interconnected._
- **Should `Grammar and Input Registry` be split into smaller, more focused modules?**
  _Cohesion score 0.09268292682926829 - nodes in this community are weakly interconnected._
- **Should `Build Config and Tasks` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._