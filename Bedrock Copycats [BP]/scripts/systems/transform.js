// systems/transform.js - wrench on an untextured, transformable copycat: rotate (top/bottom face) or flip half (sides).
import { system } from "@minecraft/server";
import { COOLDOWN_TICKS, SOUNDS } from "../config.js";
import { canChangePosition, canRotate, isTransformable } from "../core/registry.js";
import { nextRotation, getState, permutationFrom, toggledPosition } from "../core/blockStates.js";
import { tryCooldown, blockKey } from "../core/cooldown.js";
import { playSound } from "../core/sound.js";
import { updateWithNeighbors } from "./connections.js";

export function handleTransform({ player, block, face, cancel }) {
  if (!tryCooldown(`xf|${player.id}|${blockKey(block)}`, COOLDOWN_TICKS.transform)) return;
  cancel();
  const { dimension, location } = block;
  const typeId = block.typeId;

  system.runTimeout(() => {
    try {
      const target = dimension.getBlock(location);
      if (!target || target.typeId !== typeId || !isTransformable(typeId)) return;
      const perm = target.permutation;

      if ((face === "Up" || face === "Down") && canRotate(typeId)) {
        const next = nextRotation(getState(perm, "minecraft:cardinal_direction"));
        target.setPermutation(permutationFrom(perm, typeId, { "minecraft:cardinal_direction": next }));
        playSound(dimension, location, SOUNDS.rotate);
        updateWithNeighbors(target);
      } else if (["North", "South", "East", "West"].includes(face) && canChangePosition(typeId)) {
        const next = toggledPosition(perm);
        if (!next) return;
        target.setPermutation(permutationFrom(perm, typeId, next));
        playSound(dimension, location, SOUNDS.move);
        updateWithNeighbors(target);
      }
    } catch (e) {
      console.error(`[copycat] transform error: ${e}`);
    }
  }, 1);
}
