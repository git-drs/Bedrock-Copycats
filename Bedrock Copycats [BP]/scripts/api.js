// api.js - public API for other scripts/packs. Function names are kept from the previous version.
import {
  addExternalVariant, canChangePosition, canRotate, getGroupId, getShapeId, isBaseShape, isTransformable, listExternalVariants,
  listMaterialItems, listShapeIds, registryMeta, resolveTexture, MATERIAL_STATE, getMaterialItem, getShape,
} from "./core/registry.js";
import { registerConnectionRule } from "./systems/connections.js";

export { registerConnectionRule, registryMeta };

export const getBlockTransformCapabilities = (blockType) => ({
  canRotate: canRotate(blockType),
  canChangePosition: canChangePosition(blockType),
  isTransformable: isTransformable(blockType),
});

export const listTransformableBlocks = () => listShapeIds().filter(isTransformable);

/** Register a material produced by blocks YOUR pack defines: item -> block (+ optional state) on a base shape. */
export const addTextureVariant = (itemId, { shapeId, blockType, stateName, stateValue, sound }) => {
  addExternalVariant(itemId, shapeId, { typeId: blockType, stateValue, stateName, groupId: null, sound: sound ? { place: { sound } } : null });
};

export const getTextureVariantInfo = (itemId, shapeId = "cc:copycat_block") => resolveTexture(itemId, shapeId);
export const listTextureVariants = () => [...listMaterialItems(), ...listExternalVariants().map((k) => k.split("|")[0])];

/** Items that can texture the given copycat block type (base shape or textured variant). */
export const getItemsForBlockType = (blockType) => {
  const shapeId = getShapeId(blockType);
  if (!shapeId || !getShape(shapeId).texturable) return [];
  return listMaterialItems().filter((id) => (isBaseShape(blockType) ? true : resolveTexture(id, shapeId)?.typeId === blockType));
};

export const getBlockTextureInfo = (block) => {
  const blockType = block.typeId;
  const groupId = getGroupId(blockType);
  if (!groupId) return { isTextured: false, blockType, textureInfo: null };
  const stateValue = block.permutation.getState(MATERIAL_STATE);
  return {
    isTextured: true,
    blockType,
    textureInfo: { itemId: getMaterialItem(blockType, stateValue), blockType, stateName: MATERIAL_STATE, stateValue, groupId, shapeId: getShapeId(blockType) },
  };
};
