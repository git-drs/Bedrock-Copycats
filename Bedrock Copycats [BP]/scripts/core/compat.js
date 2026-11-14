// core/compat.js - the one place that knows about @minecraft/server API differences between versions.
// Everything else uses the normalized shapes returned here, so an API bump only touches this file.
import { world, system } from "@minecraft/server";

/**
 * Subscribe to "player used/interacted with a block". Works with both the older
 * world.beforeEvents.itemUseOn and the newer world.beforeEvents.playerInteractWithBlock.
 * handler receives { player, block, face, item, cancel() }.
 */
export function onBlockInteract(handler) {
  const evt = world.beforeEvents.playerInteractWithBlock ?? world.beforeEvents.itemUseOn;
  if (!evt) { console.error("[copycat] No block-interact event available in this @minecraft/server version"); return; }
  evt.subscribe((e) => {
    handler({
      player: e.player ?? e.source,
      block: e.block,
      face: e.blockFace,
      item: e.itemStack,
      cancel: () => { e.cancel = true; },
    });
  });
}

/** Subscribe to the one-time startup event where custom components must be registered. */
export function onStartup(handler) {
  const evt = system.beforeEvents?.startup ?? world.beforeEvents?.worldInitialize;
  if (!evt) { console.error("[copycat] No startup event available in this @minecraft/server version"); return; }
  evt.subscribe(handler);
}

/** Give an item stack directly to the player inventory, or spawn it at the block location if full. */
export function giveOrDrop(player, dimension, location, stack) {
  if (!stack) return;
  try {
    const inv = player?.getComponent("minecraft:inventory") ?? player?.getComponent("inventory");
    const container = inv?.container;
    if (container) {
      const leftover = container.addItem(stack);
      if (!leftover) return;
      if (dimension && location) {
        dimension.spawnItem(leftover, { x: location.x + 0.5, y: location.y + 0.5, z: location.z + 0.5 });
      }
      return;
    }
  } catch (e) {
    console.warn(`[copycat] container addItem error: ${e}`);
  }

  try {
    if (dimension && location) {
      dimension.spawnItem(stack, { x: location.x + 0.5, y: location.y + 0.5, z: location.z + 0.5 });
    }
  } catch (_) {}
}
