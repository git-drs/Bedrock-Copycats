import fs from "fs";
import path from "path";

function mkCube(origin, size, isCore) {
  const [ox, oy, oz] = origin;
  const [sx, sy, sz] = size;
  const x0 = ox + 8, z0 = oz + 8;
  const y0 = 16 - (oy + sy);

  const mat = (face) => (isCore ? face : "copycat_base");

  return {
    origin,
    size,
    uv: {
      north: { uv: [x0, y0], uv_size: [sx, sy], material_instance: mat("north") },
      south: { uv: [16 - (x0 + sx), y0], uv_size: [sx, sy], material_instance: mat("south") },
      east: { uv: [16 - (z0 + sz), y0], uv_size: [sz, sy], material_instance: mat("east") },
      west: { uv: [z0, y0], uv_size: [sz, sy], material_instance: mat("west") },
      up: { uv: [x0 + sx, z0 + sz], uv_size: [-sx, -sz], material_instance: mat("up") },
      down: { uv: [x0 + sx, z0 + sz], uv_size: [-sx, -sz], material_instance: mat("down") }
    }
  };
}

// Standing
const tray_stand = mkCube([-3, 0, -3], [6, 1, 6], false);
const core_stand = mkCube([-2.5, 1, -2.5], [5, 6, 5], true);
const roof_stand = mkCube([-3, 7, -3], [6, 2, 6], false);
const loop_stand = mkCube([-1, 9, -1], [2, 2, 2], false);

// Hanging
const tray_hang = mkCube([-3, 1, -3], [6, 1, 6], false);
const core_hang = mkCube([-2.5, 2, -2.5], [5, 6, 5], true);
const roof_hang = mkCube([-3, 8, -3], [6, 2, 6], false);
const loop_hang = mkCube([-1, 10, -1], [2, 2, 2], false);
const chain_hang = mkCube([-1, 12, -1], [2, 4, 2], false);

function mkGeo(id, cubes) {
  return {
    description: {
      identifier: id,
      texture_width: 16,
      texture_height: 16,
      visible_bounds_width: 2,
      visible_bounds_height: 2.5,
      visible_bounds_offset: [0, 0.75, 0]
    },
    bones: [
      {
        name: "bb_main",
        pivot: [0, 0, 0],
        cubes
      }
    ]
  };
}

const fileData = {
  format_version: "1.21.20",
  "minecraft:geometry": [
    mkGeo("geometry.copycat_lantern_standing", [tray_stand, core_stand, roof_stand, loop_stand]),
    mkGeo("geometry.copycat_lantern_hanging", [tray_hang, core_hang, roof_hang, loop_hang, chain_hang])
  ]
};

const targetPath = path.resolve("Bedrock Copycats [RP]/models/blocks/copycat_lantern.geo.json");
fs.writeFileSync(targetPath, JSON.stringify(fileData, null, "\t"));
console.log("Wrote " + targetPath);
