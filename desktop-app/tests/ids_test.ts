// Task C1: CVCV id contract.
import { assert, assertEquals } from "jsr:@std/assert@^1";
import {
  ensureUniqueCommandId,
  generateCommandId,
  ID_CONSONANTS,
  ID_VOWELS,
  isValidCommandId,
} from "../ids.ts";

Deno.test("consonant set is the approved 18 letters", () => {
  assertEquals(ID_CONSONANTS.length, 18);
  assertEquals(ID_VOWELS, "aeiou");
  for (const bad of ["q", "x", "y"]) {
    assert(!ID_CONSONANTS.includes(bad), `must exclude ${bad}`);
  }
});

Deno.test("generated ids match CVCV-CVCV-CVCV", () => {
  for (let i = 0; i < 50; i++) {
    const id = generateCommandId();
    assert(isValidCommandId(id), id);
    assertEquals(id.split("-").length, 3);
    for (const grp of id.split("-")) {
      assertEquals(grp.length, 4);
      assert(ID_CONSONANTS.includes(grp[0]), grp);
      assert(ID_VOWELS.includes(grp[1]), grp);
      assert(ID_CONSONANTS.includes(grp[2]), grp);
      assert(ID_VOWELS.includes(grp[3]), grp);
    }
  }
});

Deno.test("spec example is valid", () => {
  assert(isValidCommandId("sami-siru-sona"));
});

Deno.test("10k ids are unique", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 10_000; i++) seen.add(generateCommandId());
  // Collision chance at this entropy is ~nil; allow 1 in the pathological case.
  assert(seen.size >= 9999, `only ${seen.size} unique`);
});

Deno.test("validator rejects legacy and malformed ids", () => {
  for (
    const bad of [
      "",
      "u1757740800000",
      "hub-abc-123",
      "seed-ffmpeg-stream",
      "SAMI-SIRU-SONA",
      "sami_siru_sona",
      "sami-siru",
      "sami-siru-sonax",
      "sami-siru-son",
      "1234-5678-9012",
    ]
  ) assert(!isValidCommandId(bad), bad);
});

Deno.test("ensureUniqueCommandId skips taken ids", () => {
  const taken = new Set([generateCommandId()]);
  const id = ensureUniqueCommandId((c) => taken.has(c));
  assert(isValidCommandId(id));
  assert(!taken.has(id));
});
