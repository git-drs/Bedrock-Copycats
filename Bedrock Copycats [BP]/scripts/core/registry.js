// core/registry.js - runtime lookups over the generated registry. No hardcoded block lists anywhere.
import { REGISTRY } from "../generated/registry.js";

const { stateName: MATERIAL_STATE, separator: SEP, baseSound } = REGISTRY.meta;
export { MATERIAL_STATE };

/** variant block id -> { shapeId, groupId } */
const variants = new Map();
for (const [shapeId, shape] of Object.entries(REGISTRY.shapes)) {
  if (!shape.texturable) continue;
  for (const groupId of Object.keys(REGISTRY.groups)) variants.set(`${shapeId}${SEP}${groupId}`, { shapeId, groupId });
}

/** Extra materials registered at runtime by other packs (see api.js). key: `${itemId}|${shapeId}` */
const external = new Map();

export const isBaseShape = (typeId) => typeId in REGISTRY.shapes;
export const isVariant = (typeId) => variants.has(typeId);
export const getShapeId = (typeId) => (isBaseShape(typeId) ? typeId : variants.get(typeId)?.shapeId);
export const isCopycat = (typeId) => getShapeId(typeId) !== undefined;
export const getShape = (shapeId) => REGISTRY.shapes[shapeId];
export const getGroupId = (typeId) => variants.get(typeId)?.groupId;
export const listShapeIds = () => Object.keys(REGISTRY.shapes);
export const listVariantTypes = () => [...variants.keys()];

export const isTransformable = (typeId) => {
  const s = isBaseShape(typeId) ? REGISTRY.shapes[typeId] : null;
  return !!s && (s.rotate || s.position);
};
export const canRotate = (typeId) => !!REGISTRY.shapes[typeId]?.rotate;
export const canChangePosition = (typeId) => !!REGISTRY.shapes[typeId]?.position;

/**
 * Resolve "apply this item to a block of this shape" -> the block to become.
 * @returns {{ typeId: string, stateValue: string, groupId: string|null, sound: object|null } | undefined}
 */
export function resolveTexture(itemId, shapeId) {
  const shape = REGISTRY.shapes[shapeId];
  if (!shape?.texturable) return undefined;
  const ext = external.get(`${itemId}|${shapeId}`);
  if (ext) return ext;
  const entry = REGISTRY.materials[itemId.replace(/^minecraft:/, "")];
  if (!entry || !itemId.startsWith("minecraft:")) return undefined;
  const [groupId, stateValue] = entry;
  return { typeId: `${shapeId}${SEP}${groupId}`, stateValue, groupId, sound: REGISTRY.sounds[REGISTRY.groups[groupId].sound] ?? null };
}

/** Sound set ({ place, break, trapdoorOpen, trapdoorClose }) for any copycat block type. */
export function getSounds(typeId) {
  const groupId = getGroupId(typeId);
  const own = REGISTRY.sounds[groupId ? REGISTRY.groups[groupId].sound : baseSound] ?? {};
  const base = REGISTRY.sounds[baseSound] ?? {};
  // vanilla defines trapdoor sounds only for a few materials; the rest use the base block's
  return { ...own, trapdoorOpen: own.trapdoorOpen ?? base.trapdoorOpen, trapdoorClose: own.trapdoorClose ?? base.trapdoorClose };
}

/** Which vanilla item a textured block is made from (reverse lookup), or null. */
export function getMaterialItem(typeId, stateValue) {
  const groupId = getGroupId(typeId);
  if (groupId) {
    if (stateValue) {
      const entry = REGISTRY.materials[stateValue];
      if (entry && entry[0] === groupId) return `minecraft:${stateValue}`;
    }
    const group = REGISTRY.groups[groupId];
    if (group?.values?.length > 0) {
      return `minecraft:${group.values[0]}`;
    }
  }
  for (const [key, v] of external.entries()) {
    if (v.typeId === typeId && (!stateValue || v.stateValue === stateValue)) {
      return key.split("|")[0];
    }
  }
  return null;
}

export function listMaterialItems() {
  return Object.keys(REGISTRY.materials).map((n) => `minecraft:${n}`);
}

export function addExternalVariant(itemId, shapeId, variant) {
  external.set(`${itemId}|${shapeId}`, variant);
}
export const listExternalVariants = () => [...external.keys()];

export const registryMeta = () => ({ ...REGISTRY.meta, shapes: Object.keys(REGISTRY.shapes).length, groups: Object.keys(REGISTRY.groups).length, materials: Object.keys(REGISTRY.materials).length });
export const getConnectionInfo = (shapeId) => REGISTRY.shapes[shapeId]?.connections ?? null;
