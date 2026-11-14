// systems/ladder.js - simulated climbable mechanics for copycat ladder
import { world, system } from "@minecraft/server";
import { getShapeId } from "../core/registry.js";

export function initLadderSystem() {
  system.runInterval(() => {
    try {
      for (const player of world.getAllPlayers()) {
        const loc = player.location;
        const block = player.dimension.getBlock({
          x: Math.floor(loc.x),
          y: Math.floor(loc.y),
          z: Math.floor(loc.z)
        });
        if (!block) continue;

        const shape = getShapeId(block.typeId);
        if (shape === "cc:copycat_ladder") {
          if (player.isJumping) {
            player.applyKnockback(0, 0, 0, 0.28);
          } else if (player.isSneaking) {
            player.applyKnockback(0, 0, 0, 0.08);
          }
        }
      }
    } catch {
      // ignore transient world access errors during chunk loads
    }
  }, 2);
}
