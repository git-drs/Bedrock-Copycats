// core/sound.js - play vanilla sound events at a block, tolerant of missing sounds.
export function playSound(dimension, location, spec) {
  if (!spec?.sound) return;
  const [lo, hi] = Array.isArray(spec.pitch) ? spec.pitch : [spec.pitch ?? 1, spec.pitch ?? 1];
  try {
    dimension.playSound(spec.sound, { x: location.x + 0.5, y: location.y + 0.5, z: location.z + 0.5 }, {
      volume: spec.volume ?? 1,
      pitch: lo + Math.random() * (hi - lo),
    });
  } catch (e) { /* unknown sound id: ignore */ }
}
