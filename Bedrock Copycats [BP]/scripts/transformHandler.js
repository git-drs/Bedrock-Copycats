// transformHandler.js - Handles block transformations (rotation and position)
import { system } from "@minecraft/server";
import { 
  cooldowns, 
  getBlockKey, 
  isTransformable, 
  canRotate, 
  canChangePosition, 
  getClickedFace, 
  getBlockRotation, 
  getBlockPosition, 
  getNextYRotation, 
  togglePosition, 
  playSounds 
} from "./utils.js";

// ============================================
// BLOCK TRANSFORMATION LOGIC
// ============================================
export const handleBlockTransformation = (event) => {
  const { block, source: player } = event;
  const blockKey = getBlockKey(block.location);
  const clickedFace = getClickedFace(event);
  const blockType = block.typeId;
  
  // Only transform if player is not sneaking
  if (player.isSneaking) {
    return; // Don't handle transformation, let wrench handle it normally
  }
  
  const cooldownKey = `transform_${player.id}_${blockKey}`;
  if (cooldowns.has(cooldownKey)) return;
  
  cooldowns.add(cooldownKey);
  system.runTimeout(() => cooldowns.delete(cooldownKey), 10);
  event.cancel = true;

  system.runTimeout(() => {
    try {
      const targetBlock = block.dimension.getBlock(block.location);
      if (!targetBlock || !isTransformable(targetBlock.typeId)) return;

      const currentPermutation = targetBlock.permutation;
      const currentDirection = getBlockRotation(targetBlock);
      const currentPosition = getBlockPosition(targetBlock);
      
      let newPermutation = currentPermutation;
      let actionPerformed = false;
      
      // Check if clicked on up or down face (Y-axis rotation)
      if ((clickedFace === "Up" || clickedFace === "Down") && canRotate(blockType)) {
        // Rotate around Y-axis by 90 degrees
        const newDirection = getNextYRotation(currentDirection);
        newPermutation = newPermutation.withState("minecraft:cardinal_direction", newDirection);
        
        targetBlock.setPermutation(newPermutation);
        playSounds(player, block.location, [["block.itemframe.rotate_item", 0.7, 1.2]]);
        
        console.log(`Rotated ${blockType} from ${currentDirection} to ${newDirection}`);
        actionPerformed = true;
      } 
      // Check if clicked on cardinal faces (position toggle)
      else if (["North", "South", "East", "West"].includes(clickedFace) && canChangePosition(blockType)) {
        // Check if block uses minecraft:vertical_half state
        const hasVerticalHalf = currentPermutation.getState("minecraft:vertical_half") !== undefined;
        const hasCCPosition = currentPermutation.getState("cc:position") !== undefined;
        
        if (hasVerticalHalf) {
          // Handle blocks with minecraft:vertical_half state
          const currentVerticalHalf = currentPermutation.getState("minecraft:vertical_half") || "bottom";
          const newVerticalHalf = currentVerticalHalf === "bottom" ? "top" : "bottom";
          
          // Update vertical_half state
          newPermutation = newPermutation.withState("minecraft:vertical_half", newVerticalHalf);
          
          // Also update cc:position if it exists (keep states synchronized)
          if (hasCCPosition) {
            const newCCPosition = newVerticalHalf === "top" ? "upper" : "lower";
            newPermutation = newPermutation.withState("cc:position", newCCPosition);
          }
          
          targetBlock.setPermutation(newPermutation);
          playSounds(player, block.location, [["block.itemframe.place"]]);
          
          console.log(`Changed ${blockType} vertical_half from ${currentVerticalHalf} to ${newVerticalHalf}`);
          actionPerformed = true;
        } else if (hasCCPosition) {
          // Handle blocks with only cc:position state
          const newPosition = togglePosition(currentPosition);
          newPermutation = newPermutation.withState("cc:position", newPosition);
          
          targetBlock.setPermutation(newPermutation);
          playSounds(player, block.location, [["block.itemframe.place"]]);
          
          console.log(`Changed ${blockType} position from ${currentPosition} to ${newPosition}`);
          actionPerformed = true;
        }
      }
    } catch (e) { 
      console.error(`Transform error: ${e}`); 
    }
  }, 1);
};