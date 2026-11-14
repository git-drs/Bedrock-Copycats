// shapes.mjs - read the hand-authored BASE blocks and derive everything the scripts need from them.
// The base block files are the single source of truth for shapes: edit them, re-run datagen, and every
// generated variant follows (states, traits, permutations, components).
import path from "node:path";
import { promises as fs } from "node:fs";
import { readJson, walk, stripNs, nsOf, posix } from "./util.mjs";

const CONNECTION_STATE = /^([a-z0-9_]+):(north|south|east|west|up|down)_connected$/;

export async function loadShapes({ cfg, bpDir, overrides, log }) {
  const baseDir = path.join(bpDir, cfg.blocks.baseDir);
  const files = (await walk(baseDir)).filter((f) => f.endsWith(".json"));
  const shapeOverrides = overrides.shapes || {};
  const excluded = new Set(cfg.shapes.exclude || []);
  const shapes = [];

  for (const file of files) {
    const json = await readJson(file);
    const block = json["minecraft:block"];
    if (!block?.description?.identifier) { log.warn(`${posix(path.relative(bpDir, file))}: no block identifier, skipped`); continue; }
    const desc = block.description, comps = block.components ?? {}, id = desc.identifier;
    if (nsOf(id) !== cfg.namespace) { log.warn(`${id}: namespace is not '${cfg.namespace}', skipped`); continue; }
    if (excluded.has(id)) continue;
    const name = stripNs(id);
    const states = Object.keys(desc.states ?? {});
    const traits = desc.traits ?? {};
    const enabled = (t) => traits[t]?.enabled_states ?? [];

    const instances = comps["minecraft:material_instances"];
    const instList = instances && typeof instances === "object" ? Object.values(instances) : [];
    const texturable = instList.length > 0 && instList.every((i) => i.texture === cfg.blocks.baseTexture);
    const defaultRender = instList[0]?.render_method ?? "opaque";

    const rotate = enabled("minecraft:placement_direction").includes("minecraft:cardinal_direction") || states.includes("minecraft:cardinal_direction");
    const position = enabled("minecraft:placement_position").includes("minecraft:vertical_half") || states.includes("minecraft:vertical_half") || states.includes("cc:position");
    const ov = shapeOverrides[id]?.transform ?? {};

    const conn = states.map((s) => s.match(CONNECTION_STATE)).filter(Boolean);
    const connections = conn.length ? { prefix: `${conn[0][1]}:`, directions: conn.map((m) => m[2]) } : null;

    for (const perm of block.permutations ?? []) {
      if (perm.components?.["minecraft:material_instances"]) log.warn(`${id}: a permutation overrides minecraft:material_instances; generated material permutations are appended after it and win.`);
    }
    if (states.includes(cfg.blocks.stateName)) throw new Error(`${id} already declares state ${cfg.blocks.stateName}`);

    shapes.push({
      id, name, file: posix(path.relative(bpDir, file)), json,
      texturable, defaultRender,
      transform: { rotate: ov.rotate ?? rotate, position: ov.position ?? position },
      connections,
      lootPath: comps["minecraft:loot"] ?? `${cfg.blocks.lootDir}/${name}.json`,
      customComponents: [
        ...(comps["minecraft:custom_components"] ?? []),
        ...Object.keys(comps).filter((k) => k.includes(":") && !k.startsWith("minecraft:"))
      ],
    });
  }
  shapes.sort((a, b) => a.id.localeCompare(b.id));
  const ids = shapes.map((s) => s.id);
  const dup = ids.find((x, i) => ids.indexOf(x) !== i);
  if (dup) throw new Error(`Duplicate base block identifier ${dup}`);
  return shapes;
}
