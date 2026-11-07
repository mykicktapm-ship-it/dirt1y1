import { spawnSync } from "node:child_process";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tempParent = realpathSync(tmpdir());
const output = mkdtempSync(join(tempParent, "dc-contracts-"));
try {
  const config = ts.convertCompilerOptionsFromJson(
    {
      target: "ES2020",
      module: "CommonJS",
      moduleResolution: "Node",
      lib: ["ESNext", "DOM", "DOM.Iterable"],
      types: ["node"],
      typeRoots: [join(root, "node_modules/@types")],
      strict: true,
      skipLibCheck: true,
      esModuleInterop: true,
      resolveJsonModule: true,
      noEmitOnError: true,
      rootDir: root,
      outDir: output,
    },
    root,
  );
  const files = [
    "src/dc-chain/balances.ts",
    "src/dc-chain/market.ts",
    "src/dc-chain/leaderboard.ts",
    "src/dc-chain/pump-curve.ts",
    "src/dc-chain/item-markets.ts",
    "src/dc-chain/item-holdings.ts",
    "src/dc-chain/pump-swap.ts",
    "src/dc-chain/item-market-view.ts",
    "src/resources/launch.ts",
    "src/dc-ui/feedback/entrance-preload.ts",
    "src/resources/marketplace.ts",
    "src/utils/tierSystem.ts",
  ];
  const program = ts.createProgram(
    files.map((path) => join(root, path)),
    config.options,
  );
  const diagnostics = [...config.errors, ...ts.getPreEmitDiagnostics(program)];
  if (diagnostics.length)
    throw new Error(
      ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCurrentDirectory: () => root,
        getCanonicalFileName: (name) => name,
        getNewLine: () => "\n",
      }),
    );
  if (program.emit().emitSkipped) throw new Error("Contract source compilation failed");
  const result = spawnSync(
    process.execPath,
    [
      "--test",
      join(root, "tests/contracts.test.cjs"),
      join(root, "tests/item-markets.test.cjs"),
      join(root, "tests/item-holdings.test.cjs"),
      join(root, "tests/item-market-view.test.cjs"),
      join(root, "tests/pump-curve-quotes.test.cjs"),
      join(root, "tests/entrance-preload.test.cjs"),
    ],
    {
      cwd: root,
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_ENV: "test",
        NODE_PATH: [join(root, "node_modules"), process.env.NODE_PATH]
          .filter(Boolean)
          .join(delimiter),
        DC_CONTRACT_BUILD: output,
      },
    },
  );
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  // Remove only this run's freshly allocated directory, never a caller-supplied path.
  const actual = realpathSync(output);
  if (dirname(actual) !== tempParent || !actual.startsWith(join(tempParent, "dc-contracts-"))) {
    console.error("Unexpected contract-test output location; refusing cleanup");
    process.exitCode = 1;
  } else {
    rmSync(actual, { recursive: true, force: true });
  }
}
