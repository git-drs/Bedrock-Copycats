// util.mjs - small shared helpers (no dependencies)
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export const sha256 = (data) => createHash("sha256").update(data).digest("hex");
export const sha1 = (data) => createHash("sha1").update(data).digest("hex");

export const exists = async (p) => fs.access(p).then(() => true, () => false);

export async function readJson(p, fallback = undefined) {
  try {
    return JSON.parse((await fs.readFile(p, "utf8")).replace(/^\uFEFF/, ""));
  } catch (e) {
    if (e.code === "ENOENT" && fallback !== undefined) return fallback;
    throw new Error(`Cannot read JSON ${p}: ${e.message}`);
  }
}

/** Recursively list files under dir (absolute paths, sorted). Missing dir -> []. */
export async function walk(dir) {
  const out = [];
  async function rec(d) {
    let entries;
    try { entries = await fs.readdir(d, { withFileTypes: true }); }
    catch (e) { if (e.code === "ENOENT") return; throw e; }
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) await rec(full); else out.push(full);
    }
  }
  await rec(dir);
  return out.sort();
}

/** Remove empty directories below (and including) root, bottom-up. */
export async function pruneEmptyDirs(root) {
  let entries;
  try { entries = await fs.readdir(root, { withFileTypes: true }); } catch { return; }
  for (const e of entries) if (e.isDirectory()) await pruneEmptyDirs(path.join(root, e.name));
  if ((await fs.readdir(root)).length === 0) await fs.rmdir(root);
}

/** JSON with tab indentation + trailing newline, matching the pack's existing style. */
export const toJson = (obj) => JSON.stringify(obj, null, "\t") + "\n";

/** Recursively sort object keys (arrays keep order) so output is deterministic. */
export function sortKeys(v) {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])]));
  }
  return v;
}

export const posix = (p) => p.split(path.sep).join("/");
export const stripNs = (id) => id.replace(/^[a-z0-9_.-]+:/, "");
export const nsOf = (id) => (id.includes(":") ? id.split(":")[0] : "");

export function titleCase(s) {
  return s.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Compare version strings like "1.26.60". Returns -1/0/1. */
export function cmpVersion(a, b) {
  const pa = String(a).split(".").map(Number), pb = String(b).split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d < 0 ? -1 : 1;
  }
  return 0;
}

export const log = {
  info: (...a) => console.log(...a),
  warn: (...a) => console.warn("  ! ", ...a),
  step: (...a) => console.log("\n==>", ...a),
};

/** Parse JSON that may contain // and /* *​/ comments and trailing commas (Mojang's files do). */
export function parseJsonc(text) {
  let out = "", i = 0, inStr = false;
  text = text.replace(/^\uFEFF/, "");
  while (i < text.length) {
    const c = text[i], n = text[i + 1];
    if (inStr) {
      out += c;
      if (c === "\\") { out += n; i += 2; continue; }
      if (c === '"') inStr = false;
      i++;
    } else if (c === '"') { inStr = true; out += c; i++; }
    else if (c === "/" && n === "/") { while (i < text.length && text[i] !== "\n") i++; }
    else if (c === "/" && n === "*") { i += 2; while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++; i += 2; }
    else { out += c; i++; }
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, "$1"));
}
