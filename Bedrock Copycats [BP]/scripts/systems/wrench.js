// systems/wrench.js - wrench behaviour:
//   untextured transformable copycat + normal click  -> rotate / flip (systems/transform.js)
//   sneak + click on any copycat                      -> pick it up (refunds material + base block)
//   normal click on a textured copycat                -> reset to untextured base block (refunds material)
import { system, ItemStack } from "@minecraft/server";
import { COOLDOWN_TICKS, SOUNDS, WRENCH_ID } from "../config.js";
import { getShapeId, isBaseShape, isTransformable, isVariant, getMaterialItem, MATERIAL_STATE } from "../core/registry.js";
import { permutationFrom, getState } from "../core/blockStates.js";
import { tryCooldown, blockKey } from "../core/cooldown.js";
import { playSound } from "../core/sound.js";
import { giveOrDrop } from "../core/compat.js";
import { handleTransform } from "./transform.js";
import { updateWithNeighbors } from "./connections.js";
import { getDoorSibling } from "./door.js";

export function handleWrench(ctx) {
  const { player, block, cancel } = ctx;
  const shapeId = getShapeId(block.typeId);
  if (!shapeId) return;

  const isWrench = ctx.item?.typeId === WRENCH_ID;

  if (isWrench && isBaseShape(block.typeId) && isTransformable(block.typeId) && !player.isSneaking) {
    return handleTransform(ctx);
  }
  if (!tryCooldown(`wr|${player.id}|${blockKey(block)}`, COOLDOWN_TICKS.wrench)) return;
  cancel();

  const { dimension, location } = block;
  const sneaking = player.isSneaking;
  system.runTimeout(() => {
    try {
      const target = dimension.getBlock(location);
      if (!target || getShapeId(target.typeId) !== shapeId) return;

      if (sneaking) {
        // Shift-click: put copycat block and textured block directly inside inventory
        if (isVariant(target.typeId)) {
          const stateVal = getState(target.permutation, MATERIAL_STATE);
          const matItem = getMaterialItem(target.typeId, stateVal);
          if (matItem) giveOrDrop(player, dimension, location, new ItemStack(matItem, 1));
        }

        let count = 1;
        if (shapeId === "cc:copycat_layer") {
          count = getState(target.permutation, "cc:height") || 1;
        }
        giveOrDrop(player, dimension, location, new ItemStack(shapeId, count));

        if (shapeId === "cc:copycat_door") {
          const sibling = getDoorSibling(target);
          if (sibling) dimension.setBlockType(sibling.location, "minecraft:air");
        }
        dimension.setBlockType(location, "minecraft:air");
        playSound(dimension, location, SOUNDS.pickupPop);
        playSound(dimension, location, SOUNDS.pickupPlace);
      } else if (!isBaseShape(target.typeId)) {
        // Normal right-click: directly put the removed material block inside inventory
        const stateVal = getState(target.permutation, MATERIAL_STATE);
        const matItem = getMaterialItem(target.typeId, stateVal);
        if (matItem) giveOrDrop(player, dimension, location, new ItemStack(matItem, 1));

        target.setPermutation(permutationFrom(target.permutation, shapeId));
        if (shapeId === "cc:copycat_door") {
          const sibling = getDoorSibling(target);
          if (sibling) sibling.setPermutation(permutationFrom(sibling.permutation, shapeId));
        }
        playSound(dimension, location, SOUNDS.reset);
        updateWithNeighbors(target);
      }
    } catch (e) {
      console.error(`[copycat] wrench error: ${e}`);
    }
  }, 1);
}
