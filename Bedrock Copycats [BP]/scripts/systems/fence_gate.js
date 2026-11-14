// systems/fence_gate.js - interactive fence gate open/close and wall-lowering sync
import { onStartup } from "../core/compat.js";
import { playSound } from "../core/sound.js";
import { getShapeId } from "../core/registry.js";
import { WRENCH_ID } from "../config.js";

function checkInWall(block) {
  try {
    const dim = block.dimension;
    const loc = block.location;
    const cardinal = block.permutation.getState("minecraft:cardinal_direction") || "north";
    // Check perpendicular neighbors
    const isNorthSouth = cardinal === "north" || cardinal === "south";
    const sideA = dim.getBlock({ x: loc.x + (isNorthSouth ? 1 : 0), y: loc.y, z: loc.z + (isNorthSouth ? 0 : 1) });
    const sideB = dim.getBlock({ x: loc.x - (isNorthSouth ? 1 : 0), y: loc.y, z: loc.z - (isNorthSouth ? 0 : 1) });
    const isWall = (b) => b && (b.hasTag("walls") || getShapeId(b.typeId) === "cc:copycat_wall");
    return isWall(sideA) || isWall(sideB);
  } catch {
    return false;
  }
}

const FenceGateComponent = {
  onPlayerInteract({ block, dimension, player }) {
    // If player is holding a wrench, don't toggle open/close
    try {
      const equippable = player.getComponent("minecraft:equippable");
      const mainhand = equippable?.getEquipment("Mainhand");
      if (mainhand?.typeId === WRENCH_ID) return;
    } catch {}

    const perm = block.permutation;
    const currentlyOpen = perm.getState("cc:open");
    const open = !currentlyOpen;

    let newPerm = perm.withState("cc:open", open);

    // If opening, swing away from player
    if (open && player) {
      const pLoc = player.location;
      const bLoc = block.location;
      const cardinal = perm.getState("minecraft:cardinal_direction");
      if (cardinal === "north" && pLoc.z < bLoc.z) {
        newPerm = newPerm.withState("minecraft:cardinal_direction", "south");
      } else if (cardinal === "south" && pLoc.z > bLoc.z + 1) {
        newPerm = newPerm.withState("minecraft:cardinal_direction", "north");
      } else if (cardinal === "west" && pLoc.x < bLoc.x) {
        newPerm = newPerm.withState("minecraft:cardinal_direction", "east");
      } else if (cardinal === "east" && pLoc.x > bLoc.x + 1) {
        newPerm = newPerm.withState("minecraft:cardinal_direction", "west");
      }
    }

    // Check in_wall state
    const inWall = checkInWall(block);
    newPerm = newPerm.withState("cc:in_wall", inWall);

    block.setPermutation(newPerm);

    playSound(dimension, block.location, {
      sound: open ? "open.wooden_fence_gate" : "close.wooden_fence_gate",
      volume: 0.8,
      pitch: open ? 1.0 : 0.9
    });
  }
};

onStartup((e) => {
  e.blockComponentRegistry.registerCustomComponent("cc:fence_gate", FenceGateComponent);
});
