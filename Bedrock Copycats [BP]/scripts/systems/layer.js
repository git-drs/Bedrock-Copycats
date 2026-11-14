// systems/layer.js - stacking interaction for copycat layer
import { onStartup } from "../core/compat.js";
import { playSound } from "../core/sound.js";
import { SOUNDS } from "../config.js";

function consumeOneItem(player, itemTypeId) {
  try {
    const isCreative = player.getGameMode ? player.getGameMode() === "creative" : false;
    if (isCreative) return;

    const inv = player.getComponent("minecraft:inventory");
    if (!inv?.container) return;

    const slot = player.selectedSlotIndex;
    const item = inv.container.getItem(slot);
    if (item && item.typeId === itemTypeId) {
      if (item.amount > 1) {
        item.amount -= 1;
        inv.container.setItem(slot, item);
      } else {
        inv.container.setItem(slot, undefined);
      }
    }
  } catch {}
}

const LayerComponent = {
  onPlayerInteract({ block, dimension, player }) {
    try {
      const equippable = player.getComponent("minecraft:equippable");
      const mainhand = equippable?.getEquipment("Mainhand");
      if (mainhand?.typeId === "cc:copycat_layer") {
        const height = block.permutation.getState("cc:height") || 1;
        if (height < 8) {
          block.setPermutation(block.permutation.withState("cc:height", height + 1));
          consumeOneItem(player, "cc:copycat_layer");
          playSound(dimension, block.location, SOUNDS.pickupPlace);
        }
      }
    } catch (e) {
      console.warn(`[copycat] layer stacking failed: ${e}`);
    }
  }
};

onStartup((e) => {
  e.blockComponentRegistry.registerCustomComponent("cc:layer", LayerComponent);
});
