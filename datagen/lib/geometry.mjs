// geometry.mjs - make every face of the copycat geometries address its own material instance
// (up/down/north/south/east/west) so multi-texture blocks (logs, furnaces, TNT, ...) can be textured per face.
// Idempotent: faces that already name a material_instance are left alone. "*" in the block's
// material_instances stays the fallback, so existing single-texture blocks look exactly as before.
import path from "node:path";
import { promises as fs } from "node:fs";
import { walk, posix } from "./util.mjs";

const FACE_NAMES = ["north", "east", "south", "west", "up", "down"];

/** JSON writer that keeps arrays of primitives on one line (Blockbench style), objects tab-indented. */
export function stringifyCompact(v, indent = "") {
  const inner = indent + "\t";
  if (Array.isArray(v)) {
    if (v.every((x) => x === null || typeof x !== "object")) return "[" + v.map((x) => JSON.stringify(x)).join(", ") + "]";
    return "[\n" + v.map((x) => inner + stringifyCompact(x, inner)).join(",\n") + "\n" + indent + "]";
  }
  if (v && typeof v === "object") {
    const keys = Object.keys(v);
    if (!keys.length) return "{}";
    return "{\n" + keys.map((k) => `${inner}${JSON.stringify(k)}: ${stringifyCompact(v[k], inner)}`).join(",\n") + "\n" + indent + "}";
  }
  return JSON.stringify(v);
}

export async function planGeometryPatches({ cfg, rpDir, root }) {
  const dir = path.join(rpDir, cfg.geometry.dir);
  const out = [];
  for (const file of await walk(dir)) {
    const base = path.basename(file);
    if (!base.startsWith(cfg.geometry.filePrefix) || !base.endsWith(".geo.json")) continue;
    const original = await fs.readFile(file, "utf8");
    const json = JSON.parse(original.replace(/^\uFEFF/, ""));
    let touched = 0;
    for (const g of json["minecraft:geometry"] ?? []) {
      for (const bone of g.bones ?? []) for (const cube of bone.cubes ?? []) {
        if (!cube.uv || Array.isArray(cube.uv)) continue; // box-UV cubes have no per-face data
        for (const face of FACE_NAMES) {
          const f = cube.uv[face];
          if (f && typeof f === "object" && f.material_instance === undefined) { f.material_instance = face; touched++; }
        }
      }
    }
    if (touched) out.push({ rel: posix(path.relative(root, file)), abs: file, content: stringifyCompact(json) + "\n", touched });
  }
  return out;
}
