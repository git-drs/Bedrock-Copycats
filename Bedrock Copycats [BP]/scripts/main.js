// main.js - Main event handler and initialization
import { world } from "@minecraft/server";
import { isCopycat, isTransformable, getTextureVariant } from "./utils.js";
import { handleCopycatBlock} from "./textureHandler.js";
import { handleWrench } from "./wrenchHandler.js";
import "./trapdoor.js";
import "./neighbour.js";

// Export all API functions for external use
export * from "./api.js";

// ============================================
// MAIN EVENT HANDLER
// ============================================
world.beforeEvents.itemUseOn.subscribe(event => {
  const { itemStack: item, block, source: player } = event;
  
  // Early exit checks to minimize processing
  if (!item?.typeId || !block?.typeId || !player?.id) return;
  if (!isCopycat(block.typeId) && !isTransformable(block.typeId)) return;
  
  const isWrench = item.typeId === "cc:wrench";
  
  // Check if this is a valid interaction
  if (!isWrench && !getTextureVariant(item.typeId)) return;
  
  // Route to appropriate handler
  if (isWrench) {
    handleWrench(event);
  } else {
    handleCopycatBlock(event);
  }
});

// ============================================
// CLEANUP
// ============================================
world.afterEvents.playerBreakBlock.subscribe(event => {
  if (isCopycat(event.block.typeId) || isTransformable(event.block.typeId)) {
    // No cache to clean up in this version
  }
});

console.warn("Bedrock Copycat has been reload........");