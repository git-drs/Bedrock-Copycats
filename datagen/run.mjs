#!/usr/bin/env node
// datagen/run.mjs - generate every copycat variant block + script registry from real vanilla data.
//
//   node datagen/run.mjs              regenerate (only changed files are written)
//   node datagen/run.mjs --check      write nothing; exit 1 if anything is out of date (CI / pre-build)
//   node datagen/run.mjs --watch      re-run when base blocks/config change, and poll upstream (--interval=minutes, default 60)
//   node datagen/run.mjs --offline    use the download cache only
//   node datagen/run.mjs --refresh    ignore the cache and re-download everything
//   node datagen/run.mjs --stats      print counts and exit (no writes)
import path from "node:path";
import { promises as fs, watch as fsWatch } from "node:fs";
import { fileURLToPath } from "node:url";
import { Downloader } from "./lib/fetch.mjs";
import { loadVanilla } from "./lib/vanilla.mjs";
import { deriveMaterials } from "./lib/materials.mjs";
import { assignGroups, diffLocks } from "./lib/groups.mjs";
import { loadShapes } from "./lib/shapes.mjs";
import { planGeometryPatches } from "./lib/geometry.mjs";
import { buildVariantBlock, buildRegistryModule, buildBlocksJson, buildLootTable, mergeLang, variantId } from "./lib/emit.mjs";
import { Plan, applyPlan } from "./lib/output.mjs";
import { validate } from "./lib/validate.mjs";
import { deployPacks } from "./lib/deploy.mjs";
import { readJson, sha256, toJson, log, posix, sortKeys } from "./lib/util.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const args = new Set(process.argv.slice(2).filter((a) => !a.includes("=")));
const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.includes("=")).map((a) => a.replace(/^--/, "").split("=")));

