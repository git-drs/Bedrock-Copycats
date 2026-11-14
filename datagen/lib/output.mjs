// output.mjs - apply a plan of generated files to disk with ownership rules, pruning and --check support.
//
//   owned  : datagen owns the file. Created/overwritten; removed when it is no longer generated.
//   adopt  : file may pre-exist (hand-written). Only created if missing, or overwritten if datagen created it
//            earlier; a differing hand-written file is left alone with a warning.
//   merge  : file is partly hand-written; the new content was computed from the existing file. Never pruned.
import path from "node:path";
import { promises as fs } from "node:fs";
import { sha256, walk, exists, pruneEmptyDirs, readJson, posix } from "./util.mjs";

export class Plan {
  constructor() { this.items = new Map(); }
  add(rel, content, kind = "owned") { this.items.set(rel, { content, kind }); }
}

export async function applyPlan({ root, plan, manifestPath, ownedDirs, check }) {
  const manifest = await readJson(manifestPath, { owned: {} });
  const prevOwned = manifest.owned ?? {};
  const res = { created: [], updated: [], same: [], deleted: [], skipped: [], handEdited: [] };

  for (const [rel, { content, kind }] of [...plan.items].sort(([a], [b]) => a.localeCompare(b))) {
    const abs = path.join(root, rel);
    const had = await exists(abs);
    const current = had ? await fs.readFile(abs, "utf8") : null;
    if (current === content) { res.same.push(rel); continue; }
    if (kind === "adopt" && had && !(rel in prevOwned)) { res.skipped.push(`${rel} (hand-written file differs; left as is)`); continue; }
    if (kind === "owned" && had && rel in prevOwned && sha256(current) !== prevOwned[rel]) res.handEdited.push(rel);
    (had ? res.updated : res.created).push(rel);
    if (!check) {
      await fs.mkdir(path.dirname(abs), { recursive: true });
      await fs.writeFile(abs, content);
    }
  }

  // prune: previously-owned files that are no longer generated, plus strays inside fully-owned directories
  const keep = new Set([...plan.items].filter(([, v]) => v.kind !== "merge").map(([rel]) => rel));
  const stale = new Set(Object.keys(prevOwned).filter((rel) => !keep.has(rel)));
  for (const dir of ownedDirs) for (const f of await walk(path.join(root, dir))) {
    const rel = posix(path.relative(root, f));
    if (!keep.has(rel)) stale.add(rel);
  }
  for (const rel of [...stale].sort()) {
    const abs = path.join(root, rel);
    if (!(await exists(abs))) continue;
    res.deleted.push(rel);
    if (!check) await fs.rm(abs);
  }
  if (!check) {
    for (const dir of ownedDirs) await pruneEmptyDirs(path.join(root, dir));
    const owned = {};
    for (const [rel, { content, kind }] of plan.items) {
      if (kind === "merge") continue;
      if (kind === "adopt" && !(await exists(path.join(root, rel)))) continue;
      const abs = path.join(root, rel);
      const onDisk = await fs.readFile(abs, "utf8");
      if (kind === "adopt" && onDisk !== content) continue; // not ours
      owned[rel] = sha256(onDisk);
    }
    const merged = [...plan.items].filter(([, v]) => v.kind === "merge").map(([rel]) => rel).sort();
    await fs.writeFile(manifestPath, JSON.stringify({ generator: 1, merged, owned: Object.fromEntries(Object.entries(owned).sort(([a], [b]) => a.localeCompare(b))) }, null, "\t") + "\n");
  }
  res.drift = res.created.length + res.updated.length + res.deleted.length > 0;
  return res;
}
