// utils.js - Utility functions and shared state
import { system } from "@minecraft/server";
import { copycatBlocks, transformStates, positionStates, rotationStates, getTextureVariantForBlock, getTextureVariantsForItem, texturableCopycatBlocks } from "./config.js";

// Shared state
export const cooldowns = new Set();

// Block face constants
export const blockFaces = {
  DOWN: "down",
  UP: "up",
  NORTH: "north",
  SOUTH: "south",
  WEST: "west",
  EAST: "east"
};

// Utility functions
export const getBlockKey = (loc) => `${loc.x}_${loc.y}_${loc.z}`;
export const isCopycat = (typeId) => copycatBlocks.includes(typeId);
export const isTransformable = (typeId) => transformStates.hasOwnProperty(typeId);
export const canRotate = (typeId) => transformStates[typeId]?.canRotate || false;
export const canChangePosition = (typeId) => transformStates[typeId]?.canChangePosition || false;

// FIXED: Check if block is a default (untextured) copycat block
export const isDefaultCopycat = (typeId) => {
  // Check if it's one of the base texturable copycat blocks
  return texturableCopycatBlocks.includes(typeId);
};

// Updated function to get texture variant data for an item and specific block
export const getTextureVariant = (itemId, blockType = "cc:copycat_block") => {
  // If blockType is provided, get variant for that specific block
  if (blockType) {
    return getTextureVariantForBlock(itemId, blockType);
  }
  
  // Otherwise, get variants for all blocks and return the first one (for backward compatibility)
  const variants = getTextureVariantsForItem(itemId);
  return Object.values(variants)[0];
};

// Check if an item can be used as a texture on any copycat block
export const isTextureItem = (itemId) => {
  const variants = getTextureVariantsForItem(itemId);
  return Object.keys(variants).length > 0;
};

// Get all available texture variants for a specific item
export const getAvailableTextureVariants = (itemId) => {
  return getTextureVariantsForItem(itemId);
};

// Check if block is textured (not the default copycat block)
export const isBlockTextured = (block) => {
  return !isDefaultCopycat(block.typeId) && isCopycat(block.typeId);
};

// Get the next rotation for Y-axis (90-degree increments)
export const getNextYRotation = (currentDirection) => {
  const rotationOrder = [rotationStates.NORTH, rotationStates.EAST, rotationStates.SOUTH, rotationStates.WEST];
  const currentIndex = rotationOrder.indexOf(currentDirection);
  const nextIndex = (currentIndex + 1) % rotationOrder.length;
  return rotationOrder[nextIndex];
};

// Updated toggle position function to work with both position systems
export const togglePosition = (currentPosition) => {
  return currentPosition === positionStates.UPPER ? positionStates.LOWER : positionStates.UPPER;
};

// Optimized sound playing with batching
export const playSounds = (player, loc, sounds) => {
  system.runTimeout(() => {
    sounds.forEach(([sound, vol = 1, pitch = 1]) => {
      try {
        player.runCommandAsync(`playsound ${sound} @a ${loc.x} ${loc.y} ${loc.z} ${vol} ${pitch}`);
      } catch (e) { /* Silent fail */ }
    });
  }, 1);
};

// Get block face that was clicked
export const getClickedFace = (event) => {
  const { blockFace } = event;
  return blockFace;
};

// Get current block face state
export const getBlockFace = (block) => {
  try {
    return block.permutation.getState("minecraft:block_face") || blockFaces.DOWN;
  } catch (e) {
    return blockFaces.DOWN;
  }
};

// Set block face state
export const setBlockFace = (block, face) => {
  try {
    let newPermutation = block.permutation;
    newPermutation = newPermutation.withState("minecraft:block_face", face);
    block.setPermutation(newPermutation);
    return true;
  } catch (e) {
    console.error(`Failed to set block face: ${e}`);
    return false;
  }
};

// Toggle block face (cycle through available faces)
export const toggleBlockFace = (currentFace) => {
  const faceOrder = [blockFaces.DOWN, blockFaces.UP, blockFaces.NORTH, blockFaces.SOUTH, blockFaces.WEST, blockFaces.EAST];
  const currentIndex = faceOrder.indexOf(currentFace);
  const nextIndex = (currentIndex + 1) % faceOrder.length;
  return faceOrder[nextIndex];
};

// Updated to support both position state systems
export const getBlockPosition = (block) => {
  try {
    // First try minecraft:vertical_half (newer system)
    const verticalHalf = block.permutation.getState("minecraft:vertical_half");
    if (verticalHalf !== undefined) {
      return verticalHalf === "top" ? positionStates.UPPER : positionStates.LOWER;
    }
    
    // Fall back to cc:position (legacy system)
    const ccPosition = block.permutation.getState("cc:position");
    if (ccPosition !== undefined) {
      return ccPosition;
    }
    
    // Default to lower if no position state found
    return positionStates.LOWER;
  } catch (e) {
    return positionStates.LOWER;
  }
};

// Get current block rotation state
export const getBlockRotation = (block) => {
  try {
    return block.permutation.getState("minecraft:cardinal_direction") || rotationStates.NORTH;
  } catch (e) {
    return rotationStates.NORTH;
  }
};

