// systems/connections.js - keep cc:<dir>_connected states in sync with neighbours (fences etc.).
// Which shapes have connection states is read from the registry (generated from the block files);
// the connection *rules* live in config.js. Textured variants behave exactly like their base shape.
import { world, system } from "@minecraft/server";
import { CONNECTION_RULES } from "../config.js";
import { getShapeId, getConnectionInfo } from "../core/registry.js";

const DIRECTIONS = {
  north: { x: 0, y: 0, z: -1 }, south: { x: 0, y: 0, z: 1 },
  east: { x: 1, y: 0, z: 0 }, west: { x: -1, y: 0, z: 0 },
  up: { x: 0, y: 1, z: 0 }, down: { x: 0, y: -1, z: 0 },
};
const rules = new Map(Object.entries(CONNECTION_RULES));

/** Register/replace a rule at runtime (keyed by base shape id). */
export function registerConnectionRule(shapeId, rule) { rules.set(shapeId, rule); }

function connectionConfig(typeId) {
  const shapeId = getShapeId(typeId);
  const info = shapeId && getConnectionInfo(shapeId);
  if (!info) return null;
  return { shapeId, ...info, ...(rules.get(shapeId) ?? { rule: "self" }) };
}

function shouldConnect(neighbor, cfg) {
  if (!neighbor || neighbor.typeId === "minecraft:air") return false;
  const neighborShape = getShapeId(neighbor.typeId);
  if (neighborShape === cfg.shapeId) return true;
  if (neighborShape === "cc:copycat_block") return true;
  switch (cfg.rule) {
    case "self": return neighborShape === cfg.shapeId;
    case "tag": return safeHasTag(neighbor, cfg.tag);
    case "whitelist": return (cfg.allowList ?? []).some((id) => id === neighbor.typeId || id === neighborShape);
    case "blacklist": {
      if (cfg.tag && safeHasTag(neighbor, cfg.tag)) return true;
      const name = (neighborShape ?? neighbor.typeId).toLowerCase(); // match against the BASE id, not the variant suffix
      return !(cfg.denyList ?? []).some((w) => name.includes(w.toLowerCase()));
    }
    default: return false;
  }
}

const safeHasTag = (b, tag) => { try { return b.hasTag(tag); } catch { return false; } };
const neighborAt = (block, off) => { try { return block.dimension.getBlock({ x: block.location.x + off.x, y: block.location.y + off.y, z: block.location.z + off.z }); } catch { return undefined; } };

function updateConnections(block) {
  const cfg = connectionConfig(block.typeId);
  if (!cfg) return;
  let perm = block.permutation, changed = false;
  const current = perm.getAllStates();
  const connectedMap = {};
  for (const dir of cfg.directions) {
    const stateName = `${cfg.prefix}${dir}_connected`;
    const want = shouldConnect(neighborAt(block, DIRECTIONS[dir]), cfg);
    connectedMap[dir] = want;
    if (current[stateName] !== undefined && current[stateName] !== want) { perm = perm.withState(stateName, want); changed = true; }
  }
  if (current["cc:wall_post"] !== undefined) {
    const n = connectedMap.north ?? perm.getState("cc:north_connected");
    const s = connectedMap.south ?? perm.getState("cc:south_connected");
    const e = connectedMap.east ?? perm.getState("cc:east_connected");
    const w = connectedMap.west ?? perm.getState("cc:west_connected");
    const isStraightLine = (n && s && !e && !w) || (e && w && !n && !s);
    const above = neighborAt(block, DIRECTIONS.up);
    const hasAbove = above && above.typeId !== "minecraft:air";
    const wantPost = !isStraightLine || hasAbove;
    if (current["cc:wall_post"] !== wantPost) {
      perm = perm.withState("cc:wall_post", wantPost);
      changed = true;
    }
  }
  if (changed) { try { block.setPermutation(perm); } catch (e) { console.warn(`[copycat] connection update failed: ${e}`); } }
}

// --- Stair Corner Shape Connection ---
const DIRECTIONS_OPPOSITE = { north: "south", south: "north", east: "west", west: "east" };
const CLOCKWISE = { north: "east", east: "south", south: "west", west: "north" };
const WEIRDO_TO_CARDINAL = ["west", "east", "north", "south"];

export function isAnyStair(block) {
  if (!block?.typeId) return false;
  return getShapeId(block.typeId) === "cc:copycat_stair" || block.typeId.includes("stair");
}

export function isCopycatStair(typeId) {
  return getShapeId(typeId) === "cc:copycat_stair";
}

