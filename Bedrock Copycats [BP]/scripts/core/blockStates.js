// core/blockStates.js - state helpers. States are carried over generically instead of from hardcoded lists,
// so any state a base block declares (rotation, half, face, open, connections, ...) survives a block swap.
import { BlockPermutation } from "@minecraft/server";

export const ROTATIONS = ["north", "east", "south", "west"];

/** Build a permutation of `typeId` that keeps every state of `from` the new block also has, plus `overrides`. */
export function permutationFrom(from, typeId, overrides = {}) {
  const fresh = BlockPermutation.resolve(typeId);
  const valid = fresh.getAllStates();
  const states = {};
  for (const [k, v] of Object.entries(from.getAllStates())) if (k in valid) states[k] = v;
  for (const [k, v] of Object.entries(overrides)) if (k in valid) states[k] = v;
  try {
    return BlockPermutation.resolve(typeId, states);
  } catch (e) {
    let perm = fresh; // fall back to applying states one by one, skipping any that are rejected
    for (const [k, v] of Object.entries(states)) { try { perm = perm.withState(k, v); } catch { /* skip */ } }
    return perm;
  }
}

export const getState = (perm, name) => perm.getAllStates()[name];
export const hasState = (perm, name) => name in perm.getAllStates();

export const nextRotation = (current) => ROTATIONS[(Math.max(0, ROTATIONS.indexOf(current)) + 1) % ROTATIONS.length];

/** Toggle bottom/top, keeping the legacy cc:position (lower/upper) state in sync when a block has both. */
export function toggledPosition(perm) {
  const states = perm.getAllStates();
  const next = {};
  if ("minecraft:vertical_half" in states) next["minecraft:vertical_half"] = states["minecraft:vertical_half"] === "bottom" ? "top" : "bottom";
  if ("cc:position" in states) {
    next["cc:position"] = "minecraft:vertical_half" in next ? (next["minecraft:vertical_half"] === "top" ? "upper" : "lower") : states["cc:position"] === "upper" ? "lower" : "upper";
  }
  return Object.keys(next).length ? next : null;
}
