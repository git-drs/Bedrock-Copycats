// validate.mjs - hard checks on the generated data, run on every datagen invocation.
import { variantId } from "./emit.mjs";
import { cmpVersion } from "./util.mjs";

const TRAIT_SIZE = { "minecraft:cardinal_direction": 4, "minecraft:vertical_half": 2, "minecraft:block_face": 6, "minecraft:facing_direction": 6 };

export function validate({ cfg, vanilla, shapes, groups, blocks, rpTerrain, warn }) {
  const errors = [];
  const ids = new Set();
  const stateName = cfg.blocks.stateName;
  const idRe = /^[a-z0-9_]+:[a-z0-9_]+$/;

  if (rpTerrain && !rpTerrain.texture_data?.[cfg.blocks.baseTexture]) warn(`base texture '${cfg.blocks.baseTexture}' is not defined in the RP terrain_texture.json`);

  for (const g of groups) {
    if (g.values.length > 16) errors.push(`group ${g.id}: ${g.values.length} values (>16, Bedrock enum limit)`);
    if (new Set(g.values).size !== g.values.length) errors.push(`group ${g.id}: duplicate values`);
    for (const v of g.values) if (!/^[a-z0-9_]+$/.test(v)) errors.push(`group ${g.id}: illegal enum value '${v}'`);
    if (!vanilla.blockSounds[g.sound]) errors.push(`group ${g.id}: unknown sound '${g.sound}'`);
  }
  if (!vanilla.blockSounds[cfg.blocks.baseSound]) errors.push(`blocks.baseSound '${cfg.blocks.baseSound}' is not in sounds.json block_sounds`);

  for (const { shape, group, json } of blocks) {
    const b = json["minecraft:block"], id = b.description.identifier;
    if (!idRe.test(id) || id.length > 64) errors.push(`bad identifier ${id}`);
    if (ids.has(id)) errors.push(`duplicate identifier ${id}`);
    ids.add(id);
    if (id !== variantId(cfg, shape, group)) errors.push(`${id}: identifier does not match shape+group`);

    const states = b.description.states;
    let combos = 1;
    for (const vals of Object.values(states)) combos *= vals.length;
    for (const t of Object.values(b.description.traits ?? {})) for (const s of t.enabled_states ?? []) combos *= TRAIT_SIZE[s] ?? 1;
    if (combos > 65536) errors.push(`${id}: ${combos} state combinations (>65536)`);

    for (const p of b.permutations ?? []) {
      const m = String(p.condition).match(new RegExp(`q\\.block_state\\('${stateName}'\\) == '([^']+)'`));
      if (m && !states[stateName].includes(m[1])) errors.push(`${id}: permutation for unknown value ${m[1]}`);
      const mi = p.components?.["minecraft:material_instances"];
      if (mi) {
        const methods = new Set(Object.values(mi).map((i) => i.render_method));
        if (methods.size > 1) errors.push(`${id}: mixed render methods in one material_instances (${[...methods]})`);
        for (const i of Object.values(mi)) {
          if (i.texture !== cfg.blocks.baseTexture && !vanilla.terrain[i.texture]) errors.push(`${id}: texture '${i.texture}' not in vanilla terrain_texture.json`);
          if (i.isotropic && cmpVersion(json.format_version || "1.21.60", "1.21.70") < 0) {
            errors.push(`${id}: isotropic requires format_version >= 1.21.70`);
          }
        }
      }
    }
    const expectedStateLen = group.values.length === 1 ? 2 : group.values.length;
    if (states[stateName].length !== expectedStateLen) errors.push(`${id}: state values differ from group`);
    if (states[stateName].length < 2) errors.push(`${id}: custom state '${stateName}' must have at least 2 values for Bedrock`);
  }
  return errors;
}
