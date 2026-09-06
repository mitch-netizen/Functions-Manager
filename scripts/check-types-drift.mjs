#!/usr/bin/env node
// Guards against a migration landing without lib/types/database.types.ts
// being regenerated. Not a byte-exact diff against the generator's raw
// output: this file intentionally deviates from it in two documented ways
// (see the file's own header and DECISIONS.md) — a handful of
// `create_public_enquiry` args are widened to `| null`, and a block of
// convenience Enum aliases is appended — so instead this compares the set
// of table/enum/function names on each side, which is what actually
// signals "a migration changed the schema and types were never
// regenerated."
import { readFileSync } from "node:fs";

// `supabase gen types typescript --local` includes the local stack's
// `graphql_public` schema (from the pg_graphql extension) ahead of `public`
// in its output, while the Management API path used to generate the
// committed file does not emit it at all. Scoping every lookup to the
// `public: { ... }` block specifically (rather than the first "Tables: {"
// /"Functions: {" match anywhere in the file) keeps this comparison correct
// regardless of schema ordering or which schemas either side includes.
function publicSchemaBlock(source) {
  const label = "public: {";
  const blockStart = source.indexOf(label);
  if (blockStart === -1) throw new Error(`could not find "${label}" block`);

  let depth = 0;
  let i = source.indexOf("{", blockStart);
  const blockContentStart = i + 1;
  for (; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) break;
    }
  }
  return source.slice(blockContentStart, i);
}

function namesUnderBlock(source, blockLabel) {
  const blockStart = source.indexOf(`${blockLabel}: {`);
  if (blockStart === -1) throw new Error(`could not find "${blockLabel}: {" block`);

  let depth = 0;
  let i = source.indexOf("{", blockStart);
  const blockContentStart = i + 1;
  for (; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) break;
    }
  }
  const body = source.slice(blockContentStart, i);

  const names = new Set();
  for (const match of body.matchAll(/^\s{6}(\w+): \{/gm)) {
    names.add(match[1]);
  }
  return names;
}

function diffSets(a, b) {
  const onlyInA = [...a].filter((x) => !b.has(x));
  const onlyInB = [...b].filter((x) => !a.has(x));
  return { onlyInA, onlyInB };
}

const generatedPath = process.argv[2];
const committedPath = process.argv[3] ?? "lib/types/database.types.ts";

const generatedPublic = publicSchemaBlock(readFileSync(generatedPath, "utf8"));
const committedPublic = publicSchemaBlock(readFileSync(committedPath, "utf8"));

let failed = false;
for (const block of ["Tables", "Functions", "Enums"]) {
  const { onlyInA: onlyInGenerated, onlyInB: onlyInCommitted } = diffSets(
    namesUnderBlock(generatedPublic, block),
    namesUnderBlock(committedPublic, block)
  );
  if (onlyInGenerated.length > 0 || onlyInCommitted.length > 0) {
    failed = true;
    console.error(`Mismatch in "${block}":`);
    if (onlyInGenerated.length > 0) console.error(`  in the live schema but missing from the committed file: ${onlyInGenerated.join(", ")}`);
    if (onlyInCommitted.length > 0) console.error(`  in the committed file but not the live schema: ${onlyInCommitted.join(", ")}`);
  }
}

if (failed) {
  console.error(
    "\nlib/types/database.types.ts looks out of date. Regenerate it (mcp__Supabase__generate_typescript_types or " +
      "`supabase gen types typescript --local`), reapply the two documented deviations described in its file header " +
      "and in DECISIONS.md, and commit the result."
  );
  process.exit(1);
}

console.log("database.types.ts matches the live schema's table/function/enum names.");