async function generate({ check = false, statsOnly = false, offline = false, refresh = false } = {}) {
  const cfg = await readJson(path.join(HERE, "config.json"));
  const overrides = await readJson(path.join(HERE, "overrides.json"));
  const lockPath = path.join(HERE, "lock.json");
  const prevLock = await readJson(lockPath, null);
  const bpDir = path.join(ROOT, cfg.paths.bp), rpDir = path.join(ROOT, cfg.paths.rp);
  const rel = (abs) => posix(path.relative(ROOT, abs));
  const dl = new Downloader({ cacheDir: path.join(HERE, "cache"), offline, refresh });

  log.step("Loading vanilla data");
  const vanilla = await loadVanilla(dl, cfg, log);
  log.info(`  Minecraft ${vanilla.engineVersion} (Mojang/bedrock-samples) | collision data ${vanilla.mcdVersion}${vanilla.mcdExact ? "" : "  <- older than the game version; new blocks may be skipped"}`);
  log.info(`  ${vanilla.blockNames.length} vanilla blocks, ${vanilla.itemNames.size} items`);

  log.step("Deriving materials (full cubes, textures, sounds, alpha)");
  const mats = await deriveMaterials({ vanilla, dl, cfg, overrides });
  mats.warnings.forEach((w) => log.warn(w));
  log.info(`  ${mats.materials.length} materials from ${mats.texturesClassified} texture files`);

  log.step("Reading base shapes");
  const shapes = await loadShapes({ cfg, bpDir, overrides, log });
  const texturable = shapes.filter((s) => s.texturable);
  log.info(`  ${shapes.length} base shapes, ${texturable.length} texturable: ${texturable.map((s) => s.name).join(", ")}`);

  const { lock, groups } = assignGroups(mats.materials, prevLock, { groupSize: cfg.blocks.groupSize });
  const lockDiff = diffLocks(prevLock, lock);
  const materialsByName = new Map(mats.materials.map((m) => [m.name, m]));
  log.info(`  ${groups.length} groups -> ${groups.length * texturable.length} generated blocks (${groups.length} x ${texturable.length})`);
  if (statsOnly) return { ok: true };

  // ---- build the plan
  const plan = new Plan();
  const blocks = [];
  for (const shape of texturable) for (const group of groups) {
    const json = buildVariantBlock({ cfg, shape, group, materialsByName });
    blocks.push({ shape, group, json });
    plan.add(`${cfg.paths.bp}/${cfg.blocks.generatedDir}/${shape.name}/${variantId(cfg, shape, group).split(":")[1]}.block.json`, toJson(json));
  }
  for (const shape of shapes) plan.add(`${cfg.paths.bp}/${shape.lootPath}`, buildLootTable(shape), "adopt");

  const rpTerrain = await readJson(path.join(rpDir, "textures/terrain_texture.json"), null);
  const errors = validate({ cfg, vanilla, shapes, groups, blocks, rpTerrain, warn: log.warn });
  if (errors.length) { errors.slice(0, 20).forEach((e) => console.error("  x ", e)); throw new Error(`${errors.length} validation error(s); nothing written`); }

  const fingerprint = sha256(JSON.stringify([sortKeys(vanilla.hashes), mats.materials, groups.map((g) => [g.id, g.values]), shapes.map((s) => sha256(JSON.stringify(s.json))), cfg, overrides])).slice(0, 16);
  plan.add(`${cfg.paths.bp}/${cfg.scripts.registryFile}`, buildRegistryModule({ cfg, vanilla, shapes, groups, materials: mats.materials, fingerprint }));

  const readOr = async (p) => fs.readFile(p, "utf8").catch(() => null);
  const existingBlocksJson = await readOr(path.join(rpDir, "blocks.json"));
  plan.add(`${cfg.paths.rp}/blocks.json`, buildBlocksJson({ cfg, shapes, groups, existing: existingBlocksJson ? JSON.parse(existingBlocksJson) : null }), "merge");

  const baseNames = new Map();
  const langExisting = await readOr(path.join(rpDir, "texts/en_US.lang"));
  for (const s of shapes) { const m = (langExisting ?? "").match(new RegExp(`^tile\\.${s.id.replace(":", "\\:")}\\.name=(.*)$`, "m")); if (m) baseNames.set(s.id, m[1].trim()); }
  plan.add(`${cfg.paths.rp}/texts/en_US.lang`, mergeLang({ cfg, shapes, groups, existing: langExisting, baseNames }), "merge");

  if (cfg.geometry.tagFaces) for (const p of await planGeometryPatches({ cfg, rpDir, root: ROOT })) plan.add(p.rel, p.content, "merge");

  log.step(check ? "Checking generated files (no writes)" : "Writing files");
  const res = await applyPlan({
    root: ROOT, plan, check,
    manifestPath: path.join(HERE, "manifest.json"),
    ownedDirs: [`${cfg.paths.bp}/${cfg.blocks.generatedDir}`],
  });
  if (!check) await fs.writeFile(lockPath, toJson(lock));

  const n = (a) => String(a.length).padStart(5);
  log.info(`${n(res.created)} created\n${n(res.updated)} updated\n${n(res.deleted)} removed (no longer generated)\n${n(res.same)} unchanged`);
  for (const [label, list] of [["created", res.created], ["updated", res.updated], ["removed", res.deleted]]) {
    if (list.length && list.length <= 15) list.forEach((f) => log.info(`        ${label}: ${f}`));
  }
  res.skipped.forEach((s) => log.warn(s));
  if (res.handEdited.length) log.warn(`${res.handEdited.length} generated file(s) had manual edits and were overwritten (edit the base blocks / overrides instead)`);
  if (lockDiff.added.length) log.info(`New materials this run: ${lockDiff.added.slice(0, 30).join(", ")}${lockDiff.added.length > 30 ? ", ..." : ""}`);
  const retired = groups.flatMap((g) => g.retired.map((r) => `${r} (${g.id})`));
  if (retired.length) log.warn(`Retired materials (no longer in vanilla; kept so old worlds load): ${retired.join(", ")}`);

  if (!check) await writeReport({ cfg, vanilla, mats, groups, shapes, res, fingerprint, lockDiff, retired });

  const shouldDeploy = !check && !statsOnly && !args.has("--no-deploy") && (cfg.deploy?.enabled !== false || args.has("--deploy"));
  if (shouldDeploy) {
    await deployPacks({ root: ROOT, cfg, targetDir: opt.target || null });
  }

  return { ok: !(check && res.drift), res };
}

