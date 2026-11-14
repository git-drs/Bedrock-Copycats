// groups.mjs - assign materials to generated blocks ("groups") with STABLE slots.
//
// A block state enum holds at most 16 values, and sound/render_method are per block, so materials are
// bucketed by (sound, render class) and chunked into groups of <= groupSize.
// datagen/lock.json remembers which group each material lives in. Re-running (or a Minecraft update that
// adds/removes blocks) never moves an existing material, so saved worlds keep their copycats.
// Removed materials stay in the enum ("retired") and render with the base texture.

export const familyKey = (m) => (m.render === "opaque" ? m.sound : `${m.sound}_${m.render}`);

export function assignGroups(materials, prevLock, { groupSize }) {
  const prev = prevLock?.families ?? {};
  const byFamily = new Map();
  for (const m of materials) {
    const k = familyKey(m);
    if (!byFamily.has(k)) byFamily.set(k, []);
    byFamily.get(k).push(m);
  }

  const families = {};
  const keys = new Set([...Object.keys(prev), ...byFamily.keys()]);
  for (const k of [...keys].sort()) {
    const groups = (prev[k]?.groups ?? []).map((g) => [...g]);
    const placed = new Set(groups.flat());
    for (const m of byFamily.get(k) ?? []) {
      if (placed.has(m.name)) continue;
      let g = groups.find((x) => x.length < groupSize);
      if (!g) { g = []; groups.push(g); }
      g.push(m.name);
      placed.add(m.name);
    }
    if (groups.length) families[k] = { groups };
  }

  const active = new Set(materials.map((m) => m.name));
  const matByName = new Map(materials.map((m) => [m.name, m]));
  const out = [];
  for (const [fam, { groups }] of Object.entries(families)) {
    groups.forEach((names, i) => {
      const famMats = new Set((byFamily.get(fam) ?? []).map((m) => m.name));
      out.push({
        id: `${fam}_${i}`,
        family: fam,
        sound: (byFamily.get(fam)?.[0] ?? matByName.get(names.find((n) => matByName.has(n))))?.sound ?? fam.replace(/_(alpha_test|blend)$/, ""),
        render: fam.endsWith("_alpha_test") ? "alpha_test" : fam.endsWith("_blend") ? "blend" : "opaque",
        values: names,
        retired: names.filter((n) => !famMats.has(n) || !active.has(n)),
      });
    });
  }
  return { lock: { families }, groups: out };
}

/** Human-readable diff between two locks/material sets, for the change report. */
export function diffLocks(prevLock, newLock) {
  const flat = (l) => {
    const m = new Map();
    for (const [fam, { groups }] of Object.entries(l?.families ?? {})) groups.forEach((g, i) => g.forEach((n) => m.set(n, `${fam}_${i}`)));
    return m;
  };
  const a = flat(prevLock), b = flat(newLock);
  return { added: [...b.keys()].filter((n) => !a.has(n)), removedFromLock: [...a.keys()].filter((n) => !b.has(n)) };
}