// Get the base copycat block type from a textured block
export const getBaseCopycatType = (texturedBlockType) => {
  // First, check if it's already a base copycat block
  if (texturableCopycatBlocks.includes(texturedBlockType)) {
    return texturedBlockType;
  }
  
  // Try to match against each texturable copycat block to find the base
  for (const baseCopycatBlock of texturableCopycatBlocks) {
    if (texturedBlockType.startsWith(baseCopycatBlock)) {
      // Check if the remaining part looks like a texture suffix
      const suffix = texturedBlockType.substring(baseCopycatBlock.length);
      if (suffix.match(/^_\w+(_\d+)?$/)) {
        return baseCopycatBlock;
      }
    }
  }
  
  // Fallback: try pattern matching for specific block types
  // This handles cases where the above logic might miss something
  const blockPatterns = [
    { pattern: /copycat_horizontal_corner_beam/, base: "cc:copycat_horizontal_corner_beam" },
    { pattern: /copycat_corner_beam/, base: "cc:copycat_corner_beam" },
    { pattern: /copycat_beam/, base: "cc:copycat_beam" },
    { pattern: /copycat_slope/, base: "cc:copycat_slope" },
    { pattern: /copycat_slab/, base: "cc:copycat_slab" },
    { pattern: /copycat_block/, base: "cc:copycat_block" },
    { pattern: /copycat_fence/, base: "cc:copycat_fence"},
    { pattern: /copycat_board/, base: "cc:copycat_board"}
  ];
  
  for (const { pattern, base } of blockPatterns) {
    if (pattern.test(texturedBlockType) && texturableCopycatBlocks.includes(base)) {
      return base;
    }
  }
  
  // Final fallback
  return "cc:copycat_block";
};

// Helper function to check if a block can receive a specific texture
export const canReceiveTexture = (blockType, itemId) => {
  const variant = getTextureVariantForBlock(itemId, blockType);
  return variant !== undefined;
};

// Helper function to get texture information from a textured block
export const getTextureInfoFromBlock = (block) => {
  const blockType = block.typeId;
  
  // If it's a default copycat block, it has no texture
  if (isDefaultCopycat(blockType)) {
    return null;
  }
  
  // Try to extract texture information
  try {
    // This is a simplified version - you might need to adjust based on your block states
    const baseType = getBaseCopycatType(blockType);
    
    return {
      baseBlock: baseType,
      texturedBlock: blockType,
      isTextured: true
    };
  } catch (e) {
    return null;
  }
};

/**
 * Get the current vertical half state of a block
 * @param {Block} block - The block to check
 * @returns {string} - "bottom" or "top"
 */
export const getVerticalHalf = (block) => {
  try {
    return block.permutation.getState("minecraft:vertical_half") || "bottom";
  } catch (e) {
    return "bottom";
  }
};

/**
 * Toggle vertical half position
 * @param {string} currentHalf - Current vertical half ("bottom" or "top")
 * @returns {string} - New vertical half position
 */
export const toggleVerticalHalf = (currentHalf) => {
  return currentHalf === "bottom" ? "top" : "bottom";
};

// Helper function to check which position state system a block uses
export const getBlockPositionSystem = (block) => {
  try {
    // Check if block uses minecraft:vertical_half
    if (block.permutation.getState("minecraft:vertical_half") !== undefined) {
      return "vertical_half";
    }
    
    // Check if block uses cc:position
    if (block.permutation.getState("cc:position") !== undefined) {
      return "cc_position";
    }
    
    return null;
  } catch (e) {
    return null;
  }
};

// Helper function to set position state using the appropriate system
export const setBlockPosition = (block, position) => {
  try {
    let newPermutation = block.permutation;
    
    // Try minecraft:vertical_half first (newer system)
    try {
      if (block.permutation.getState("minecraft:vertical_half") !== undefined) {
        const verticalHalf = position === positionStates.UPPER ? "top" : "bottom";
        newPermutation = newPermutation.withState("minecraft:vertical_half", verticalHalf);
        block.setPermutation(newPermutation);
        return true;
      }
    } catch (e) {
      // Continue to try cc:position
    }
    
    // Fall back to cc:position (legacy system)
    try {
      if (block.permutation.getState("cc:position") !== undefined) {
        newPermutation = newPermutation.withState("cc:position", position);
        block.setPermutation(newPermutation);
        return true;
      }
    } catch (e) {
      // Neither system works
    }
    
    return false;
  } catch (e) {
    console.error(`Failed to set block position: ${e}`);
    return false;
  }
};

// Helper function to get all current states of a block for debugging
export const getBlockStates = (block) => {
  const states = {};
  
  try {
    // Common states to check
    const statesToCheck = [
      "minecraft:cardinal_direction",
      "minecraft:vertical_half", 
      "minecraft:block_face",
      "cc:position",
      "cc:glass"
    ];
    
    statesToCheck.forEach(state => {
      try {
        const value = block.permutation.getState(state);
        if (value !== undefined) {
          states[state] = value;
        }
      } catch (e) {
        // State doesn't exist, ignore
      }
    });
    
    return states;
  } catch (e) {
    console.error(`Error getting block states: ${e}`);
    return states;
  }
};