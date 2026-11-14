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

const post = mkCube([-4, 0, -4], [8, 16, 8]);
const north = mkCube([-3, 0, -8], [6, 14, 4]);
const south = mkCube([-3, 0, 4], [6, 14, 4]);
const east = mkCube([4, 0, -3], [4, 14, 6]);
const west = mkCube([-8, 0, -3], [4, 14, 6]);
const straight = mkCube([-3, 0, -8], [6, 14, 16]);

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
  mkGeo("geometry.copycat_wall_post", [post]),
  mkGeo("geometry.copycat_wall_side", [post, north]),
  mkGeo("geometry.copycat_wall_straight", [straight]),
  mkGeo("geometry.copycat_wall_straight_post", [post, north, south]),
  mkGeo("geometry.copycat_wall_side2", [post, north, west]),
  mkGeo("geometry.copycat_wall_tee", [post, north, south, west]),
  mkGeo("geometry.copycat_wall_quad", [post, north, south, east, west])
];

const fileData = {
  format_version: "1.21.20",
  "minecraft:geometry": geometries
};

const targetPath = path.resolve("Bedrock Copycats [RP]/models/blocks/copycat_wall.geo.json");
fs.writeFileSync(targetPath, JSON.stringify(fileData, null, "\t"));
console.log("Wrote " + targetPath);
