// wrenchHandler.js - Handles wrench functionality (pickup and reset)
import { system, ItemStack, BlockPermutation } from "@minecraft/server";
import { 
  cooldowns, 
  getBlockKey, 
  isCopycat, 
  isTransformable, 
  isBlockTextured, 
  getBlockRotation, 
  getBlockPosition, 
  getBlockFace,  // Add this import
  playSounds,
  getBaseCopycatType,
  getVerticalHalf,  // Add this import
  getBlockStates    // Add this import for debugging
} from "./utils.js";
import { handleBlockTransformation } from "./transformHandler.js";

// ============================================
// WRENCH LOGIC - FIXED TO PRESERVE ALL STATES
// ============================================
export const handleWrench = (event) => {
  const { itemStack: item, block, source: player } = event;
  const blockKey = getBlockKey(block.location);
  
  // Check if this is a transformable block and conditions are met for transformation
  if (isTransformable(block.typeId) && !player.isSneaking) {
    handleBlockTransformation(event);
    return;
  }
  
  const cooldownKey = `${player.id}_${blockKey}`;
  if (cooldowns.has(cooldownKey)) return;
  
  cooldowns.add(cooldownKey);
  system.runTimeout(() => cooldowns.delete(cooldownKey), 10);
  event.cancel = true;

  system.runTimeout(() => {
    try {
      const targetBlock = block.dimension.getBlock(block.location);
      if (!targetBlock || !isCopycat(targetBlock.typeId)) return;

      if (player.isSneaking) {
        // Pickup functionality - FIXED: Give base copycat block instead of textured variant
        const baseType = getBaseCopycatType(targetBlock.typeId);
        const blockItem = new ItemStack(baseType, 1);
        const inventory = player.getComponent("minecraft:inventory");
        
        if (inventory?.container) {
          const remaining = inventory.container.addItem(blockItem);
          if (!remaining) {
            targetBlock.dimension.setBlockType(targetBlock.location, "minecraft:air");
            playSounds(player, block.location, [["random.pop", 0.5, 1.2],["place.copper"]]);
          } else {
            targetBlock.dimension.spawnItem(blockItem, {
              x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5
            });
            targetBlock.dimension.setBlockType(targetBlock.location, "minecraft:air");
            playSounds(player, block.location, [["random.pop", 0.5, 1.2]]);
          }
        }
      } else {
        // Reset functionality - convert back to default copycat block
        if (isBlockTextured(targetBlock)) {
          // Store ALL current block states before transformation
          const currentRotation = getBlockRotation(targetBlock);
          const currentPosition = getBlockPosition(targetBlock);
          const currentVerticalHalf = getVerticalHalf(targetBlock);
          const currentBlockFace = getBlockFace(targetBlock);  // Store block face
          
          // Debug: Log current states
          console.log(`Current block states before reset:`, getBlockStates(targetBlock));
          
          // Use the utility function to get the proper base type
          const baseType = getBaseCopycatType(targetBlock.typeId);
          
          try {
            let newPermutation = BlockPermutation.resolve(baseType);
            
            // Preserve rotation state
            try {
              newPermutation = newPermutation.withState("minecraft:cardinal_direction", currentRotation);
            } catch (e) { /* State doesn't exist on new block */ }
            
            // Preserve block face state - THIS IS CRITICAL FOR POSITION
            try {
              newPermutation = newPermutation.withState("minecraft:block_face", currentBlockFace);
            } catch (e) { /* State doesn't exist on new block */ }
            
            // Preserve vertical_half state (newer system)
            try {
              newPermutation = newPermutation.withState("minecraft:vertical_half", currentVerticalHalf);
            } catch (e) { 
              // Fall back to cc:position if vertical_half doesn't exist
              try {
                newPermutation = newPermutation.withState("cc:position", currentPosition);
              } catch (e2) { /* Neither state exists */ }
            }
            
            // Apply the new permutation
            targetBlock.setPermutation(newPermutation);
            playSounds(player, block.location, [["block.itemframe.remove_item", 0.8, 0.8]]);
            
            // Debug: Log final states
            console.log(`Reset textured block ${targetBlock.typeId} to default ${baseType}`);
            console.log(`Preserved states - rotation: ${currentRotation}, face: ${currentBlockFace}, vertical_half: ${currentVerticalHalf}`);
            console.log(`Final block states:`, getBlockStates(targetBlock.dimension.getBlock(targetBlock.location)));
            
          } catch (e) {
            console.error(`Failed to reset block to ${baseType}: ${e}`);
          }
        }
      }
    } catch (e) { 
      console.error(`Wrench error: ${e}`); 
    }
  }, 1);
};