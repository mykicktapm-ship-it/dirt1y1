import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(resolve(root, name), "utf8");
const registry = JSON.parse(read("docs/context-map.json"));
const scripts = JSON.parse(read("package.json")).scripts;

function localPath(name) {
  const path = resolve(root, name);
  const rel = relative(root, path);
  assert(
    !isAbsolute(rel) && rel !== ".." && !rel.startsWith(`..${sep}`),
    `Outside project: ${name}`,
  );
  assert(existsSync(path), `Missing path: ${name}`);
  return path;
}

function select(keys) {
  const selected = keys.map((key) => {
    assert(Object.hasOwn(registry.domains, key), `Unknown domain: ${key}`);
    return registry.domains[key];
  });
  return {
    documents: [...new Set([...registry.shared, ...selected.map((item) => item.contract)])],
    entrypoints: [...new Set(selected.flatMap((item) => item.entrypoints))],
    checks: [...new Set(selected.flatMap((item) => item.checks))],
  };
}

function markdownFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(path);
    return entry.name.endsWith(".md") ? [path] : [];
  });
}

function check() {
  assert.equal(registry.version, 1);
  for (const key of Object.keys(registry.domains)) {
    const selection = select([key]);
    for (const path of [...selection.documents, ...selection.entrypoints]) localPath(path);
    for (const command of selection.checks)
      assert(Object.hasOwn(scripts, command), `Missing check: ${command}`);
    assert(!selection.documents.some((path) => path.startsWith("docs/roadmap/")));
  }
  const files = ["AGENTS.md", "README.md"].map((name) => resolve(root, name));
  files.push(...markdownFiles(resolve(root, "docs")));
  let links = 0;
  for (const file of files) {
    const body = readFileSync(file, "utf8").replace(/```[\s\S]*?```/g, "");
    for (const match of body.matchAll(/\[[^\]\n]*\]\(([^)\s]+)\)/g)) {
      const target = match[1];
      if (/^(?:[a-z][a-z\d+.-]*:|#)/i.test(target)) continue;
      const path = decodeURIComponent(target.split("#")[0]);
      localPath(relative(root, resolve(dirname(file), path)));
      links++;
    }
  }
  const cases = JSON.parse(read("docs/evals/context-cases.json")).cases;
  const measures = cases.map((item) => {
    const selection = select(item.domains);
    const paths = [...selection.documents, ...selection.entrypoints];
    for (const name of item.mustInclude)
      assert(paths.includes(name), `${item.task}: missing ${name}`);
    for (const name of item.mustExclude)
      assert(!paths.includes(name), `${item.task}: unwanted ${name}`);
    return {
      domains: item.domains.join("+"),
      documentBytes: selection.documents.reduce(
        (sum, path) => sum + statSync(localPath(path)).size,
        0,
      ),
    };
  });
  console.log(
    JSON.stringify(
      {
        result: "PASS",
        domains: Object.keys(registry.domains).length,
        localLinks: links,
        routingCases: cases.length,
        measures,
        limitation: "Path/routing/byte checks only; no model-quality or token benchmark.",
      },
      null,
      2,
    ),
  );
}

try {
  const keys = process.argv.slice(2);
  if (keys[0] === "--check") check();
  else if (!keys.length)
    console.log(
      `Select a task area: ${Object.keys(registry.domains).join(", ")}\nExample: npm run context -- dashboard data`,
    );
  else console.log(JSON.stringify(select(keys), null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
