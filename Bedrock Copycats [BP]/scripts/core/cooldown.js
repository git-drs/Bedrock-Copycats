// core/cooldown.js - tiny tick-based cooldown set.
import { system } from "@minecraft/server";

const active = new Set();

/** Returns true (and arms the cooldown) if `key` is free, false if still cooling down. */
export function tryCooldown(key, ticks) {
  if (active.has(key)) return false;
  active.add(key);
  system.runTimeout(() => active.delete(key), ticks);
  return true;
}

export const blockKey = (block) => `${block.dimension.id}|${block.location.x}|${block.location.y}|${block.location.z}`;