function getStairFacing(block) {
  if (!block?.permutation) return "north";
  try {
    const card = block.permutation.getState("minecraft:cardinal_direction");
    if (card) return card;
  } catch (_) {}
  try {
    const weirdo = block.permutation.getState("weirdo_direction");
    if (weirdo !== undefined && weirdo >= 0 && weirdo < WEIRDO_TO_CARDINAL.length) {
      return WEIRDO_TO_CARDINAL[weirdo];
    }
  } catch (_) {}
  return "north";
}

function getStairHalf(block) {
  if (!block?.permutation) return "bottom";
  try {
    const half = block.permutation.getState("minecraft:vertical_half");
    if (half) return half;
  } catch (_) {}
  try {
    const upsideDown = block.permutation.getState("upside_down_bit");
    if (upsideDown !== undefined) return upsideDown ? "top" : "bottom";
  } catch (_) {}
  return "bottom";
}

function isPerpendicular(dirA, dirB) {
  return dirA !== dirB && dirA !== DIRECTIONS_OPPOSITE[dirB];
}

function canTakeShape(dimension, loc, facing, half, checkDir) {
  const off = DIRECTIONS[checkDir];
  if (!off) return true;
  try {
    const adjBlock = dimension.getBlock({ x: loc.x + off.x, y: loc.y + off.y, z: loc.z + off.z });
    if (!adjBlock || !isAnyStair(adjBlock)) return true;
    const adjFacing = getStairFacing(adjBlock);
    const adjHalf = getStairHalf(adjBlock);
    return adjFacing !== facing || adjHalf !== half;
  } catch (_) {
    return true;
  }
}

export function calculateStairShape(block) {
  if (!block || !isAnyStair(block)) return "straight";
  const facing = getStairFacing(block);
  const half = getStairHalf(block);
  const dimension = block.dimension;
  const loc = block.location;

  try {
    const frontOffset = DIRECTIONS[facing];
    const frontBlock = dimension.getBlock({ x: loc.x + frontOffset.x, y: loc.y + frontOffset.y, z: loc.z + frontOffset.z });
    if (frontBlock && isAnyStair(frontBlock) && getStairHalf(frontBlock) === half) {
      const frontFacing = getStairFacing(frontBlock);
      if (isPerpendicular(frontFacing, facing) && canTakeShape(dimension, loc, facing, half, DIRECTIONS_OPPOSITE[frontFacing])) {
        return frontFacing === CLOCKWISE[facing] ? "outer_left" : "outer_right";
      }
    }
  } catch (_) {}

  try {
    const oppDir = DIRECTIONS_OPPOSITE[facing];
    const oppOffset = DIRECTIONS[oppDir];
    const backBlock = dimension.getBlock({ x: loc.x + oppOffset.x, y: loc.y + oppOffset.y, z: loc.z + oppOffset.z });
    if (backBlock && isAnyStair(backBlock) && getStairHalf(backBlock) === half) {
      const backFacing = getStairFacing(backBlock);
      if (isPerpendicular(backFacing, facing) && canTakeShape(dimension, loc, facing, half, backFacing)) {
        return backFacing === CLOCKWISE[facing] ? "inner_left" : "inner_right";
      }
    }
  } catch (_) {}

  return "straight";
}

export function updateStairConnections(block) {
  if (!block || !isCopycatStair(block.typeId)) return;
  const targetShape = calculateStairShape(block);
  try {
    const currentShape = block.permutation.getState("cc:stair_shape");
    if (currentShape !== targetShape) {
      block.setPermutation(block.permutation.withState("cc:stair_shape", targetShape));
    }
  } catch (e) {
    console.warn(`[copycat] stair connection update failed: ${e}`);
  }
}

export function updateWithNeighbors(block) {
  updateConnections(block);
  updateStairConnections(block);
  for (const off of Object.values(DIRECTIONS)) {
    const n = neighborAt(block, off);
    if (n) {
      if (connectionConfig(n.typeId)) updateConnections(n);
      if (isCopycatStair(n.typeId)) updateStairConnections(n);
    }
  }
}

world.afterEvents.playerPlaceBlock.subscribe(({ block }) => system.run(() => updateWithNeighbors(block)));
world.afterEvents.playerBreakBlock.subscribe(({ block, dimension }) => {
  const { x, y, z } = block.location;
  system.run(() => {
    for (const off of Object.values(DIRECTIONS)) {
      try {
        const n = dimension.getBlock({ x: x + off.x, y: y + off.y, z: z + off.z });
        if (n) {
          if (connectionConfig(n.typeId)) updateConnections(n);
          if (isCopycatStair(n.typeId)) updateStairConnections(n);
        }
      } catch { /* unloaded chunk */ }
    }
  });
});
