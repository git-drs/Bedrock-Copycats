// materials.mjs - derive "materials" (vanilla blocks usable as a copycat texture) from vanilla data.
// Nothing here is guessed from block names: every property comes from a data file (see vanilla.mjs)
// or from the small, validated overrides.json.
import { classifyImage } from "./imagealpha.mjs";

export const FACES = ["up", "down", "north", "south", "east", "west"];
const ENGINE_DEFAULT_SOUND = "normal"; // vanilla blocks.json omits `sound` for blocks using the engine default

/** terrain_texture.json entry -> list of texture file paths (without extension). */
export function texturePaths(entry) {
  const t = entry?.textures;
  const list = Array.isArray(t) ? t : t === undefined ? [] : [t];
  return list.map((x) => (typeof x === "string" ? x : x?.path)).filter(Boolean);
}

/** Resolve vanilla blocks.json `textures` (string | per-face object) into one short name per face. */
export function resolveFaces(textures) {
  if (typeof textures === "string") return Object.fromEntries(FACES.map((f) => [f, textures]));
  const faces = {};
  for (const f of FACES) {
    const v = textures[f] ?? (f !== "up" && f !== "down" ? textures.side : undefined);
    if (v === undefined) return null; // ambiguous: refuse instead of guessing
    faces[f] = v;
  }
  return faces;
}

function resolveIsotropic(iso) {
  if (iso === true) return Object.fromEntries(FACES.map((f) => [f, true]));
  if (iso && typeof iso === "object") return Object.fromEntries(FACES.map((f) => [f, !!iso[f]]));
  return null;
}

const isFullCube = (v, fullId) => (Array.isArray(v) ? v.length > 0 && v.every((x) => x === fullId) : v === fullId);

async function pool(items, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const item = items[i++]; await fn(item); }
  }));
}

export async function deriveMaterials({ vanilla, dl, cfg, overrides }) {
  const fullId = Object.entries(vanilla.collisionShapes).find(([, boxes]) => boxes.length === 1 && boxes[0].every((n, i) => n === [0, 0, 0, 1, 1, 1][i]))?.[0];
  if (fullId === undefined) throw new Error("minecraft-data collision shapes: no unit-cube shape found (data format changed?)");
  const fullNum = Number(fullId);

  const excludeRes = (cfg.materials.exclude || []).map((r) => new RegExp(r));
  const includeRes = (cfg.materials.include || []).map((r) => new RegExp(r));
  const forceExclude = new Set(overrides.forceExclude || []);
  const supplements = Object.fromEntries(Object.entries(overrides.supplementBlocks || {}).filter(([k]) => !k.startsWith("_")));

  const skipped = {};
  const skip = (reason, name) => (skipped[reason] ||= []).push(name);
  const cands = [];
  const supplementsUsed = [];

  for (const name of vanilla.blockNames) {
    if (forceExclude.has(name)) { skip("technical block (overrides.forceExclude)", name); continue; }
    if (excludeRes.some((r) => r.test(name))) { skip("excluded by config materials.exclude", name); continue; }
    if (includeRes.length && !includeRes.some((r) => r.test(name))) { skip("not matched by config materials.include", name); continue; }
    const col = vanilla.collisionBlocks[name];
    if (col === undefined) { skip("no collision data in minecraft-data (too new?)", name); continue; }
    if (!isFullCube(col, fullNum)) { skip("not a full cube", name); continue; }
    if (!vanilla.itemNames.has(name)) { skip("no item form (cannot be used on a block)", name); continue; }
    let rp = vanilla.blocksJson[name];
    if (!rp && supplements[name]) { rp = supplements[name]; supplementsUsed.push(name); }
    if (!rp || rp.textures === undefined) { skip("no entry in vanilla blocks.json", name); continue; }
    const faces = resolveFaces(rp.textures);
    if (!faces) { skip("ambiguous per-face textures", name); continue; }
    const missing = [...new Set(Object.values(faces))].filter((t) => !vanilla.terrain[t]);
    if (missing.length) { skip(`texture short name missing from terrain_texture.json (${missing.join(",")})`, name); continue; }
    const sound = rp.sound ?? ENGINE_DEFAULT_SOUND;
    if (!vanilla.blockSounds[sound]) { skip(`sound '${sound}' missing from sounds.json block_sounds`, name); continue; }
    const mcd = vanilla.mcd.get(name);
    if (!mcd) { skip("no minecraft-data entry (light level unknown)", name); continue; }
    cands.push({ name, rp, faces, sound, mcd });
  }

  // --- classify the real texture pixels (alpha) -> render method. Images are cached forever.
  const paths = new Set();
  for (const c of cands) for (const sn of new Set(Object.values(c.faces))) for (const p of texturePaths(vanilla.terrain[sn])) paths.add(p);
  const alpha = new Map();
  await pool([...paths], cfg.concurrency || 8, async (path) => {
    let kind = "unknown";
    for (const ext of [".png", ".tga"]) {
      const url = `https://raw.githubusercontent.com/${cfg.source.samples.repo}/${cfg.source.samples.ref}/resource_pack/${path}${ext}`;
      const buf = await dl.buffer(url, { allow404: true, immutable: true });
      if (buf) { kind = classifyImage(buf, ext); break; }
    }
    alpha.set(path, kind);
  });

  const rank = { opaque: 0, binary: 1, partial: 2, unknown: 2 };
  const materials = [];
  const warnings = [];
  for (const c of cands) {
    let render = overrides.render?.[c.name];
    if (!render) {
      let worst = "opaque";
      for (const sn of new Set(Object.values(c.faces))) for (const p of texturePaths(vanilla.terrain[sn])) {
        const k = alpha.get(p);
        if (k === "unknown") warnings.push(`${c.name}: could not decode texture ${p}; assuming translucent`);
        if (rank[k] > rank[worst]) worst = k;
      }
      render = worst === "opaque" ? "opaque" : worst === "binary" ? "alpha_test" : "blend";
    }
    const tintRule = overrides.tint?.[c.name];
    const tint = tintRule ? (typeof tintRule === "string" ? Object.fromEntries(FACES.map((f) => [f, tintRule])) : tintRule) : null;
    materials.push({
      name: c.name,
      item: `minecraft:${c.name}`,
      displayName: vanilla.lang.get(`tile.${c.name}.name`) || null,
      sound: c.sound,
      render,
      faces: c.faces,
      isotropic: resolveIsotropic(c.rp.isotropic),
      tint,
      light: Math.max(0, Math.min(15, Math.round(c.mcd.emitLight || 0))),
    });
  }
  materials.sort((a, b) => a.name.localeCompare(b.name));
  return { materials, skipped, warnings, supplementsUsed, texturesClassified: paths.size };
}
