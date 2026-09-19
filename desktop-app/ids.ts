// Command Centre command IDs — CVCV-CVCV-CVCV (plan task C1).
// C = consonant (18-letter friendly set, drops q/x/y), V = vowel.
// Example: sami-siru-sona.

const CONSONANTS = "bcdfghjklmnpqrstvwz".split("").filter((c) =>
  !"qxy".includes(c)
).join("");
// NOTE: keep exactly the 18 approved letters (no q, x, y).
export const ID_CONSONANTS = CONSONANTS;
export const ID_VOWELS = "aeiou";

const GROUP_RE = `[${ID_CONSONANTS}][${ID_VOWELS}][${ID_CONSONANTS}][${ID_VOWELS}]`;
const ID_RE = new RegExp(`^${GROUP_RE}-${GROUP_RE}-${GROUP_RE}$`);

function randOf(alphabet: string): string {
  // crypto.getRandomValues when available (browser/CEF + Deno), else Math.random.
  try {
    const g = globalThis as unknown as {
      crypto?: { getRandomValues?: (a: Uint32Array) => void; randomUUID?: () => string };
    };
    if (g.crypto?.getRandomValues) {
      const buf = new Uint32Array(1);
      g.crypto.getRandomValues(buf);
      return alphabet[buf[0] % alphabet.length];
    }
  } catch {
    // fall through
  }
  return alphabet[Math.floor(Math.random() * alphabet.length)];
}

function syllable(): string {
  return randOf(ID_CONSONANTS) + randOf(ID_VOWELS) + randOf(ID_CONSONANTS) +
    randOf(ID_VOWELS);
}

/** Random CVCV-CVCV-CVCV id, e.g. "sami-siru-sona". */
export function generateCommandId(): string {
  return `${syllable()}-${syllable()}-${syllable()}`;
}

/** Strict validator: lowercase CVCV groups only. Legacy ids fail. */
export function isValidCommandId(id: unknown): id is string {
  return typeof id === "string" && ID_RE.test(id);
}

/** Generate an id not in `exists`. Retries on collision (practically never). */
export function ensureUniqueCommandId(
  exists: (id: string) => boolean,
  maxTries = 100,
): string {
  for (let i = 0; i < maxTries; i++) {
    const id = generateCommandId();
    if (!exists(id)) return id;
  }
  throw new Error("could not generate a unique command id");
}

// Re-export for tests (locks the 18-letter set).
export { CONSONANTS };
