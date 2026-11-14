// systems/versionCheck.js - detect that the game is newer/older than the data the registry was generated from.
import { BlockTypes, system } from "@minecraft/server";
import { VERSION_CHECK } from "../config.js";
import { KNOWN_VANILLA_BLOCKS } from "../generated/registry.js";
import { listMaterialItems, listVariantTypes, registryMeta } from "../core/registry.js";

export function runVersionCheck() {
  if (!VERSION_CHECK) return;
  system.runTimeout(() => {
    try {
      const meta = registryMeta();
      const live = new Set(BlockTypes.getAll().map((b) => b.id).filter((id) => id.startsWith("minecraft:")).map((id) => id.slice(10)));
      const known = new Set(KNOWN_VANILLA_BLOCKS);
      const added = [...live].filter((n) => !known.has(n));
      const missingMaterials = listMaterialItems().filter((id) => !live.has(id.slice(10)));
      const variants = listVariantTypes();
      const variantsLoaded = variants.length === 0 || !!BlockTypes.get(variants[0]);

      console.warn(`[copycat] registry: Minecraft ${meta.engineVersion} data, ${meta.materials} materials, ${meta.groups} groups, ${meta.shapes} shapes`);
      if (!variantsLoaded) console.warn("[copycat] generated variant blocks are not loaded - re-run `node datagen/run.mjs` and re-apply the behavior pack.");
      if (added.length) console.warn(`[copycat] ${added.length} vanilla block(s) newer than the registry (${added.slice(0, 8).join(", ")}${added.length > 8 ? ", ..." : ""}) - run \`node datagen/run.mjs\` to add them.`);
      if (missingMaterials.length) console.warn(`[copycat] ${missingMaterials.length} registry material(s) no longer exist in this game version (${missingMaterials.slice(0, 8).join(", ")}) - run datagen.`);
    } catch (e) {
      console.warn(`[copycat] version check skipped: ${e}`);
    }
  }, 40);
}
