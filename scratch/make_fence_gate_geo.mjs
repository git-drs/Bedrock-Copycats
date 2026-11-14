import fs from "fs";
import path from "path";

function mkCube(origin, size) {
  const [ox, oy, oz] = origin;
  const [sx, sy, sz] = size;
  const x0 = ox + 8, z0 = oz + 8;
  const y0 = 16 - (oy + sy);

  return {
    origin,
    size,
    uv: {
      north: { uv: [x0, y0], uv_size: [sx, sy], material_instance: "north" },
      south: { uv: [16 - (x0 + sx), y0], uv_size: [sx, sy], material_instance: "south" },
      east: { uv: [16 - (z0 + sz), y0], uv_size: [sz, sy], material_instance: "east" },
      west: { uv: [z0, y0], uv_size: [sz, sy], material_instance: "west" },
      up: { uv: [x0 + sx, z0 + sz], uv_size: [-sx, -sz], material_instance: "up" },
      down: { uv: [x0 + sx, z0 + sz], uv_size: [-sx, -sz], material_instance: "down" }
    }
  };
}

// Normal height (y: 0..16)
const postL = mkCube([-8, 0, -2], [2, 16, 4]);
const postR = mkCube([6, 0, -2], [2, 16, 4]);
const leafL_closed = mkCube([-6, 4, -1], [6, 8, 2]);
const leafR_closed = mkCube([0, 4, -1], [6, 8, 2]);
const leafL_open = mkCube([-8, 4, 2], [2, 8, 6]);
const leafR_open = mkCube([6, 4, 2], [2, 8, 6]);

// Wall height (shifted down 3 pixels: y - 3)
const postL_wall = mkCube([-8, -3, -2], [2, 16, 4]);
const postR_wall = mkCube([6, -3, -2], [2, 16, 4]);
const leafL_wall_closed = mkCube([-6, 1, -1], [6, 8, 2]);
const leafR_wall_closed = mkCube([0, 1, -1], [6, 8, 2]);
const leafL_wall_open = mkCube([-8, 1, 2], [2, 8, 6]);
const leafR_wall_open = mkCube([6, 1, 2], [2, 8, 6]);

function mkGeo(id, cubes) {
  return {
    description: {
      identifier: id,
      texture_width: 16,
      texture_height: 16,
      visible_bounds_width: 3,
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

const geometries = [
  mkGeo("geometry.copycat_fence_gate_closed", [postL, postR, leafL_closed, leafR_closed]),
  mkGeo("geometry.copycat_fence_gate_open", [postL, postR, leafL_open, leafR_open]),
  mkGeo("geometry.copycat_fence_gate_wall_closed", [postL_wall, postR_wall, leafL_wall_closed, leafR_wall_closed]),
  mkGeo("geometry.copycat_fence_gate_wall_open", [postL_wall, postR_wall, leafL_wall_open, leafR_wall_open])
];

const fileData = {
  format_version: "1.21.20",
  "minecraft:geometry": geometries
};

const targetPath = path.resolve("Bedrock Copycats [RP]/models/blocks/copycat_fence_gate.geo.json");
fs.writeFileSync(targetPath, JSON.stringify(fileData, null, "\t"));
console.log("Wrote " + targetPath);
