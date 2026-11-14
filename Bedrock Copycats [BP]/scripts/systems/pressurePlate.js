// systems/pressurePlate.js - entity step detection and unpress timeout for copycat pressure plate
import { world, system } from "@minecraft/server";
import { onStartup } from "../core/compat.js";
import { playSound } from "../core/sound.js";
import { getShapeId } from "../core/registry.js";

const activePlates = new Map(); // key -> { dimId, x, y, z }

const PressurePlateComponent = {
  onStepOn({ block, dimension }) {
    try {
      if (!block.permutation.getState("cc:powered")) {
        block.setPermutation(block.permutation.withState("cc:powered", true));
        playSound(dimension, block.location, { sound: "power.on", volume: 0.8, pitch: 0.6 });
      }
      const key = `${dimension.id}|${block.location.x}|${block.location.y}|${block.location.z}`;
      activePlates.set(key, { dimId: dimension.id, ...block.location });
    } catch (e) {
      console.warn(`[copycat] plate onStepOn failed: ${e}`);
    }
  }
};

onStartup((e) => {
  e.blockComponentRegistry.registerCustomComponent("cc:pressure_plate", PressurePlateComponent);

  system.runInterval(() => {
    if (activePlates.size === 0) return;

    for (const [key, loc] of activePlates.entries()) {
      try {
        const dimension = world.getDimension(loc.dimId);
        const block = dimension.getBlock(loc);
        if (!block || getShapeId(block.typeId) !== "cc:copycat_pressure_plate") {
          activePlates.delete(key);
          continue;
        }

        // Query entities on top of the plate
        const entities = dimension.getEntities({
          location: { x: loc.x + 0.1, y: loc.y, z: loc.z + 0.1 },
          volume: { x: 0.8, y: 0.5, z: 0.8 }
        });

        if (entities.length === 0) {
          block.setPermutation(block.permutation.withState("cc:powered", false));
          playSound(dimension, loc, { sound: "power.off", volume: 0.7, pitch: 0.5 });
          activePlates.delete(key);
        }
      } catch {
        activePlates.delete(key);
      }
    }
  }, 5);
});