async function writeReport({ cfg, vanilla, mats, groups, shapes, res, fingerprint, lockDiff, retired }) {
  const L = [];
  L.push(`# datagen report`, "", `- Minecraft snapshot: **${vanilla.engineVersion}** (collision data ${vanilla.mcdVersion})`, `- Fingerprint: \`${fingerprint}\``,
    `- Materials: ${mats.materials.length} | groups: ${groups.length} | texturable shapes: ${shapes.filter((s) => s.texturable).length} | generated blocks: ${groups.length * shapes.filter((s) => s.texturable).length}`,
    `- Last run: ${res.created.length} created, ${res.updated.length} updated, ${res.deleted.length} removed, ${res.same.length} unchanged`);
  if (lockDiff.added.length) L.push(`- New materials: ${lockDiff.added.join(", ")}`);
  if (retired.length) L.push(`- Retired materials: ${retired.join(", ")}`);
  if (mats.supplementsUsed.length) L.push(`- Supplemented from overrides.json: ${mats.supplementsUsed.join(", ")}`);
  L.push("", "## Skipped vanilla blocks", "");
  for (const [reason, list] of Object.entries(mats.skipped).sort((a, b) => b[1].length - a[1].length)) {
    L.push(`- **${list.length}** ${reason}${list.length <= 25 ? `: ${list.join(", ")}` : ""}`);
  }
  L.push("", "## Groups", "", "| group | sound | render | materials |", "|---|---|---|---|");
  for (const g of groups) L.push(`| ${g.id} | ${g.sound} | ${g.render} | ${g.values.join(", ")} |`);
  await fs.writeFile(path.join(HERE, "REPORT.md"), L.join("\n") + "\n");
}

async function main() {
  const flags = { check: args.has("--check"), statsOnly: args.has("--stats"), offline: args.has("--offline"), refresh: args.has("--refresh") };
  const once = async () => {
    try { return await generate(flags); } catch (e) { console.error("\ndatagen failed:", e.message); if (process.env.DEBUG) console.error(e.stack); return { ok: false }; }
  };
  if (!args.has("--watch")) { const r = await once(); if (flags.check && !r.ok) console.error("\nOut of date. Run: node datagen/run.mjs"); process.exit(r.ok ? 0 : 1); }

  // watch mode: local edits trigger a (cached) rebuild; upstream is re-checked on an interval
  const minutes = Number(opt.interval || 60);
  let timer, running = false;
  const trigger = (why, f = {}) => { clearTimeout(timer); timer = setTimeout(async () => { if (running) return; running = true; log.step(`Change detected (${why})`); await generate({ ...flags, ...f }).catch((e) => console.error(e.message)); running = false; }, 600); };
  await once();
  const cfg = await readJson(path.join(HERE, "config.json"));
  for (const target of [path.join(ROOT, cfg.paths.bp, cfg.blocks.baseDir), path.join(ROOT, cfg.paths.rp, cfg.geometry.dir), path.join(HERE, "config.json"), path.join(HERE, "overrides.json")]) {
    try { fsWatch(target, { recursive: true }, (_, f) => { if (!String(f || "").endsWith(".tmp")) trigger(posix(path.relative(ROOT, target)), { offline: true }); }); } catch (e) { log.warn(`cannot watch ${target}: ${e.message}`); }
  }
  setInterval(() => trigger("upstream poll"), minutes * 60000);
  log.info(`\nWatching base blocks, geometry, config and upstream vanilla data (every ${minutes} min). Ctrl+C to stop.`);
}
main();
