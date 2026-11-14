// systems/button.js - 30-tick pulse timer for copycat button
import { system } from "@minecraft/server";
import { onStartup } from "../core/compat.js";
import { playSound } from "../core/sound.js";
import { getShapeId } from "../core/registry.js";

const ButtonComponent = {
  onPlayerInteract({ block, dimension }) {
    try {
      if (block.permutation.getState("cc:powered")) return;

      block.setPermutation(block.permutation.withState("cc:powered", true));
      playSound(dimension, block.location, { sound: "power.on", volume: 0.8, pitch: 0.6 });

      const loc = { x: block.location.x, y: block.location.y, z: block.location.z };
      const dim = dimension;

      // 30-tick pulse timer (1.5 seconds, vanilla wooden button pulse)
      system.runTimeout(() => {
        try {
          const current = dim.getBlock(loc);
          if (!current || getShapeId(current.typeId) !== "cc:copycat_button") return;
          if (current.permutation.getState("cc:powered")) {
            current.setPermutation(current.permutation.withState("cc:powered", false));
            playSound(dim, loc, { sound: "power.off", volume: 0.7, pitch: 0.5 });
          }
        } catch (e) {
          console.error(`[copycat] button timeout failed: ${e}`);
        }
      }, 30);
    } catch (e) {
      console.warn(`[copycat] button onPlayerInteract failed: ${e}`);
    }
  }
};

onStartup((e) => {
  e.blockComponentRegistry.registerCustomComponent("cc:button", ButtonComponent);
});
