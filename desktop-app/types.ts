// Command Centre contracts — task C1 (lean persistence model).
//
// DB row (the index): id/command/title/description/source_folder/tags
// (+ created_at/updated_at). Everything else lives in the
// {id}.metadata.json sidecar (MetadataDoc).
import { z } from "zod";
import { ID_CONSONANTS, ID_VOWELS } from "./ids.ts";

// ── Command id: CVCV-CVCV-CVCV ─────────────────────────────────────────────
const g = `[${ID_CONSONANTS}][${ID_VOWELS}][${ID_CONSONANTS}][${ID_VOWELS}]`;
export const CommandIdSchema = z.string().regex(
  new RegExp(`^${g}-${g}-${g}$`),
  "must be CVCV-CVCV-CVCV (e.g. sami-siru-sona)",
);
export type CommandId = z.infer<typeof CommandIdSchema>;

// ── Lean DB row ─────────────────────────────────────────────────────────────
export const CommandRowSchema = z.object({
  id: CommandIdSchema,
  command: z.string().min(1),
  title: z.string().min(1).max(100),
  description: z.string().default(""),
  source_folder: z.string().default(""),
  tags: z.array(z.string().min(1).max(40)).default([]),
  created_at: z.number().int(),
  updated_at: z.number().int(),
});
export type CommandRow = z.infer<typeof CommandRowSchema>;

// Back-compat input: old field names (name/cmd/desc/cwd/tag) map to the row.
export const LegacyCommandInputSchema = z.object({
  id: z.string().optional(),
  command: z.string().optional(),
  cmd: z.string().optional(),
  title: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  desc: z.string().optional(),
  source_folder: z.string().optional(),
  cwd: z.string().optional(),
  workingDirectory: z.string().optional(),
  tags: z.union([z.array(z.string()), z.string()]).optional(),
  tag: z.string().optional(),
}).passthrough();
export type LegacyCommandInput = z.infer<typeof LegacyCommandInputSchema>;

// ── Sidecar metadata (§1.4 export doc, version 2 + runtime fields) ──────────
export const MetaOptionSchema = z.object({
  value: z.string(),
  label: z.string().optional(),
  description: z.string().optional(),
}).passthrough();

export const MetaVariableSchema = z.object({
  token: z.string().optional(),
  key: z.string().optional(),
  iid: z.string().optional(),
  occ: z.number().int().optional(),
  total: z.number().int().optional(),
  type: z.string().optional(),
  name: z.string().optional(),
  params: z.string().optional(),
  auto: z.boolean().optional(),
  default: z.string().optional(),
  label: z.string().optional(),
  description: z.string().optional(),
  options: z.array(MetaOptionSchema).optional(),
  example: z.string().optional(),
  checkedDef: z.boolean().nullable().optional(),
  optionsArr: z.array(z.string()).nullable().optional(),
  rangeDef: z.object({
    min: z.number(),
    max: z.number(),
    def: z.string(),
  }).nullable().optional(),
}).passthrough();
export type MetaVariable = z.infer<typeof MetaVariableSchema>;

export const AskModeSchema = z.enum(["every", "once"]);
export type AskMode = z.infer<typeof AskModeSchema>;

export const ShellIdSchema = z.enum(["powershell", "bash", "ubuntu"]);
export type ShellId = z.infer<typeof ShellIdSchema>;

export const MetadataDocSchema = z.object({
  app: z.literal("command-center").default("command-center"),
  kind: z.literal("command-metadata").default("command-metadata"),
  version: z.literal(2).default(2),
  id: z.string().min(1),
  askMode: AskModeSchema.default("every"),
  shell: ShellIdSchema.optional(),
  fromHub: z.string().nullable().optional(),
  custom: z.boolean().optional(),
  variables: z.array(MetaVariableSchema).default([]),
  values: z.record(z.string()).default({}),
}).passthrough();
export type MetadataDoc = z.infer<typeof MetadataDocSchema>;

export function defaultMetadata(id: string): MetadataDoc {
  return {
    app: "command-center",
    kind: "command-metadata",
    version: 2,
    id,
    askMode: "every",
    variables: [],
    values: {},
  };
}

// ── §1.4 wire format (publish handoff — field renames are the contract) ─────
export const WireMetadataSchema = z.object({
  app: z.string().optional(),
  kind: z.string().optional(),
  version: z.number().optional(),
  id: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  command: z.string().min(1).optional(),
  workingDirectory: z.string().optional(),
  tag: z.union([z.string(), z.array(z.string())]).optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  askMode: z.string().optional(),
  variables: z.array(MetaVariableSchema).optional(),
}).passthrough();
export type WireMetadata = z.infer<typeof WireMetadataSchema>;

// ── Settings (§8.8) ─────────────────────────────────────────────────────────
export const AppSettingsSchema = z.object({
  shell: ShellIdSchema.default("powershell"),
  confirmRun: z.boolean().default(true),
  keepTerminalOpen: z.boolean().default(true),
  maxOutputLines: z.number().int().min(100).max(50000).default(5000),
  hubApiBase: z.string().default(""),
  lastTab: z.string().default("commands"),
  listView: z.enum(["list", "grid"]).default("list"),
  sortBy: z.string().default("name-asc"),
  lastFolder: z.string().nullable().default(null),
}).passthrough();
export type AppSettings = z.infer<typeof AppSettingsSchema>;

export const DEFAULT_SETTINGS: AppSettings = {
  shell: "powershell",
  confirmRun: true,
  keepTerminalOpen: true,
  maxOutputLines: 5000,
  hubApiBase: "",
  lastTab: "commands",
  listView: "list",
  sortBy: "name-asc",
  lastFolder: null,
};

// ── Run contract (§7.5; execution itself lands in D2) ───────────────────────
export const RunRequestSchema = z.object({
  commandId: z.string().min(1),
  shell: ShellIdSchema,
  cwd: z.string().min(1),
  line: z.string().min(1),
  allowUnresolved: z.boolean().default(false),
});
export type RunRequest = z.infer<typeof RunRequestSchema>;

// ── Hub / publish query shapes (full routes land in Phase F) ────────────────
export const HubQuerySchema = z.object({
  q: z.string().default(""),
  pkg: z.string().default(""),
  sort: z.string().default("adds"),
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(60),
}).passthrough();

export const SubmitRequestSchema = z.object({
  commandId: z.string().min(1).optional(),
  name: z.string().min(2),
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  installScript: z.string().default(""),
  notes: z.string().default(""),
  metadata: WireMetadataSchema.optional(),
}).passthrough();
export type SubmitRequest = z.infer<typeof SubmitRequestSchema>;
