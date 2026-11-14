// systems/wrench.js - wrench behaviour:
//   untextured transformable copycat + normal click  -> rotate / flip (systems/transform.js)
//   sneak + click on any copycat                      -> pick it up (refunds material + base block)
//   normal click on a textured copycat                -> reset to untextured base block (refunds material)
import { system, ItemStack } from "@minecraft/server";
import { COOLDOWN_TICKS, SOUNDS } from "../config.js";
import { getShapeId, isBaseShape, isTransformable, isVariant, getMaterialItem, MATERIAL_STATE } from "../core/registry.js";
import { permutationFrom, getState } from "../core/blockStates.js";
import { tryCooldown, blockKey } from "../core/cooldown.js";
import { playSound } from "../core/sound.js";
import { giveOrDrop } from "../core/compat.js";
import { handleTransform } from "./transform.js";
import { updateWithNeighbors } from "./connections.js";

export function handleWrench(ctx) {
  const { player, block, cancel } = ctx;
  const shapeId = getShapeId(block.typeId);
  if (!shapeId) return;

  if (isBaseShape(block.typeId) && isTransformable(block.typeId) && !player.isSneaking) return handleTransform(ctx);
  if (!tryCooldown(`wr|${player.id}|${blockKey(block)}`, COOLDOWN_TICKS.wrench)) return;
  cancel();

  const { dimension, location } = block;
  const sneaking = player.isSneaking;
  system.runTimeout(() => {
    try {
      const target = dimension.getBlock(location);
      if (!target || getShapeId(target.typeId) !== shapeId) return;

      const isCreative = player.getGameMode ? player.getGameMode() === "creative" : false;

      if (sneaking) {
        // Refund applied material item in Survival
        if (isVariant(target.typeId) && !isCreative) {
          const stateVal = getState(target.permutation, MATERIAL_STATE);
          const matItem = getMaterialItem(target.typeId, stateVal);
          if (matItem) giveOrDrop(player, dimension, location, new ItemStack(matItem, 1));
        }

        // Give base copycat block in Survival
        if (!isCreative) {
          giveOrDrop(player, dimension, location, new ItemStack(shapeId, 1));
        }

        dimension.setBlockType(location, "minecraft:air");
        playSound(dimension, location, SOUNDS.pickupPop);
        playSound(dimension, location, SOUNDS.pickupPlace);
      } else if (!isBaseShape(target.typeId)) {
        // Refund applied material item in Survival
        if (!isCreative) {
          const stateVal = getState(target.permutation, MATERIAL_STATE);
          const matItem = getMaterialItem(target.typeId, stateVal);
          if (matItem) giveOrDrop(player, dimension, location, new ItemStack(matItem, 1));
        }

        target.setPermutation(permutationFrom(target.permutation, shapeId));
        playSound(dimension, location, SOUNDS.reset);
        updateWithNeighbors(target);
      }
    } catch (e) {
      console.error(`[copycat] wrench error: ${e}`);
    }
  }, 1);
}
