// systems/texturing.js - use a vanilla block item on a copycat to give it that block's texture.
import { system, ItemStack } from "@minecraft/server";
import { ALLOW_RETEXTURE, COOLDOWN_TICKS, SOUNDS } from "../config.js";
import { MATERIAL_STATE, getShapeId, isVariant, resolveTexture, getMaterialItem } from "../core/registry.js";
import { permutationFrom, getState } from "../core/blockStates.js";
import { tryCooldown, blockKey } from "../core/cooldown.js";
import { playSound } from "../core/sound.js";
import { giveOrDrop } from "../core/compat.js";
import { updateWithNeighbors } from "./connections.js";
import { getDoorSibling } from "./door.js";

/** Deduct 1 item from player's hand unless in creative mode */
function consumeHeldItem(player, expectedTypeId) {
  try {
    const gameMode = player.getGameMode ? player.getGameMode() : undefined;
    if (gameMode === "creative") return;

    const inv = player.getComponent("minecraft:inventory");
    if (!inv?.container) return;

    const slot = player.selectedSlotIndex;
    const held = inv.container.getItem(slot);
    if (held && held.typeId === expectedTypeId) {
      if (held.amount > 1) {
        held.amount -= 1;
        inv.container.setItem(slot, held);
      } else {
        inv.container.setItem(slot, undefined);
      }
    }
  } catch (e) {
    console.warn(`[copycat] could not consume item: ${e}`);
  }
}

/** @returns {boolean} true if the interaction was handled */
export function handleTexturing({ player, block, item, cancel }) {
  const shapeId = getShapeId(block.typeId);
  const target = shapeId && resolveTexture(item.typeId, shapeId);
  if (!target) return false;
  if (isVariant(block.typeId) && !ALLOW_RETEXTURE) return false;

  const { dimension, location } = block;
  const already = block.typeId === target.typeId && getState(block.permutation, MATERIAL_STATE) === target.stateValue;
  cancel();
  if (already || !tryCooldown(`tex|${blockKey(block)}`, COOLDOWN_TICKS.texture)) return true;

  system.runTimeout(() => {
    try {
      const current = dimension.getBlock(location);
      if (!current || getShapeId(current.typeId) !== shapeId) return;

      // If retexturing an existing textured block in Survival, refund the previous material item
      if (isVariant(current.typeId)) {
        const isCreative = player.getGameMode ? player.getGameMode() === "creative" : false;
        if (!isCreative) {
          const oldState = getState(current.permutation, MATERIAL_STATE);
          const oldItem = getMaterialItem(current.typeId, oldState);
          if (oldItem) giveOrDrop(player, dimension, location, new ItemStack(oldItem, 1));
        }
      }

      current.setPermutation(permutationFrom(current.permutation, target.typeId, { [MATERIAL_STATE]: target.stateValue }));
      if (shapeId === "cc:copycat_door") {
        const sibling = getDoorSibling(current);
        if (sibling) {
          sibling.setPermutation(permutationFrom(sibling.permutation, target.typeId, { [MATERIAL_STATE]: target.stateValue }));
        }
      }
      consumeHeldItem(player, item.typeId);
      playSound(dimension, location, SOUNDS.textureAdd);
      playSound(dimension, location, target.sound?.place);
      updateWithNeighbors(current);
    } catch (e) {
      console.error(`[copycat] texturing ${shapeId} with ${item.typeId} failed: ${e}`);
    }
  }, 1);
  return true;
}
