import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "tsup";

const sourceRoot = path.resolve("src");

const resolveAlias = (specifier: string): string => {
  const base = path.join(sourceRoot, specifier.slice(2));
  const candidates = [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")];
  const match = candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  return match ?? base;
};

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  target: "node20",
  clean: true,
  sourcemap: true,
  splitting: false,
  noExternal: ["@agentvault/shared"],
  esbuildPlugins: [
    {
      name: "agentvault-alias",
      setup(build) {
        build.onResolve({ filter: /^@\// }, (args) => ({
          path: resolveAlias(args.path),
        }));
      },
    },
  ],
});
