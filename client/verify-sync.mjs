import { readFileSync } from "fs";

/**
 * Proves api-client.mjs's apiFetch logic actually matches
 * reference-api.js (the real src/lib/api.js as of D1.10), rather than
 * just asserting that in a comment. The only expected difference is
 * the base-URL line (import.meta.env vs process.env) - everything
 * else should be identical after removing that one line and
 * normalizing whitespace.
 */
function extractFunctionBody(source) {
  const match = source.match(/export async function apiFetch[\s\S]*$/);
  if (!match) throw new Error("Could not find apiFetch in source");
  return match[0]
    .split("\n")
    .filter((line) => !line.includes("API_BASE_URL =")) // the one expected difference
    .join("\n")
    .replace(/\s+/g, " ")
    .trim();
}

const real = extractFunctionBody(readFileSync(new URL("./reference-api.js", import.meta.url), "utf-8"));
const testHarness = extractFunctionBody(readFileSync(new URL("./api-client.mjs", import.meta.url), "utf-8"));

if (real === testHarness) {
  console.log("PASS: api-client.mjs's apiFetch logic matches the real src/lib/api.js exactly");
  console.log("      (excluding the expected process.env vs import.meta.env difference)");
} else {
  console.log("FAIL: api-client.mjs has drifted from the real src/lib/api.js");
  console.log("--- real ---");
  console.log(real);
  console.log("--- test harness ---");
  console.log(testHarness);
  process.exit(1);
}
