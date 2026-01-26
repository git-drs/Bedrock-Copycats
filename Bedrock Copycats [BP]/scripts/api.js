// api.js - Public API functions for external use
import { transformStates, textureVariants } from "./config.js";
import { canRotate, canChangePosition, isTransformable, isBlockTextured } from "./utils.js";

// ============================================
// UTILITY FUNCTIONS FOR EXTERNAL USE
// ============================================
export const getBlockTransformCapabilities = (blockType) => {
  return {
    canRotate: canRotate(blockType),
    canChangePosition: canChangePosition(blockType),
    isTransformable: isTransformable(blockType)
  };
};

export const listTransformableBlocks = () => {
  return Object.keys(transformStates);
};

// Helper function to add new texture variants dynamically
export const addTextureVariant = (itemId, variantData) => {
  textureVariants[itemId] = variantData;
  console.log(`Added texture variant: ${itemId} -> ${variantData.blockType} (${variantData.stateValue})`);
};

// Helper function to get texture variant info for an item
export const getTextureVariantInfo = (itemId) => {
  return textureVariants[itemId];
};

// Helper function to list all available texture variants
export const listTextureVariants = () => {
  return Object.keys(textureVariants);
};

// Helper function to get all items for a specific block type
export const getItemsForBlockType = (blockType) => {
  const items = [];
  for (const [itemId, variant] of Object.entries(textureVariants)) {
    if (variant.blockType === blockType) {
      items.push(itemId);
    }
  }
  return items;
};

// Helper function to get current texture information for a block
export const getBlockTextureInfo = (block) => {
  const blockType = block.typeId;
  const isTextured = isBlockTextured(block);
  
  let textureInfo = null;
  if (isTextured) {
    // Find the texture variant that matches this block
    for (const [itemId, variant] of Object.entries(textureVariants)) {
      if (variant.blockType === blockType) {
        try {
          const stateValue = block.permutation.getState(variant.stateName);
          if (stateValue === variant.stateValue) {
            textureInfo = {
              itemId: itemId,
              blockType: variant.blockType,
              stateValue: variant.stateValue,
              stateName: variant.stateName
            };
            break;
          }
        } catch (e) {
          // State doesn't exist, continue
        }
      }
    }
  }
  
  return {
    isTextured: isTextured,
    blockType: blockType,
    textureInfo: textureInfo
  };
};