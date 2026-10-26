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

// Names directly inside `<blockLabel>: { ... }`, found by brace depth rather
// than indentation, so it reads the generator's raw (unformatted) output and
// the formatted committed file alike. Comments and string literals are skipped.
function namesUnderBlock(source, blockLabel) {
  // Only the public schema (the generator may put graphql_public first).
  // Keys may or may not be quoted, depending on the generator version.
  const publicStart = source.search(/["']?\bpublic["']?\s*:\s*\{/);
  if (publicStart === -1) {
    throw new Error(`could not find the "public: {" schema (${source.length} chars; starts: ${JSON.stringify(source.slice(0, 300))})`);
  }
  const offset = source.slice(publicStart).search(new RegExp(`["']?\\b${blockLabel}["']?\\s*:\\s*\\{`));
  const blockStart = offset === -1 ? -1 : publicStart + offset;
  if (blockStart === -1) throw new Error(`could not find "${blockLabel}: {" block`);

  const names = new Set();
  let depth = 0;
  for (let i = source.indexOf("{", blockStart); i < source.length; i++) {
    const c = source[i];
    if (c === "/" && source[i + 1] === "/") {
      i = source.indexOf("\n", i);
      if (i === -1) break;
    } else if (c === "/" && source[i + 1] === "*") {
      i = source.indexOf("*/", i + 2) + 1;
    } else if (c === '"' || c === "'" || c === "`") {
      const open = i;
      for (i++; i < source.length && source[i] !== c; i++) if (source[i] === "\\") i++;
      // A quoted key, e.g. "enquiries": {
      if (depth === 1 && /^\??\s*:/.test(source.slice(i + 1, i + 20))) names.add(source.slice(open + 1, i));
    } else if (c === "{") {
      depth++;
    } else if (c === "}") {
      depth--;
      if (depth === 0) break;
    } else if (depth === 1 && /[A-Za-z_]/.test(c) && !/[\w$]/.test(source[i - 1] ?? "")) {
      const m = /^(\w+)\??\s*:/.exec(source.slice(i, i + 200));
      if (m) names.add(m[1]);
      i += (m ? m[0].length : 1) - 1;
    }
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

const generated = readFileSync(generatedPath, "utf8");
const committed = readFileSync(committedPath, "utf8");

let failed = false;
for (const block of ["Tables", "Functions", "Enums"]) {
  const { onlyInA: onlyInGenerated, onlyInB: onlyInCommitted } = diffSets(
    namesUnderBlock(generated, block),
    namesUnderBlock(committed, block)
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
