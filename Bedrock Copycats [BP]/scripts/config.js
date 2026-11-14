// config.js - the ONLY hand-edited tunables for the scripts.
// Shapes, materials, groups and sounds are NOT listed here: they come from generated/registry.js,
// which `node datagen/run.mjs` rebuilds from the base blocks and vanilla Minecraft data.

export const WRENCH_ID = "cc:wrench";
export const TOGGLE_COMPONENT = "cc:toggleable"; // custom component on the trapdoor shape

/** Allow applying a different material to a block that is already textured. */
export const ALLOW_RETEXTURE = true;

/** Cooldowns in ticks (stops the double-fire of interact events). */
export const COOLDOWN_TICKS = { texture: 20, wrench: 10, transform: 10 };

/** Warn in the console when the game has vanilla blocks the registry does not know (run datagen). */
export const VERSION_CHECK = true;

/** Feedback sounds (vanilla sound event names). Material sounds come from the registry. */
export const SOUNDS = {
  textureAdd: { sound: "block.itemframe.add_item" },
  reset: { sound: "block.itemframe.remove_item", volume: 0.8, pitch: 0.8 },
  rotate: { sound: "block.itemframe.rotate_item", volume: 0.7, pitch: 1.2 },
  move: { sound: "block.itemframe.place" },
  pickupPop: { sound: "random.pop", volume: 0.5, pitch: 1.2 },
  pickupPlace: { sound: "place.copper" },
};

/**
 * Neighbour-connection rules, keyed by BASE shape id. Which blocks have connection states
 * (cc:north_connected, ...) is detected from the block files; only the *rule* lives here.
 *   self      connect to the same shape (textured variants count as the same shape)
 *   tag       connect to blocks having `tag`
 *   whitelist connect to the shapes/blocks in allowList
 *   blacklist like tag, but not to blocks whose shape/type id contains a word of denyList
 * Shapes with connection states but no rule here default to "self".
 */
export const CONNECTION_RULES = {
  "cc:copycat_fence": {
    rule: "blacklist",
    tag: "fences",
    denyList: ["slab", "stair", "trapdoor", "pannel", "board", "beam", "lantern", "torch", "layer", "grass", "pane"],
  },
  "cc:copycat_bars": {
    rule: "blacklist",
    tag: "bars",
    denyList: ["slab", "stair", "trapdoor", "pannel", "board", "beam", "lantern", "torch", "layer", "grass"],
  },
};
