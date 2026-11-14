// systems/door.js - 2-block multiblock synchronization for copycat door
import { world, system, ItemStack } from "@minecraft/server";
import { onStartup } from "../core/compat.js";
import { playSound } from "../core/sound.js";
import { getShapeId } from "../core/registry.js";
import { WRENCH_ID } from "../config.js";

const breakingDoorGuard = new Set();

export function getDoorSibling(block) {
  try {
    const half = block.permutation.getState("cc:half");
    const loc = block.location;
    const siblingLoc = {
      x: loc.x,
      y: half === "upper" ? loc.y - 1 : loc.y + 1,
      z: loc.z
    };
    const sibling = block.dimension.getBlock(siblingLoc);
    if (sibling && getShapeId(sibling.typeId) === "cc:copycat_door") {
      return sibling;
    }
  } catch {}
  return null;
}

const DoorComponent = {
  beforeOnPlayerPlace(event) {
    const { block, dimension } = event;
    const upperLoc = { x: block.location.x, y: block.location.y + 1, z: block.location.z };
    const upperBlock = dimension.getBlock(upperLoc);
    if (!upperBlock || (!upperBlock.isAir && upperBlock.typeId !== "minecraft:air")) {
      event.cancel = true;
      return;
    }

    // Default hinge is left; if right neighbor has door with left hinge, make this right hinge
    let hinge = "left";
    try {
      const cardinal = event.permutationToPlace.getState("minecraft:cardinal_direction") || "north";
      const isNS = cardinal === "north" || cardinal === "south";
      const rightNeighbor = dimension.getBlock({
        x: block.location.x + (isNS ? 1 : 0),
        y: block.location.y,
        z: block.location.z + (isNS ? 0 : 1)
      });
      if (rightNeighbor && getShapeId(rightNeighbor.typeId) === "cc:copycat_door") {
        hinge = "right";
      }
    } catch {}

    event.permutationToPlace = event.permutationToPlace
      .withState("cc:half", "lower")
      .withState("cc:hinge", hinge)
      .withState("cc:open", false);

    // Place upper half on the next tick
    system.runTimeout(() => {
      try {
        const lower = dimension.getBlock(block.location);
        if (lower && getShapeId(lower.typeId) === "cc:copycat_door") {
          const upper = dimension.getBlock(upperLoc);
          if (upper) {
            upper.setPermutation(
              lower.permutation.withState("cc:half", "upper")
            );
          }
        }
      } catch (e) {
        console.warn(`[copycat] failed to place upper door: ${e}`);
      }
    }, 1);
  },

  onPlayerInteract({ block, dimension, player }) {
    // If player is holding a wrench, let wrench system handle it
    try {
      const equippable = player.getComponent("minecraft:equippable");
      const mainhand = equippable?.getEquipment("Mainhand");
      if (mainhand?.typeId === WRENCH_ID) return;
    } catch {}

    const perm = block.permutation;
    const currentlyOpen = perm.getState("cc:open");
    const open = !currentlyOpen;

    block.setPermutation(perm.withState("cc:open", open));

    const sibling = getDoorSibling(block);
    if (sibling) {
      sibling.setPermutation(sibling.permutation.withState("cc:open", open));
    }

    playSound(dimension, block.location, {
      sound: open ? "open.wooden_door" : "close.wooden_door",
      volume: 0.8,
      pitch: open ? 1.0 : 0.9
    });
  }
};

onStartup((e) => {
  e.blockComponentRegistry.registerCustomComponent("cc:door", DoorComponent);
});

// Cascade breaking between lower and upper halves
world.afterEvents.playerBreakBlock.subscribe((event) => {
  const { block, brokenBlockPermutation, dimension, player } = event;
  const shape = getShapeId(brokenBlockPermutation.type.id);
  if (shape !== "cc:copycat_door") return;

  const key = `${block.location.x},${block.location.y},${block.location.z}`;
  if (breakingDoorGuard.has(key)) {
    breakingDoorGuard.delete(key);
    return;
  }

  const half = brokenBlockPermutation.getState("cc:half");
  const siblingLoc = {
    x: block.location.x,
    y: half === "upper" ? block.location.y - 1 : block.location.y + 1,
    z: block.location.z
  };

  const siblingKey = `${siblingLoc.x},${siblingLoc.y},${siblingLoc.z}`;
  breakingDoorGuard.add(siblingKey);

  try {
    const sibling = dimension.getBlock(siblingLoc);
    if (sibling && getShapeId(sibling.typeId) === "cc:copycat_door") {
      sibling.setPermutation(sibling.permutation.withState("cc:half", "lower")); // avoid recursion
      dimension.setBlockType(siblingLoc, "minecraft:air");
    }
  } catch {}

  // If upper half was broken in Survival, spawn the door drop
  if (half === "upper") {
    try {
      if (!player?.getGameMode || player.getGameMode() !== "creative") {
        dimension.spawnItem(new ItemStack("cc:copycat_door", 1), {
          x: block.location.x + 0.5,
          y: block.location.y + 0.5,
          z: block.location.z + 0.5
        });
      }
    } catch {}
  }
});
