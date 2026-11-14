#!/usr/bin/env node
// datagen/deploy.mjs - deploy BP and RP to games/com.mojang development folders
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJson } from "./lib/util.mjs";
import { deployPacks } from "./lib/deploy.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

const args = new Set(process.argv.slice(2).filter((a) => !a.includes("=")));
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.includes("=")).map((a) => a.replace(/^--/, "").split("=")));

async function main() {
  const cfg = await readJson(path.join(HERE, "config.json"));
  const dryRun = args.has("--dry-run");
  const targetDir = opt.target || null;

  const result = await deployPacks({ root: ROOT, cfg, targetDir, dryRun });
  if (!result.ok) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Deploy failed:", err.message);
  process.exit(1);
});
