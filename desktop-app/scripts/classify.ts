// Calls the TypeSafe Jev decisions API with the checked-in schema.
// Run: deno task classify [--schema <path>] [--env <path>] [--state '<json|string>'] [--dry-run]
import { dirname, fromFileUrl, join } from "std/path";

const OPEN_ROUTER_DECISIONS_URL = "https://openrouter.ai/api/alpha/decisions";

const USAGE_TEXT = `Usage: deno task classify [options]

Options:
  --schema <path>   Path to jev-schema.json (default: <repo>/plan/jev-schema.json)
  --env <path>      Path to .env holding OPENROUTER_API_KEY (default: <repo>/.env)
  --state <json>    Override schema state; raw strings stay strings (state accepts any JSON)
  --dry-run         Print the request body without calling the API
  --help            Show this text`;

interface ClassifyOptions {
  schemaPath: string;
  envPath: string;
  stateOverride: unknown;
  hasStateOverride: boolean;
  dryRun: boolean;
}

function parseCommandLineArguments(argumentValues: string[], repositoryRoot: string): ClassifyOptions {
  const options: ClassifyOptions = {
    schemaPath: join(repositoryRoot, "plan", "jev-schema.json"),
    envPath: join(repositoryRoot, ".env"),
    stateOverride: undefined,
    hasStateOverride: false,
    dryRun: false,
  };
  for (let index = 0; index < argumentValues.length; index += 1) {
    const argument = argumentValues[index];
    if (argument === "--help" || argument === "-h") {
      console.log(USAGE_TEXT);
      Deno.exit(0);
    }
    if (argument === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (argument === "--schema" || argument === "--env" || argument === "--state") {
      const value = argumentValues[index + 1];
      if (value === undefined) {
        throw new Error(`Missing value for ${argument}`);
      }
      index += 1;
      if (argument === "--schema") {
        options.schemaPath = value;
      } else if (argument === "--env") {
        options.envPath = value;
      } else {
        options.hasStateOverride = true;
        try {
          options.stateOverride = JSON.parse(value);
        } catch {
          // Jev state accepts a plain string, so keep raw text as-is.
          options.stateOverride = value;
        }
      }
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

// Deno with --allow-env reads the ambient environment, but the script must
// also work when invoked elsewhere, so parse the file only for the missing key.
async function loadApiKeyFromEnvFile(envPath: string): Promise<string | null> {
  const ambientKey = Deno.env.get("OPENROUTER_API_KEY");
  if (ambientKey) return ambientKey;
  let envText: string;
  try {
    envText = await Deno.readTextFile(envPath);
  } catch {
    return null;
  }
  for (const line of envText.split(/\r?\n/)) {
    const trimmedLine = line.trim();
    if (trimmedLine === "" || trimmedLine.startsWith("#")) continue;
    const separatorIndex = trimmedLine.indexOf("=");
    if (separatorIndex < 0) continue;
    const key = trimmedLine.slice(0, separatorIndex).trim();
    if (key !== "OPENROUTER_API_KEY") continue;
    let value = trimmedLine.slice(separatorIndex + 1).trim();
    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    return value || null;
  }
  return null;
}

interface JevSchemaFile {
  model: string;
  state: unknown;
  questions: Record<string, unknown>;
}

async function loadDecisionRequestBody(schemaPath: string, options: ClassifyOptions): Promise<JevSchemaFile> {
  let schemaText: string;
  try {
    schemaText = await Deno.readTextFile(schemaPath);
  } catch {
    throw new Error(`Cannot read schema file: ${schemaPath}`);
  }
  const parsedSchema = JSON.parse(schemaText) as Partial<JevSchemaFile>;
  if (typeof parsedSchema.model !== "string" || parsedSchema.model === "") {
    throw new Error(`Schema ${schemaPath} has no "model" string`);
  }
  if (parsedSchema.questions === undefined || typeof parsedSchema.questions !== "object") {
    throw new Error(`Schema ${schemaPath} has no "questions" object`);
  }
  return {
    model: parsedSchema.model,
    state: options.hasStateOverride ? options.stateOverride : parsedSchema.state,
    questions: parsedSchema.questions as Record<string, unknown>,
  };
}

async function postDecisionRequestBody(requestBody: JevSchemaFile, apiKey: string): Promise<void> {
  const response = await fetch(OPEN_ROUTER_DECISIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });
  const responseText = await response.text();
  if (!response.ok) {
    console.error(`OpenRouter error ${response.status}: ${responseText.slice(0, 2000)}`);
    Deno.exit(1);
  }
  try {
    console.log(JSON.stringify(JSON.parse(responseText), null, 2));
  } catch {
    console.log(responseText);
  }
}

const scriptDirectory = dirname(fromFileUrl(import.meta.url));
const repositoryRoot = join(scriptDirectory, "..", "..");
const options = parseCommandLineArguments(Deno.args, repositoryRoot);
const apiKey = await loadApiKeyFromEnvFile(options.envPath);
if (!apiKey) {
  console.error(`OPENROUTER_API_KEY not found in environment or ${options.envPath}`);
  Deno.exit(1);
}
const requestBody = await loadDecisionRequestBody(options.schemaPath, options);
if (options.dryRun) {
  console.log(JSON.stringify(requestBody, null, 2));
} else {
  await postDecisionRequestBody(requestBody, apiKey);
}
