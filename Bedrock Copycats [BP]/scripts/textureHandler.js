// textureHandler.js - Handles texture application to copycat blocks
import { system, BlockPermutation } from "@minecraft/server";
import { 
  cooldowns, 
  getBlockKey, 
  isCopycat, 
  isDefaultCopycat, 
  getBlockRotation, 
  getBlockPosition, 
  getBlockFace,
  playSounds 
} from "./utils.js";
import { getTextureVariantForBlock } from "./config.js";

// ============================================
// COPYCAT BLOCK LOGIC - UPDATED FOR DYNAMIC SYSTEM WITH BLOCK FACE SUPPORT
// ============================================
export const handleCopycatBlock = (event) => {
  const { itemStack: item, block, source: player } = event;
  const blockKey = getBlockKey(block.location);
  
  // Get texture variant for this specific item and base block combination
  const textureVariant = getTextureVariantForBlock(item.typeId, block.typeId);
  
  if (textureVariant && !cooldowns.has(blockKey)) {
    // Only apply texture if it's a default copycat block (not already textured)
    if (!isDefaultCopycat(block.typeId) && !isCopycat(block.typeId)) {
      console.log(`Block ${block.typeId} is not a valid copycat block, skipping texture application`);
      return;
    }
    
    // Check if the block is already textured with a different texture
    if (isCopycat(block.typeId) && !isDefaultCopycat(block.typeId) && !block.typeId.includes(textureVariant.blockType.split('_').slice(-1)[0])) {
      console.log(`Block ${block.typeId} is already textured with different material, skipping texture application`);
      return;
    }
    
    cooldowns.add(blockKey);
    system.runTimeout(() => cooldowns.delete(blockKey), 20);
    event.cancel = true;

    system.runTimeout(() => {
      try {
        const targetBlock = block.dimension.getBlock(block.location);
        if (!targetBlock || !isCopycat(targetBlock.typeId)) return;
        
        // Store current block states before transformation
        const currentRotation = getBlockRotation(targetBlock);
        const currentPosition = getBlockPosition(targetBlock);
        const currentBlockFace = getBlockFace(targetBlock);
        
        // Use the target block type from the texture variant
        const targetBlockType = textureVariant.blockType;
        
        // Create new permutation with the texture variant
        let newPermutation;
        try {
          newPermutation = BlockPermutation.resolve(targetBlockType);
          
          // Apply texture state
          if (textureVariant.stateName && textureVariant.stateValue) {
            newPermutation = newPermutation.withState(textureVariant.stateName, textureVariant.stateValue);
            playSounds(player, block.location, [["block.itemframe.add_item"]]);
          }
          
          // Preserve rotation state if it exists
          try {
            newPermutation = newPermutation.withState("minecraft:cardinal_direction", currentRotation);
          } catch (e) { 
            // State doesn't exist on new block, that's fine
          }
          
          // Preserve block face state if it exists
          try {
            newPermutation = newPermutation.withState("minecraft:block_face", currentBlockFace);
          } catch (e) { 
            // State doesn't exist on new block, that's fine
          }
          
          // Preserve position states - try both systems
          try {
            // First try minecraft:vertical_half (newer system)
            const verticalHalf = currentPosition === "upper" ? "top" : "bottom";
            newPermutation = newPermutation.withState("minecraft:vertical_half", verticalHalf);
          } catch (e) { 
            // Fall back to cc:position (legacy system)
            try {
              newPermutation = newPermutation.withState("cc:position", currentPosition);
            } catch (e2) {
              // Neither state exists on new block, that's fine
            }
          }
          
          // Apply the new permutation
          targetBlock.setPermutation(newPermutation);
          playSounds(player, block.location, [[textureVariant.sound]]);
          
          console.log(`Applied texture variant ${textureVariant.stateValue} to block type ${targetBlockType} with face ${currentBlockFace}`);
          
        } catch (e) {
          console.error(`Failed to create block permutation for ${targetBlockType}: ${e}`);
        }
      } catch (e) { 
        console.error(`Texture variant error: ${e}`); 
      }
    }, 1);
  } else if (!textureVariant) {
    // Optional: Give feedback when item cannot be used as texture
    console.log(`No texture variant found for item ${item.typeId} on block ${block.typeId}`);
  }
};